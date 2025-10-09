// src/pages/Admin/AdminRoleManager.tsx

import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { withAdminAuth } from '../../services/adminHOC';
import './AdminRoleManager.css';

interface Profile {
  id: string;
  name: string;
  email: string;
  major: string;
  stnum: string;
  is_admin: boolean;
  approved: boolean;
  created_at: string;
  image_url?: string;
}

function AdminRoleManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'user'>('all');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // 🔍 모든 사용자 가져오기 (Service Role 사용)
  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const users = await adminService.getAllUsers();
      setProfiles(users);
      console.log('✅ 사용자 목록 조회 완료:', users.length, '명');
    } catch (error: any) {
      console.error('사용자 조회 오류:', error);
      alert(`사용자 조회 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔐 관리자 권한 토글
  const toggleAdminRole = async (userId: string, currentAdminStatus: boolean) => {
    const profile = profiles.find(p => p.id === userId);
    if (!profile) return;

    const confirmMessage = currentAdminStatus 
      ? `${profile.name}님의 관리자 권한을 제거하시겠습니까?` 
      : `${profile.name}님을 관리자로 지정하시겠습니까?`;
    
    if (!window.confirm(confirmMessage)) return;

    setUpdating(userId);
    try {
      const result = await adminService.setAdminRole(userId, !currentAdminStatus);

      if (result.success) {
        alert(result.message);
        
        // 로컬 상태 업데이트
        setProfiles(profiles.map(p => 
          p.id === userId ? { ...p, is_admin: !currentAdminStatus } : p
        ));
      } else {
        alert(result.message || '권한 변경에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('권한 변경 오류:', error);
      alert(`권한 변경 실패: ${error.message}`);
    } finally {
      setUpdating(null);
    }
  };

  // ✅ 사용자 승인
  const approveUser = async (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    if (!profile) return;

    if (!window.confirm(`${profile.name}님의 가입을 승인하시겠습니까?`)) return;

    setUpdating(userId);
    try {
      const result = await adminService.approveUser(userId);

      if (result.success) {
        alert(result.message);
        
        // 로컬 상태 업데이트
        setProfiles(profiles.map(p => 
          p.id === userId ? { ...p, approved: true } : p
        ));
      } else {
        alert(result.message || '승인에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('승인 오류:', error);
      alert(`승인 실패: ${error.message}`);
    } finally {
      setUpdating(null);
    }
  };

  // 🗑️ 사용자 완전 삭제
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

  // 🔍 필터링된 프로필 목록
  const filteredProfiles = profiles.filter(profile => {
    // 검색어 필터
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      profile.name.toLowerCase().includes(searchLower) ||
      profile.email.toLowerCase().includes(searchLower) ||
      profile.major.toLowerCase().includes(searchLower) ||
      String(profile.stnum).includes(searchTerm);

    // 타입 필터
    const matchesType =
      filterType === 'all' ||
      (filterType === 'admin' && profile.is_admin) ||
      (filterType === 'user' && !profile.is_admin);

    return matchesSearch && matchesType;
  });

  // 통계
  const stats = {
    total: profiles.length,
    admins: profiles.filter(p => p.is_admin).length,
    users: profiles.filter(p => !p.is_admin).length,
    pending: profiles.filter(p => !p.approved).length
  };

  if (loading) {
    return (
      <div className="admin-role-container">
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-role-container">
      {/* 헤더 */}
      <div className="admin-header">
        <h1>👑 관리자 권한 관리</h1>
        <p className="admin-subtitle">Service Role을 사용한 완전한 사용자 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="admin-stats">
        <div className="stat-card total">
          <span className="stat-icon">👥</span>
          <div>
            <span className="stat-label">전체 사용자</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card admin">
          <span className="stat-icon">👑</span>
          <div>
            <span className="stat-label">관리자</span>
            <span className="stat-value">{stats.admins}</span>
          </div>
        </div>
        <div className="stat-card user">
          <span className="stat-icon">👤</span>
          <div>
            <span className="stat-label">일반 사용자</span>
            <span className="stat-value">{stats.users}</span>
          </div>
        </div>
        <div className="stat-card pending">
          <span className="stat-icon">⏳</span>
          <div>
            <span className="stat-label">승인 대기</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="admin-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="이름, 이메일, 학과, 학번으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            전체
          </button>
          <button
            className={`filter-btn ${filterType === 'admin' ? 'active' : ''}`}
            onClick={() => setFilterType('admin')}
          >
            👑 관리자
          </button>
          <button
            className={`filter-btn ${filterType === 'user' ? 'active' : ''}`}
            onClick={() => setFilterType('user')}
          >
            👤 일반 사용자
          </button>
        </div>

        <button className="refresh-btn" onClick={fetchAllUsers}>
          🔄 새로고침
        </button>
      </div>

      {/* 사용자 목록 */}
      <div className="profiles-grid">
        {filteredProfiles.length === 0 ? (
          <div className="empty-state">
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          filteredProfiles.map((profile) => (
            <div key={profile.id} className="profile-card">
              {/* 프로필 헤더 */}
              <div className="profile-header">
                <div className="profile-image">
                  <img 
                    src={profile.image_url || '/default-avatar.png'} 
                    alt={profile.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
                  {profile.is_admin && (
                    <span className="admin-crown">👑</span>
                  )}
                </div>
                
                <div className="profile-info">
                  <h3 className="profile-name">{profile.name}</h3>
                  <p className="profile-email">📧 {profile.email}</p>
                  <p className="profile-detail">🎓 {profile.major}</p>
                  <p className="profile-detail">🔢 {profile.stnum}</p>
                </div>

                <div className="profile-badges">
                  <span className={`badge ${profile.is_admin ? 'admin' : 'user'}`}>
                    {profile.is_admin ? '관리자' : '일반'}
                  </span>
                  {!profile.approved && (
                    <span className="badge pending">미승인</span>
                  )}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="profile-actions">
                {!profile.approved && (
                  <button
                    className="action-btn approve"
                    onClick={() => approveUser(profile.id)}
                    disabled={updating === profile.id}
                  >
                    {updating === profile.id ? '처리중...' : '✅ 승인'}
                  </button>
                )}

                <button
                  className={`action-btn ${profile.is_admin ? 'revoke' : 'grant'}`}
                  onClick={() => toggleAdminRole(profile.id, profile.is_admin)}
                  disabled={updating === profile.id}
                >
                  {updating === profile.id ? (
                    '처리중...'
                  ) : profile.is_admin ? (
                    '🔓 권한 제거'
                  ) : (
                    '🔐 관리자 지정'
                  )}
                </button>

                <button
                  className="action-btn delete"
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
export default withAdminAuth(AdminRoleManager);