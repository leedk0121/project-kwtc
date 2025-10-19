import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../auth/supabaseClient";
import './ReservationProfile.css';

interface UserProfile {
  name: string;
  major: string;
  stnum: string;
  email: string;
  image_url: string;
  nowon_id?: string;
  nowon_pass?: string;
  dobong_id?: string;
  dobong_pass?: string;
  reservation_alert?: boolean;
}

interface ReservationDetail {
  orderNumber: string;
  useDayBegin: string;
  useDayEnd: string;
  useDayBeginDay: number;
  useDayEndDay: number;
  useTimeBegin: string;
  useTimeEnd: string;
  cName: string;
  codeName: string;
  productName: string;
  price: number;
  pricePay: number;
  stat: string;
  p_stat: string;
  seq: number;
  insertDate: string;
  insertTime: string;
}

interface NowonReservation {
  no: number;
  apply_date: string;
  reservation_date: string;
  reservation_time: string;
  facility: string;
  location: string;
  payment_amount: string;
  payment_status: string;
  payment_method: string;
  cancel_status: string;
  raw: {
    totalPriceSale: number;
    method: string;
    pstat: string;
    insertDate: string;
    priceRefundTotalPricePay: number;
    p: string;
    okayYn: string;
    totalcnt: number;
    cName: string;
    payMethod: string;
    detailList: ReservationDetail[];
    rstat: string;
    seq: number;
  };
}

// 테니스장 계정 수정 모달 컴포넌트
function TennisAccountEditModal({ 
  isOpen, 
  onClose, 
  currentData,
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  currentData: TennisAccountEditData;
  onSave: (accountInfo: TennisAccountEditData) => void;
}) {
  const [formData, setFormData] = useState<TennisAccountEditData>(currentData);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    nowon_pass: false,
    dobong_pass: false
  });

  useEffect(() => {
    setFormData(currentData);
  }, [currentData]);

  const handleInputChange = (field: keyof TennisAccountEditData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: 'nowon_pass' | 'dobong_pass') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>테니스장 계정 정보 수정</h3>
        <p>테니스장 예약에 사용될 계정 정보를 수정할 수 있습니다.</p>
        
        <div className="form-fields">
          <div className="form-field">
            <label>노원구 테니스장 ID</label>
            <input
              type="text"
              value={formData.nowon_id}
              onChange={(e) => handleInputChange('nowon_id', e.target.value)}
              placeholder="노원구 테니스장 ID"
            />
          </div>
          
          <div className="form-field">
            <label>노원구 테니스장 비밀번호</label>
            <div className="password-input-container">
              <input
                type={showPasswords.nowon_pass ? 'text' : 'password'}
                value={formData.nowon_pass}
                onChange={(e) => handleInputChange('nowon_pass', e.target.value)}
                placeholder="노원구 테니스장 비밀번호"
              />
              <button
                type="button"
                className="password-toggle-btn-modal"
                onClick={() => togglePasswordVisibility('nowon_pass')}
              >
                {showPasswords.nowon_pass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          <div className="form-field">
            <label>도봉구 테니스장 ID</label>
            <input
              type="text"
              value={formData.dobong_id}
              onChange={(e) => handleInputChange('dobong_id', e.target.value)}
              placeholder="도봉구 테니스장 ID"
            />
          </div>
          
          <div className="form-field">
            <label>도봉구 테니스장 비밀번호</label>
            <div className="password-input-container">
              <input
                type={showPasswords.dobong_pass ? 'text' : 'password'}
                value={formData.dobong_pass}
                onChange={(e) => handleInputChange('dobong_pass', e.target.value)}
                placeholder="도봉구 테니스장 비밀번호"
              />
              <button
                type="button"
                className="password-toggle-btn-modal"
                onClick={() => togglePasswordVisibility('dobong_pass')}
              >
                {showPasswords.dobong_pass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-buttons">
          <button 
            onClick={onClose}
            className="cancel-btn"
            disabled={loading}
          >
            취소
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

export default function ReservationProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reservationHistory, setReservationHistory] = useState<NowonReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'nowon-history' | 'darakwon-history'>('profile');
  const [showNowonPass, setShowNowonPass] = useState(false);
  const [showDobongPass, setShowDobongPass] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'payment-waiting' | 'payment-completed'>('all');

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'nowon-history') {
      loadReservationHistory();
    }
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      // 로컬 스토리지에서 기본 정보 가져오기
      const userName = localStorage.getItem('user_name') || '';
      const userMajor = localStorage.getItem('user_major') || '';
      const userStnum = localStorage.getItem('user_stnum') || '';
      const userImageUrl = localStorage.getItem('user_image_url') || '';
      
      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // tennis_reservation_profile에서 테니스장 계정 정보 가져오기
        const { data: reservationData, error } = await supabase
          .from('tennis_reservation_profile')
          .select('nowon_id, nowon_pass, dobong_id, dobong_pass, reservation_alert')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('테니스장 계정 정보 로드 오류:', error);
        }

        setProfile({
          name: userName,
          major: userMajor,
          stnum: userStnum,
          email: user.email || '',
          image_url: userImageUrl,
          nowon_id: reservationData?.nowon_id || '',
          nowon_pass: reservationData?.nowon_pass || '',
          dobong_id: reservationData?.dobong_id || '',
          dobong_pass: reservationData?.dobong_pass || '',
          reservation_alert: reservationData?.reservation_alert ?? true
        });
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReservationHistory = async () => {
    try {
      setLoadingHistory(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('로그인이 필요합니다');
      }

      console.log('📡 노원구 예약 내역 크롤링 시작...');

      // supabase 클라이언트에서 URL 추출
      const functionUrl = `${supabase.supabaseUrl}/functions/v1/crawl-nowon-reservation`;
      console.log('📡 요청 URL:', functionUrl);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 응답 오류:', errorData);
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ 크롤링 결과:', result);
      
      // API 응답의 data를 직접 사용 (Storage 건너뛰기)
      if (result.data && Array.isArray(result.data)) {
        console.log('📦 API 응답 데이터 직접 사용:', result.data.length);
        setReservationHistory(result.data);
        return;
      }
      
      // Storage에서 데이터 다운로드 (백업)
      console.log('📦 Storage에서 데이터 다운로드 시작...');
      
      // Storage에서 데이터 읽기
      if (result.userId) {
        console.log('📦 Storage에서 데이터 다운로드 시작...');
        
        const { data: storageData, error: storageError } = await supabase.storage
          .from('reservation-data')
          .download(`nowon-reservations-${result.userId}.json`);

        if (storageError) {
          console.error('❌ Storage 다운로드 오류:', storageError);
          throw new Error(`Storage 다운로드 실패: ${storageError.message}`);
        }

        const fileContent = await storageData.text();
        const jsonData = JSON.parse(fileContent);
        
        console.log('📦 Storage 데이터:', jsonData);
        
        // 예약 데이터를 상태에 저장
        const reservations = jsonData.reservations || [];
        
        console.log('📊 예약 개수:', reservations.length);
        console.log('📊 첫 번째 예약:', reservations[0]);
        console.log('📊 첫 번째 raw:', reservations[0]?.raw);
        console.log('📊 첫 번째 detailList:', reservations[0]?.raw?.detailList);
        
        setReservationHistory(reservations);
        
        console.log('✅ State 업데이트 완료');
      } else {
        throw new Error('사용자 ID가 응답에 없습니다.');
      }

    } catch (error: any) {
      console.error('❌ 예약 내역 로드 오류:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEditTennisAccount = () => {
    setShowEditModal(true);
  };

  const saveTennisAccountInfo = async (accountInfo: TennisAccountEditData) => {
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

      // 프로필 상태 업데이트
      setProfile(prev => prev ? {
        ...prev,
        nowon_id: accountInfo.nowon_id,
        nowon_pass: accountInfo.nowon_pass,
        dobong_id: accountInfo.dobong_id,
        dobong_pass: accountInfo.dobong_pass
      } : null);

      console.log('✅ 테니스장 계정 정보가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('계정 정보 저장 오류:', error);
      throw error;
    }
  };

  const handleReservationAlertToggle = async (checked: boolean) => {
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
          .update({ reservation_alert: checked })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // 새 레코드 생성
        const { error } = await supabase
          .from('tennis_reservation_profile')
          .insert({
            user_id: user.id,
            reservation_alert: checked
          });

        if (error) throw error;
      }

      // 프로필 상태 업데이트
      setProfile(prev => prev ? {
        ...prev,
        reservation_alert: checked
      } : null);

      console.log(`✅ 알림 설정이 ${checked ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('알림 설정 저장 오류:', error);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('로그아웃 하시겠습니까?');
    if (confirmLogout) {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate('/login');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('프로필 이미지 업로드 기능은 준비 중입니다.');
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
    }
  };

  const toggleDetails = (seq: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(seq)) {
      newExpanded.delete(seq);
    } else {
      newExpanded.add(seq);
    }
    setExpandedItems(newExpanded);
  };

  const handleCancelReservation = async (seq: number, totalPrice: number) => {
    const confirmCancel = window.confirm('정말로 예약을 취소하시겠습니까?');
    if (!confirmCancel) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다');
        return;
      }

      console.log('🔄 예약 취소 요청 시작...');
      console.log('seq:', seq, 'totalPrice:', totalPrice);

      const functionUrl = `${supabase.supabaseUrl}/functions/v1/cancel-nowon-reservation`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inRseq: seq,
          totalPrice: totalPrice
        })
      });

      console.log('📥 응답 상태:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 취소 오류:', errorData);
        throw new Error(errorData.error || '예약 취소에 실패했습니다');
      }

      const result = await response.json();
      console.log('✅ 취소 성공:', result);

      alert('예약이 취소되었습니다.');
      
      // 예약 내역 새로고침
      loadReservationHistory();

    } catch (error: any) {
      console.error('❌ 예약 취소 오류:', error);
      alert(error.message || '예약 취소에 실패했습니다');
    }
  };

  // 예약 상태에 따른 한글 표시
  const getReservationStatus = (reservation: NowonReservation): string => {
    const raw = reservation.raw;
    
    // 예약 취소
    if (raw.rstat === 'C' || raw.rstat === '1') return '예약취소';
    
    // 결제 대기 (rstat === 'R' 추가)
    if (raw.rstat === 'R' || raw.pstat === '결제대기') return '결제대기';
    
    // 결제 완료
    if (raw.pstat === '결제완료') return '결제완료';
    
    // 승인 완료
    if (raw.okayYn === 'Y') return '승인완료';
    
    return '대기중';
  };

  // 예약 상태에 따른 CSS 클래스
  const getStatusClass = (reservation: NowonReservation): string => {
    const raw = reservation.raw;
    
    // 예약 취소
    if (raw.rstat === 'C' || raw.rstat === '1') return 'status-cancelled';
    
    // 결제 대기 (rstat === 'R' 추가)
    if (raw.rstat === 'R' || raw.pstat === '결제대기') return 'status-payment-waiting';
    
    // 결제 완료
    if (raw.pstat === '결제완료') return 'status-confirmed';
    
    // 승인 완료
    if (raw.okayYn === 'Y') return 'status-approved';
    
    return 'status-pending';
  };

  // 요일 표시 (1=일, 2=월, 3=화, 4=수, 5=목, 6=금, 7=토)
  const getDayOfWeek = (day: number): string => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[day] || '';
  };

  // 필터링된 예약 내역
  const getFilteredReservations = () => {
    return reservationHistory.filter(reservation => {
      const raw = reservation.raw;
      
      // 취소된 예약은 기본적으로 제외
      if (raw.rstat === 'C' || raw.rstat === '1') {
        return false;
      }
      
      if (filterStatus === 'all') return true;
      
      if (filterStatus === 'payment-waiting') {
        return raw.rstat === 'R' || raw.pstat === '결제대기';
      }
      
      if (filterStatus === 'payment-completed') {
        return raw.pstat === '결제완료';
      }
      
      return true;
    });
  };

  if (loading) {
    return (
      <div className="reservation-profile-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="reservation-profile-container">
      <button className="back-btn" onClick={() => navigate('/reservation')}>
        ← 예약 페이지로 돌아가기
      </button>

      <div className="profile-header">
        <div className="profile-image-section">
          <div className="profile-image">
            <img 
              src={profile?.image_url || '/default-avatar.png'} 
              alt="프로필 이미지"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default-avatar.png';
              }}
            />
            <label className="image-upload-btn">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              📷
            </label>
          </div>
        </div>
        <div className="profile-info">
          <h2>{profile?.name}</h2>
          <p className="major">{profile?.major}</p>
          <p className="student-number">학번: {profile?.stnum}</p>
          <p className="email">{profile?.email}</p>
        </div>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          프로필
        </button>
        <button 
          className={`tab-btn ${activeTab === 'nowon-history' ? 'active' : ''}`}
          onClick={() => setActiveTab('nowon-history')}
        >
          노원구 예약
        </button>
        <button 
          className={`tab-btn ${activeTab === 'darakwon-history' ? 'active' : ''}`}
          onClick={() => setActiveTab('darakwon-history')}
        >
          다락원 예약
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'profile' && (
          <div className="profile-tab">
            <div className="info-card">
              <h3>기본 정보</h3>
              <div className="info-row">
                <span className="label">이름:</span>
                <span className="value">{profile?.name}</span>
              </div>
              <div className="info-row">
                <span className="label">학과:</span>
                <span className="value">{profile?.major}</span>
              </div>
              <div className="info-row">
                <span className="label">학번:</span>
                <span className="value">{profile?.stnum}</span>
              </div>
              <div className="info-row">
                <span className="label">이메일:</span>
                <span className="value">{profile?.email}</span>
              </div>
            </div>

            <div className="info-card">
              <h3>테니스장 계정 정보</h3>
              <div className="info-row">
                <span className="label">노원 ID:</span>
                <span className="value">{profile?.nowon_id || '등록되지 않음'}</span>
              </div>
              <div className="info-row">
                <span className="label">노원 비밀번호:</span>
                <div className="password-field">
                  <span className="value">
                    {profile?.nowon_pass 
                      ? (showNowonPass ? profile.nowon_pass : '***') 
                      : '등록되지 않음'
                    }
                  </span>
                  {profile?.nowon_pass && (
                    <button 
                      className="password-toggle-btn"
                      onClick={() => setShowNowonPass(!showNowonPass)}
                      type="button"
                    >
                      {showNowonPass ? '🙈' : '👁️'}
                    </button>
                  )}
                </div>
              </div>
              <div className="info-row">
                <span className="label">도봉 ID:</span>
                <span className="value">{profile?.dobong_id || '등록되지 않음'}</span>
              </div>
              <div className="info-row">
                <span className="label">도봉 비밀번호:</span>
                <div className="password-field">
                  <span className="value">
                    {profile?.dobong_pass 
                      ? (showDobongPass ? profile.dobong_pass : '***') 
                      : '등록되지 않음'
                    }
                  </span>
                  {profile?.dobong_pass && (
                    <button 
                      className="password-toggle-btn"
                      onClick={() => setShowDobongPass(!showDobongPass)}
                      type="button"
                    >
                      {showDobongPass ? '🙈' : '👁️'}
                    </button>
                  )}
                </div>
              </div>
              <button 
                className="edit-btn"
                onClick={handleEditTennisAccount}
              >
                수정
              </button>
            </div>

            <div className="info-card">
              <h3>계정 설정</h3>
              <div className="setting-item">
                <span className="setting-label">알림 설정</span>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={profile?.reservation_alert ?? true}
                    onChange={(e) => handleReservationAlertToggle(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          </div>
        )}

        {activeTab === 'nowon-history' && (
          <div className="history-tab">
            <div className="history-card">
              <div className="history-header">
                <h3>노원구 테니스장 예약 내역</h3>
                <button 
                  className="refresh-history-btn"
                  onClick={loadReservationHistory}
                  disabled={loadingHistory}
                >
                  {loadingHistory ? '🔄 로딩 중...' : '🔄 새로고침'}
                </button>
              </div>
              
              {/* 필터 버튼 - 취소 제거 */}
              {!loadingHistory && reservationHistory.filter(r => r.raw.rstat !== 'C' && r.raw.rstat !== '1').length > 0 && (
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                  >
                    전체 ({reservationHistory.filter(r => r.raw.rstat !== 'C' && r.raw.rstat !== '1').length})
                  </button>
                  <button 
                    className={`filter-btn ${filterStatus === 'payment-waiting' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('payment-waiting')}
                  >
                    결제대기 ({reservationHistory.filter(r => (r.raw.rstat === 'R' || r.raw.pstat === '결제대기') && r.raw.rstat !== 'C' && r.raw.rstat !== '1').length})
                  </button>
                  <button 
                    className={`filter-btn ${filterStatus === 'payment-completed' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('payment-completed')}
                  >
                    결제완료 ({reservationHistory.filter(r => r.raw.pstat === '결제완료' && r.raw.rstat !== 'C' && r.raw.rstat !== '1').length})
                  </button>
                </div>
              )}
              
              {loadingHistory ? (
                <div className="loading-history">예약 내역을 불러오는 중...</div>
              ) : getFilteredReservations().length > 0 ? (
                <div className="history-list">
                  {getFilteredReservations()
                    .filter(reservation => reservation?.raw)
                    .map((reservation, index) => {
                      const raw = reservation.raw;
                      const isExpanded = expandedItems.has(raw.seq || index);
                      const isPaymentWaiting = raw.rstat === 'R' || raw.pstat === '결제대기';
                      
                      return (
                        <div key={raw.seq || index} className="history-item">
                          <div className="history-main-info">
                            <div className="court-name">{raw.cName || '코트 정보 없음'}</div>
                            <div className={`status ${getStatusClass(reservation)}`}>
                              {getReservationStatus(reservation)}
                            </div>
                          </div>

                          {raw.detailList && raw.detailList.length > 0 ? (
                            <div className="reservation-times">
                              <div className="times-header">
                                📅 예약 일정
                              </div>
                              <div className="time-summary">
                                <div className="summary-date">
                                  <span className="summary-icon">📆</span>
                                  <strong>{raw.detailList[0].useDayBegin}</strong>
                                  <span className="day-badge">
                                    ({getDayOfWeek(raw.detailList[0].useDayBeginDay)})
                                  </span>
                                </div>
                                <div className="summary-time">
                                  <span className="summary-icon">⏰</span>
                                  <strong>
                                    {raw.detailList[0].useTimeBegin} ~ {raw.detailList[raw.detailList.length - 1].useTimeEnd}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="no-detail-info">
                              상세 예약 시간 정보가 없습니다.
                            </div>
                          )}

                          <div className="history-item-actions">
                            <button 
                              className="toggle-details-btn"
                              onClick={() => toggleDetails(raw.seq || index)}
                            >
                              {isExpanded ? '▲ 상세 정보 접기' : '▼ 상세 정보 보기'}
                            </button>

                            {isExpanded && (
                              <div className="history-details">
                                <div className="detail-row">
                                  <span className="detail-label">신청일:</span>
                                  <span className="detail-value">
                                    {raw.insertDate ? `20${raw.insertDate}` : '날짜 정보 없음'}
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">총 금액:</span>
                                  <span className="detail-value">
                                    {(raw.priceRefundTotalPricePay || 0).toLocaleString()}원
                                  </span>
                                </div>
                                {raw.payMethod && (
                                  <div className="detail-row">
                                    <span className="detail-label">결제방법:</span>
                                    <span className="detail-value">{raw.payMethod}</span>
                                  </div>
                                )}
                                <div className="detail-row">
                                  <span className="detail-label">결제상태:</span>
                                  <span className={`detail-value ${
                                    (raw.rstat === 'R' || raw.pstat === '결제대기') ? 'payment-waiting-text' : ''
                                  }`}>
                                    {raw.pstat || '상태 정보 없음'}
                                  </span>
                                </div>
                                
                                {isPaymentWaiting && (
                                  <div className="detail-actions">
                                    <button 
                                      className="cancel-reservation-btn-detail"
                                      onClick={() => handleCancelReservation(
                                        reservation.no,
                                        raw.priceRefundTotalPricePay || 0
                                      )}
                                    >
                                      <span className="cancel-icon">🗑️</span>
                                      <span>예약 취소하기</span>
                                    </button>
                                    <p className="cancel-notice">
                                      ⚠️ 취소 후에는 복구할 수 없습니다
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="no-history">
                  <p>{filterStatus === 'all' ? '예약 내역이 없습니다.' : '해당하는 예약 내역이 없습니다.'}</p>
                  {filterStatus === 'all' && (
                    <button onClick={() => navigate('/reservation')}>
                      예약하러 가기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'darakwon-history' && (
          <div className="history-tab">
            <div className="history-card">
              <div className="history-header">
                <h3>다락원 예약 내역</h3>
                <button 
                  className="refresh-history-btn"
                  disabled
                >
                  🔄 새로고침
                </button>
              </div>
              
              <div className="no-history">
                <p>다락원 예약 내역 기능은 준비 중입니다.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 테니스장 계정 정보 수정 모달 */}
      <TennisAccountEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentData={{
          nowon_id: profile?.nowon_id || '',
          nowon_pass: profile?.nowon_pass || '',
          dobong_id: profile?.dobong_id || '',
          dobong_pass: profile?.dobong_pass || ''
        }}
        onSave={saveTennisAccountInfo}
      />
    </div>
  );
}