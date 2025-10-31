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
        const { data, error } = await supabase
          .from('ranked_user')
          .select('name, major, stnum, rank_all, image_url, birthday, phone, rank_tier')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) setProfile(data);
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
