// src/services/adminService.ts

import { supabase } from '../pages/Auth/supabaseClient';

/**
 * Service Role을 사용하는 관리자 작업 서비스
 * Edge Function을 통해 RLS를 우회한 작업 수행
 */

interface AdminServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Edge Function 호출 헬퍼 함수
async function invokeAdminFunction(action: string, data: any): Promise<AdminServiceResponse> {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('admin-operations', {
      body: { action, data }
    });

    // Edge Function 에러 처리
    if (error) {
      console.error(`Admin Service Error (${action}):`, error);
      
      // Response 객체에서 에러 메시지 추출
      if (error.context instanceof Response) {
        try {
          const errorBody = await error.context.json();
          throw new Error(errorBody.message || '작업에 실패했습니다.');
        } catch (parseError) {
          throw new Error('서버 응답을 처리할 수 없습니다.');
        }
      }
      
      throw new Error(error.message || '알 수 없는 오류가 발생했습니다.');
    }

    // 응답 데이터 확인
    if (!responseData) {
      throw new Error('서버로부터 응답이 없습니다.');
    }

    return responseData;
  } catch (error: any) {
    console.error(`Admin Service Error (${action}):`, error);
    throw error;
  }
}

export const adminService = {
  /**
   * 관리자 권한 설정/해제
   * @param userId 대상 사용자 ID
   * @param isAdmin 관리자 여부
   */
  async setAdminRole(userId: string, isAdmin: boolean): Promise<AdminServiceResponse> {
    return await invokeAdminFunction('set_admin_role', {
      user_id: userId,
      is_admin: isAdmin
    });
  },

  /**
   * 사용자 승인
   * @param userId 대상 사용자 ID
   */
  async approveUser(userId: string): Promise<AdminServiceResponse> {
    return await invokeAdminFunction('approve_user', {
      user_id: userId
    });
  },

  /**
   * 사용자 완전 삭제 (Auth + Profile + 관련 데이터)
   * @param userId 대상 사용자 ID
   */
  async deleteUser(userId: string): Promise<AdminServiceResponse> {
    return await invokeAdminFunction('delete_user', {
      user_id: userId
    });
  },

  /**
   * 여러 사용자 일괄 승인
   * @param userIds 사용자 ID 배열
   */
  async bulkApprove(userIds: string[]): Promise<AdminServiceResponse> {
    return await invokeAdminFunction('bulk_approve', {
      user_ids: userIds
    });
  },

  /**
   * 모든 사용자 조회 (RLS 우회)
   * @returns 모든 사용자 정보
   */
  async getAllUsers(): Promise<any[]> {
    const response = await invokeAdminFunction('get_all_users', {});
    return response.data || [];
  },

  /**
   * 다른 사용자 프로필 강제 수정
   * @param userId 대상 사용자 ID
   * @param updates 수정할 필드들
   */
  async updateUserProfile(userId: string, updates: any): Promise<AdminServiceResponse> {
    return await invokeAdminFunction('update_user_profile', {
      user_id: userId,
      updates
    });
  },

  /**
   * 현재 사용자가 관리자인지 확인
   */
  async checkIsAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('profile')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        return false;
      }

      return data.is_admin === true;
    } catch (error) {
      console.error('관리자 권한 확인 오류:', error);
      return false;
    }
  }
};