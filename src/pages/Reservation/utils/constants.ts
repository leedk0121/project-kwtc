// Proxy URL for court crawling
export const PROXY_URL = 'http://kwtc.dothome.co.kr/proxy.php';

// Payment URLs
export const NOWON_PAYMENT_URL = 'https://reservation.nowonsc.kr/';
export const DOBONG_PAYMENT_URL = 'https://yeyak.dobongsiseol.or.kr/rent/index.php?c_id=05&page_info=index&n_type=rent&c_ox=0';

// Time slots for reservations
export const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00"
];

// Cache expiry time (in hours)
export const CACHE_EXPIRY_HOURS = 1;

// Court names
export const COURT_NAMES = {
  NOWON: '노원테니스장',
  JUNGNANG: '중랑테니스장',
  DOBONG: '도봉테니스장'
} as const;

// Status types
export const RESERVATION_STATUS = {
  AVAILABLE: '가능',
  UNAVAILABLE: '불가',
  RESERVED: '예약완료'
} as const;
