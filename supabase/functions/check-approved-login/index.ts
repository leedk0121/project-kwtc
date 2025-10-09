// supabase/functions/check-approved-login/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 로그인 요청 시작')
    
    // Supabase Admin Client (Service Role Key 사용)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { email, password } = await req.json()
    console.log('📧 이메일:', email)

    if (!email || !password) {
      console.log('❌ 이메일 또는 비밀번호 누락')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: '이메일과 비밀번호를 입력해주세요.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // 1. 사용자 로그인 시도 (Admin client 사용)
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.log('❌ 로그인 실패:', authError.message)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: '이메일 또는 비밀번호가 올바르지 않습니다.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    console.log('✅ 인증 성공, 사용자 ID:', authData.user.id)

    // 2. profile 테이블에서 approved 상태 확인
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profile')
      .select('approved')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.log('❌ 프로필 조회 실패:', profileError.message)
      
      // 로그아웃 처리
      await supabaseAdmin.auth.signOut()
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: '사용자 프로필을 찾을 수 없습니다.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    console.log('📋 Approved 상태:', profile.approved)

    // 3. approved가 false인 경우
    if (!profile.approved) {
      console.log('🚫 승인되지 않은 사용자')
      
      // 로그아웃 처리
      await supabaseAdmin.auth.signOut()
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          approved: false,
          message: '관리자에게 승인을 요청하세요.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // 4. 승인된 사용자 - 로그인 성공
    console.log('✅ 로그인 성공 (승인된 사용자)')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        approved: true,
        user: authData.user,
        session: authData.session,
        message: '로그인에 성공했습니다.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 예상치 못한 오류:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})