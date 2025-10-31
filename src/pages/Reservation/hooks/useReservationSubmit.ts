import { useState, useCallback } from 'react';
import { SelectedReservation } from './useReservationSelection';
import { TennisAccount } from './useReservationAccounts';

const PROXY_URL = 'http://kwtc.dothome.co.kr/proxy.php';

type ReservationResult = {
  court: string;
  courtNum: string;
  date: string;
  time: string;
  success: boolean;
  message?: string;
  rent_no?: string;
  price?: string;
  pprice?: string;
  eprice?: string;
  region?: 'nowon' | 'dobong';
};

export function useReservationSubmit(tennisAccount: TennisAccount) {
  const [submitting, setSubmitting] = useState(false);

  const submitNowonReservations = useCallback(async (
    reservations: SelectedReservation[]
  ): Promise<ReservationResult[]> => {
    const results: ReservationResult[] = [];

    for (const res of reservations) {
      try {
        const response = await fetch(PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reserve_nowon',
            username: tennisAccount.nowon_id,
            password: tennisAccount.nowon_pass,
            court: res.court,
            court_num: res.court_num,
            date: res.date,
            time: res.time
          })
        });

        const result = await response.json();

        if (result.success) {
          results.push({
            court: res.court,
            courtNum: res.court_num,
            date: res.date,
            time: res.time,
            success: true,
            message: result.message,
            rent_no: result.rent_no,
            price: result.price,
            pprice: result.pprice,
            eprice: result.eprice,
            region: 'nowon'
          });
        } else {
          results.push({
            court: res.court,
            courtNum: res.court_num,
            date: res.date,
            time: res.time,
            success: false,
            message: result.error || '예약에 실패했습니다.',
            region: 'nowon'
          });
        }
      } catch (error: any) {
        console.error('노원 예약 오류:', error);
        results.push({
          court: res.court,
          courtNum: res.court_num,
          date: res.date,
          time: res.time,
          success: false,
          message: error.message || '예약 중 오류가 발생했습니다.',
          region: 'nowon'
        });
      }
    }

    return results;
  }, [tennisAccount.nowon_id, tennisAccount.nowon_pass]);

  const submitDobongReservations = useCallback(async (
    reservations: SelectedReservation[]
  ): Promise<ReservationResult[]> => {
    const results: ReservationResult[] = [];

    for (const res of reservations) {
      try {
        const response = await fetch(PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reserve_dobong',
            username: tennisAccount.dobong_id,
            password: tennisAccount.dobong_pass,
            court: res.court,
            court_num: res.court_num,
            date: res.date,
            time: res.time
          })
        });

        const result = await response.json();

        if (result.success) {
          results.push({
            court: res.court,
            courtNum: res.court_num,
            date: res.date,
            time: res.time,
            success: true,
            message: result.message,
            rent_no: result.rent_no,
            price: result.price,
            pprice: result.pprice,
            eprice: result.eprice,
            region: 'dobong'
          });
        } else {
          results.push({
            court: res.court,
            courtNum: res.court_num,
            date: res.date,
            time: res.time,
            success: false,
            message: result.error || '예약에 실패했습니다.',
            region: 'dobong'
          });
        }
      } catch (error: any) {
        console.error('도봉 예약 오류:', error);
        results.push({
          court: res.court,
          courtNum: res.court_num,
          date: res.date,
          time: res.time,
          success: false,
          message: error.message || '예약 중 오류가 발생했습니다.',
          region: 'dobong'
        });
      }
    }

    return results;
  }, [tennisAccount.dobong_id, tennisAccount.dobong_pass]);

  const submitAllReservations = useCallback(async (
    reservations: SelectedReservation[]
  ): Promise<ReservationResult[]> => {
    if (reservations.length === 0) {
      return [];
    }

    setSubmitting(true);

    try {
      const nowonReservations = reservations.filter(r =>
        r.court.includes('노원') || r.court.includes('중랑')
      );
      const dobongReservations = reservations.filter(r =>
        r.court.includes('도봉')
      );

      const results: ReservationResult[] = [];

      if (nowonReservations.length > 0) {
        const nowonResults = await submitNowonReservations(nowonReservations);
        results.push(...nowonResults);
      }

      if (dobongReservations.length > 0) {
        const dobongResults = await submitDobongReservations(dobongReservations);
        results.push(...dobongResults);
      }

      return results;
    } catch (error) {
      console.error('예약 제출 오류:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [submitNowonReservations, submitDobongReservations]);

  return {
    submitting,
    submitNowonReservations,
    submitDobongReservations,
    submitAllReservations
  };
}
