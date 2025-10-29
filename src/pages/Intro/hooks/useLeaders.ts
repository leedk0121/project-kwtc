import { useState, useCallback } from 'react';
import { supabase } from '../../Auth/supabaseClient';

export interface LeaderProfile {
  user_id: string;
  position: string;
  position_description: string;
  order_num: number;
  profile?: {
    id: string;
    name: string;
    major: string;
    image_url?: string;
  } | null;
}

export function useLeaders() {
  const [leaders, setLeaders] = useState<LeaderProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: leaderData, error: leaderError } = await supabase
        .from('leader_profile')
        .select('user_id, position, position_description, order_num')
        .order('order_num', { ascending: true });

      if (leaderError) throw leaderError;

      const userIds = leaderData.map(leader => leader.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profile')
        .select('id, name, major, image_url')
        .in('id', userIds);

      if (profileError) throw profileError;

      const mergedData = leaderData.map(leader => {
        const profile = profileData.find(p => p.id === leader.user_id);
        return {
          ...leader,
          profile: profile || null
        };
      });

      setLeaders(mergedData);
      return { success: true, data: mergedData };
    } catch (error: any) {
      console.error('임원진 조회 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    leaders,
    loading,
    fetchLeaders
  };
}
