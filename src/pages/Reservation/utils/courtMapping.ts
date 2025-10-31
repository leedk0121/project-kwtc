/**
 * Get display format for court number
 * Converts "C1" to "1번", etc.
 */
export function getDisplayCourtNum(court_num: string): string {
  if (court_num.startsWith('C')) {
    return court_num.substring(1) + '번';
  }
  return court_num;
}

/**
 * Get CSS class for court header based on court name
 */
export function getCourtHeaderClass(court: string): string {
  if (court.includes('노원')) return 'court-nowon';
  if (court.includes('도봉')) return 'court-dobong';
  if (court.includes('중랑')) return 'court-jungnang';
  return 'court-default';
}

/**
 * Get CSS class for table cell based on status and court
 */
export function getCellClass(status: string | undefined, court: string): string {
  if (!status) return '';

  const baseClass = status === '가능' ? 'available' :
                    status === '불가' ? 'unavailable' :
                    status === '예약완료' ? 'reserved' : '';

  const courtClass = getCourtHeaderClass(court).replace('court-', '');

  return `${baseClass} ${courtClass}`;
}

/**
 * Get status icon for reservation
 */
export function getStatusIcon(status: string | undefined): string {
  if (!status) return '';

  switch (status) {
    case '가능':
      return '✅';
    case '불가':
      return '❌';
    case '예약완료':
      return '🔒';
    default:
      return '';
  }
}

/**
 * Check if court is from Nowon region
 */
export function isNowonCourt(court: string): boolean {
  return court.includes('노원') || court.includes('중랑');
}

/**
 * Check if court is from Dobong region
 */
export function isDobongCourt(court: string): boolean {
  return court.includes('도봉');
}
