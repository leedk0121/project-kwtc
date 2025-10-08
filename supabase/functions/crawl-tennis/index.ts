// supabase/functions/crawl-tennis/index.ts
// 노원구 테니스장 전용 크롤러 (Edge Function)
// 도봉구는 클라우드 IP 차단으로 브라우저에서 직접 크롤링

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

      // 쿠키 저장
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
      // 시간 정보 가져오기
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

      // 예약 정보 가져오기
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

      // 예약된 시간 세트
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

      // 코트 정보 설정
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

// ===== 도봉 크롤러 제거 =====
// 도봉구는 클라우드 서버 IP 차단으로 인해 브라우저에서 직접 크롤링합니다.

// ===== 메인 핸들러 =====
serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // 요청 body 확인
    const contentType = req.headers.get('content-type')
    console.log('Request method:', req.method)
    console.log('Content-Type:', contentType)

    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json')
    }

    const body = await req.text()
    console.log('Request body:', body)

    if (!body) {
      throw new Error('Request body is empty')
    }

    const { nowon_id, nowon_pass, dates } = JSON.parse(body)

    if (!dates || dates.length === 0) {
      return new Response(
        JSON.stringify({ error: '날짜가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const allResults: any[] = []

    console.log('노원구 크롤링 시작 - 날짜:', dates)
    console.log('노원 계정:', nowon_id ? '있음' : '없음')

    // 노원 크롤링
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
          allResults.push(...bul, ...ma, ...cho)
        }
        console.log(`노원 크롤링 완료: ${allResults.length}개 항목`)
      } else {
        console.error('노원 로그인 실패')
      }
    } else {
      console.log('노원 계정 정보 없음')
    }

    return new Response(
      JSON.stringify({ success: true, data: allResults }),
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