// src/pages/reservation/UnifiedReservationPage.tsx
import React, { useState, useEffect } from "react";
import './UnifiedreservationPage.css';
import { supabase } from "../auth/supabaseClient";
import { useNavigate } from "react-router-dom";

type Reservation = {
  court: string;
  date: string;
  court_num: string;
  start_time: string;
  end_time: string;
  status: string;
};

type MonthData = {
  [date: string]: Reservation[];
};

type SelectedReservation = {
  court: string;
  court_num: string;
  time: string;
  date: string;
};

function UnifiedreservationPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthData, setMonthData] = useState<MonthData>({});
  const [loading, setLoading] = useState(false);
  const [selectedReservations, setSelectedReservations] = useState<SelectedReservation[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [tennisAccount, setTennisAccount] = useState({
    nowon_id: '',
    nowon_pass: '',
    dobong_id: '',
    dobong_pass: ''
  });
  const [crawlProgress, setCrawlProgress] = useState({ current: 0, total: 0 });
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadUserInfo();
  }, []);

  // 페이지 로드 시 캐시 자동 로드
  useEffect(() => {
    
    const autoLoadCache = async () => {
      // 사용자 정보가 로드될 때까지 대기
      if (!tennisAccount.dobong_id || !tennisAccount.nowon_id) return;
      
      console.log('📦 페이지 로드 - 캐시 확인 중...');
      const cached = await getCachedMonthData(year, month);
      
      if (cached) {
        console.log('✅ 캐시에서 데이터 자동 로드');
        setMonthData(cached.data);
        setUsingCache(true);
        setLastUpdated(cached.updatedAt);
      } else {
        console.log('캐시 없음 - 수동 로드 필요');
      }
    };

    autoLoadCache();
  }, [year, month, tennisAccount.dobong_id, tennisAccount.nowon_id]);

  const loadUserInfo = async () => {
    try {
      const userName = localStorage.getItem('user_name');
      setCurrentUser(userName || "사용자");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: accountData } = await supabase
        .from('tennis_reservation_profile')
        .select('nowon_id, nowon_pass, dobong_id, dobong_pass')
        .eq('user_id', user.id)
        .single();

      if (accountData) {
        setTennisAccount({
          nowon_id: accountData.nowon_id || '',
          nowon_pass: accountData.nowon_pass || '',
          dobong_id: accountData.dobong_id || '',
          dobong_pass: accountData.dobong_pass || ''
        });
      }
    } catch (error) {
      console.error('사용자 정보 로드 오류:', error);
    }
  };

  // ========== Storage 캐시 조회 ==========
  const getCachedMonthData = async (year: number, month: number) => {
    const fileName = `${year}-${String(month + 1).padStart(2, '0')}-all.json`;
    
    try {
      const { data, error } = await supabase.storage
        .from('crawl-cache')
        .download(fileName);
      
      if (error) {
        console.log('캐시 파일 없음:', fileName);
        return null;
      }
      
      const text = await data.text();
      const cached = JSON.parse(text);
      
      console.log('✅ 캐시 사용:', fileName);
      return cached;
    } catch (error) {
      console.error('캐시 로드 오류:', error);
      return null;
    }
  };

  // ========== Storage에 월간 데이터 저장 ==========
  const saveMonthDataToStorage = async (
    year: number, 
    month: number, 
    monthData: MonthData
  ) => {
    const fileName = `${year}-${String(month + 1).padStart(2, '0')}-all.json`;
    
    const cacheData = {
      updatedAt: Date.now(),
      year,
      month: month + 1,
      data: monthData
    };
    
    try {
      const jsonData = JSON.stringify(cacheData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // 기존 파일 삭제
      await supabase.storage
        .from('crawl-cache')
        .remove([fileName]);
      
      // 새 파일 업로드
      const { error } = await supabase.storage
        .from('crawl-cache')
        .upload(fileName, blob, {
          contentType: 'application/json',
          upsert: true
        });
      
      if (error) {
        console.error('캐시 저장 오류:', error);
        return false;
      }
      
      console.log('✅ 캐시 저장 완료:', fileName);
      return true;
    } catch (error) {
      console.error('캐시 저장 오류:', error);
      return false;
    }
  };

  // UnifiedReservationPage.tsx - 최종 수정 버전
  // HTML 구조 분석 결과를 바탕으로 정확하게 파싱

    const crawlDobong = async (dateStr: string): Promise<Reservation[]> => {
  const PROXY_URL = 'http://kwtc.dothome.co.kr/proxy.php';
  
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
        result.error.includes('아이디') ||
        result.error.includes('비밀번호')
      )) {
        throw new Error(`도봉구 로그인 실패: ${result.error}`);
      }
      return [];
    }

    const playData = result.data.play_name;
    const reservations: Reservation[] = [];

    playData.forEach((court: any) => {
      if (court.play_name === '다락원축구장') return;

      const htmlx = court.htmlx || '';
      
      const blockRegex = /<div class='chk_d[^']*'>[\s\S]*?<\/div>/g;
      const blocks = [...htmlx.matchAll(blockRegex)];

      blocks.forEach((block) => {
        const blockHtml = block[0];
        
        const timeMatch = blockHtml.match(/(\d{2}):(\d{2})\s*~\s*(\d{2}):(\d{2})/);
        if (!timeMatch) return;
        
        const startTime = `${timeMatch[1]}:${timeMatch[2]}`;
        const endTime = `${timeMatch[3]}:${timeMatch[4]}`;
        
        const hasNochk = blockHtml.includes("class='chk_d nochk'");
        const hasCheckbox = blockHtml.includes("type='checkbox'");
        const hasHiddenDisabled = blockHtml.includes("type='hidden'") && 
                                  blockHtml.includes("disabled");
        
        let status: string;
        if (hasNochk || hasHiddenDisabled) {
          status = '예약불가';
        } else if (hasCheckbox) {
          status = '예약가능';
        } else {
          status = '예약불가';
        }

        reservations.push({
          court: '도봉',
          date: dateStr,
          court_num: court.play_name,
          start_time: startTime,
          end_time: endTime,
          status: status
        });
      });
    });

    const totalAvailable = reservations.filter(r => r.status === '예약가능').length;
    console.log(`✅ 도봉구 ${dateStr}: ${totalAvailable}개 예약 가능`);
    
    return reservations;
    
  } catch (error) {
    console.error('도봉구 크롤링 오류:', error);
    throw error;
  }
};

  // ========== 노원구 Edge Function 크롤링 ==========
  const crawlNowon = async (dates: string[]): Promise<{ [date: string]: Reservation[] }> => {
    if (!tennisAccount.nowon_id || !tennisAccount.nowon_pass) {
      console.log('노원구 계정 정보 없음');
      return {};
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('세션 없음');
        alert('로그인이 필요합니다.');
        return {};
      }

      console.log('노원구 크롤링 시작...', dates.length, '일');

      const response = await fetch(
        `https://aftlhyhiskoeyflfiljr.supabase.co/functions/v1/crawl-tennis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            nowon_id: tennisAccount.nowon_id,
            nowon_pass: tennisAccount.nowon_pass,
            dates: dates
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function 오류 응답:', errorText);
        throw new Error(`Edge Function 오류: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ 노원구 크롤링 완료: ${Object.keys(result.data).length}개 날짜`);
        return result.data;
      } else {
        console.error('❌ 노원구 크롤링 실패:', result.error);
        // 로그인 실패 체크
        if (result.error && (
          result.error.includes('로그인') || 
          result.error.includes('인증') ||
          result.error.includes('아이디') ||
          result.error.includes('비밀번호')
        )) {
          throw new Error(`노원구 로그인 실패: ${result.error}`);
        }
        return {};
      }
    } catch (error: any) {
      console.error('❌ 노원구 Edge Function 호출 오류:', error);
      throw error; // 에러를 상위로 전달
    }
  };

  // ========== 한 달 데이터 크롤링 (메인 함수) ==========
 
  const crawlMonthData = async (forceRefresh = false) => {
    if (!tennisAccount.dobong_id || !tennisAccount.dobong_pass) {
      alert('도봉구 테니스장 계정 정보를 먼저 등록해주세요.\n(프로필 페이지에서 등록 가능)');
      return;
    }

    if (!tennisAccount.nowon_id || !tennisAccount.nowon_pass) {
      alert('노원구 테니스장 계정 정보를 먼저 등록해주세요.\n(프로필 페이지에서 등록 가능)');
      return;
    }

    setLoading(true);
    setMonthData({});
    setCrawlProgress({ current: 0, total: 0 });

    // ===== 오늘 날짜 계산 (시간 제외) =====
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정
    
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // ===== 크롤링 시작일 계산 =====
    let startDay = 1;
    
    // 현재 선택한 월이 오늘이 속한 월이라면, 오늘 날짜부터 시작
    if (year === today.getFullYear() && month === today.getMonth()) {
      startDay = today.getDate();
      console.log(`📅 오늘(${startDay}일)부터 크롤링 시작`);
    }
    // 선택한 월이 과거라면 크롤링하지 않음
    else if (year < today.getFullYear() || 
            (year === today.getFullYear() && month < today.getMonth())) {
      alert('과거 날짜는 크롤링할 수 없습니다.');
      setLoading(false);
      return;
    }
    // 미래 월이라면 1일부터 크롤링
    else {
      console.log(`📅 ${year}년 ${month + 1}월 전체 크롤링 (미래 월)`);
    }

    const daysToFetch = totalDays - startDay + 1; // 실제 크롤링할 날짜 수

    try {
      // forceRefresh가 false면 캐시 확인
      if (!forceRefresh) {
        console.log('📦 캐시 확인 중...');
        const cached = await getCachedMonthData(year, month);
        
        if (cached) {
          console.log('✅ 캐시에서 데이터 로드');
          setMonthData(cached.data);
          setUsingCache(true);
          setLastUpdated(cached.updatedAt);
          setLoading(false);
          
          alert(`${year}년 ${month + 1}월 데이터 로드 완료! (캐시 사용)`);
          return;
        }
        
        console.log('캐시 없음, 크롤링 시작');
      } else {
        console.log('🔄 강제 새로고침 - 캐시 무시');
      }

      setCrawlProgress({ current: 0, total: daysToFetch });
      const newMonthData: MonthData = {};

      // === 1. 노원구 전체 크롤링 (불암산, 마들, 초안산) ===
      console.log(`📍 노원구 크롤링 시작 (${startDay}일부터 ${totalDays}일까지)...`);
      const nowonDates: string[] = [];
      
      for (let day = startDay; day <= totalDays; day++) {
        const currentDate = new Date(year, month, day);
        const formattedDate = [
          currentDate.getFullYear(),
          String(currentDate.getMonth() + 1).padStart(2, "0"),
          String(currentDate.getDate()).padStart(2, "0"),
        ].join("-");
        nowonDates.push(formattedDate);
      }

      const nowonByDate = await crawlNowon(nowonDates);
      console.log(`✅ 노원구 크롤링 완료: ${Object.keys(nowonByDate).length}개 날짜`);

      // === 2. 도봉구(다락원) 크롤링 (날짜별) ===
      console.log(`📍 도봉구(다락원) 크롤링 시작 (${startDay}일부터)...`);
      
      let processedDays = 0;
      
      for (let day = startDay; day <= totalDays; day++) {
        const currentDate = new Date(year, month, day);
        const formattedDate = [
          currentDate.getFullYear(),
          String(currentDate.getMonth() + 1).padStart(2, "0"),
          String(currentDate.getDate()).padStart(2, "0"),
        ].join("-");

        // 노원구 데이터 가져오기
        const dayReservations: Reservation[] = nowonByDate[formattedDate] || [];

        // 도봉구(다락원) 데이터 크롤링
        const dobongData = await crawlDobong(formattedDate);
        dayReservations.push(...dobongData);

        newMonthData[formattedDate] = dayReservations;

        // 진행상황 업데이트
        processedDays++;
        setCrawlProgress({ current: processedDays, total: daysToFetch });

        // API 부하 방지 딜레이
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.log('✅ 도봉구(다락원) 크롤링 완료');

      // === 3. Storage에 전체 데이터 저장 ===
      console.log('💾 Storage에 데이터 저장 중...');
      const saved = await saveMonthDataToStorage(year, month, newMonthData);
      
      if (saved) {
        console.log('✅ Storage 저장 완료');
        setUsingCache(false);
        setLastUpdated(Date.now());
      }

      setMonthData(newMonthData);
      setLoading(false);
      setCrawlProgress({ current: 0, total: 0 });

      alert(
        `${year}년 ${month + 1}월 데이터 크롤링 완료!\n` +
        `(${startDay}일 ~ ${totalDays}일, 총 ${daysToFetch}일)` +
        `${saved ? '\n(다음부터는 캐시 사용)' : ''}`
      );
    } catch (error: any) {
      setLoading(false);
      setCrawlProgress({ current: 0, total: 0 });
      
      // 로그인 오류 메시지 표시
      const errorMessage = error.message || '크롤링 중 오류가 발생했습니다.';
      alert(`❌ ${errorMessage}\n\n계정 정보를 확인해주세요.`);
      console.error('크롤링 오류:', error);
    }
  };

  // ========== 캘린더 날짜 클릭 ==========
  const handleDateClick = (date: number | null) => {
    if (!date) return;
    
    const selected = new Date(year, month, date);
    setSelectedDate(selected);
    setSelectedReservations([]);

    const formattedDate = [
      selected.getFullYear(),
      String(selected.getMonth() + 1).padStart(2, "0"),
      String(selected.getDate()).padStart(2, "0"),
    ].join("-");

    // 크롤링된 데이터가 없으면 알림
    if (!monthData[formattedDate]) {
      alert('해당 날짜의 데이터가 없습니다.\n"한 달 데이터 로드" 버튼을 눌러주세요.');
    }
  };

  // ========== 예약 선택/해제 ==========
  const handleReservationSelect = (
    court: string,
    court_num: string,
    time: string,
    isChecked: boolean
  ) => {
    const formattedDate = selectedDate
      ? [
          selectedDate.getFullYear(),
          String(selectedDate.getMonth() + 1).padStart(2, "0"),
          String(selectedDate.getDate()).padStart(2, "0"),
        ].join("-")
      : "";

    if (isChecked) {
      setSelectedReservations((prev) => [
        ...prev,
        { court, court_num, time, date: formattedDate },
      ]);
    } else {
      setSelectedReservations((prev) =>
        prev.filter(
          (item) =>
            !(
              item.court === court &&
              item.court_num === court_num &&
              item.time === time
            )
        )
      );
    }
  };

  // ========== 월 이동 ==========
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
    setSelectedDate(null);
    setSelectedReservations([]);
    setMonthData({});
    setLastUpdated(null);
    setUsingCache(false);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
    setSelectedDate(null);
    setSelectedReservations([]);
    setMonthData({});
    setLastUpdated(null);
    setUsingCache(false);
  };

  // ========== 코트 번호 표시 변환 ==========
  const getDisplayCourtNum = (court_num: string) => {
    // 노원구 코트 번호 변환
    const courtNumMap: { [key: string]: string } = {
      "21코트": "1코트",
      "22코트": "2코트",
      "23코트": "3코트",
      "24코트": "4코트",
      "11코트": "1코트",
      "12코트": "2코트",
      "13코트": "3코트",
      "14코트": "4코트",
      "15코트": "5코트",
      "16코트": "6코트",
      "17코트": "7코트",
      "18코트": "8코트",
      "19코트": "9코트",
    };
    return courtNumMap[court_num] || court_num;
  };

  // ========== 캘린더 렌더링 ==========
  const renderCalendar = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const dates = [];
    for (let i = 0; i < firstDay; i++) dates.push(null);
    for (let d = 1; d <= lastDate; d++) dates.push(d);

    return (
      <div className="calendar">
        <div className="calendar-header">
          <button className="nav-btn" onClick={goToPreviousMonth}>
            ‹
          </button>
          <h2>
            {year}년 {month + 1}월
          </h2>
          <button className="nav-btn" onClick={goToNextMonth}>
            ›
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>일</th>
              <th>월</th>
              <th>화</th>
              <th>수</th>
              <th>목</th>
              <th>금</th>
              <th>토</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(dates.length / 7) }).map(
              (_, weekIdx) => (
                <tr key={weekIdx}>
                  {dates.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, idx) => {
                    const isSelected =
                      selectedDate?.getDate() === date &&
                      selectedDate?.getMonth() === month &&
                      selectedDate?.getFullYear() === year;

                    const formattedDate = date
                      ? [
                          year,
                          String(month + 1).padStart(2, "0"),
                          String(date).padStart(2, "0"),
                        ].join("-")
                      : "";

                    const hasData = formattedDate && monthData[formattedDate];

                    return (
                      <td
                        key={idx}
                        style={{
                          background: isSelected
                            ? "#e0e7ff"
                            : hasData
                            ? "#f0f9ff"
                            : undefined,
                          cursor: date ? "pointer" : "default",
                          fontWeight: hasData ? "bold" : "normal",
                        }}
                        onClick={() => handleDateClick(date)}
                      >
                        {date || ""}
                      </td>
                    );
                  })}
                </tr>
              )
            )}
          </tbody>
        </table>
        {selectedDate && (
          <div style={{ marginTop: "10px", textAlign: "center" }}>
            선택한 날짜: {selectedDate.toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  // ========== 예약 테이블 렌더링 ==========
  const renderReservationTable = () => {
    if (!selectedDate) return null;

    const formattedDate = [
      selectedDate.getFullYear(),
      String(selectedDate.getMonth() + 1).padStart(2, "0"),
      String(selectedDate.getDate()).padStart(2, "0"),
    ].join("-");

    const reservations = monthData[formattedDate] || [];

    if (reservations.length === 0) {
      return (
        <div className="no-reservation-message">
          해당 날짜의 예약 정보가 없습니다.
        </div>
      );
    }

    // 코트별 그룹화
    const courtGroups: { [court: string]: string[] } = {};
    reservations.forEach((r) => {
      if (!courtGroups[r.court]) courtGroups[r.court] = [];
      if (!courtGroups[r.court].includes(r.court_num)) {
        courtGroups[r.court].push(r.court_num);
      }
    });

    // 각 그룹 정렬
    Object.keys(courtGroups).forEach((court) => {
      courtGroups[court].sort();
    });

    // 시간대 추출 및 정렬
    const times = Array.from(
      new Set(
        reservations.map((r) => `${r.start_time}~${r.end_time}`)
      )
    ).sort();

    // 22:00 이후 필터링
    const filteredTimes = times.filter((time) => {
      const endTime = time.split("~")[1];
      const endHour = parseInt(endTime.substring(0, 2));
      return endHour <= 22;
    });

    const getReservation = (time: string, court_num: string, court: string) =>
      reservations.find(
        (r) =>
          r.court === court &&
          r.court_num === court_num &&
          `${r.start_time}~${r.end_time}` === time
      );

    const isSelected = (court: string, court_num: string, time: string) =>
      selectedReservations.some(
        (item) =>
          item.court === court &&
          item.court_num === court_num &&
          item.time === time
      );

    const getStatusIcon = (
      status: string,
      court: string,
      court_num: string,
      time: string
    ) => {
      if (status === "예약불가") return "";
      if (status === "예약가능")
        return (
          <input
            type="checkbox"
            className="reservation-checkbox"
            checked={isSelected(court, court_num, time)}
            onChange={(e) => {
              handleReservationSelect(court, court_num, time, e.target.checked);
            }}
          />
        );
      return status;
    };

    const getCourtHeaderClass = (court: string) => {
      const classMap: { [key: string]: string } = {
        불암산: "court-header-bulam",
        초안산: "court-header-choan",
        마들: "court-header-madeul",
        도봉: "court-header-dobong",
      };
      return classMap[court] || "";
    };

    const getCellClass = (status: string | undefined, court: string) => {
      if (status === "예약불가") return "cell-unavailable";
      if (status === "예약가능") {
        const classMap: { [key: string]: string } = {
          불암산: "cell-available-bulam",
          초안산: "cell-available-choan",
          마들: "cell-available-madeul",
          도봉: "cell-available-dobong",
        };
        return classMap[court] || "cell-available-bulam";
      }
      const lightClassMap: { [key: string]: string } = {
        불암산: "cell-other-bulam",
        초안산: "cell-other-choan",
        마들: "cell-other-madeul",
        도봉: "cell-other-dobong",
      };
      return lightClassMap[court] || "cell-other-bulam";
    };

    return (
      <div className="reservation-list">
        <h3>📅 예약 정보</h3>
        <div className="reservation-table-wrapper">
          <table className="reservation-table">
            <thead>
              <tr>
                <th className="time-header">시간</th>
                {Object.entries(courtGroups).map(([court, nums]) =>
                  nums.map((court_num) => (
                    <th
                      key={`${court}-${court_num}`}
                      className={getCourtHeaderClass(court)}
                    >
                      {court}
                      <br />
                      {court === "도봉" ? court_num : getDisplayCourtNum(court_num)}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {filteredTimes.map((time) => (
                <tr key={time}>
                  <td className="time-cell">
                    {time}
                  </td>
                  {Object.entries(courtGroups).flatMap(([court, nums]) =>
                    nums.map((court_num) => {
                      const res = getReservation(time, court_num, court);
                      return (
                        <td
                          key={`${court}-${court_num}`}
                          className={getCellClass(res?.status, court)}
                        >
                          {res
                            ? getStatusIcon(
                                res.status,
                                court,
                                court_num,
                                time
                              )
                            : ""}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedReservations.length > 0 && (
          <div className="selected-reservations">
            <h4>
              ✅ 선택된 예약 ({selectedReservations.length})
            </h4>
            {selectedReservations.map((item, index) => (
              <div key={index} className="selected-reservation-item">
                {item.court} - {item.court === "도봉" ? item.court_num : getDisplayCourtNum(item.court_num)} -{" "}
                {item.time} ({item.date})
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ========== 1시간 경과 여부 체크 ==========
  const isDataStale = () => {
    if (!lastUpdated) return false;
    const oneHour = 60 * 60 * 1000;
    return Date.now() - lastUpdated > oneHour;
  };

  return (
    <div className="unified-reservation-container">
      <button className="home-btn" onClick={() => navigate("/participate")}>
        Back
      </button>
      
      {currentUser && (
        <div
          className="user-info"
          onClick={() => navigate("/reservation/profile")}
        >
          user: {currentUser}
        </div>
      )}

      <h1>통합 예약 페이지</h1>
      <p>노원구(불암산/마들/초안산)와 도봉구(다락원) 테니스장 예약 정보를 한 번에 확인하세요.</p>

      {renderCalendar()}

      {renderReservationTable()}

      {lastUpdated && (
        <div className={`cache-info ${isDataStale() ? 'cache-info-stale' : 'cache-info-fresh'}`}>
          📅 마지막 새로고침: {new Date(lastUpdated).toLocaleString('ko-KR')}
          {isDataStale() && (
            <div className="cache-info-warning">
              ⚠️ 마지막 새로고침이 1시간 이상 전입니다. 새로고침이 필요합니다.
            </div>
          )}
        </div>
      )}

      <div className="button-area">
        <div className="button-row">
          <button
            onClick={() => crawlMonthData(true)}
            className="refresh-btn"
            disabled={loading}
          >
            {loading ? (
              <>새로고침 중... ({crawlProgress.current}/{crawlProgress.total})</>
            ) : (
              <>
                <span>🔄</span>
                새로고침
              </>
            )}
          </button>

          <button
            className="refresh-btn"
            disabled={selectedReservations.length === 0}
            onClick={() => {
              if (selectedReservations.length === 0) {
                alert('예약할 코트를 선택해주세요.');
                return;
              }
              alert(`${selectedReservations.length}개의 예약을 진행합니다.`);
            }}
          >
            <span>📝</span>
            예약하기 ({selectedReservations.length})
          </button>
        </div>

        {loading && (
          <div className="progress-info">
            <div>✅ 노원구: 완료 (불암산, 마들, 초안산)</div>
            <div>🔄 도봉구(다락원): {crawlProgress.current}/{crawlProgress.total}</div>
          </div>
        )}

        {!loading && (
          <div className="tip-message">
            💡 Tip: 새로고침을 누르면 최신 예약 정보를 불러옵니다
          </div>
        )}
      </div>
    </div>
  );
}

export default UnifiedreservationPage;
