import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ReservationSuccessPage.css';

type SuccessReservation = {
  court: string;
  courtNum: string;
  date: string;
  time: string;
  success: boolean;
  message?: string;
};

function ReservationSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const reservations = (location.state?.reservations || []) as SuccessReservation[];

  const successList = reservations.filter(r => r.success);
  const failedList = reservations.filter(r => !r.success);

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
                  {res.message && (
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
          <button
            className="btn-primary"
            onClick={() => {
              window.open('https://reservation.nowonsc.kr/', '_blank');
            }}
          >
            결제하기
          </button>
        </div>

        <div className="payment-notice">
          <p>💳 결제는 직접 노원구 시설관리 공단페이지에서 해야합니다.</p>
        </div>
      </div>
    </div>
  );
}

export default ReservationSuccessPage;