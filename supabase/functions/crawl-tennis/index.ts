// supabase/functions/crawl-tennis/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Supabase 클라이언트 생성
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ===== 노원 크롤러 =====
class NowonCrawler {
  private baseUrl = "https://reservation.nowonsc.kr"
  private cookies: string[] = []

  async login(username: string, password: string): Promise<boolean> {
    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      const response = await fetch(`${this.baseUrl}/member/loginAction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0'
        },
        body: formData.toString()
      })

      const setCookie = response.headers.get('set-cookie')
      if (setCookie) {
        this.cookies.push(setCookie)
      }

      return response.ok
    } catch (error) {
      console.error('노원 로그인 실패:', error)
      return false
    }
  }

  async crawlDate(pickDate: string, cate2: number): Promise<any[]> {
    try {
      const timeFormData = new URLSearchParams()
      timeFormData.append('pickDate', pickDate)
      timeFormData.append('cate2', cate2.toString())

      const timeResponse = await fetch(`${this.baseUrl}/sports/reserve_time_pick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.cookies.join('; '),
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: timeFormData.toString()
      })

      const timeResult = await timeResponse.json()

      const reservedFormData = new URLSearchParams()
      reservedFormData.append('kd', 'A')
      reservedFormData.append('useDayBegin', pickDate)
      reservedFormData.append('cseq', cate2.toString())

      let reserved = { list: [] }
      try {
        const reservedResponse = await fetch(`${this.baseUrl}/API`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': this.cookies.join('; ')
          },
          body: reservedFormData.toString()
        })
        
        if (reservedResponse.ok) {
          reserved = await reservedResponse.json()
        }
      } catch (e) {
        console.log('예약 정보 조회 실패, 빈 배열 사용')
      }

      const reservedSet = new Set<string>()
      const reservedList = reserved.list || []
      
      for (let i = 0; i < reservedList.length; i++) {
        const r = reservedList[i]
        let beginTime = r.useTimeBegin || "00:00"
        if (/^\d+$/.test(beginTime)) {
          beginTime = `${parseInt(beginTime).toString().padStart(2, '0')}:00`
        }
        reservedSet.add(`${r.cseq},${beginTime}`)
      }

      let courts: string[], prefix: string, facilityName: string
      if (cate2 === 17) {
        courts = []
        for (let i = 0; i < 4; i++) {
          courts.push(`${i + 1}코트@${29 + i + 1}`)
        }
        prefix = "2"
        facilityName = "초안산"
      } else if (cate2 === 15) {
        courts = []
        for (let i = 0; i < 3; i++) {
          courts.push(`${i + 1}코트@${17 + i + 1}`)
        }
        prefix = ""
        facilityName = "불암산"
      } else {
        courts = []
        for (let i = 0; i < 9; i++) {
          courts.push(`${i + 1}코트@${20 + i + 1}`)
        }
        prefix = "1"
        facilityName = "마들"
      }

      const rows: any[] = []
      let startTime = timeResult.useBeginHour
      const hourUnit = timeResult.hourUnit
      const lineCount = parseInt(timeResult.line)

      for (let i = 0; i < lineCount; i++) {
        const endTime = startTime + hourUnit
        const startTxt = `${Math.floor(startTime).toString().padStart(2, '0')}:00`
        const endTxt = `${Math.floor(endTime).toString().padStart(2, '0')}:00`

        for (let j = 0; j < courts.length; j++) {
          const c = courts[j]
          const parts = c.split('@')
          const courtName = parts[0]
          const courtSeq = parts[1]
          const isReserved = reservedSet.has(`${courtSeq},${startTxt}`)
          const courtNum = prefix ? `${prefix}${courtName}` : courtName

          rows.push({
            date: pickDate,
            court: facilityName,
            court_num: courtNum,
            start_time: startTxt,
            end_time: endTxt,
            status: isReserved ? "예약불가" : "예약가능"
          })
        }

        startTime += hourUnit
      }

      return rows
    } catch (error) {
      console.error(`노원 크롤링 실패 (${pickDate}, cate2: ${cate2}):`, error)
      return []
    }
  }
}

// Storage에서 캐시 데이터 조회
async function getCachedData(year: number, month: number) {
  const fileName = `${year}-${String(month + 1).padStart(2, '0')}.json`
  
  try {
    const { data, error } = await supabase.storage
      .from('crawl-cache')
      .download(fileName)
    
    if (error) {
      console.log('캐시 파일 없음:', fileName)
      return null
    }
    
    const text = await data.text()
    const cached = JSON.parse(text)
    
    // 1시간(3600000ms) 이내 데이터만 유효
    const now = Date.now()
    const cacheAge = now - cached.updatedAt
    const maxAge = 60 * 60 * 1000 // 1시간
    
    if (cacheAge > maxAge) {
      console.log('캐시 만료:', fileName)
      return null
    }
    
    console.log('캐시 사용:', fileName)
    return cached
  } catch (error) {
    console.error('캐시 로드 오류:', error)
    return null
  }
}

// Storage에 크롤링 데이터 저장
async function saveCachedData(year: number, month: number, data: any) {
  const fileName = `${year}-${String(month + 1).padStart(2, '0')}.json`
  
  const cacheData = {
    updatedAt: Date.now(),
    year,
    month: month + 1,
    data
  }
  
  try {
    const jsonData = JSON.stringify(cacheData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    
    // 기존 파일 삭제
    await supabase.storage
      .from('crawl-cache')
      .remove([fileName])
    
    // 새 파일 업로드
    const { error } = await supabase.storage
      .from('crawl-cache')
      .upload(fileName, blob, {
        contentType: 'application/json',
        upsert: true
      })
    
    if (error) {
      console.error('캐시 저장 오류:', error)
      return false
    }
    
    console.log('캐시 저장 완료:', fileName)
    return true
  } catch (error) {
    console.error('캐시 저장 오류:', error)
    return false
  }
}

// ===== 메인 핸들러 =====
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const contentType = req.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json')
    }

    const body = await req.text()
    if (!body) {
      throw new Error('Request body is empty')
    }

    const { nowon_id, nowon_pass, dates, forceRefresh } = JSON.parse(body)

    if (!dates || dates.length === 0) {
      return new Response(
        JSON.stringify({ error: '날짜가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 첫 번째 날짜로 년월 확인
    const firstDate = new Date(dates[0])
    const year = firstDate.getFullYear()
    const month = firstDate.getMonth()

    // forceRefresh가 아니면 캐시 확인
    if (!forceRefresh) {
      const cached = await getCachedData(year, month)
      if (cached) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: cached.data,
            fromCache: true,
            updatedAt: cached.updatedAt
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 캐시가 없거나 forceRefresh면 크롤링 시작
    console.log('노원구 크롤링 시작 - 날짜:', dates)

    const allResultsByDate: { [date: string]: any[] } = {}

    if (nowon_id && nowon_pass) {
      console.log('노원 크롤링 시작...')
      const nowonCrawler = new NowonCrawler()
      const loginSuccess = await nowonCrawler.login(nowon_id, nowon_pass)
      
      if (loginSuccess) {
        for (let i = 0; i < dates.length; i++) {
          const date = dates[i]
          const [bul, ma, cho] = await Promise.all([
            nowonCrawler.crawlDate(date, 15),
            nowonCrawler.crawlDate(date, 16),
            nowonCrawler.crawlDate(date, 17)
          ])
          allResultsByDate[date] = [...bul, ...ma, ...cho]
        }
        console.log(`노원 크롤링 완료`)
      } else {
        console.error('노원 로그인 실패')
        return new Response(
          JSON.stringify({ success: false, error: '노원 로그인 실패' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      console.log('노원 계정 정보 없음')
      return new Response(
        JSON.stringify({ success: false, error: '노원 계정 정보 필요' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Storage에 저장
    await saveCachedData(year, month, allResultsByDate)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: allResultsByDate,
        fromCache: false,
        updatedAt: Date.now()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('크롤링 오류:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})