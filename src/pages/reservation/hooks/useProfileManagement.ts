import { useState, useCallback } from 'react';
import { supabase } from '../../Auth/supabaseClient';

export interface UserProfile {
  name: string;
  major: string;
  stnum: string;
  email: string;
  image_url: string;
  nowon_id?: string;
  nowon_pass?: string;
  dobong_id?: string;
  dobong_pass?: string;
  reservation_alert?: boolean;
}

export interface TennisAccountEditData {
  nowon_id: string;
  nowon_pass: string;
  dobong_id: string;
  dobong_pass: string;
}

/**
 * Custom hook for managing user profile
 */
export function useProfileManagement() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load user profile data
   */
  const loadUserData = useCallback(async () => {
    try {
      const userName = localStorage.getItem('user_name') || '';
      const userMajor = localStorage.getItem('user_major') || '';
      const userStnum = localStorage.getItem('user_stnum') || '';
      const userImageUrl = localStorage.getItem('user_image_url') || '';

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: reservationData, error } = await supabase
          .from('tennis_reservation_profile')
          .select('nowon_id, nowon_pass, dobong_id, dobong_pass, reservation_alert')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('테니스장 계정 정보 로드 오류:', error);
        }

        setProfile({
          name: userName,
          major: userMajor,
          stnum: userStnum,
          email: user.email || '',
          image_url: userImageUrl,
          nowon_id: reservationData?.nowon_id || '',
          nowon_pass: reservationData?.nowon_pass || '',
          dobong_id: reservationData?.dobong_id || '',
          dobong_pass: reservationData?.dobong_pass || '',
          reservation_alert: reservationData?.reservation_alert ?? true
        });
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save tennis account information
   */
  const saveTennisAccountInfo = useCallback(async (accountInfo: TennisAccountEditData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다.');

      const { data: existingData } = await supabase
        .from('tennis_reservation_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingData) {
        const { error } = await supabase
          .from('tennis_reservation_profile')
          .update(accountInfo)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tennis_reservation_profile')
          .insert({
            user_id: user.id,
            ...accountInfo
          });

        if (error) throw error;
      }

      setProfile(prev => prev ? {
        ...prev,
        nowon_id: accountInfo.nowon_id,
        nowon_pass: accountInfo.nowon_pass,
        dobong_id: accountInfo.dobong_id,
        dobong_pass: accountInfo.dobong_pass
      } : null);
    } catch (error) {
      console.error('계정 정보 저장 오류:', error);
      throw error;
    }
  }, []);

  /**
   * Toggle reservation alert setting
   */
  const toggleReservationAlert = useCallback(async (checked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다.');

      const { data: existingData } = await supabase
        .from('tennis_reservation_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingData) {
        const { error } = await supabase
          .from('tennis_reservation_profile')
          .update({ reservation_alert: checked })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tennis_reservation_profile')
          .insert({
            user_id: user.id,
            reservation_alert: checked
          });

        if (error) throw error;
      }

      setProfile(prev => prev ? {
        ...prev,
        reservation_alert: checked
      } : null);
    } catch (error) {
      console.error('알림 설정 저장 오류:', error);
    }
  }, []);

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async (navigate: any) => {
    const confirmLogout = window.confirm('로그아웃 하시겠습니까?');
    if (confirmLogout) {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate('/login');
    }
  }, []);

  return {
    profile,
    loading,
    loadUserData,
    saveTennisAccountInfo,
    toggleReservationAlert,
    handleLogout
  };
}
