// supabase/functions/admin-operations/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 감사 로그 기록 함수
async function logAdminAction(
  supabaseAdmin: any,
  adminId: string,
  adminEmail: string,
  action: string,
  targetUserId: string | null,
  targetUserEmail: string | null,
  details: any,
  req: Request
) {
  try {
    // IP와 User-Agent 추출
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: adminId,
        admin_email: adminEmail,
        action: action,
        target_user_id: targetUserId,
        target_user_email: targetUserEmail,
        details: details,
        ip_address: ip,
        user_agent: userAgent
      });
  } catch (error) {
    console.error('감사 로그 기록 실패:', error);
    // 로그 실패해도 작업은 계속 진행
  }
}

serve(async (req) => {
  // CORS preflight 처리
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Authorization 헤더 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 사용자 확인
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
      .select('is_admin, name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile?.is_admin) {
      console.error(`관리자 권한 없음: ${user.email}`)
      return new Response(
        JSON.stringify({ success: false, message: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 요청 본문 파싱
    const { action, data } = await req.json()

    // 입력 유효성 검사
    if (!action || typeof action !== 'string') {
      return new Response(
        JSON.stringify({ success: false, message: '올바른 action이 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 관리자 작업 실행
    let result: any;
    let targetUserEmail: string | null = null;

    switch (action) {
      // ==================== 관리자 권한 설정 ====================
      case 'set_admin_role':
        // UUID 유효성 검사
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!data.user_id || !uuidRegex.test(data.user_id)) {
          return new Response(
            JSON.stringify({ success: false, message: '유효한 user_id가 필요합니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (typeof data.is_admin !== 'boolean') {
          return new Response(
            JSON.stringify({ success: false, message: 'is_admin은 boolean이어야 합니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 대상 사용자 정보 조회
        const { data: targetProfile } = await supabaseAdmin
          .from('profile')
          .select('email, name')
          .eq('id', data.user_id)
          .single()

        targetUserEmail = targetProfile?.email || null

        // 관리자 권한 변경
        result = await supabaseAdmin
          .from('profile')
          .update({ is_admin: data.is_admin })
          .eq('id', data.user_id)
          .select('id, email, name, is_admin')
          .single()

        if (!result.error) {
          await logAdminAction(
            supabaseAdmin,
            user.id,
            userProfile.email,
            action,
            data.user_id,
            targetUserEmail,
            { is_admin: data.is_admin },
            req
          )
        }
        break

      // ==================== 사용자 승인 ====================
      case 'approve_user':
        if (!data.user_id) {
          return new Response(
            JSON.stringify({ success: false, message: 'user_id가 필요합니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 대상 사용자 정보 조회
        const { data: approveProfile } = await supabaseAdmin
          .from('profile')
          .select('email, name')
          .eq('id', data.user_id)
          .single()

        targetUserEmail = approveProfile?.email || null

        result = await supabaseAdmin
          .from('profile')
          .update({ approved: true })
          .eq('id', data.user_id)
          .select()
          .single()

        if (!result.error) {
          await logAdminAction(
            supabaseAdmin,
            user.id,
            userProfile.email,
            action,
            data.user_id,
            targetUserEmail,
            { approved: true },
            req
          )
        }
        break

      // ==================== 사용자 완전 삭제 ====================
      case 'delete_user':
        if (!data.user_id) {
          return new Response(
            JSON.stringify({ success: false, message: 'user_id가 필요합니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 대상 사용자 정보 조회
        const { data: deleteProfile } = await supabaseAdmin
          .from('profile')
          .select('email, name')
          .eq('id', data.user_id)
          .single()

        targetUserEmail = deleteProfile?.email || null

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
        await supabaseAdmin
          .from('profile')
          .delete()
          .eq('id', data.user_id)

        // 3. Auth 사용자 삭제
        result = await supabaseAdmin.auth.admin.deleteUser(data.user_id)

        if (!result.error) {
          await logAdminAction(
            supabaseAdmin,
            user.id,
            userProfile.email,
            action,
            data.user_id,
            targetUserEmail,
            { deleted: true },
            req
          )
        }
        break

      // ==================== 여러 사용자 일괄 승인 ====================
      case 'bulk_approve':
        if (!data.user_ids || !Array.isArray(data.user_ids)) {
          return new Response(
            JSON.stringify({ success: false, message: 'user_ids 배열이 필요합니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        result = await supabaseAdmin
          .from('profile')
          .update({ approved: true })
          .in('id', data.user_ids)
          .select()

        if (!result.error) {
          await logAdminAction(
            supabaseAdmin,
            user.id,
            userProfile.email,
            action,
            null,
            null,
            { user_ids: data.user_ids, count: data.user_ids.length },
            req
          )
        }
        break

      // ==================== 모든 사용자 조회 ====================
      case 'get_all_users':
        result = await supabaseAdmin
          .from('profile')
          .select('id, email, name, major, stnum, is_admin, approved, created_at, image_url')
          .order('created_at', { ascending: false })

        // 조회는 로그에 기록하지 않음 (너무 많아짐)
        break

      // ==================== 사용자 프로필 강제 수정 ====================
      case 'update_user_profile':
        if (!data.user_id || !data.updates) {
          return new Response(
            JSON.stringify({ success: false, message: 'user_id와 updates가 필요합니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 대상 사용자 정보 조회
        const { data: updateProfile } = await supabaseAdmin
          .from('profile')
          .select('email, name')
          .eq('id', data.user_id)
          .single()

        targetUserEmail = updateProfile?.email || null

        result = await supabaseAdmin
          .from('profile')
          .update(data.updates)
          .eq('id', data.user_id)
          .select()
          .single()

        if (!result.error) {
          await logAdminAction(
            supabaseAdmin,
            user.id,
            userProfile.email,
            action,
            data.user_id,
            targetUserEmail,
            { updates: data.updates },
            req
          )
        }
        break

      default:
        return new Response(
          JSON.stringify({ success: false, message: `지원하지 않는 작업: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // 결과 확인
    if (result.error) {
      console.error(`작업 실패 (${action}):`, result.error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `작업 실행에 실패했습니다: ${result.error.message}`,
          error: result.error.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`작업 완료: ${action}`)

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