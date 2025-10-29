export const POST_TYPE_KR: { [key: string]: string } = {
  announcement: '공지',
  tour: '대회',
  normal: '자유',
};

export const POST_TYPE_OPTIONS = [
  { value: 'normal', label: '자유', icon: '💬', color: '#3b82f6' },
  { value: 'announcement', label: '공지', icon: '📢', color: '#ef4444' },
  { value: 'tour', label: '대회', icon: '🏆', color: '#f59e0b' }
];

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInHours < 48) {
    return '1일 전';
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  }
}

export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleString('ko-KR');
}
