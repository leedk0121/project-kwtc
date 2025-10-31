import { useEffect, useState } from 'react';
import { supabase } from '../../../pages/Auth/supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  name: string;
  major: string;
  stnum: number;
  image_url: string;
}

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // 로컬 스토리지에서 사용자 정보 가져오기
      const userName = localStorage.getItem('user_name');
      const userMajor = localStorage.getItem('user_major');
      const userStnum = localStorage.getItem('user_stnum');
      const userImageUrl = localStorage.getItem('user_image_url');

      setProfile({
        name: userName || '',
        major: userMajor || '',
        stnum: parseInt(userStnum || '0'),
        image_url: userImageUrl || ''
      });

      setLoading(false);
    };

    fetchUserAndProfile();
  }, []);

  return { user, profile, loading };
}
