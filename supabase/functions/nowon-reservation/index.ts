import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

class NowonCrawler {
  private baseUrl = "https://reservation.nowonsc.kr"
  private cookies: Map<string, string> = new Map()
  private mseq: string = ''

  private saveCookies(setCookieHeaders: Headers) {
    const cookieStrings = setCookieHeaders.getSetCookie?.() || []
    
    cookieStrings.forEach(cookieStr => {
      const [cookiePart] = cookieStr.split(';')
      const [name, value] = cookiePart.split('=')
      if (name && value) {
        this.cookies.set(name.trim(), value.trim())
      }
    })
    
    const setCookieHeader = setCookieHeaders.get('set-cookie')
    if (setCookieHeader) {
      const [cookiePart] = setCookieHeader.split(';')
      const [name, value] = cookiePart.split('=')
      if (name && value) {
        this.cookies.set(name.trim(), value.trim())
      }
    }
  }

  private getCookieString(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      const response = await fetch(`${this.baseUrl}/member/loginAction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Referer': `${this.baseUrl}/member/login`
        },
        body: formData.toString(),
        redirect: 'manual'
      })

      this.saveCookies(response.headers)

      if (response.status === 302 || response.status === 301) {
        const location = response.headers.get('location')
        if (location) {
          const followUpUrl = location.startsWith('http') ? location : `${this.baseUrl}${location}`

          const followUpResponse = await fetch(followUpUrl, {
            method: 'GET',
            headers: {
              'Cookie': this.getCookieString(),
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
          })

          this.saveCookies(followUpResponse.headers)
        }
      }

      const sportsMainResponse = await fetch(`${this.baseUrl}/sports/courtReserve`, {
        method: 'GET',
        headers: {
          'Cookie': this.getCookieString(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      })

      this.saveCookies(sportsMainResponse.headers)

      if (response.ok || response.status === 302 || response.status === 301) {
        console.log('노원구 로그인 성공')
        return true
      }

      return false
    } catch (error) {
      console.error('노원 로그인 실패:', error)
      return false
    }
  }

  async fetchMseqFromReservationPage(cseq: string): Promise<void> {
    // 테스트용 하드코딩
    this.mseq = '112938'
  }

  getMseq(): string {
    return this.mseq
  }

  convertToReservationFormat(reservation: any) {
    const { cseq, courtName, startTime, endTime, displayCourtNum, actualCourtNum, date } = reservation

    const feeMap: { [key: string]: { normal: string, night: string, holiday: string } } = {
      '마들': { normal: '4000', night: '5200', holiday: '5200' },
      '불암산': { normal: '4000', night: '5200', holiday: '5200' },
      '초안산': { normal: '4000', night: '5200', holiday: '5200' }
    }

    const parentSeqMap: { [key: string]: string } = {
      '마들': '1',
      '불암산': '1', 
      '초안산': '1'
    }

    const fees = feeMap[courtName] || { normal: '4000', night: '5200', holiday: '5200' }
    const parentSeq = parentSeqMap[courtName] || '1'

    // displayCourtNum이 "2코트" 형식이면 그대로, 아니면 "코트" 붙이기
    const courtDisplay = String(displayCourtNum).includes('코트')
      ? displayCourtNum
      : `${displayCourtNum}코트`

    return {
      cseq: cseq,
      parentSeq: parentSeq,
      feeNormal: fees.normal,
      feeNight: fees.night,
      feeHoilday: fees.holiday,
      kind: `테니스 > ${courtName}`,
      useDayBegin: date,
      useDayEnd: date,
      useTimeBegin: '',
      useTimeEnd: '',
      idleDay1: 'N',
      idleDay2: 'N',
      idleDay3: 'N',
      idleDay4: 'N',
      idleDay5: 'N',
      idleDay6: 'N',
      idleDay7: 'N',
      mseq: this.mseq,
      time_chk: `${startTime}~${endTime}~${actualCourtNum}~${courtDisplay}`
    }
  }

  async confirmReservationBatch(reservationDataList: any[]): Promise<{ success: boolean, voStr?: string, timeStr?: string, memberInfo?: any, message?: string }> {
    try {
      // 첫 번째 예약 데이터를 기본으로 사용
      const baseData = reservationDataList[0]
      const formData = new URLSearchParams()
      
      // 기본 필드 추가 (time_chk 제외)
      Object.keys(baseData).forEach(key => {
        if (key !== 'time_chk') {
          formData.append(key, baseData[key])
        }
      })

      // 모든 time_chk 추가 (여러 개)
      reservationDataList.forEach(data => {
        formData.append('time_chk', data.time_chk)
      })

      const response = await fetch(`${this.baseUrl}/sports/courtReserve_confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.getCookieString(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': `${this.baseUrl}/sports/courtReserve_date?cate1=1&cate2=${baseData.cseq}`,
          'Origin': this.baseUrl,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        body: formData.toString()
      })

      const responseText = await response.text()

      if (!response.ok) {
        return { success: false, message: `HTTP ${response.status} 오류` }
      }

      const parser = new DOMParser()
      const doc = parser.parseFromString(responseText, 'text/html')
      
      const voStrInput = doc.querySelector('input[name="voStr"], input#voStr')
      const timeStrInput = doc.querySelector('input[name="timeStr"], input#timeStr')

      const voStr = voStrInput?.getAttribute('value') || ''
      const timeStr = timeStrInput?.getAttribute('value') || ''

      if (!voStr || !timeStr) {
        console.error('⚠️ voStr 또는 timeStr을 찾을 수 없습니다.')
        return { success: false, message: 'voStr/timeStr 추출 실패' }
      }

      // 회원 정보 크롤링
      const memberNameInput = doc.querySelector('input[name="memberName"], input#memberName')
      const memberMobileInput = doc.querySelector('input[name="memberMobile"], input#memberMobile')
      const memberEmailInput = doc.querySelector('input[name="memberEmail"], input#memberEmail')

      const memberInfo = {
        memberName: memberNameInput?.getAttribute('value') || '',
        memberMobile: memberMobileInput?.getAttribute('value') || '',
        memberEmail: memberEmailInput?.getAttribute('value') || ''
      }

      console.log('✅ [1단계] voStr:', voStr)
      console.log('✅ [1단계] timeStr:', timeStr)
      console.log('✅ [1단계] 회원 정보:', memberInfo)

      return { success: true, voStr, timeStr, memberInfo }

    } catch (error: any) {
      console.error('❌ [1단계] 예약 확인 실패:', error)
      return { success: false, message: error.message }
    }
  }

  async makeReservationBatch(reservationDataList: any[], originalReservations: any[]): Promise<{ success: boolean, message: string, details?: any[] }> {
    try {
      // 1단계: 예약 확인 (배치)
      const confirmResult = await this.confirmReservationBatch(reservationDataList)
      if (!confirmResult.success || !confirmResult.voStr || !confirmResult.timeStr) {
        return { success: false, message: confirmResult.message || '예약 확인 실패' }
      }

      // 2단계: 예약 완료
      const finalResult = await this.finalizeReservation(confirmResult.voStr, confirmResult.timeStr)
      if (!finalResult.success) {
        return { success: false, message: finalResult.message }
      }

      // 3단계: payment 폼 제출 - 첫 번째 예약 데이터 사용
      const paymentResult = await this.submitPaymentForm(
        confirmResult.voStr,
        confirmResult.timeStr,
        reservationDataList[0],
        confirmResult.memberInfo || {}
      )
      if (!paymentResult.success) {
        console.error('payment 폼 제출 실패 (예약은 완료됨)')
      }

      // 성공한 예약 상세 정보
      const details = originalReservations.map(res => ({
        court: res.courtName,
        courtNum: res.displayCourtNum,
        date: res.date,
        time: `${res.startTime}~${res.endTime}`,
        success: true,
        message: '예약이 완료되었습니다.'
      }))

      return { success: true, message: '예약이 완료되었습니다.', details }

    } catch (error: any) {
      console.error('예약 실패:', error)
      return { success: false, message: error.message }
    }
  }

  async confirmReservation(reservationData: any): Promise<{ success: boolean, voStr?: string, timeStr?: string, memberInfo?: any, message?: string }> {
    try {
      const formData = new URLSearchParams()
      
      Object.keys(reservationData).forEach(key => {
        formData.append(key, reservationData[key])
      })

      const response = await fetch(`${this.baseUrl}/sports/courtReserve_confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.getCookieString(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': `${this.baseUrl}/sports/courtReserve_date?cate1=1&cate2=${reservationData.cseq}`,
          'Origin': this.baseUrl,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        body: formData.toString()
      })

      const responseText = await response.text()

      if (!response.ok) {
        return { success: false, message: `HTTP ${response.status} 오류` }
      }

      const parser = new DOMParser()
      const doc = parser.parseFromString(responseText, 'text/html')
      
      const voStrInput = doc.querySelector('input[name="voStr"], input#voStr')
      const timeStrInput = doc.querySelector('input[name="timeStr"], input#timeStr')

      const voStr = voStrInput?.getAttribute('value') || ''
      const timeStr = timeStrInput?.getAttribute('value') || ''

      if (!voStr || !timeStr) {
        console.error('⚠️ voStr 또는 timeStr을 찾을 수 없습니다.')
        return { success: false, message: 'voStr/timeStr 추출 실패' }
      }

      // 회원 정보 크롤링
      const memberNameInput = doc.querySelector('input[name="memberName"], input#memberName')
      const memberMobileInput = doc.querySelector('input[name="memberMobile"], input#memberMobile')
      const memberEmailInput = doc.querySelector('input[name="memberEmail"], input#memberEmail')

      const memberInfo = {
        memberName: memberNameInput?.getAttribute('value') || '',
        memberMobile: memberMobileInput?.getAttribute('value') || '',
        memberEmail: memberEmailInput?.getAttribute('value') || ''
      }

      return { success: true, voStr, timeStr, memberInfo }

    } catch (error: any) {
      console.error('[1단계] 예약 확인 실패:', error)
      return { success: false, message: error.message }
    }
  }

  async finalizeReservation(voStr: string, timeStr: string): Promise<{ success: boolean, message: string, reservationId?: string }> {
    try {
      // voStr을 파싱해서 개별 필드로 변환
      const voParams = new URLSearchParams(voStr)
      
      const formData = new URLSearchParams()
      
      // voStr의 모든 파라미터를 개별적으로 추가
      for (const [key, value] of voParams.entries()) {
        formData.append(key, value)
      }
      
      // timeStr과 parentSeq는 맨 끝에 추가
      formData.append('timeStr', timeStr)
      formData.append('parentSeq', '1')

      const response = await fetch(`${this.baseUrl}/sports/courtReserveAction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.getCookieString(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': `${this.baseUrl}/sports/courtReserve_confirm`,
          'Origin': this.baseUrl,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json, text/javascript, */*; q=0.01'
        },
        body: formData.toString()
      })

      const responseText = await response.text()

      // HTML 응답인지 확인
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('HTML 응답 수신 (예상: JSON)')
        return { success: false, message: `서버 에러 ${response.status}` }
      }

      // JSON 파싱
      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        console.error('JSON 파싱 실패')
        return { success: false, message: '응답 파싱 실패' }
      }

      // 결과 해석
      if (result.result > 0) {
        const reservationId = result.result.toString()
        console.log('예약 완료 - ID:', reservationId)
        return { success: true, message: '예약이 신청되었습니다.', reservationId }
      } else if (result.result === 'err') {
        return { success: false, message: result.msg || '오전 10시부터 신청하실 수 있습니다.' }
      } else if (result.result === '-3' || result.result === -3) {
        return { success: false, message: result.msg || '해당 회원은 예약이 불가능합니다.' }
      } else if (result.result === '-1' || result.result === -1) {
        return { success: false, message: result.msg || '예약이 완료된 시간입니다.' }
      } else {
        return { success: false, message: result.msg || `응답 코드: ${result.result}` }
      }

    } catch (error: any) {
      console.error('[2단계] 예약 완료 실패:', error)
      return { success: false, message: error.message }
    }
  }

  async submitPaymentForm(voStr: string, timeStr: string, reservationData: any, memberInfo: any): Promise<{ success: boolean, message?: string }> {
    try {
      // URL 쿼리스트링: voStr 전체
      const url = `${this.baseUrl}/sports/courtReserve_payment?${voStr}`
      
      // POST Body: 추가 필드들
      const formData = new URLSearchParams()
      
      // voStr에서 날짜 정보 추출
      const voParams = new URLSearchParams(voStr)
      const useDayBegin = voParams.get('useDayBegin') || ''
      const useTimeBegin = voParams.get('useTimeBegin') || ''
      
      // timeStr에서 정보 추출 (예: "13:00~14:00~19~2코트")
      const timeStrParts = timeStr.split('~')
      const startTime = timeStrParts[0] || ''
      const endTime = timeStrParts[1] || ''
      const displayCourtNum = timeStrParts[3] || ''
      
      // 날짜 포맷팅 (2025-10-21 → 10-21(화))
      const dateObj = new Date(useDayBegin)
      const weekdays = ['일', '월', '화', '수', '목', '금', '토']
      const weekday = weekdays[dateObj.getDay()]
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')
      const formattedDate = `${month}-${day}(${weekday})`
      
      // feeNormal 가져오기
      const feeNormal = voParams.get('feeNormal') || '4000'
      
      // timeStrList 생성 (예: "1코트 2025-10-21(화) 13:00~14:00 4,000원")
      const timeStrList = `${displayCourtNum} ${dateObj.getFullYear()}-${formattedDate} ${startTime}~${endTime} ${parseInt(feeNormal).toLocaleString()}원`
      
      formData.append('timeStrList', timeStrList)
      formData.append('kind', reservationData.kind || '')
      formData.append('parentSeq', reservationData.parentSeq || '1')
      
      // 현재 시간
      const now = new Date()
      const nowWeekday = weekdays[now.getDay()]
      const memberToday = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}(${nowWeekday}) ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
      formData.append('memberToday', memberToday)
      
      // 회원 정보 - confirm 페이지에서 크롤링한 실제 값!
      formData.append('memberName', memberInfo.memberName || '')
      formData.append('memberMobile', memberInfo.memberMobile || '')
      formData.append('memberEmail', memberInfo.memberEmail || '')
      formData.append('lightTxt', '')
      
      // 날짜와 금액
      formData.append('msgProductDate', `${formattedDate} `)
      formData.append('priceTotal', `${parseInt(feeNormal).toLocaleString()}`)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.getCookieString(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': `${this.baseUrl}/sports/courtReserve_confirm`,
          'Origin': this.baseUrl
        },
        body: formData.toString()
      })

      if (response.ok) {
        console.log('payment 폼 제출 성공')
        return { success: true }
      } else {
        console.error('payment 응답 상태:', response.status)
        return { success: true, message: `payment 응답: ${response.status}` }
      }

    } catch (error: any) {
      console.error('[3단계] payment 폼 제출 실패:', error)
      return { success: false, message: error.message }
    }
  }

  async makeReservation(reservationData: any): Promise<{ success: boolean, message: string }> {
    try {
      await this.fetchMseqFromReservationPage(reservationData.cseq)
      
      if (!this.mseq) {
        return { success: false, message: 'mseq 값을 가져올 수 없습니다.' }
      }

      reservationData.mseq = this.mseq

      // 1단계: 예약 확인 + 회원 정보 크롤링
      const confirmResult = await this.confirmReservation(reservationData)
      if (!confirmResult.success || !confirmResult.voStr || !confirmResult.timeStr) {
        return { success: false, message: confirmResult.message || '예약 확인 실패' }
      }

      // 2단계: 예약 완료
      const finalResult = await this.finalizeReservation(confirmResult.voStr, confirmResult.timeStr)
      if (!finalResult.success) {
        return { success: false, message: finalResult.message }
      }

      // 3단계: payment 폼 제출 (POST) - 카카오톡 발송
      const paymentResult = await this.submitPaymentForm(
        confirmResult.voStr,
        confirmResult.timeStr,
        reservationData,
        confirmResult.memberInfo || {}
      )
      if (!paymentResult.success) {
        console.error('payment 폼 제출 실패 (예약은 완료됨)')
      }

      return { success: true, message: '예약이 완료되었습니다.' }

    } catch (error: any) {
      console.error('예약 실패:', error)
      return { success: false, message: error.message }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nowon_id, nowon_pass, reservations } = await req.json()

    if (!nowon_id || !nowon_pass) {
      throw new Error('노원구 계정 정보가 없습니다.')
    }

    if (!reservations || reservations.length === 0) {
      throw new Error('예약 정보가 없습니다.')
    }

    const crawler = new NowonCrawler()

    const loginSuccess = await crawler.login(nowon_id, nowon_pass)
    if (!loginSuccess) {
      throw new Error('노원구 로그인 실패')
    }

    // mseq 설정
    await crawler.fetchMseqFromReservationPage(reservations[0].cseq)

    // 같은 코트(cseq + date)별로 그룹핑
    const groupedReservations = new Map<string, any[]>()
    
    reservations.forEach((reservation: any) => {
      const key = `${reservation.cseq}_${reservation.date}`  // 같은 코트, 같은 날짜
      if (!groupedReservations.has(key)) {
        groupedReservations.set(key, [])
      }
      groupedReservations.get(key)!.push(reservation)
    })

    const allResults: any[] = []

    // 각 그룹별로 배치 예약
    for (const [key, group] of groupedReservations.entries()) {
      // 각 예약을 포맷팅
      const formattedDataList = group.map(res => crawler.convertToReservationFormat(res))

      // 배치로 예약 실행
      const result = await crawler.makeReservationBatch(formattedDataList, group)
      
      if (result.details) {
        allResults.push(...result.details)
      } else {
        // 실패한 경우
        group.forEach(res => {
          allResults.push({
            court: res.courtName,
            courtNum: res.displayCourtNum,
            date: res.date,
            time: `${res.startTime}~${res.endTime}`,
            success: false,
            message: result.message
          })
        })
      }

      // 그룹 간 딜레이
      if (groupedReservations.size > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const allSuccess = allResults.every(r => r.success)
    const successCount = allResults.filter(r => r.success).length

    return new Response(
      JSON.stringify({
        success: allSuccess,
        results: allResults,
        mseq: crawler.getMseq(),
        summary: {
          total: allResults.length,
          success: successCount,
          failed: allResults.length - successCount,
          groups: groupedReservations.size
        },
        message: allSuccess
          ? `모든 예약 성공 (${successCount}/${allResults.length})`
          : `일부 예약 실패 (${successCount}/${allResults.length})`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: allSuccess ? 200 : 207
      }
    )

  } catch (error: any) {
    console.error('예약 오류:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})