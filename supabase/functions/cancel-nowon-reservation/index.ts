// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('인증 정보가 없습니다')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('사용자 인증 실패:', userError)
      throw new Error('사용자 인증 실패')
    }

    const { inRseq, totalPrice } = await req.json()

    if (!inRseq || totalPrice === undefined) {
      throw new Error('필수 파라미터가 누락되었습니다 (inRseq, totalPrice)')
    }

    // tennis_reservation_profile에서 노원구 계정 정보 가져오기
    const { data: profileData, error: profileError } = await supabase
      .from('tennis_reservation_profile')
      .select('nowon_id, nowon_pass')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('프로필 조회 오류:', profileError)
      throw new Error('프로필 조회 실패')
    }

    if (!profileData?.nowon_id || !profileData?.nowon_pass) {
      console.error('계정 정보 없음')
      throw new Error('노원구 테니스장 계정 정보가 등록되지 않았습니다')
    }

    const { nowon_id, nowon_pass } = profileData

    // 로그인 세션 생성
    const loginResponse = await fetch('https://reservation.nowonsc.kr/member/loginAction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: new URLSearchParams({
        id: nowon_id,
        pw: nowon_pass,
        returnUrl: '',
      }),
    })

    if (!loginResponse.ok) {
      console.error('로그인 실패:', loginResponse.status, loginResponse.statusText)
      throw new Error('로그인에 실패했습니다')
    }

    const setCookieHeaders = loginResponse.headers.getSetCookie()
    if (!setCookieHeaders || setCookieHeaders.length === 0) {
      console.error('쿠키 없음')
      throw new Error('세션 쿠키를 가져올 수 없습니다')
    }

    const cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ')

    // 예약 취소 요청
    const cancelResponse = await fetch('https://reservation.nowonsc.kr/mypage/reserveCancelAction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://reservation.nowonsc.kr/mypage/myReserve',
      },
      body: new URLSearchParams({
        inRseq: inRseq.toString(),
        totalPrice: totalPrice.toString(),
      }),
    })

    const cancelResult = await cancelResponse.text()

    // HTTP 200이면 성공으로 간주 (노원구 서버는 성공시 200 반환)
    if (cancelResponse.ok || cancelResponse.status === 200) {
      console.log('예약 취소 성공')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '예약이 취소되었습니다',
          inRseq,
          totalPrice,
          responsePreview: cancelResult.substring(0, 200)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      console.error('취소 요청 실패:', cancelResponse.status, cancelResponse.statusText)
      throw new Error(`예약 취소 요청 실패: HTTP ${cancelResponse.status}`)
    }

  } catch (error) {
    console.error('예약 취소 오류:', error)

    return new Response(
      JSON.stringify({ 
        error: error.message || '예약 취소 중 오류가 발생했습니다',
        details: error.toString(),
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/cancel-nowon-reservation' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
