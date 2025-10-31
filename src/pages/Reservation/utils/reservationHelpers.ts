import type { NowonReservation, DobongReservation } from '../hooks';

/**
 * Get reservation status text
 */
export function getReservationStatus(reservation: NowonReservation): string {
  const raw = reservation.raw;

  if (raw.rstat === 'C' || raw.rstat === '1') return '예약취소';
  if (raw.rstat === 'R' || raw.pstat === '결제대기') return '결제대기';
  if (raw.pstat === '결제완료') return '결제완료';
  if (raw.okayYn === 'Y') return '승인완료';

  return '대기중';
}

/**
 * Get CSS class for reservation status
 */
export function getStatusClass(reservation: NowonReservation): string {
  const raw = reservation.raw;

  if (raw.rstat === 'C' || raw.rstat === '1') return 'status-cancelled';
  if (raw.rstat === 'R' || raw.pstat === '결제대기') return 'status-payment-waiting';
  if (raw.pstat === '결제완료') return 'status-confirmed';
  if (raw.okayYn === 'Y') return 'status-approved';

  return 'status-pending';
}

/**
 * Get CSS class for Dobong reservation status
 */
export function getDobongStatusClass(reservation: DobongReservation): string {
  const status = reservation.column_2 || '';

  if (status.includes('시간경과취소') || status.includes('취소')) {
    return 'status-time-cancelled';
  }

  if (reservation.type === 'completed') {
    return 'status-completed';
  }

  return 'status-pending';
}

/**
 * Get day of week in Korean
 */
export function getDayOfWeek(day: number): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[day] || '';
}

/**
 * Filter Nowon reservations by status
 */
export function getFilteredReservations(
  reservations: NowonReservation[],
  filterStatus: 'all' | 'payment-waiting' | 'payment-completed'
): NowonReservation[] {
  return reservations.filter(reservation => {
    const raw = reservation.raw;

    if (raw.rstat === 'C' || raw.rstat === '1') {
      return false;
    }

    if (filterStatus === 'all') return true;

    if (filterStatus === 'payment-waiting') {
      return raw.rstat === 'R' || raw.pstat === '결제대기';
    }

    if (filterStatus === 'payment-completed') {
      return raw.pstat === '결제완료';
    }

    return true;
  });
}

/**
 * Filter Dobong reservations by type
 */
export function getFilteredDobongReservations(
  reservations: DobongReservation[],
  filterType: 'pending' | 'completed' | 'cancelled'
): DobongReservation[] {
  if (filterType === 'pending') {
    return reservations.filter(
      r => r.type === 'pending' && !(r.column_2?.includes('취소'))
    );
  }
  if (filterType === 'cancelled') {
    return reservations.filter(
      r => r.column_2?.includes('취소')
    );
  }
  return reservations.filter(
    r => r.type === 'completed' && !(r.column_2?.includes('취소'))
  );
}

/**
 * Calculate Dobong reservation counts by type
 */
export function getDobongCounts(
  reservations: DobongReservation[],
  headers: { pending?: string[]; completed?: string[] }
) {
  const headerPendingStatus = headers.pending && headers.pending.length > 14 ? headers.pending[9] : '';
  const headerCompletedStatus = headers.completed && headers.completed.length > 14 ? headers.completed[9] : '';

  const pendingCount = reservations.filter(
    r => r.type === 'pending' && !(r.column_2?.includes('취소')) && !(r.column_2?.includes('완료'))
  ).length;
  const cancelledCount = reservations.filter(
    r => r.column_2?.includes('취소')
  ).length;
  const completedCount = reservations.filter(
    r => r.type === 'completed' && !(r.column_2?.includes('취소'))
  ).length;

  return {
    pending: pendingCount + (
      headers.pending && headers.pending.length > 14 &&
      !headerPendingStatus.includes('취소') &&
      !headerPendingStatus.includes('완료')
        ? 1 : 0
    ),
    cancelled: cancelledCount + (
      headers.pending && headers.pending.length > 14 &&
      headerPendingStatus.includes('취소')
        ? 1 : 0
    ),
    completed: completedCount +
      (
        headers.pending && headers.pending.length > 14 &&
        headerPendingStatus.includes('완료')
          ? 1 : 0
      ) +
      (
        headers.completed && headers.completed.length > 14 &&
        headerCompletedStatus.includes('완료')
          ? 1 : 0
      )
  };
}
