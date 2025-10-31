import { useState, useCallback } from 'react';
import { Reservation, MonthData } from './useReservationData';
import { TennisAccount } from './useReservationAccounts';

const PROXY_URL = 'http://kwtc.dothome.co.kr/proxy.php';

export function useCourtCrawler(tennisAccount: TennisAccount) {
  const [crawlProgress, setCrawlProgress] = useState({ current: 0, total: 0 });

  const crawlDobong = useCallback(async (dateStr: string): Promise<Reservation[]> => {
    try {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crawl_dobong',
          username: tennisAccount.dobong_id,
          password: tennisAccount.dobong_pass,
          dateStr: dateStr.replace(/-/g, '')
        })
      });

      const result = await response.json();

      if (!result.success) {
        console.error('도봉구 크롤링 실패:', result.error);
        if (result.error && (
          result.error.includes('로그인') ||
          result.error.includes('인증') ||
          result.error.includes('비밀번호')
        )) {
          throw new Error('도봉구 계정 정보가 올바르지 않습니다. 계정 정보를 확인해주세요.');
        }
        return [];
      }

      const reservations: Reservation[] = result.data || [];
      return reservations.map(r => ({
        ...r,
        date: dateStr
      }));
    } catch (error: any) {
      console.error('도봉구 크롤링 오류:', error);
      if (error.message && error.message.includes('계정')) {
        throw error;
      }
      return [];
    }
  }, [tennisAccount.dobong_id, tennisAccount.dobong_pass]);

  const crawlNowon = useCallback(async (dates: string[]): Promise<{ [date: string]: Reservation[] }> => {
    const result: { [date: string]: Reservation[] } = {};

    try {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crawl_nowon',
          username: tennisAccount.nowon_id,
          password: tennisAccount.nowon_pass,
          dates: dates
        })
      });

      const data = await response.json();

      if (!data.success) {
        console.error('노원구 크롤링 실패:', data.error);
        if (data.error && (
          data.error.includes('로그인') ||
          data.error.includes('인증') ||
          data.error.includes('비밀번호')
        )) {
          throw new Error('노원구 계정 정보가 올바르지 않습니다. 계정 정보를 확인해주세요.');
        }
        return result;
      }

      return data.data || {};
    } catch (error: any) {
      console.error('노원구 크롤링 오류:', error);
      if (error.message && error.message.includes('계정')) {
        throw error;
      }
      return result;
    }
  }, [tennisAccount.nowon_id, tennisAccount.nowon_pass]);

  const crawlMonthData = useCallback(async (
    year: number,
    month: number,
    forceRefresh = false
  ): Promise<MonthData> => {
    if (!tennisAccount.dobong_id || !tennisAccount.nowon_id) {
      throw new Error('계정 정보가 설정되지 않았습니다.');
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates: string[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dates.push(dateStr);
    }

    const newMonthData: MonthData = {};

    setCrawlProgress({ current: 0, total: dates.length * 2 });

    try {
      // 도봉구 크롤링
      for (let i = 0; i < dates.length; i++) {
        const dateStr = dates[i];
        try {
          const dobongReservations = await crawlDobong(dateStr);
          if (!newMonthData[dateStr]) {
            newMonthData[dateStr] = [];
          }
          newMonthData[dateStr].push(...dobongReservations);
        } catch (error) {
          console.error(`도봉구 크롤링 실패 (${dateStr}):`, error);
        }
        setCrawlProgress({ current: i + 1, total: dates.length * 2 });
      }

      // 노원구 크롤링 (배치)
      try {
        const nowonData = await crawlNowon(dates);
        Object.keys(nowonData).forEach(dateStr => {
          if (!newMonthData[dateStr]) {
            newMonthData[dateStr] = [];
          }
          newMonthData[dateStr].push(...nowonData[dateStr]);
        });
      } catch (error) {
        console.error('노원구 크롤링 실패:', error);
      }

      setCrawlProgress({ current: dates.length * 2, total: dates.length * 2 });

      return newMonthData;
    } catch (error) {
      console.error('월별 데이터 크롤링 오류:', error);
      throw error;
    }
  }, [tennisAccount, crawlDobong, crawlNowon]);

  return {
    crawlProgress,
    setCrawlProgress,
    crawlDobong,
    crawlNowon,
    crawlMonthData
  };
}
