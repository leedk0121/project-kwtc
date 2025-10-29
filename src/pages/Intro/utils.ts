export function getPositionBadgeClass(position: string): string {
  switch (position.toLowerCase()) {
    case '회장':
    case 'president':
      return 'president';
    case '부회장':
    case 'vice-president':
      return 'vice-president';
    case '총무':
    case 'treasurer':
      return 'treasurer';
    case '운영진':
    case 'manager':
      return 'manager';
    default:
      return 'member';
  }
}

export const CLUB_INFO = {
  name: 'KWTC',
  fullName: '광운대학교 테니스 동아리',
  foundedYear: '1978년',
  affiliation: '광운대학교 중앙동아리',
  sport: '테니스',
  activities: '정기 연습, 대회 참가',
  instagram: {
    handle: '@kwtc_official',
    url: 'https://instagram.com/kwtc_official'
  },
  description: '광운대학교 테니스 동아리 KWTC는 1978년에 처음 창립된 광운대학교의 중앙동아리입니다. 45년의 오랜 전통과 역사를 자랑하며, 수많은 테니스 애호가들과 함께 성장해왔습니다.'
};
