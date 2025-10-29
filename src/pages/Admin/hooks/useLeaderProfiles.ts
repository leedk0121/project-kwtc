import { useState, useCallback } from 'react';
import { supabase } from '../../Auth/supabaseClient';

export interface Profile {
  id: string;
  name: string;
  major: string;
  stnum: string;
  image_url?: string;
}

export interface LeaderProfile {
  user_id: string;
  position: string;
  position_description: string;
  order_num: number;
}

export interface LeaderProfileWithDetails extends LeaderProfile {
  profile?: Profile;
}

export function useLeaderProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [leaderProfiles, setLeaderProfiles] = useState<LeaderProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('id, name, major, stnum, image_url');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      throw error;
    }
  }, []);

  const fetchLeaderProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leader_profile')
        .select('user_id, position, position_description, order_num')
        .order('order_num', { ascending: true });

      if (error) throw error;
      setLeaderProfiles(data || []);
    } catch (error) {
      console.error('리더 프로필 조회 오류:', error);
      throw error;
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProfiles(), fetchLeaderProfiles()]);
    } finally {
      setLoading(false);
    }
  }, [fetchProfiles, fetchLeaderProfiles]);

  const addLeaderRole = async (
    userId: string,
    position: string,
    positionDescription: string,
    orderNum: number
  ) => {
    try {
      const { data, error } = await supabase
        .from('leader_profile')
        .insert([{
          user_id: userId,
          position,
          position_description: positionDescription,
          order_num: orderNum
        }])
        .select('user_id, position, position_description, order_num');

      if (error) throw error;

      if (data && data.length > 0) {
        const updatedLeaderProfiles = [...leaderProfiles, data[0]]
          .sort((a, b) => a.order_num - b.order_num);

        setLeaderProfiles(updatedLeaderProfiles);
        return { success: true, message: '역할이 추가되었습니다.' };
      }

      return { success: false, message: '역할 추가에 실패했습니다.' };
    } catch (error: any) {
      console.error('역할 추가 오류:', error);
      return { success: false, message: error.message };
    }
  };

  const removeLeaderRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('leader_profile')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setLeaderProfiles(leaderProfiles.filter(role => role.user_id !== userId));
      return { success: true, message: '역할이 삭제되었습니다.' };
    } catch (error: any) {
      console.error('역할 삭제 오류:', error);
      return { success: false, message: error.message };
    }
  };

  const updateLeaderRole = async (
    userId: string,
    position?: string,
    positionDescription?: string,
    orderNum?: number
  ) => {
    try {
      const updateData: any = {};
      if (position !== undefined) updateData.position = position;
      if (positionDescription !== undefined) updateData.position_description = positionDescription;
      if (orderNum !== undefined) updateData.order_num = orderNum;

      const { error } = await supabase
        .from('leader_profile')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      const { data: updatedData, error: fetchError } = await supabase
        .from('leader_profile')
        .select('user_id, position, position_description, order_num')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      if (updatedData) {
        const updatedProfiles = leaderProfiles.map(role =>
          role.user_id === userId ? updatedData : role
        ).sort((a, b) => a.order_num - b.order_num);

        setLeaderProfiles(updatedProfiles);
      }

      return { success: true, message: '역할이 수정되었습니다.' };
    } catch (error: any) {
      console.error('역할 수정 오류:', error);
      return { success: false, message: error.message };
    }
  };

  const getProfileByUserId = useCallback((userId: string) => {
    return profiles.find(profile => profile.id === userId);
  }, [profiles]);

  const getAvailableProfiles = useCallback(() => {
    return profiles.filter(profile =>
      !leaderProfiles.some(leaderProfile => leaderProfile.user_id === profile.id)
    );
  }, [profiles, leaderProfiles]);

  const getLeaderProfilesWithDetails = useCallback((): LeaderProfileWithDetails[] => {
    return leaderProfiles.map(leader => ({
      ...leader,
      profile: getProfileByUserId(leader.user_id)
    }));
  }, [leaderProfiles, getProfileByUserId]);

  return {
    profiles,
    leaderProfiles,
    loading,
    fetchAll,
    addLeaderRole,
    removeLeaderRole,
    updateLeaderRole,
    getProfileByUserId,
    getAvailableProfiles,
    getLeaderProfilesWithDetails
  };
}
