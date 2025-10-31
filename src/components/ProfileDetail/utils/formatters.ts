/**
 * 랭킹 표시 함수
 */
export function getRankDisplay(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

/**
 * 연락처 포맷 함수
 */
export function formatPhone(phone: string): string {
  // 숫자만 추출
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11) {
    // 010-1234-5678
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  } else if (digits.length === 10) {
    // 02-1234-5678 또는 011-123-4567
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  return phone;
}

/**
 * 기본 프로필 이미지 URL
 */
export function getDefaultProfileImage(): string {
  return "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png";
}
