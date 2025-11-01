import { useEffect, useState } from 'react';
import { supabase } from '../../../pages/Auth/supabaseClient';

export interface ProfileData {
  name: string;
  major: string;
  stnum: string;
  rank_all: number;
  image_url: string;
  birthday: string;
  phone: string;
  rank_tier: number;
  position?: string; // 임원진 직책 (선택적)
  leader_icon?: string; // 임원진 아이콘 (선택적)
}

export function useProfileData(id: string) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // 1. ranked_user 정보 가져오기
        const { data: userData, error: userError } = await supabase
          .from('ranked_user')
          .select('name, major, stnum, rank_all, image_url, birthday, phone, rank_tier')
          .eq('id', id)
          .single();

        if (userError) throw userError;

        // 2. leader_profile 테이블에서 직책 정보 가져오기
        const { data: leaderData } = await supabase
          .from('leader_profile')
          .select('position, leader_icon')
          .eq('user_id', id)
          .maybeSingle(); // single 대신 maybeSingle 사용 (리더가 아닐 수 있음)

        // 3. 데이터 병합
        if (userData) {
          setProfile({
            ...userData,
            position: leaderData?.position || undefined,
            leader_icon: leaderData?.leader_icon || undefined
          });
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  return { profile, loading, error };
}
