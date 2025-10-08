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

type SelectedReservation = {
  court: string;
  court_num: string;
  time: string;
  date: string;
};

type TennisAccountInfo = {
  nowon_id: string;
  nowon_pass: string;
  dobong_id: string;
  dobong_pass: string;
};

// 테니스장 계정 정보 입력 모달 컴포넌트
function TennisAccountModal({ 
  isOpen, 
  onClose, 
  missingFields,
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  missingFields: string[];
  onSave: (accountInfo: Partial<TennisAccountInfo>) => void;
}) {
  const [formData, setFormData] = useState<Partial<TennisAccountInfo>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof TennisAccountInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('계정 정보 저장 오류:', error);
      alert('계정 정보 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      nowon_id: '노원구 테니스장 ID',
      nowon_pass: '노원구 테니스장 비밀번호',
      dobong_id: '도봉구 테니스장 ID',
      dobong_pass: '도봉구 테니스장 비밀번호'
    };
    return labels[field] || field;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>테니스장 계정 정보 입력</h3>
        <p>원활한 예약 서비스 이용을 위해 테니스장 계정 정보를 입력해주세요.</p>
        
        <div className="form-fields">
          {missingFields.map(field => (
            <div key={field} className="form-field">
              <label>{getFieldLabel(field)}</label>
              <input
                type={field.includes('pass') ? 'password' : 'text'}
                value={formData[field as keyof TennisAccountInfo] || ''}
                onChange={(e) => handleInputChange(field as keyof TennisAccountInfo, e.target.value)}
                placeholder={getFieldLabel(field)}
              />
            </div>
          ))}
        </div>

        <div className="modal-buttons">
          <button 
            onClick={onClose}
            className="cancel-btn"
            disabled={loading}
          >
            나중에 입력
          </button>
          <button 
            onClick={handleSave}
            className="save-btn"
            disabled={loading}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReservations, setSelectedReservations] = useState<SelectedReservation[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const dates = [];
  for (let i = 0; i < firstDay; i++) dates.push(null);
  for (let d = 1; d <= lastDate; d++) dates.push(d);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
    setSelectedDate(null);
    setReservations([]);
    setSelectedReservations([]);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
    setSelectedDate(null);
    setReservations([]);
    setSelectedReservations([]);
  };

  const handleDateClick = async (date: number | null) => {
    if (!date) return;
    const selected = new Date(year, month, date);
    setSelectedDate(selected);
    setSelectedReservations([]); // 날짜 변경 시 선택 초기화
    setLoading(true);

    const formattedDate = [
      selected.getFullYear(),
      String(selected.getMonth() + 1).padStart(2, "0"),
      String(selected.getDate()).padStart(2, "0"),
    ].join("-");

    const tables = [
      { name: "tennis_reservation_bul", court: "불암산" },
      { name: "tennis_reservation_cho", court: "초안산" },
      { name: "tennis_reservation_ma", court: "마들" },
      { name: "tennis_reservation_da", court: "다락원" },
    ];

    let allReservations: Reservation[] = [];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table.name)
        .select("*")
        .eq("date", formattedDate);

      if (error) continue;
      if (data) {
        allReservations = allReservations.concat(
          data
            .filter((item: any) => item.court_num !== "다락원축구장")
            .map((item: any) => ({
              court: table.court,
              date: item.date,
              court_num: item.court_num,
              start_time: item.start_time,
              end_time: item.end_time,
              status: item.status,
            }))
        );
      }
    }

    setReservations(allReservations);
    setLoading(false);
  };

  // 선택된 예약 추가/제거
  const handleReservationSelect = (court: string, court_num: string, time: string, isChecked: boolean) => {
    const formattedDate = selectedDate ? [
      selectedDate.getFullYear(),
      String(selectedDate.getMonth() + 1).padStart(2, "0"),
      String(selectedDate.getDate()).padStart(2, "0"),
    ].join("-") : "";

    if (isChecked) {
      setSelectedReservations(prev => [...prev, { court, court_num, time, date: formattedDate }]);
    } else {
      setSelectedReservations(prev => 
        prev.filter(item => !(item.court === court && item.court_num === court_num && item.time === time))
      );
    }
  };

  // 코트 번호 변환 함수 (ReservationTable의 함수와 동일)
  const getDisplayCourtNum = (court_num: string) => {
    const courtNumMap: { [key: string]: string } = {
      "21코트": "1코트", "22코트": "2코트", "23코트": "3코트", "24코트": "4코트",
      "11코트": "1코트", "12코트": "2코트", "13코트": "3코트", "14코트": "4코트",   
      "15코트": "5코트", "16코트": "6코트", "17코트": "7코트", "18코트": "8코트", "19코트": "9코트"
    };
    return courtNumMap[court_num] || court_num;
  };

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
          {Array.from({ length: Math.ceil(dates.length / 7) }).map((_, weekIdx) => (
            <tr key={weekIdx}>
              {dates.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, idx) => (
                <td
                  key={idx}
                  style={{
                    background: selectedDate?.getDate() === date && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year ? "#e0e7ff" : undefined,
                    cursor: date ? "pointer" : "default",
                  }}
                  onClick={() => handleDateClick(date)}
                >
                  {date || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {selectedDate && (
        <div style={{ marginTop: "10px" }}>
          선택한 날짜: {selectedDate.toLocaleDateString()}
        </div>
      )}
      
      {loading && <div>예약 정보를 불러오는 중...</div>}
      {!loading && reservations.length > 0 && (
        <div className="reservation-list" style={{ marginTop: "16px" }}>
          <h3>예약 정보</h3>
          <ReservationTable 
            reservations={reservations} 
            onReservationSelect={handleReservationSelect}
            selectedReservations={selectedReservations}
          />
          
          {/* 선택된 예약 표시 - 시간표 밑으로 이동 */}
          {selectedReservations.length > 0 && (
            <div style={{ marginTop: "16px", padding: "12px", background: "#f0f9ff", borderRadius: "8px" }}>
              <h4 style={{ margin: "0 0 8px 0", color: "#2563eb" }}>선택된 예약:</h4>
              {selectedReservations.map((item, index) => (
                <div key={index} style={{ fontSize: "14px", color: "#374151", marginBottom: "4px" }}>
                  {item.court} - {getDisplayCourtNum(item.court_num)} - {item.time} ({item.date})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {!loading && selectedDate && reservations.length === 0 && (
        <div style={{ marginTop: "16px" }}>예약 정보가 없습니다.</div>
      )}
    </div>
  );
}

function getUniqueCourtNums(reservations: Reservation[]) {
  const nums = reservations.map(r => r.court_num);
  return Array.from(new Set(nums)).sort();
}

function getUniqueTimes(reservations: Reservation[]) {
  const times = reservations.map(r => `${r.start_time}~${r.end_time}`);
  const uniqueTimes = Array.from(new Set(times));
  
  // 22:00까지만 필터링
  const filteredTimes = uniqueTimes.filter(time => {
    const endTime = time.split('~')[1];
    const endHour = parseInt(endTime.split(':')[0]);
    return endHour <= 22;
  });
  
  return filteredTimes.sort();
}

function getCourtNameByNum(reservations: Reservation[], court_num: string) {
  const found = reservations.find(r => r.court_num === court_num);
  return found ? found.court : "";
}

function getCourtGroups(reservations: Reservation[]) {
  // court별로 court_num을 그룹화 (원본 번호 그대로 저장)
  const groups: { [court: string]: string[] } = {};
  reservations.forEach(r => {
    if (!groups[r.court]) groups[r.court] = [];
    if (!groups[r.court].includes(r.court_num)) groups[r.court].push(r.court_num);
  });
  
  // 각 그룹 내에서 정렬
  Object.keys(groups).forEach(court => {
    groups[court].sort((a, b) => parseInt(a) - parseInt(b));
  });
  
  return groups;
}

function ReservationTable({ 
  reservations, 
  onReservationSelect,
  selectedReservations
}: { 
  reservations: Reservation[];
  onReservationSelect: (court: string, court_num: string, time: string, isChecked: boolean) => void;
  selectedReservations: SelectedReservation[];
}) {
  if (reservations.length === 0) return null;

  const courtGroups = getCourtGroups(reservations);
  const times = getUniqueTimes(reservations);

  const getReservation = (time: string, court_num: string) =>
    reservations.find(r => r.court_num === court_num && `${r.start_time}~${r.end_time}` === time);

  const getCourtByNum = (court_num: string) => {
    const res = reservations.find(r => r.court_num === court_num);
    return res ? res.court : "";
  };

  const getDisplayCourtNum = (court_num: string) => {
    const courtNumMap: { [key: string]: string } = {
      "21코트": "1코트", "22코트": "2코트", "23코트": "3코트", "24코트": "4코트",
      "11코트": "1코트", "12코트": "2코트", "13코트": "3코트", "14코트": "4코트",   
      "15코트": "5코트", "16코트": "6코트", "17코트": "7코트", "18코트": "8코트", "19코트": "9코트"
    };
    return courtNumMap[court_num] || court_num;
  };

  // 체크박스가 선택되었는지 확인
  const isSelected = (court: string, court_num: string, time: string) => {
    return selectedReservations.some(item => 
      item.court === court && item.court_num === court_num && item.time === time
    );
  };

  const getStatusIcon = (status: string, court: string, court_num: string, time: string) => {
    if (status === "예약불가") return "";
    if (status === "예약가능")
      return (
        <input
          type="checkbox"
          checked={isSelected(court, court_num, time)}
          style={{ 
            width: 12, 
            height: 12, 
            cursor: 'pointer',
            accentColor: '#2563eb'
          }}
          onChange={(e) => {
            onReservationSelect(court, court_num, time, e.target.checked);
          }}
        />
      );
    return status;
  };

  const getCourtHeaderBg = (court: string) => {
    const colorMap: { [key: string]: string } = {
      "불암산": "#dbeafe", "초안산": "#dcfce7", "마들": "#fef3c7", "다락원": "#fce7f3"
    };
    return colorMap[court] || "#f1f5f9";
  };

  const getCellBg = (status: string | undefined, court: string) => {
    if (status === "예약불가") return "#bdc0c4ff";
    if (status === "예약가능") {
      const colorMap: { [key: string]: string } = {
        "불암산": "#bfdbfe", "초안산": "#bbf7d0", "마들": "#fef08a", "다락원": "#f9a8d4"
      };
      return colorMap[court] || "#bbf7d0";
    }
    const lightColorMap: { [key: string]: string } = {
      "불암산": "#f0f9ff", "초안산": "#f0fdf4", "마들": "#fffbeb", "다락원": "#fdf2f8"
    };
    return lightColorMap[court] || "#f1f5f9";
  };

  return (
    <div className="reservation-table-wrapper" style={{ overflowX: "auto" }}>
      <table className="reservation-table">
        <thead>
          <tr>
            <th style={{ position: "sticky", left: 0, background: "#fff", zIndex: 2 }}></th>
            {Object.entries(courtGroups).map(([court, nums]) => (
              <th 
                key={court} 
                colSpan={nums.length} 
                style={{ background: getCourtHeaderBg(court), color: "#334155" }}
              >
                {court}
              </th>
            ))}
          </tr>
          <tr>
            <th style={{ position: "sticky", left: 0, background: "#fff", zIndex: 2 }}>시간</th>
            {Object.entries(courtGroups).flatMap(([court, nums]) =>
              nums.map(court_num => (
                <th 
                  key={`${court}-${court_num}`} 
                  style={{ 
                    background: getCourtHeaderBg(court),
                    minWidth: court === "다락원" ? "70px" : "50px",
                    width: court === "다락원" ? "70px" : "auto"
                  }}
                >
                  {getDisplayCourtNum(court_num)}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {times.map(time => (
            <tr key={time}>
              <td style={{ position: "sticky", left: 0, background: "#fff", zIndex: 1 }}>{time}</td>
              {Object.entries(courtGroups).flatMap(([court, nums]) =>
                nums.map(court_num => {
                  const res = getReservation(time, court_num);
                  const courtName = getCourtByNum(court_num);
                  return (
                    <td
                      key={`${court}-${court_num}`}
                      style={{
                        background: getCellBg(res?.status, courtName),
                        color: res && (res.status === "예약불가" || res.status === "예약가능") ? "#fff" : undefined,
                        fontWeight: res && (res.status === "예약불가" || res.status === "예약가능") ? "bold" : undefined,
                        minWidth: court === "다락원" ? "70px" : "50px",
                        width: court === "다락원" ? "70px" : "auto"
                      }}
                    >
                      {res ? getStatusIcon(res.status, courtName, court_num, time) : ""}
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UnifiedreservationPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<string>("");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 이름 가져오기
    const userName = localStorage.getItem('user_name');
    setCurrentUser(userName || "사용자");
    
    // 테니스장 계정 정보 확인
    checkTennisAccountInfo();
  }, []);

  const checkTennisAccountInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: accountData, error } = await supabase
        .from('tennis_reservation_profile')
        .select('nowon_id, nowon_pass, dobong_id, dobong_pass')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('계정 정보 확인 오류:', error);
        return;
      }

      // 누락된 필드 확인
      const missing: string[] = [];
      const fields = ['nowon_id', 'nowon_pass', 'dobong_id', 'dobong_pass'];
      
      if (!accountData) {
        // 레코드가 없으면 모든 필드가 누락
        missing.push(...fields);
      } else {
        // 각 필드가 null이거나 빈 문자열인지 확인
        fields.forEach(field => {
          if (!accountData[field]) {
            missing.push(field);
          }
        });
      }

      if (missing.length > 0) {
        setMissingFields(missing);
        setShowAccountModal(true);
      }
    } catch (error) {
      console.error('테니스장 계정 정보 확인 중 오류:', error);
    }
  };

  const saveTennisAccountInfo = async (accountInfo: Partial<TennisAccountInfo>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다.');

      // 기존 레코드가 있는지 확인
      const { data: existingData } = await supabase
        .from('tennis_reservation_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingData) {
        // 기존 레코드 업데이트
        const { error } = await supabase
          .from('tennis_reservation_profile')
          .update(accountInfo)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // 새 레코드 생성
        const { error } = await supabase
          .from('tennis_reservation_profile')
          .insert({
            user_id: user.id,
            ...accountInfo
          });

        if (error) throw error;
      }

      alert('테니스장 계정 정보가 저장되었습니다.');
    } catch (error) {
      console.error('계정 정보 저장 오류:', error);
      throw error;
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="unified-reservation-container">
      <button
        className="home-btn"
        onClick={() => navigate("/participate")}
      >
        Back
      </button>
      {currentUser && (
        <div 
          className="user-info"
          onClick={() => navigate('/reservation/profile')}
          style={{ cursor: 'pointer' }}
        >
         user: {currentUser}
        </div>
      )}
      <h1>통합 예약 페이지</h1>
      <p>노원구와 도봉구의 테니스장을 예약 할 수 있습니다.</p>
      <Calendar />
      <div style={{ textAlign: "center", marginTop: "32px", display: "flex", justifyContent: "center", gap: "12px" }}>
        <button
          onClick={handleRefresh}
          className="refresh-btn"
        >
          새로고침
        </button>
        <a
          className="reservation-link-btn"
        >
          예약하기
        </a>
      </div>

      {/* 테니스장 계정 정보 입력 모달 */}
      <TennisAccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        missingFields={missingFields}
        onSave={saveTennisAccountInfo}
      />
    </div>
  );
}

export default UnifiedreservationPage;