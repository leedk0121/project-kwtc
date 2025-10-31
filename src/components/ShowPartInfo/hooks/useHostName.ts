import { useEffect, useState } from 'react';
import { supabase } from '../../../pages/Auth/supabaseClient';

export function useHostName(hostId: string | null) {
  const [hostName, setHostName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHostName = async () => {
      if (!hostId) {
        setHostName("");
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('ranked_user')
        .select('name')
        .eq('id', hostId)
        .single();

      if (!error && data) {
        setHostName(data.name);
      } else {
        setHostName(hostId);
      }

      setLoading(false);
    };

    fetchHostName();
  }, [hostId]);

  return { hostName, loading };
}
