import { useEffect, useState } from 'react';
import { supabase } from '../../../pages/Auth/supabaseClient';

export function useMyTier() {
  const [myTier, setMyTier] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTier = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMyTier(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ranked_user')
        .select('rank_tier')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setMyTier(Number(data.rank_tier));
      } else {
        setMyTier(null);
      }

      setLoading(false);
    };

    fetchMyTier();
  }, []);

  return { myTier, loading };
}
