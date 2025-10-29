import { useState, useCallback } from 'react';
import { supabase } from '../../Auth/supabaseClient';

export interface AddEventParams {
  where: string;
  courtNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  maxPeople: number;
  minTier: number | null;
  hostJoin: boolean;
  hostId: string | null;
}

export function useEventActions() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addEvent = useCallback(async (params: AddEventParams) => {
    const {
      where,
      courtNumber,
      date,
      startTime,
      endTime,
      maxPeople,
      minTier,
      hostJoin,
      hostId
    } = params;

    setLoading(true);
    setSuccess(false);

    try {
      let participants: string[] = [];
      let participants_num = 0;
      if (hostJoin && hostId) {
        participants = [hostId];
        participants_num = 1;
      }

      const { error } = await supabase.from("vote").insert([
        {
          host: hostId,
          where,
          court_number: courtNumber,
          date,
          start_time: startTime,
          end_time: endTime,
          max_people: maxPeople,
          min_tier: minTier,
          Participants: participants,
          participant_num: participants_num,
        }
      ]);

      if (error) throw error;

      setSuccess(true);
      return { success: true, message: '일정 추가에 성공했습니다.' };
    } catch (error: any) {
      console.error('일정 추가 오류:', error);
      return { success: false, message: '일정 추가에 실패했습니다.', error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    success,
    addEvent,
    setSuccess
  };
}
