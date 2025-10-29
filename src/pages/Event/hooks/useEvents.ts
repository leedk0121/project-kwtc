import { useState, useCallback } from 'react';
import { supabase } from '../../Auth/supabaseClient';

export interface EventData {
  date: string;
  where: string;
  start_time: string;
  end_time: string;
  court_number: string;
  min_tier: number | null;
  max_people: number;
  Participants: string[];
  color: number;
  participant_num: number;
  host: string;
  created_at: string;
}

export function useEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hostNames, setHostNames] = useState<{ [hostId: string]: string }>({});

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vote")
        .select("date, where, start_time, end_time, court_number, min_tier, max_people, Participants, color, participant_num, host, created_at");

      if (error) throw error;

      if (data) {
        setEvents(data);

        // 호스트 아이디 목록 추출
        const hostIds = Array.from(new Set(data.map((v: any) => v.host).filter(Boolean)));
        if (hostIds.length > 0) {
          // 호스트 이름들 가져오기
          const { data: userData } = await supabase
            .from("ranked_user")
            .select("id, name")
            .in("id", hostIds);
          if (userData) {
            const nameMap: { [hostId: string]: string } = {};
            userData.forEach((u: any) => {
              nameMap[u.id] = u.name;
            });
            setHostNames(nameMap);
          }
        }
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('일정 조회 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    hostNames,
    fetchEvents
  };
}
