import { useState, useCallback } from 'react';
import { supabase } from '../../Auth/supabaseClient';

export interface ReservationDetail {
  orderNumber: string;
  useDayBegin: string;
  useDayEnd: string;
  useDayBeginDay: number;
  useDayEndDay: number;
  useTimeBegin: string;
  useTimeEnd: string;
  cName: string;
  codeName: string;
  productName: string;
  price: number;
  pricePay: number;
  stat: string;
  p_stat: string;
  seq: number;
  insertDate: string;
  insertTime: string;
}

export interface NowonReservation {
  no: number;
  apply_date: string;
  reservation_date: string;
  reservation_time: string;
  facility: string;
  location: string;
  payment_amount: string;
  payment_status: string;
  payment_method: string;
  cancel_status: string;
  raw: {
    totalPriceSale: number;
    method: string;
    pstat: string;
    insertDate: string;
    priceRefundTotalPricePay: number;
    p: string;
    okayYn: string;
    totalcnt: number;
    cName: string;
    payMethod: string;
    detailList: ReservationDetail[];
    rstat: string;
    seq: number;
  };
}

export interface DobongReservation {
  type: 'pending' | 'completed';
  column_1?: string;
  column_2?: string;
  column_3?: string;
  column_4?: string;
  column_5?: string;
  column_6?: string;
  column_7?: string;
  links?: Array<{
    text: string;
    href: string;
  }>;
}

export interface DobongHeaders {
  pending?: string[];
  completed?: string[];
}

/**
 * Custom hook for managing reservation history
 */
export function useReservationHistory() {
  const [reservationHistory, setReservationHistory] = useState<NowonReservation[]>([]);
  const [dobongReservationHistory, setDobongReservationHistory] = useState<DobongReservation[]>([]);
  const [dobongHeaders, setDobongHeaders] = useState<DobongHeaders>({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDobongHistory, setLoadingDobongHistory] = useState(false);

  /**
   * Load Nowon reservation history
   */
  const loadReservationHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('로그인이 필요합니다');
      }

      const functionUrl = `${supabase.supabaseUrl}/functions/v1/crawl-nowon-reservation`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 응답 오류:', errorData);
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        setReservationHistory(result.data);
        return;
      }

      if (result.userId) {
        const { data: storageData, error: storageError } = await supabase.storage
          .from('reservation-data')
          .download(`nowon-reservations-${result.userId}.json`);

        if (storageError) {
          console.error('❌ Storage 다운로드 오류:', storageError);
          throw new Error(`Storage 다운로드 실패: ${storageError.message}`);
        }

        const fileContent = await storageData.text();
        const jsonData = JSON.parse(fileContent);

        const reservations = jsonData.reservations || [];
        setReservationHistory(reservations);
      } else {
        throw new Error('사용자 ID가 응답에 없습니다.');
      }
    } catch (error: any) {
      console.error('❌ 예약 내역 로드 오류:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  /**
   * Load Dobong reservation history
   */
  const loadDobongReservationHistory = useCallback(async (dobongId: string, dobongPass: string) => {
    try {
      setLoadingDobongHistory(true);

      if (!dobongId || !dobongPass) {
        alert('도봉구 계정 정보가 없습니다. 프로필에서 등록해주세요.');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('로그인이 필요합니다');
      }

      const PROXY_URL = 'http://kwtc.dothome.co.kr/get_reservation_list.php';

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_reservation_list',
          username: dobongId,
          password: dobongPass,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const pendingReservations = result.data.pending?.reservations || [];
        const completedReservations = result.data.completed?.reservations || [];
        const allReservations = [...pendingReservations, ...completedReservations];

        setDobongHeaders({
          pending: result.data.pending?.headers,
          completed: result.data.completed?.headers,
        });

        setDobongReservationHistory(allReservations);

        // Save to storage
        try {
          const jsonData = {
            pending: result.data.pending,
            completed: result.data.completed,
            total_count: allReservations.length,
            crawled_at: new Date().toISOString()
          };

          const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
            type: 'application/json'
          });

          const fileName = `dobong-reservations-${user.id}.json`;

          const { data: existingFiles } = await supabase.storage
            .from('reservation-data')
            .list('', {
              search: fileName
            });

          if (existingFiles && existingFiles.length > 0) {
            await supabase.storage
              .from('reservation-data')
              .remove([fileName]);
          }

          await supabase.storage
            .from('reservation-data')
            .upload(fileName, blob, {
              contentType: 'application/json',
              upsert: true
            });
        } catch (storageError) {
          console.error('Storage 처리 오류:', storageError);
        }
      } else {
        throw new Error(result.error || '데이터를 불러올 수 없습니다');
      }

    } catch (error: any) {
      console.error('❌ 도봉구 예약 내역 조회 오류:', error);
      alert(error.message || '예약 내역을 불러올 수 없습니다');
    } finally {
      setLoadingDobongHistory(false);
    }
  }, []);

  /**
   * Cancel Nowon reservation
   */
  const cancelNowonReservation = useCallback(async (seq: number, totalPrice: number) => {
    const confirmCancel = window.confirm('정말로 예약을 취소하시겠습니까?');
    if (!confirmCancel) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다');
        return false;
      }

      const functionUrl = `${supabase.supabaseUrl}/functions/v1/cancel-nowon-reservation`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inRseq: seq,
          totalPrice: totalPrice
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 취소 오류:', errorData);
        throw new Error(errorData.error || '예약 취소에 실패했습니다');
      }

      alert('예약이 취소되었습니다.');
      await loadReservationHistory();
      return true;
    } catch (error: any) {
      console.error('❌ 예약 취소 오류:', error);
      alert(error.message || '예약 취소에 실패했습니다');
      return false;
    }
  }, [loadReservationHistory]);

  /**
   * Cancel Dobong reservation
   */
  const cancelDobongReservation = useCallback(async (
    reservation: DobongReservation,
    dobongId: string,
    dobongPass: string
  ) => {
    const rentNo = reservation.column_1 || '';
    const facilityName = reservation.column_5 || '시설명 없음';

    let place_code = '';
    if (facilityName.includes('실내')) {
      place_code = '019';
    } else if (facilityName.includes('실외')) {
      place_code = '022';
    }
    const event_code = '039';

    const member_name = localStorage.getItem('user_name') || '';

    let goodsName = '';
    if (facilityName.length >= 12) {
      goodsName = facilityName.substring(7, 12);
    }

    if (!confirm(`정말로 "${facilityName}" 예약을 취소하시겠습니까?\n\n취소 후에는 복구할 수 없습니다.`)) {
      return false;
    }

    try {
      if (!dobongId || !dobongPass) {
        alert('도봉구 계정 정보가 없습니다.');
        return false;
      }

      const CANCEL_URL = 'http://kwtc.dothome.co.kr/cancel_dobong_reservation.php';

      const payload: any = {
        action: 'cancel_reservation',
        username: dobongId,
        password: dobongPass,
        rent_no: rentNo,
        place_code,
        event_code,
        member_name,
        goodsName,
        member_id: dobongId
      };

      const response = await fetch(CANCEL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert('예약이 취소되었습니다.');
        await loadDobongReservationHistory(dobongId, dobongPass);
        return true;
      } else {
        throw new Error(result.error || result.message || '취소 실패');
      }
    } catch (error: any) {
      console.error('❌ 도봉구 예약 취소 오류:', error);
      alert('❌ 예약 취소 실패: ' + error.message);
      return false;
    }
  }, [loadDobongReservationHistory]);

  return {
    reservationHistory,
    dobongReservationHistory,
    dobongHeaders,
    loadingHistory,
    loadingDobongHistory,
    loadReservationHistory,
    loadDobongReservationHistory,
    cancelNowonReservation,
    cancelDobongReservation
  };
}
