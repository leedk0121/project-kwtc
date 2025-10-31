import { useState, useEffect } from 'react';
import { supabase } from '../../Auth/supabaseClient';

export interface RankedUser {
  id: string;
  major: string;
  name: string;
  stnum: string;
  rank_tier: number;
  rank_detail: number;
  rank_all: number;
  image_url: string;
  raket?: string;
}

/**
 * Custom hook for fetching ranking data
 */
export function useRankingData() {
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('ranked_user')
          .select('id, major, name, stnum, rank_tier, rank_detail, rank_all, image_url, raket')
          .order('rank_tier', { ascending: true })
          .order('rank_detail', { ascending: true });

        if (error) throw error;
        if (data) setUsers(data);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch ranking data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { users, loading, error };
}
