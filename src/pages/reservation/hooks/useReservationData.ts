import { useState, useCallback } from 'react';
import { supabase } from '../../Auth/supabaseClient';

export type Reservation = {
  court: string;
  date: string;
  court_num: string;
  start_time: string;
  end_time: string;
  status: string;
};

export type MonthData = {
  [date: string]: Reservation[];
};

interface CachedData {
  updatedAt: number;
  year: number;
  month: number;
  data: MonthData;
}

export function useReservationData() {
  const [monthData, setMonthData] = useState<MonthData>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  const getCachedMonthData = useCallback(async (year: number, month: number): Promise<CachedData | null> => {
    const fileName = `${year}-${String(month + 1).padStart(2, '0')}-all.json`;

    try {
      const { data, error } = await supabase.storage
        .from('crawl-cache')
        .download(fileName);

      if (error) {
        return null;
      }

      const text = await data.text();
      const cached = JSON.parse(text) as CachedData;

      return cached;
    } catch (error) {
      console.error('캐시 로드 오류:', error);
      return null;
    }
  }, []);

  const saveMonthDataToStorage = useCallback(async (
    year: number,
    month: number,
    monthData: MonthData
  ): Promise<boolean> => {
    const fileName = `${year}-${String(month + 1).padStart(2, '0')}-all.json`;

    const cacheData: CachedData = {
      updatedAt: Date.now(),
      year,
      month: month + 1,
      data: monthData
    };

    try {
      const jsonData = JSON.stringify(cacheData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });

      await supabase.storage
        .from('crawl-cache')
        .remove([fileName]);

      const { error } = await supabase.storage
        .from('crawl-cache')
        .upload(fileName, blob, {
          contentType: 'application/json',
          upsert: true
        });

      if (error) {
        console.error('캐시 저장 오류:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('캐시 저장 오류:', error);
      return false;
    }
  }, []);

  const isDataStale = useCallback(() => {
    if (!lastUpdated) return true;
    const hoursSinceUpdate = (Date.now() - lastUpdated) / (1000 * 60 * 60);
    return hoursSinceUpdate > 1;
  }, [lastUpdated]);

  const loadCachedData = useCallback(async (year: number, month: number) => {
    const cached = await getCachedMonthData(year, month);

    if (cached) {
      setMonthData(cached.data);
      setUsingCache(true);
      setLastUpdated(cached.updatedAt);
      return true;
    }

    return false;
  }, [getCachedMonthData]);

  return {
    monthData,
    setMonthData,
    loading,
    setLoading,
    lastUpdated,
    setLastUpdated,
    usingCache,
    setUsingCache,
    getCachedMonthData,
    saveMonthDataToStorage,
    isDataStale,
    loadCachedData
  };
}
