import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../Auth/supabaseClient";
import LoadingSpinner from '../../components/LoadingSpinner';
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

interface DobongReservation {
  type: 'pending' | 'completed';
  column_1?: string;  // 번호
  column_2?: string;  // 상태 (예: "예약대기", "예약완료")
  column_3?: string;  // (미사용 또는 기타)
  column_4?: string;  // (미사용 또는 기타)
  column_5?: string;  // 시설명
  column_6?: string;  // 날짜
  column_7?: string;  // 시간
  links?: Array<{
    text: string;
    href: string;
  }>;
}

interface TennisAccountEditData {
  nowon_id: string;
  nowon_pass: string;
  dobong_id: string;
  dobong_pass: string;
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
  const [dobongReservationHistory, setDobongReservationHistory] = useState<DobongReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDobongHistory, setLoadingDobongHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'nowon-history' | 'darakwon-history'>('profile');
  const [showNowonPass, setShowNowonPass] = useState(false);
  const [showDobongPass, setShowDobongPass] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'payment-waiting' | 'payment-completed'>('all');
  const [dobongFilterType, setDobongFilterType] = useState<'pending' | 'completed' | 'cancelled'>('pending'); // 기본값: 예약대기
  const [expandedDobongItems, setExpandedDobongItems] = useState<Set<number>>(new Set());
  // 도봉구 headers 상태 추가
  const [dobongHeaders, setDobongHeaders] = useState<{ pending?: string[]; completed?: string[] }>({});

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'nowon-history') {
      loadReservationHistory();
    } else if (activeTab === 'darakwon-history') {
      loadDobongReservationHistory();
    }
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      const userName = localStorage.getItem('user_name') || '';
      const userMajor = localStorage.getItem('user_major') || '';
      const userStnum = localStorage.getItem('user_stnum') || '';
      const userImageUrl = localStorage.getItem('user_image_url') || '';
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
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

      const { data, error } = await supabase.functions.invoke('crawl-nowon-reservation');

      if (error) {
        console.error('❌ Edge Function 오류:', error);
        throw new Error(error.message || 'Edge Function 호출 실패');
      }

      const result = data;

      if (result.data && Array.isArray(result.data)) {
        setReservationHistory(result.data);
        return;
      }

      if (result.userId) {
        
        const { data: storageData, error: storageError } = await supabase.storage
          .from('reservation-data')
          .download(`nowon-reservations-${result.userId}.json`);

        if (storageError) {
          console.error('❌ Storage 다운로드 오류:', storageError);
          throw new Error(`Storage 다운로드 실패: ${storageError.message}`);
        }

        const fileContent = await storageData.text();
        const jsonData = JSON.parse(fileContent);

        const reservations = jsonData.reservations || [];
        setReservationHistory(reservations);
      } else {
        throw new Error('사용자 ID가 응답에 없습니다.');
      }

    } catch (error: any) {
      console.error('❌ 예약 내역 로드 오류:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadDobongReservationHistory = async () => {
    try {
      setLoadingDobongHistory(true);
      
      if (!profile?.dobong_id || !profile?.dobong_pass) {
        alert('도봉구 계정 정보가 없습니다. 프로필에서 등록해주세요.');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('로그인이 필요합니다');
      }

      const PROXY_URL = 'https://kwtc.dothome.co.kr/get_reservation_list.php';

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_reservation_list',
          username: profile.dobong_id,
          password: profile.dobong_pass,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // 예약 대기 + 예약 완료 데이터 통합
        const pendingReservations = result.data.pending?.reservations || [];
        const completedReservations = result.data.completed?.reservations || [];
        const allReservations = [...pendingReservations, ...completedReservations];

        // headers 추출
        setDobongHeaders({
          pending: result.data.pending?.headers,
          completed: result.data.completed?.headers,
        });

        setDobongReservationHistory(allReservations);
        
        // Storage에 저장
        try {
          const jsonData = {
            pending: result.data.pending,
            completed: result.data.completed,
            total_count: allReservations.length,
            crawled_at: new Date().toISOString()
          };
          
          const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
            type: 'application/json'
          });
          
          const fileName = `dobong-reservations-${user.id}.json`;
          
          const { data: existingFiles } = await supabase.storage
            .from('reservation-data')
            .list('', {
              search: fileName
            });
          
          if (existingFiles && existingFiles.length > 0) {
            await supabase.storage
              .from('reservation-data')
              .remove([fileName]);
          }
          
          const { error: uploadError } = await supabase.storage
            .from('reservation-data')
            .upload(fileName, blob, {
              contentType: 'application/json',
              upsert: true
            });
          
          if (uploadError) {
            console.error('Storage 업로드 실패:', uploadError);
          }
        } catch (storageError) {
          console.error('Storage 처리 오류:', storageError);
        }
      } else {
        throw new Error(result.error || '데이터를 불러올 수 없습니다');
      }
      
    } catch (error: any) {
      console.error('❌ 도봉구 예약 내역 조회 오류:', error);
      alert(error.message || '예약 내역을 불러올 수 없습니다');
    } finally {
      setLoadingDobongHistory(false);
    }
  };

  const handleEditTennisAccount = () => {
    setShowEditModal(true);
  };

  const saveTennisAccountInfo = async (accountInfo: TennisAccountEditData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다.');

      const { data: existingData } = await supabase
        .from('tennis_reservation_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingData) {
        const { error } = await supabase
          .from('tennis_reservation_profile')
          .update(accountInfo)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tennis_reservation_profile')
          .insert({
            user_id: user.id,
            ...accountInfo
          });

        if (error) throw error;
      }

      setProfile(prev => prev ? {
        ...prev,
        nowon_id: accountInfo.nowon_id,
        nowon_pass: accountInfo.nowon_pass,
        dobong_id: accountInfo.dobong_id,
        dobong_pass: accountInfo.dobong_pass
      } : null);
    } catch (error) {
      console.error('계정 정보 저장 오류:', error);
      throw error;
    }
  };

  const handleReservationAlertToggle = async (checked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다.');

      const { data: existingData } = await supabase
        .from('tennis_reservation_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingData) {
        const { error } = await supabase
          .from('tennis_reservation_profile')
          .update({ reservation_alert: checked })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tennis_reservation_profile')
          .insert({
            user_id: user.id,
            reservation_alert: checked
          });

        if (error) throw error;
      }

      setProfile(prev => prev ? {
        ...prev,
        reservation_alert: checked
      } : null);
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

  const toggleDobongDetails = (index: number) => {
    const newExpanded = new Set(expandedDobongItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDobongItems(newExpanded);
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

      const { data, error } = await supabase.functions.invoke('cancel-nowon-reservation', {
        body: {
          inRseq: seq,
          totalPrice: totalPrice
        }
      });

      if (error) {
        console.error('❌ 취소 오류:', error);
        throw new Error(error.message || '예약 취소에 실패했습니다');
      }

      alert('예약이 취소되었습니다.');
      
      loadReservationHistory();

    } catch (error: any) {
      console.error('❌ 예약 취소 오류:', error);
      alert(error.message || '예약 취소에 실패했습니다');
    }
  };

  // 도봉구 예약 취소 함수 - 예약 객체 전체를 인자로 받아 필요한 정보 추출
  const handleDobongCancelReservation = async (reservation: DobongReservation) => {
    const rentNo = reservation.column_1 || '';
    const facilityName = reservation.column_5 || '시설명 없음';

    // place_code: 실내코트면 019, 실외코트면 022
    let place_code = '';
    if (facilityName.includes('실내')) {
      place_code = '019';
    } else if (facilityName.includes('실외')) {
      place_code = '022';
    }
    // event_code는 항상 039
    const event_code = '039';

    // member_name은 로컬스토리지에서 user_name을 가져옴
    const member_name = localStorage.getItem('user_name') || '';

    // goodsName: facilityName에서 앞에 8글자 뺀 뒤 5글자
    let goodsName = '';
    if (facilityName.length >= 12) {
      goodsName = facilityName.substring(7, 12);
    }

    // member_id는 tennis_reservation_profile 테이블의 dobong_id (이미 profile.dobong_id로 관리 중)
    const member_id = profile?.dobong_id || '';

    // 확인 알림
    if (!confirm(`정말로 "${facilityName}" 예약을 취소하시겠습니까?\n\n취소 후에는 복구할 수 없습니다.`)) {
      return;
    }

    try {
      if (!profile?.dobong_id || !profile?.dobong_pass) {
        alert('도봉구 계정 정보가 없습니다.');
        return;
      }

      const CANCEL_URL = 'https://kwtc.dothome.co.kr/cancel_dobong_reservation.php';

      const payload: any = {
        action: 'cancel_reservation',
        username: profile.dobong_id,
        password: profile.dobong_pass,
        rent_no: rentNo,
        place_code,
        event_code,
        member_name,
        goodsName,
        member_id
      };

      const response = await fetch(CANCEL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert('예약이 취소되었습니다.');
        loadDobongReservationHistory();
      } else {
        throw new Error(result.error || result.message || '취소 실패');
      }

    } catch (error: any) {
      console.error('❌ 도봉구 예약 취소 오류:', error);
      alert('❌ 예약 취소 실패: ' + error.message);
    }
  };

  const getReservationStatus = (reservation: NowonReservation): string => {
    const raw = reservation.raw;
    
    if (raw.rstat === 'C' || raw.rstat === '1') return '예약취소';
    if (raw.rstat === 'R' || raw.pstat === '결제대기') return '결제대기';
    if (raw.pstat === '결제완료') return '결제완료';
    if (raw.okayYn === 'Y') return '승인완료';
    
    return '대기중';
  };

  const getStatusClass = (reservation: NowonReservation): string => {
    const raw = reservation.raw;
    
    if (raw.rstat === 'C' || raw.rstat === '1') return 'status-cancelled';
    if (raw.rstat === 'R' || raw.pstat === '결제대기') return 'status-payment-waiting';
    if (raw.pstat === '결제완료') return 'status-confirmed';
    if (raw.okayYn === 'Y') return 'status-approved';
    
    return 'status-pending';
  };

  const getDobongStatusClass = (reservation: DobongReservation): string => {
    const status = reservation.column_2 || '';
    
    // 시간경과취소는 빨간색
    if (status.includes('시간경과취소') || status.includes('취소')) {
      return 'status-time-cancelled';
    }
    
    // 예약완료는 초록색
    if (reservation.type === 'completed') {
      return 'status-completed';
    }
    
    // 예약대기는 노란색
    return 'status-pending';
  };

  const getDayOfWeek = (day: number): string => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[day] || '';
  };

  const getFilteredReservations = () => {
    return reservationHistory.filter(reservation => {
      const raw = reservation.raw;
      
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

  const getFilteredDobongReservations = () => {
    if (dobongFilterType === 'pending') {
      return dobongReservationHistory.filter(
        r => r.type === 'pending' && !(r.column_2?.includes('취소'))
      );
    }
    if (dobongFilterType === 'cancelled') {
      return dobongReservationHistory.filter(
        r => r.column_2?.includes('취소')
      );
    }
    return dobongReservationHistory.filter(
      r => r.type === 'completed' && !(r.column_2?.includes('취소'))
    );
  };

  // 다락원 예약 내역 필터별 카운트 계산 (헤더 데이터 포함)
  const getDobongCounts = () => {
    // 헤더 상태 추출
    const headerPendingStatus = dobongHeaders.pending && dobongHeaders.pending.length > 14 ? dobongHeaders.pending[9] : '';
    const headerCompletedStatus = dobongHeaders.completed && dobongHeaders.completed.length > 14 ? dobongHeaders.completed[9] : '';

    // 실제 데이터 카운트
    const pendingCount = dobongReservationHistory.filter(
      r => r.type === 'pending' && !(r.column_2?.includes('취소')) && !(r.column_2?.includes('완료'))
    ).length;
    const cancelledCount = dobongReservationHistory.filter(
      r => r.column_2?.includes('취소')
    ).length;
    const completedCount = dobongReservationHistory.filter(
      r => r.type === 'completed' && !(r.column_2?.includes('취소'))
    ).length;

    // 헤더가 실제로 해당 리스트에 표시될 때만 +1
    return {
      pending: pendingCount + (
        dobongHeaders.pending && dobongHeaders.pending.length > 14 &&
        !headerPendingStatus.includes('취소') &&
        !headerPendingStatus.includes('완료')
          ? 1 : 0
      ),
      cancelled: cancelledCount + (
        dobongHeaders.pending && dobongHeaders.pending.length > 14 &&
        headerPendingStatus.includes('취소')
          ? 1 : 0
      ),
      completed: completedCount +
        (
          dobongHeaders.pending && dobongHeaders.pending.length > 14 &&
          headerPendingStatus.includes('완료')
            ? 1 : 0
        ) +
        (
          dobongHeaders.completed && dobongHeaders.completed.length > 14 &&
          headerCompletedStatus.includes('완료')
            ? 1 : 0
        )
    };
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
      <button className="ur-back-btn" onClick={() => navigate('/reservation')}>
        <img
          src="/back-icon.png"
          alt="뒤로가기"
          className="back-icon-img"
          style={{ width: 24, height: 24, verticalAlign: 'middle'}}
        />
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
          노원구 예약 내역
        </button>
        <button 
          className={`tab-btn ${activeTab === 'darakwon-history' ? 'active' : ''}`}
          onClick={() => setActiveTab('darakwon-history')}
        >
          다락원 예약 내역
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

            <button className="logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
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
              
              {/* 안내 문구 추가 */}
              <div className="history-tip">
                <div className="tip-text">
                  💡 예약 내역이 안보인다면 페이지를 새로고침 해주세요.<br/>
                  💡 결제는 노원구 시설관리공단에서 직접 해야됩니다.
                </div>
                <a 
                  href="https://reservation.nowonsc.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tip-link-btn"
                >
                  결제하러 가기 →
                </a>
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
                <LoadingSpinner message="예약 내역을 불러오는 중..." />
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
                            <div className="court-name">{raw.cName || '코트 정보 없음'}장</div>
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

                          {/* 상세정보 접기/펼치기 버튼을 상세정보 바로 위로 이동 */}
                          <div className="history-item-actions">
                            <button 
                              className="toggle-details-btn"
                              onClick={() => toggleDetails(raw.seq || index)}
                            >
                              {isExpanded ? '▲ 상세 정보 / 취소 접기' : '▼ 상세 정보 / 취소 보기'}
                            </button>
                          </div>

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
                <h3>다락원 테니스장 예약 내역</h3>
                <button 
                  className="refresh-history-btn"
                  onClick={loadDobongReservationHistory}
                  disabled={loadingDobongHistory}
                >
                  {loadingDobongHistory ? '🔄 로딩 중...' : '🔄 새로고침'}
                </button>
              </div>
              
              {/* 안내 문구 추가 */}
              <div className="history-tip">
                <div className="tip-text">
                  💡 다락원 예약 내역은 최신 10개만 보여집니다
                  <br />
                  💡 결제는 도봉구 시설관리공단에서 직접 해야됩니다
                </div>
                <a 
                  href="https://yeyak.dobongsiseol.or.kr/rent/index.php?c_id=05&page_info=index&n_type=rent&c_ox=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tip-link-btn"
                >
                  결제하러 가기 →
                </a>
              </div>

              {/* 필터 버튼 */}
              {!loadingDobongHistory && dobongReservationHistory.length > 0 && (
                <div className="dobong-filter-buttons">
                  {(() => {
                    const counts = getDobongCounts();
                    return (
                      <>
                        <button 
                          className={`dobong-filter-btn ${dobongFilterType === 'pending' ? 'active' : ''}`}
                          onClick={() => setDobongFilterType('pending')}
                        >
                          ⏳ 결제대기 ({counts.pending})
                        </button>
                        <button 
                          className={`dobong-filter-btn ${dobongFilterType === 'cancelled' ? 'active' : ''}`}
                          onClick={() => setDobongFilterType('cancelled')}
                        >
                          🗑️ 취소 ({counts.cancelled})
                        </button>
                        <button 
                          className={`dobong-filter-btn ${dobongFilterType === 'completed' ? 'active' : ''}`}
                          onClick={() => setDobongFilterType('completed')}
                        >
                          ✅ 예약 완료 ({counts.completed})
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* 예약 내역 리스트 */}
              <div className="history-list">
                {/* 헤더 예약 데이터도 리스트에 포함 (일반 데이터와 동일 기능) */}
                {!loadingDobongHistory && dobongFilterType === 'pending' && dobongHeaders.pending && dobongHeaders.pending.length > 14 && !dobongHeaders.pending[9]?.includes('취소') && !dobongHeaders.pending[9]?.includes('완료') && (
                  <div className={`history-item dobong-item status-pending`}>
                    <div className="history-main-info">
                      <div className="facility-name">
                        {dobongHeaders.pending[12]
                          ? dobongHeaders.pending[12].substring(7, 12)
                          : '시설명 없음'}
                      </div>
                      <div className="reservation-status status-pending">
                        {dobongHeaders.pending[9] || '상태 없음'}
                      </div>
                    </div>
                    <div className="reservation-times">
                      <div className="times-header">📅 예약 일정</div>
                      <div className="time-summary">
                        <div className="summary-date">
                          <span className="summary-icon">📆</span>
                          <strong>{dobongHeaders.pending[13]}</strong>
                        </div>
                        <div className="summary-time">
                          <span className="summary-icon">⏰</span>
                          <strong>{dobongHeaders.pending[14]}</strong>
                        </div>
                      </div>
                    </div>
                    {/* 상세정보 접기/펼치기 버튼 */}
                    <div className="history-item-actions">
                      <button
                        className="toggle-details-btn"
                        onClick={() => {
                          const newExpanded = new Set(expandedDobongItems);
                          if (newExpanded.has(-1)) {
                            newExpanded.delete(-1);
                          } else {
                            newExpanded.add(-1);
                          }
                          setExpandedDobongItems(newExpanded);
                        }}
                      >
                        {expandedDobongItems.has(-1) ? '▲ 상세 정보 접기' : '▼ 상세 정보 보기'}
                      </button>
                    </div>
                    {/* 상세 정보 */}
                    {expandedDobongItems.has(-1) && (
                      <div className="dobong-details">
                        <div className="detail-row">
                          <span className="detail-label">예약번호:</span>
                          <span className="detail-value">{dobongHeaders.pending[8]}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">신청일자:</span>
                          <span className="detail-value">{dobongHeaders.pending[10]}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">상태:</span>
                          <span className="detail-value">{dobongHeaders.pending[9]}</span>
                        </div>
                        {/* 예약 취소하기 버튼 - 취소 상태가 아닐 때만 노출 */}
                        {dobongHeaders.pending[8] && !dobongHeaders.pending[9]?.includes('취소') && (
                          <div className="detail-actions">
                            <button
                              className="cancel-reservation-btn-detail"
                              onClick={() => handleDobongCancelReservation({
                                type: 'pending',
                                column_1: dobongHeaders.pending[8],
                                column_2: dobongHeaders.pending[9],
                                column_3: dobongHeaders.pending[10],
                                column_5: dobongHeaders.pending[12],
                                column_6: dobongHeaders.pending[13],
                                column_7: dobongHeaders.pending[14]
                              })}
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
                )}
                {/* 실제 예약 데이터 리스트 */}
                {loadingDobongHistory ? (
                  <LoadingSpinner message="예약 내역을 불러오는 중..." />
                ) : getFilteredDobongReservations().length > 0 ? (
                  getFilteredDobongReservations().map((reservation, index) => {
                    const isExpanded = expandedDobongItems.has(index);
                    const statusClass = getDobongStatusClass(reservation);
                    // 결제대기 상태 여부
                    const isPaymentWaiting = reservation.column_2 === '예약대기' || reservation.type === 'pending';
                    // 취소 상태 여부
                    const isCancelled = reservation.column_2?.includes('취소');

                    return (
                      <div 
                        key={index} 
                        className={`history-item dobong-item ${statusClass}`}
                      >
                        {/* 메인 정보 */}
                        <div className="history-main-info">
                          <div className="facility-name">
                            {/* facilityName 앞 7자 제외, 뒤 5자만 출력 (무조건 앞 7자 제외) */}
                            {reservation.column_5
                              ? reservation.column_5.substring(7, 12)
                              : '시설명 없음'}
                          </div>
                          <div className={`reservation-status ${statusClass}`}>
                            {reservation.column_2 || (reservation.type === 'pending' ? '⏳ 예약대기' : '✅ 예약완료')}
                          </div>
                        </div>

                        {/* 예약 시간 정보 */}
                        {(reservation.column_6 || reservation.column_7) && (
                          <div className="reservation-times">
                            <div className="times-header">
                              📅 예약 일정
                            </div>
                            <div className="time-summary">
                              {reservation.column_6 && (
                                <div className="summary-date">
                                  <span className="summary-icon">📆</span>
                                  <strong>{reservation.column_6}</strong>
                                </div>
                              )}
                              {reservation.column_7 && (
                                <div className="summary-time">
                                  <span className="summary-icon">⏰</span>
                                  <strong>{reservation.column_7}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 상세정보 접기/펼치기 버튼을 상세정보 바로 위로 이동 */}
                        <div className="history-item-actions">
                          <button
                            className="toggle-details-btn"
                            onClick={() => toggleDobongDetails(index)}
                          >
                            {isExpanded ? '▲ 상세 정보 / 취소 접기' : '▼ 상세 정보 / 취소 보기'}
                          </button>
                        </div>

                        {/* 상세 정보 */}
                        {isExpanded && (
                          <div className="dobong-details">
                            {reservation.column_1 && (
                              <div className="detail-row">
                                <span className="detail-label">예약번호:</span>
                                <span className="detail-value">{reservation.column_1}</span>
                              </div>
                            )}
                            {reservation.column_3 && (
                              <div className="detail-row">
                                <span className="detail-label">신청일자:</span>
                                <span className="detail-value">{reservation.column_3}</span>
                              </div>
                            )}
                            
                            {/* 예약 취소하기 버튼 - 취소 상태가 아니고 결제대기일 때만 노출 */}
                            {isPaymentWaiting && reservation.column_1 && !isCancelled && (
                              <div className="detail-actions">
                                <button 
                                  className="cancel-reservation-btn-detail"
                                  onClick={() => handleDobongCancelReservation(reservation)}
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
                    );
                  })
                ) : (
                  <div className="no-history">
                    <p>
                      {dobongFilterType === 'pending' 
                        ? '결제 대기 중인 내역이 없습니다.' 
                        : dobongFilterType === 'cancelled'
                          ? '취소된 내역이 없습니다.'
                          : '예약 완료된 내역이 없습니다.'}
                    </p>
                    <button onClick={() => navigate('/reservation')}>
                      예약하러 가기
                    </button>
                  </div>
                )}
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