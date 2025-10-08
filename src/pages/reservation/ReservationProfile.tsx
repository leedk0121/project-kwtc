import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../auth/supabaseClient';
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

interface ReservationHistory {
  id: number;
  court: string;
  court_num: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
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

function ReservationProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reservationHistory, setReservationHistory] = useState<ReservationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'settings'>('profile');
  const [showNowonPass, setShowNowonPass] = useState(false);
  const [showDobongPass, setShowDobongPass] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

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

      alert('테니스장 계정 정보가 성공적으로 수정되었습니다.');
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

      console.log(`알림 설정이 ${checked ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('알림 설정 저장 오류:', error);
      alert('알림 설정 저장에 실패했습니다.');
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

      alert('프로필 이미지 업로드 기능은 준비 중입니다.');
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
    }
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
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          예약 히스토리
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          설정
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
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            <div className="history-card">
              <h3>최근 예약 내역</h3>
              {reservationHistory.length > 0 ? (
                <div className="history-list">
                  {reservationHistory.map((reservation) => (
                    <div key={reservation.id} className="history-item">
                      <div className="history-info">
                        <div className="court-info">
                          {reservation.court} - {reservation.court_num}
                        </div>
                        <div className="date-time">
                          {reservation.date} {reservation.time}
                        </div>
                      </div>
                      <div className={`status ${reservation.status}`}>
                        {reservation.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-history">
                  <p>예약 내역이 없습니다.</p>
                  <button onClick={() => navigate('/reservation')}>
                    예약하러 가기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="settings-card">
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

export default ReservationProfile;