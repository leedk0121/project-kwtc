// src/pages/Admin/Loginapprovepage.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { withAdminAuth } from '../../services/adminHOC';
import './Loginapprovepage.css';

interface ProfileData {
  id: string;
  name: string;
  major: string;
  email: string;
  stnum: string;
  approved: boolean;
  is_admin: boolean;
  created_at: string;
  image_url?: string;
}

function LoginApprove() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  // 모든 프로필 가져오기
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const users = await adminService.getAllUsers();
      setProfiles(users || []);
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      alert('프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사용자 승인/취소 토글
  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    const profile = profiles.find(p => p.id === userId);
    if (!profile) return;

    const confirmMessage = currentStatus 
      ? `${profile.name}님의 승인을 취소하시겠습니까?` 
      : `${profile.name}님의 가입을 승인하시겠습니까?`;
    
    if (!window.confirm(confirmMessage)) return;

    setUpdating(userId);
    try {
      if (currentStatus) {
        // 승인 취소 - approved를 false로 변경
        const result = await adminService.updateUserProfile(userId, { approved: false });
        
        if (result.success) {
          alert('승인이 취소되었습니다.');
          setProfiles(profiles.map(p => 
            p.id === userId ? { ...p, approved: false } : p
          ));
        } else {
          alert(result.message || '승인 취소에 실패했습니다.');
        }
      } else {
        // 승인 처리
        const result = await adminService.approveUser(userId);
        
        if (result.success) {
          alert(result.message);
          setProfiles(profiles.map(p => 
            p.id === userId ? { ...p, approved: true } : p
          ));
        } else {
          alert(result.message || '승인에 실패했습니다.');
        }
      }
    } catch (error: any) {
      console.error('승인 상태 변경 오류:', error);
      alert(`승인 상태 변경 실패: ${error.message}`);
    } finally {
      setUpdating(null);
    }
  };

  // 사용자 삭제
  const deleteUser = async (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    if (!profile) return;

    if (!window.confirm(
      `⚠️ 경고: ${profile.name}님의 계정을 완전히 삭제하시겠습니까?\n\n` +
      '이 작업은 되돌릴 수 없으며, 다음 데이터가 모두 삭제됩니다:\n' +
      '- Auth 계정\n' +
      '- 프로필 정보\n' +
      '- 리더 역할\n' +
      '- 예약 정보\n' +
      '- 기타 관련 데이터'
    )) return;

    // 최종 확인
    if (!window.confirm('정말로 삭제하시겠습니까? (최종 확인)')) return;

    setUpdating(userId);
    try {
      const result = await adminService.deleteUser(userId);

      if (result.success) {
        alert(result.message);
        // 로컬 상태에서 제거
        setProfiles(profiles.filter(p => p.id !== userId));
      } else {
        alert(result.message || '삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('삭제 오류:', error);
      alert(`삭제 실패: ${error.message}`);
    } finally {
      setUpdating(null);
    }
  };

  // 필터링된 프로필
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.stnum.includes(searchTerm);

    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'approved' && profile.approved) ||
      (filterStatus === 'pending' && !profile.approved);

    return matchesSearch && matchesStatus;
  });

  // 통계
  const stats = {
    total: profiles.length,
    approved: profiles.filter(p => p.approved).length,
    pending: profiles.filter(p => !p.approved).length
  };

  if (loading) {
    return (
      <div className="login-approve-container">
        <div className="login-approve-loading">
          <div className="spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-approve-container">
      {/* 페이지 헤더 */}
      <div className="login-approve-header">
        <h1 className="login-approve-page-title">사용자 승인 관리</h1>
        <p className="login-approve-subtitle">가입한 사용자들의 승인 상태를 관리합니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="login-approve-stats-cards">
        <div className="login-approve-stat-card">
          <span className="login-approve-stat-label">전체</span>
          <span className="login-approve-stat-value">{stats.total}</span>
        </div>
        <div className="login-approve-stat-card">
          <span className="login-approve-stat-label">승인됨</span>
          <span className="login-approve-stat-value">{stats.approved}</span>
        </div>
        <div className="login-approve-stat-card">
          <span className="login-approve-stat-label">대기중</span>
          <span className="login-approve-stat-value">{stats.pending}</span>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="login-approve-controls">
        <input
          type="text"
          className="login-approve-search"
          placeholder="이름, 이메일, 학과, 학번으로 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="login-approve-filter-buttons">
          <button 
            className={filterStatus === 'all' ? 'active' : ''}
            onClick={() => setFilterStatus('all')}
          >
            전체
          </button>
          <button 
            className={filterStatus === 'approved' ? 'active' : ''}
            onClick={() => setFilterStatus('approved')}
          >
            승인됨
          </button>
          <button 
            className={filterStatus === 'pending' ? 'active' : ''}
            onClick={() => setFilterStatus('pending')}
          >
            대기중
          </button>
        </div>

        <button className="login-approve-refresh" onClick={fetchProfiles}>
          🔄 새로고침
        </button>
      </div>

      {/* 프로필 목록 */}
      <div className="login-approve-profiles-list">
        {filteredProfiles.length === 0 ? (
          <div className="login-approve-no-results">
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          filteredProfiles.map((profile) => (
            <div key={profile.id} className="login-approve-profile-card">
              <div className="login-approve-profile-image">
                <img 
                  src={profile.image_url || '/default-avatar.png'} 
                  alt={profile.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
              </div>

              <div className="login-approve-profile-info">
                <h3 className="login-approve-profile-name">
                  {profile.name}
                  {profile.is_admin && <span style={{marginLeft: '8px'}}>👑</span>}
                </h3>
                <div className="login-approve-profile-details">
                  <span className="login-approve-detail-item">📧 {profile.email}</span>
                  <span className="login-approve-detail-item">🎓 {profile.major}</span>
                  <span className="login-approve-detail-item">🔢 {profile.stnum}</span>
                </div>
                <p className="login-approve-profile-date">
                  가입일: {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="login-approve-profile-actions">
                <span className={`login-approve-status-badge ${profile.approved ? 'approved' : 'pending'}`}>
                  {profile.approved ? '승인됨' : '대기중'}
                </span>
                
                <button
                  className={`login-approve-toggle-btn ${profile.approved ? 'revoke' : 'approve'}`}
                  onClick={() => toggleApproval(profile.id, profile.approved)}
                  disabled={updating === profile.id}
                >
                  {updating === profile.id ? (
                    '처리중...'
                  ) : profile.approved ? (
                    '승인 취소'
                  ) : (
                    '승인하기'
                  )}
                </button>

                <button
                  className="login-approve-toggle-btn reject"
                  onClick={() => deleteUser(profile.id)}
                  disabled={updating === profile.id}
                >
                  {updating === profile.id ? '처리중...' : '🗑️ 삭제'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// HOC로 관리자 권한 보호
export default withAdminAuth(LoginApprove);