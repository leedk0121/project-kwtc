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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadUserInfo();
  }, []);

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

  // 도봉구 크롤링 함수
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
          dateStr: dateStr.replace(/-/g, '') // 2025-10-15 → 20251015
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        console.error('도봉구 크롤링 실패:', result.error);
        return [];
      }

      // play_name 파싱
      const playData = result.data.play_name;
      const reservations: Reservation[] = [];

      playData.forEach((court: any) => {
        if (court.play_name === '다락원축구장') return; // 축구장 제외

        const htmlx = court.htmlx || '';
        
        // 시간대별 예약 상태 파싱
        const timeRegex = /(\d{2}):(\d{2})\s*~\s*(\d{2}):(\d{2})/g;
        const matches = [...htmlx.matchAll(timeRegex)];

        matches.forEach((match, index) => {
          const startTime = `${match[1]}:${match[2]}`;
          const endTime = `${match[3]}:${match[4]}`;
          
          // 해당 시간대 섹션 추출
          const sectionStart = match.index! - 300;
          const sectionEnd = match.index! + 300;
          const section = htmlx.substring(Math.max(0, sectionStart), sectionEnd);
          
          // 예약 가능 여부 판단
          const hasCheckbox = section.includes('type="checkbox"') || section.includes("type='checkbox'");
          const isDisabled = section.includes('disabled');
          const isNochk = section.includes('nochk');
          
          const status = (hasCheckbox && !isDisabled) ? '예약가능' : '예약불가';

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

      return reservations;
    } catch (error) {
      console.error('도봉구 크롤링 오류:', error);
      return [];
    }
  };

  // 노원구 Edge Function 크롤링
  const crawlNowon = async (dates: string[]): Promise<Reservation[]> => {
    if (!tennisAccount.nowon_id || !tennisAccount.nowon_pass) {
      console.log('노원구 계정 정보 없음');
      return [];
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('세션 없음');
        alert('로그인이 필요합니다.');
        return [];
      }

      console.log('Edge Function URL:', `https://aftlhyhiskoeyflfiljr.supabase.co/functions/v1/crawl-tennis`);
      console.log('요청 데이터:', { dates: dates.length });

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

      console.log('응답 상태:', response.status, response.statusText);

      // 응답 상태 확인
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function 오류 응답:', errorText);
        alert(`노원구 크롤링 실패: ${response.status} ${response.statusText}`);
        return [];
      }

      // 응답 본문 확인
      const responseText = await response.text();
      console.log('응답 본문 길이:', responseText.length);
      console.log('응답 본문 미리보기:', responseText.substring(0, 200));

      if (!responseText || responseText.trim() === '') {
        console.error('빈 응답 받음');
        alert('노원구 서버에서 빈 응답을 받았습니다.');
        return [];
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.error('파싱 시도한 텍스트:', responseText);
        alert('노원구 서버 응답 형식이 올바르지 않습니다.');
        return [];
      }
      
      if (result.success) {
        console.log(`✅ 노원구 크롤링 성공: ${result.data.length}개 항목`);
        return result.data;
      } else {
        console.error('❌ 노원구 크롤링 실패:', result.error);
        alert(`노원구 크롤링 실패: ${result.error}`);
        return [];
      }
    } catch (error: any) {
      console.error('❌ 노원구 Edge Function 호출 오류:', error);
      console.error('Error stack:', error.stack);
      alert(`노원구 크롤링 중 오류 발생: ${error.message}`);
      return [];
    }
  };

  // 노원구 + 도봉구 한 달 크롤링
  const crawlMonthData = async () => {
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

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    setCrawlProgress({ current: 0, total: totalDays });

    const newMonthData: MonthData = {};

    // 1. 먼저 노원구 전체 크롤링 (Edge Function - 한 번에 처리)
    console.log('노원구 크롤링 시작...');
    const nowonDates: string[] = [];
    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(year, month, day);
      const formattedDate = [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, "0"),
        String(currentDate.getDate()).padStart(2, "0"),
      ].join("-");
      nowonDates.push(formattedDate);
    }

    const nowonResults = await crawlNowon(nowonDates);
    console.log(`노원구 크롤링 완료: ${nowonResults.length}개 항목`);

    // 노원 데이터를 날짜별로 그룹화
    const nowonByDate: { [date: string]: Reservation[] } = {};
    nowonResults.forEach(item => {
      if (!nowonByDate[item.date]) {
        nowonByDate[item.date] = [];
      }
      nowonByDate[item.date].push(item);
    });

    // 2. 다락원 데이터 가져오기 (Supabase)
    console.log('다락원 데이터 로드 중...');
    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(year, month, day);
      const formattedDate = [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, "0"),
        String(currentDate.getDate()).padStart(2, "0"),
      ].join("-");

      try {
        const { data, error } = await supabase
          .from("tennis_reservation_da")
          .select("*")
          .eq("date", formattedDate);

        if (!error && data) {
          const darakData = data
            .filter((item: any) => item.court_num !== "다락원축구장")
            .map((item: any) => ({
              court: "다락원",
              date: item.date,
              court_num: item.court_num,
              start_time: item.start_time,
              end_time: item.end_time,
              status: item.status,
            }));

          if (!nowonByDate[formattedDate]) {
            nowonByDate[formattedDate] = [];
          }
          nowonByDate[formattedDate].push(...darakData);
        }
      } catch (error) {
        console.error(`다락원 데이터 로드 오류 (${formattedDate}):`, error);
      }
    }

    // 3. 도봉구 날짜별 크롤링
    console.log('도봉구 크롤링 시작...');
    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(year, month, day);
      const formattedDate = [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, "0"),
        String(currentDate.getDate()).padStart(2, "0"),
      ].join("-");

      const dayReservations: Reservation[] = nowonByDate[formattedDate] || [];

      // 도봉구 데이터 (PHP 프록시 크롤링)
      const dobongData = await crawlDobong(formattedDate);
      dayReservations.push(...dobongData);

      newMonthData[formattedDate] = dayReservations;

      // 진행상황 업데이트
      setCrawlProgress({ current: day, total: totalDays });

      // API 부하 방지를 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setMonthData(newMonthData);
    setLoading(false);
    setCrawlProgress({ current: 0, total: 0 });

    alert(`${year}년 ${month + 1}월 데이터 크롤링 완료!`);
  };

  // 캘린더 날짜 클릭
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
      alert('해당 날짜의 데이터가 없습니다.\n"새로고침" 버튼을 눌러 한 달 데이터를 크롤링하세요.');
    }
  };

  // 예약 선택/해제
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

  // 월 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
    setSelectedDate(null);
    setSelectedReservations([]);
    setMonthData({});
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
    setSelectedDate(null);
    setSelectedReservations([]);
    setMonthData({});
  };

  // 코트 번호 표시 변환
  const getDisplayCourtNum = (court_num: string) => {
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

  // 캘린더 렌더링
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

  // 예약 테이블 렌더링
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
        <div style={{ marginTop: "16px", textAlign: "center", color: "#64748b" }}>
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
            checked={isSelected(court, court_num, time)}
            style={{
              width: 12,
              height: 12,
              cursor: "pointer",
              accentColor: "#2563eb",
            }}
            onChange={(e) => {
              handleReservationSelect(court, court_num, time, e.target.checked);
            }}
          />
        );
      return status;
    };

    const getCourtHeaderBg = (court: string) => {
      const colorMap: { [key: string]: string } = {
        불암산: "#dbeafe",
        초안산: "#dcfce7",
        마들: "#fef3c7",
        다락원: "#fce7f3",
        도봉: "#fce4ec",
      };
      return colorMap[court] || "#f1f5f9";
    };

    const getCellBg = (status: string | undefined, court: string) => {
      if (status === "예약불가") return "#bdc0c4ff";
      if (status === "예약가능") {
        const colorMap: { [key: string]: string } = {
          불암산: "#bfdbfe",
          초안산: "#bbf7d0",
          마들: "#fef08a",
          다락원: "#f9a8d4",
          도봉: "#f8bbd0",
        };
        return colorMap[court] || "#bbf7d0";
      }
      const lightColorMap: { [key: string]: string } = {
        불암산: "#f0f9ff",
        초안산: "#f0fdf4",
        마들: "#fffbeb",
        다락원: "#fdf2f8",
        도봉: "#fce4ec",
      };
      return lightColorMap[court] || "#f1f5f9";
    };

    return (
      <div className="reservation-list" style={{ marginTop: "16px" }}>
        <h3>예약 정보</h3>
        <div
          className="reservation-table-wrapper"
          style={{ overflowX: "auto" }}
        >
          <table className="reservation-table">
            <thead>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    background: "#fff",
                    zIndex: 2,
                  }}
                ></th>
                {Object.entries(courtGroups).map(([court, nums]) => (
                  <th
                    key={court}
                    colSpan={nums.length}
                    style={{
                      background: getCourtHeaderBg(court),
                      color: "#334155",
                    }}
                  >
                    {court}
                  </th>
                ))}
              </tr>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    background: "#fff",
                    zIndex: 2,
                  }}
                >
                  시간
                </th>
                {Object.entries(courtGroups).flatMap(([court, nums]) =>
                  nums.map((court_num) => (
                    <th
                      key={`${court}-${court_num}`}
                      style={{
                        background: getCourtHeaderBg(court),
                        minWidth: court === "다락원" ? "70px" : "50px",
                        width: court === "다락원" ? "70px" : "auto",
                      }}
                    >
                      {getDisplayCourtNum(court_num)}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {filteredTimes.map((time) => (
                <tr key={time}>
                  <td
                    style={{
                      position: "sticky",
                      left: 0,
                      background: "#fff",
                      zIndex: 1,
                    }}
                  >
                    {time}
                  </td>
                  {Object.entries(courtGroups).flatMap(([court, nums]) =>
                    nums.map((court_num) => {
                      const res = getReservation(time, court_num, court);
                      return (
                        <td
                          key={`${court}-${court_num}`}
                          style={{
                            background: getCellBg(res?.status, court),
                            color:
                              res &&
                              (res.status === "예약불가" ||
                                res.status === "예약가능")
                                ? "#fff"
                                : undefined,
                            fontWeight:
                              res &&
                              (res.status === "예약불가" ||
                                res.status === "예약가능")
                                ? "bold"
                                : undefined,
                            minWidth: court === "다락원" ? "70px" : "50px",
                            width: court === "다락원" ? "70px" : "auto",
                          }}
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

        {/* 선택된 예약 표시 */}
        {selectedReservations.length > 0 && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "#f0f9ff",
              borderRadius: "8px",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", color: "#2563eb" }}>
              선택된 예약:
            </h4>
            {selectedReservations.map((item, index) => (
              <div
                key={index}
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  marginBottom: "4px",
                }}
              >
                {item.court} - {getDisplayCourtNum(item.court_num)} -{" "}
                {item.time} ({item.date})
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
          style={{ cursor: "pointer" }}
        >
          user: {currentUser}
        </div>
      )}

      <h1>통합 예약 페이지</h1>
      <p>노원구와 도봉구의 테니스장 예약 정보를 한 번에 확인하세요.</p>

      {renderCalendar()}

      {renderReservationTable()}

      <div
        style={{
          textAlign: "center",
          marginTop: "32px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <button
          onClick={crawlMonthData}
          className="refresh-btn"
          disabled={loading}
          style={{
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
          }}
        >
          {loading
            ? `로딩 중... (${crawlProgress.current}/${crawlProgress.total})`
            : "새로고침"}
        </button>

        <a
          className="reservation-link-btn"
          style={{
            pointerEvents: selectedReservations.length > 0 ? "auto" : "none",
            opacity: selectedReservations.length > 0 ? 1 : 0.5,
            fontSize: "14px",
          }}
        >
          예약하기 ({selectedReservations.length}개 선택)
        </a>
      </div>

      {loading && (
        <div style={{ color: "#2563eb", fontSize: "14px", textAlign: "center", marginTop: "12px" }}>
          {crawlProgress.total > 0 &&
            `진행률: ${Math.round(
              (crawlProgress.current / crawlProgress.total) * 100
            )}%`}
        </div>
      )}
    </div>
  );
}

export default UnifiedreservationPage;