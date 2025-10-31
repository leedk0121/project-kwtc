import { useEffect, useState } from 'react';
import { supabase } from '../../../pages/Auth/supabaseClient';

export interface ParticipantInfo {
  id: string;
  name: string;
  major: string;
  image_url: string;
  rank_all: number;
}

export function useParticipantsInfo(participantIds: string[]) {
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchParticipantsInfo = async () => {
      if (participantIds.length === 0) {
        setParticipants([]);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('ranked_user')
        .select('id, name, major, image_url, rank_all')
        .in('id', participantIds);

      if (!error && data) {
        setParticipants(data);
      } else {
        setParticipants([]);
      }

      setLoading(false);
    };

    fetchParticipantsInfo();
  }, [participantIds.join(',')]);

  return { participants, loading };
}
