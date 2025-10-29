import { useState, useCallback } from 'react';
import { supabase } from '../../Auth/supabaseClient';

export interface RankedUser {
  id: string;
  name: string;
  major: string;
  stnum: string;
  rank_tier?: string | null;
  rank_detail?: string | null;
  rank_all?: number;
  raket?: string;
  image_url?: string;
  birthday?: string;
  phone?: string;
}

type ListMode = 'ranked' | 'all';

export function useRankedUsers() {
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ListMode>('ranked');
  const [rankedIds, setRankedIds] = useState<string[]>([]);

  const fetchRankedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ranked_user')
        .select('id, name, major, stnum, rank_tier, rank_detail, rank_all, raket, image_url, birthday, phone');

      if (error) throw error;
      setUsers(data || []);
      setMode('ranked');
    } catch (error) {
      console.error('랭킹 사용자 조회 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, rankedRes] = await Promise.all([
        supabase
          .from('profile')
          .select('id, name, birthday, phone, major, stnum, image_url'),
        supabase
          .from('ranked_user')
          .select('id')
      ]);

      if (profileRes.error) throw profileRes.error;

      setUsers(profileRes.data || []);
      setRankedIds(rankedRes.data?.map((u: any) => u.id) || []);
      setMode('all');
    } catch (error) {
      console.error('전체 사용자 조회 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addUsersToRanking = async (
    userIds: string[],
    tierValues: Record<string, string>,
    detailValues: Record<string, string>
  ) => {
    try {
      const newIds = userIds.filter(id => !rankedIds.includes(id));
      if (newIds.length === 0) {
        return { success: false, message: '이미 추가된 사용자만 선택되어 있습니다.' };
      }

      const usersToAdd = users
        .filter(u => newIds.includes(u.id))
        .map(user => {
          const userObj: any = {
            id: user.id,
            name: user.name,
            major: user.major,
            stnum: user.stnum,
            image_url: user.image_url,
            birthday: user.birthday,
            phone: user.phone
          };

          const tierValue = tierValues[user.id];
          const detailValue = detailValues[user.id];

          if (tierValue !== undefined && tierValue !== '') {
            userObj.rank_tier = tierValue;
          }
          if (detailValue !== undefined && detailValue !== '') {
            userObj.rank_detail = detailValue;
          }

          return userObj;
        });

      const { error } = await supabase
        .from('ranked_user')
        .upsert(usersToAdd);

      if (error) throw error;

      return { success: true, message: `${newIds.length}명이 랭킹에 추가되었습니다.` };
    } catch (error: any) {
      console.error('랭킹 추가 오류:', error);
      return { success: false, message: error.message };
    }
  };

  const deleteFromRanking = async (userIds: string[]) => {
    try {
      const { error } = await supabase
        .from('ranked_user')
        .delete()
        .in('id', userIds);

      if (error) throw error;

      return { success: true, message: '랭킹에서 삭제되었습니다.' };
    } catch (error: any) {
      console.error('랭킹 삭제 오류:', error);
      return { success: false, message: error.message };
    }
  };

  const updateRankings = async (
    updates: { id: string; rank_tier?: string; rank_detail?: string; raket?: string }[]
  ) => {
    try {
      const { error } = await supabase
        .from('ranked_user')
        .upsert(updates, { onConflict: ['id'] });

      if (error) throw error;

      return { success: true, message: '랭킹이 수정되었습니다.' };
    } catch (error: any) {
      console.error('랭킹 수정 오류:', error);
      return { success: false, message: error.message };
    }
  };

  const calculateAndSaveAllRanks = async (currentUsers: RankedUser[]) => {
    try {
      const preprocessed = currentUsers.map(user => ({
        ...user,
        rank_tier: Number(user.rank_tier ?? 0) === 0 ? 99 : user.rank_tier
      }));

      const sorted = [...preprocessed].sort((a, b) => {
        const tierA = Number(a.rank_tier ?? 0);
        const tierB = Number(b.rank_tier ?? 0);
        if (tierA !== tierB) return tierA - tierB;

        const rankA = Number(a.rank_detail ?? 0);
        const rankB = Number(b.rank_detail ?? 0);
        return rankA - rankB;
      });

      const rankAll = sorted.map((user, idx) => ({
        id: user.id,
        rank_all: idx + 1
      }));

      const { error } = await supabase
        .from('ranked_user')
        .upsert(rankAll, { onConflict: ['id'] });

      if (error) throw error;

      return { success: true, message: '전체 랭킹이 저장되었습니다.' };
    } catch (error: any) {
      console.error('전체 랭킹 저장 오류:', error);
      return { success: false, message: error.message };
    }
  };

  const refreshProfileData = async (currentUsers: RankedUser[]) => {
    try {
      const rankedIds = currentUsers.map(u => u.id);
      if (rankedIds.length === 0) return { success: false, message: '사용자가 없습니다.' };

      const { data: profileData, error } = await supabase
        .from('profile')
        .select('id, name, major, stnum, image_url, birthday, phone')
        .in('id', rankedIds);

      if (error || !profileData) throw error;

      const updatedUsers = currentUsers.map(user => {
        const profile = profileData.find((p: any) => p.id === user.id);
        return {
          ...user,
          name: profile?.name ?? user.name,
          major: profile?.major ?? user.major,
          stnum: profile?.stnum ?? user.stnum,
          image_url: profile?.image_url ?? user.image_url,
          birthday: profile?.birthday ?? user.birthday,
          phone: profile?.phone ?? user.phone,
        };
      });

      const { error: upsertError } = await supabase
        .from('ranked_user')
        .upsert(updatedUsers, { onConflict: ['id'] });

      if (upsertError) throw upsertError;

      return { success: true, message: '프로필 정보가 새로고침되었습니다.' };
    } catch (error: any) {
      console.error('프로필 새로고침 오류:', error);
      return { success: false, message: error.message };
    }
  };

  return {
    users,
    loading,
    mode,
    rankedIds,
    fetchRankedUsers,
    fetchAllUsers,
    addUsersToRanking,
    deleteFromRanking,
    updateRankings,
    calculateAndSaveAllRanks,
    refreshProfileData
  };
}
