import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ReservationSuccessPage.css';

// 🆕 타입 수정: price, pprice, eprice, region 추가
type SuccessReservation = {
  court: string;
  courtNum: string;
  date: string;
  time: string;
  success: boolean;
  message?: string;
  rent_no?: string;  // 예약번호
  price?: string;    // 총 가격
  pprice?: string;   // 시설 가격
  eprice?: string;   // 장비 가격
  region?: 'nowon' | 'dobong';  // 🆕 지역 구분
};

function ReservationSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const reservations = (location.state?.reservations || []) as SuccessReservation[];

  const successList = reservations.filter(r => r.success);
  const failedList = reservations.filter(r => !r.success);

  // 🆕 성공한 예약 중 어느 지역인지 확인
  const hasNowonReservation = successList.some(r => r.region === 'nowon');
  const hasDobongReservation = successList.some(r => r.region === 'dobong');

  // 🆕 결제 링크 결정 (두 지역 모두 있으면 노원 우선)
  const getPaymentUrl = () => {
    if (hasNowonReservation) {
      return 'https://reservation.nowonsc.kr/';
    }
    if (hasDobongReservation) {
      return 'https://yeyak.dobongsiseol.or.kr/rent/index.php?c_id=05&page_info=index&n_type=rent&c_ox=0';
    }
    return 'https://reservation.nowonsc.kr/'; // 기본값
  };

  // 🆕 결제 버튼 텍스트 결정
  const getPaymentButtonText = () => {
    if (hasNowonReservation && hasDobongReservation) {
      return '결제하기 (노원구/도봉구)';
    }
    if (hasNowonReservation) {
      return '결제하기 (노원구)';
    }
    if (hasDobongReservation) {
      return '결제하기 (도봉구)';
    }
    return '결제하기';
  };

  // 🆕 안내 문구 결정
  const getPaymentNotice = () => {
    if (hasNowonReservation && hasDobongReservation) {
      return '💳 결제는 노원구/도봉구 시설관리공단 페이지에서 각각 직접 해야합니다.';
    }
    if (hasNowonReservation) {
      return '💳 결제는 노원구 시설관리공단 페이지에서 직접 해야합니다.';
    }
    if (hasDobongReservation) {
      return '💳 결제는 도봉구 시설관리공단 페이지에서 직접 해야합니다.';
    }
    return '💳 결제는 각 시설관리공단 페이지에서 직접 해야합니다.';
  };

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-header">
          <div className="success-icon">✅</div>
          <h1>예약 완료</h1>
          <p className="success-subtitle">
            {successList.length}개의 예약이 성공적으로 완료되었습니다
          </p>
        </div>

        <div className="reservation-results">
          {successList.length > 0 && (
            <div className="result-section success-section">
              <h2>✅ 예약 성공 ({successList.length})</h2>
              {successList.map((res, index) => (
                <div key={index} className="reservation-item success-item">
                  <div className="reservation-info">
                    <span className="court-badge">{res.court}</span>
                    <span className="court-num">{res.courtNum}</span>
                  </div>
                  <div className="reservation-detail">
                    <span className="date">📅 {res.date}</span>
                    <span className="time">🕐 {res.time}</span>
                  </div>
                  {/* 예약번호 표시 */}
                  {res.rent_no && (
                    <div className="reservation-message success-message">
                      📋 예약번호: {res.rent_no}
                    </div>
                  )}
                  {/* 가격 표시 */}
                  {res.price && (
                    <div className="reservation-message success-message">
                      💰 총 금액: {res.price}
                      {res.pprice && res.eprice && (
                        <span style={{ fontSize: '0.9em', color: '#666', marginLeft: '8px' }}>
                          (시설: {res.pprice}{res.eprice !== '0원' && `, 장비: ${res.eprice}`})
                        </span>
                      )}
                    </div>
                  )}
                  {res.message && !res.rent_no && (
                    <div className="reservation-message success-message">
                      {res.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {failedList.length > 0 && (
            <div className="result-section failed-section">
              <h2>❌ 예약 실패 ({failedList.length})</h2>
              {failedList.map((res, index) => (
                <div key={index} className="reservation-item failed-item">
                  <div className="reservation-info">
                    <span className="court-badge">{res.court}</span>
                    <span className="court-num">{res.courtNum}</span>
                  </div>
                  <div className="reservation-detail">
                    <span className="date">📅 {res.date}</span>
                    <span className="time">🕐 {res.time}</span>
                  </div>
                  {res.message && (
                    <div className="reservation-message failed-message">
                      ⚠️ {res.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button
            className="btn-secondary"
            onClick={() => navigate('/reservation')}
          >
            예약 페이지로 돌아가기
          </button>
          {successList.length > 0 && (
            <button
              className="btn-primary"
              onClick={() => {
                window.open(getPaymentUrl(), '_blank');
              }}
            >
              {getPaymentButtonText()}
            </button>
          )}
        </div>

        {successList.length > 0 && (
          <div className="payment-notice">
            <p>{getPaymentNotice()}</p>
            {/* 🆕 두 지역 모두 예약한 경우 추가 링크 제공 */}
            {hasNowonReservation && hasDobongReservation && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <a
                  href="https://reservation.nowonsc.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    background: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  노원구 결제 →
                </a>
                <a
                  href="https://yeyak.dobongsiseol.or.kr/rent/index.php?c_id=05&page_info=index&n_type=rent&c_ox=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    background: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  도봉구 결제 →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReservationSuccessPage;