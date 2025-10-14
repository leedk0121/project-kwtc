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
      // 승인된 사용자만 필터링
      const approvedUsers = users.filter(user => user.approved === true);
      setProfiles(approvedUsers);
      console.log('✅ 승인된 사용자 목록 조회 완료:', approvedUsers.length, '명');
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
    users: profiles.filter(p => !p.is_admin).length
  };

  if (loading) {
    return (
      <div className="admin-role-manage-container">
        <div className="admin-role-manage-loading">
          <div className="admin-role-manage-spinner"></div>
          <p>사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-role-manage-container">
      {/* 헤더 */}
      <div className="admin-role-manage-header">
        <h1>관리자 권한 관리</h1>
        <p className="admin-role-manage-subtitle">사용자의 관리자 권한을 설정하거나 해제할 수 있습니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="admin-role-manage-stats">
        <div className="admin-role-manage-stat-card admin-role-manage-total">
          <span className="admin-role-manage-stat-icon">👥</span>
          <div>
            <span className="admin-role-manage-stat-label">전체 사용자</span>
            <span className="admin-role-manage-stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="admin-role-manage-stat-card admin-role-manage-admin">
          <span className="admin-role-manage-stat-icon">👑</span>
          <div>
            <span className="admin-role-manage-stat-label">관리자</span>
            <span className="admin-role-manage-stat-value">{stats.admins}</span>
          </div>
        </div>

        <div className="admin-role-manage-stat-card admin-role-manage-user">
          <span className="admin-role-manage-stat-icon">👤</span>
          <div>
            <span className="admin-role-manage-stat-label">일반 사용자</span>
            <span className="admin-role-manage-stat-value">{stats.users}</span>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="admin-role-manage-controls">
        <div className="admin-role-manage-search-bar">
          <span className="admin-role-manage-search-icon">🔍</span>
          <input
            type="text"
            placeholder="이름, 이메일, 학과, 학번으로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-role-manage-filter-buttons">
          <button
            className={`admin-role-manage-filter-btn ${filterType === 'all' ? 'admin-role-manage-active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            📋 전체
          </button>
          <button
            className={`admin-role-manage-filter-btn ${filterType === 'admin' ? 'admin-role-manage-active' : ''}`}
            onClick={() => setFilterType('admin')}
          >
            👑 관리자
          </button>
          <button
            className={`admin-role-manage-filter-btn ${filterType === 'user' ? 'admin-role-manage-active' : ''}`}
            onClick={() => setFilterType('user')}
          >
            👤 일반 사용자
          </button>
        </div>

        <button className="admin-role-manage-refresh-btn" onClick={fetchAllUsers}>
          🔄 새로고침
        </button>
      </div>

      {/* 사용자 목록 */}
      <div className="admin-role-manage-profiles-grid">
        {filteredProfiles.length === 0 ? (
          <div className="admin-role-manage-empty-state">
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          filteredProfiles.map((profile) => (
            <div key={profile.id} className="admin-role-manage-profile-card">
              {/* 프로필 헤더 */}
              <div className="admin-role-manage-profile-header">
                <div className="admin-role-manage-profile-image">
                  <img 
                    src={profile.image_url || '/default-avatar.png'} 
                    alt={profile.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
                  {profile.is_admin && (
                    <span className="admin-role-manage-admin-crown">👑</span>
                  )}
                </div>
                
                <div className="admin-role-manage-profile-info">
                  <h3 className="admin-role-manage-profile-name">{profile.name}</h3>
                  <p className="admin-role-manage-profile-email">📧 {profile.email}</p>
                  <p className="admin-role-manage-profile-detail">🎓 {profile.major}</p>
                  <p className="admin-role-manage-profile-detail">🔢 {profile.stnum}</p>
                </div>

                <div className="admin-role-manage-profile-badges">
                  <span className={`admin-role-manage-badge ${profile.is_admin ? 'admin-role-manage-badge-admin' : 'admin-role-manage-badge-user'}`}>
                    {profile.is_admin ? '관리자' : '일반'}
                  </span>
                </div>
              </div>

              {/* 액션 버튼 - 관리자 권한 토글만 */}
              <div className="admin-role-manage-profile-actions">
                <button
                  className={`admin-role-manage-action-btn ${profile.is_admin ? 'admin-role-manage-revoke' : 'admin-role-manage-grant'}`}
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