import { EventData } from './hooks/useEvents';

// 요일 상수
export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 시간 옵션
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i + 1);
export const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5);

// 색상 매핑 (이벤트 타입별)
export const EVENT_COLOR_MAP = {
  1: {
    background: "linear-gradient(135deg, #FBC4D4 0%, #f8e8ec 100%)",
    text: "#4B0082",
    accent: "#e91e63",
    accentDark: "#c2185b",
    badge: "#FBC4D4"
  },
  2: {
    background: "linear-gradient(135deg, #e5f0ff 0%, #f0f7ff 100%)",
    text: "#0D2C54",
    accent: "#2196f3",
    accentDark: "#1976d2",
    badge: "#e5f0ff"
  },
  3: {
    background: "linear-gradient(135deg, #e5ffe5 0%, #f0fff0 100%)",
    text: "#004225",
    accent: "#4caf50",
    accentDark: "#388e3c",
    badge: "#e5ffe5"
  },
  4: {
    background: "linear-gradient(135deg, #D9C7F5 0%, #e8dcf7 100%)",
    text: "#46226dff",
    accent: "#9c27b0",
    accentDark: "#7b1fa2",
    badge: "#D9C7F5"
  },
  5: {
    background: "linear-gradient(135deg, #FFD8B5 0%, #ffe5cc 100%)",
    text: "#2C2C2C",
    accent: "#ff9800",
    accentDark: "#f57c00",
    badge: "#FFD8B5"
  },
  6: {
    background: "linear-gradient(135deg, #FFF9B1 0%, #fffcc4 100%)",
    text: "#333333",
    accent: "#ffc107",
    accentDark: "#ffa000",
    badge: "#FFF9B1"
  }
};

export const DEFAULT_COLOR = {
  background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
  text: "#2d3748",
  accent: "#667eea",
  accentDark: "#4f7dca",
  badge: "#111"
};

// 달력 유틸리티 함수
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function generateCalendarDays(year: number, month: number): (number | null)[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  let calendarDays: (number | null)[] = Array(firstDayOfWeek).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  // 항상 6줄(42칸) 유지
  while (calendarDays.length < 42) {
    calendarDays.push(null);
  }

  return calendarDays;
}

// 날짜 형식화
export function formatDateString(year: number, month: number, date: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
}

export function formatTimeString(hour: string, minute: string): string {
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`;
}

// 날짜 비교
export function isToday(date: number, month: number, year: number, today: Date): boolean {
  return date === today.getDate() && month === today.getMonth() && year === today.getFullYear();
}

export function isSelectedDate(date: number, month: number, year: number, selectedDate: Date | null): boolean {
  if (!selectedDate) return false;
  return date === selectedDate.getDate() &&
         month === selectedDate.getMonth() &&
         year === selectedDate.getFullYear();
}

// 이벤트 필터링
export function getEventsForDate(events: EventData[], year: number, month: number, date: number): EventData[] {
  if (!date) return [];
  const dateStr = formatDateString(year, month, date);
  return events.filter(event => event.date.startsWith(dateStr));
}

export function getMyEvents(events: EventData[], userId: string | null, today: Date): EventData[] {
  if (!userId) return [];
  const todayStr = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
  return events.filter(event =>
    event.Participants &&
    event.Participants.includes(userId) &&
    event.date >= todayStr
  );
}

// 날짜별 이벤트 그룹화
export function groupEventsByDate(events: EventData[]): { [date: string]: EventData[] } {
  const grouped: { [date: string]: EventData[] } = {};
  events.forEach(event => {
    const dateStr = event.date.split("T")[0]; // yyyy-mm-dd
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(event);
  });
  return grouped;
}

// 색상 가져오기
export function getEventColorStyle(colorCode: number): typeof DEFAULT_COLOR {
  return EVENT_COLOR_MAP[colorCode as keyof typeof EVENT_COLOR_MAP] || DEFAULT_COLOR;
}

// 폼 검증
export function validateEventForm(params: {
  where: string;
  courtNumber: string;
  date: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  maxPeople: number | null;
}): boolean {
  return (
    params.where.trim() !== "" &&
    params.courtNumber.trim() !== "" &&
    params.date !== "" &&
    params.startHour !== "" &&
    params.startMinute !== "" &&
    params.endHour !== "" &&
    params.endMinute !== "" &&
    params.maxPeople !== null &&
    params.maxPeople > 0
  );
}
