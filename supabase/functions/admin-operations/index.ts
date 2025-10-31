// supabase/functions/admin-operations/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // 🔑 Service Role 클라이언트 생성 (RLS 우회)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 일반 클라이언트 (사용자 인증 확인용)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: '유효하지 않은 토큰입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 🔐 관리자 권한 확인 (Service Role로 조회)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profile')
      .select('is_admin, name')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile?.is_admin) {
      console.error('관리자 권한 없음:', user.email)
      return new Response(
        JSON.stringify({ success: false, message: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 요청 본문 파싱
    const { action, data } = await req.json()

    // 🚀 관리자 작업 실행 (Service Role 사용)
    let result;
    
    switch (action) {
      case 'set_admin_role':
        // 관리자 권한 설정/해제
        result = await supabaseAdmin
          .from('profile')
          .update({ is_admin: data.is_admin })
          .eq('id', data.user_id)
          .select()
          .single()
        break;

      case 'approve_user':
        // 사용자 승인
        result = await supabaseAdmin
          .from('profile')
          .update({ approved: true })
          .eq('id', data.user_id)
          .select()
          .single()
        break;

      case 'delete_user':
        // 사용자 완전 삭제 (모든 관련 데이터 포함)
        // 1. 관련 데이터 삭제
        await supabaseAdmin
          .from('leader_profile')
          .delete()
          .eq('user_id', data.user_id)
        
        await supabaseAdmin
          .from('tennis_reservation_profile')
          .delete()
          .eq('user_id', data.user_id)

        // 2. profile 삭제
        result = await supabaseAdmin
          .from('profile')
          .delete()
          .eq('id', data.user_id)
          .select()

        // 3. Auth 사용자 삭제
        await supabaseAdmin.auth.admin.deleteUser(data.user_id)
        break;

      case 'bulk_approve':
        // 여러 사용자 일괄 승인
        result = await supabaseAdmin
          .from('profile')
          .update({ approved: true })
          .in('id', data.user_ids)
          .select()
        break;

      case 'get_all_users':
        // 모든 사용자 조회 (RLS 우회)
        result = await supabaseAdmin
          .from('profile')
          .select('*')
          .order('created_at', { ascending: false })
        break;

      case 'update_user_profile':
        // 다른 사용자 프로필 강제 수정
        result = await supabaseAdmin
          .from('profile')
          .update(data.updates)
          .eq('id', data.user_id)
          .select()
          .single()
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, message: '지원하지 않는 작업입니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    if (result.error) {
      console.error('작업 실행 오류:', result.error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: '작업 실행에 실패했습니다.',
          error: result.error.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '작업이 성공적으로 완료되었습니다.',
        data: result.data 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('예상치 못한 오류:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: '서버 오류가 발생했습니다.',
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})