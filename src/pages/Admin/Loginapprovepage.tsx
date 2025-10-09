import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../auth/supabaseClient';
import './Loginapprovepage.css';

interface ProfileData {
  id: string;
  name: string;
  major: string;
  email: string;
  stnum: string;
  approved: boolean;
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
    checkAdminAndFetchProfiles();
  }, []);

  const checkAdminAndFetchProfiles = async () => {
    try {
      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      // 관리자 권한 확인 (선택사항 - 필요하면 추가)
      // const { data: profile } = await supabase
      //   .from('profile')
      //   .select('is_admin')
      //   .eq('id', user.id)
      //   .single();
      // 
      // if (!profile?.is_admin) {
      //   alert('관리자만 접근할 수 있습니다.');
      //   navigate('/');
      //   return;
      // }

      // 모든 프로필 가져오기
      fetchProfiles();
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('id, name, major, email, stnum, approved, created_at, image_url')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      alert('프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    const confirmMessage = currentStatus 
      ? '승인을 취소하시겠습니까?' 
      : '로그인을 승인하시겠습니까?';
    
    if (!window.confirm(confirmMessage)) return;

    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profile')
        .update({ approved: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setProfiles(profiles.map(p => 
        p.id === userId ? { ...p, approved: !currentStatus } : p
      ));

      alert(currentStatus ? '승인이 취소되었습니다.' : '승인이 완료되었습니다.');
    } catch (error) {
      console.error('승인 상태 변경 오류:', error);
      alert('승인 상태 변경에 실패했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  const rejectProfile = async (userId: string, userName: string) => {
    if (!window.confirm(`${userName}님의 가입 신청을 거절하고 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profile')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // 로컬 상태에서 제거
      setProfiles(profiles.filter(p => p.id !== userId));

      alert('가입 신청이 거절되었습니다.');
    } catch (error) {
      console.error('프로필 삭제 오류:', error);
      alert('프로필 삭제에 실패했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  // 필터링된 프로필 목록
  const filteredProfiles = profiles.filter(profile => {
    // 검색어 필터
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (profile.name || '').toLowerCase().includes(searchLower) ||
      (profile.email || '').toLowerCase().includes(searchLower) ||
      String(profile.stnum || '').includes(searchTerm) ||
      (profile.major || '').toLowerCase().includes(searchLower);

    // 상태 필터
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'approved' && profile.approved) ||
      (filterStatus === 'pending' && !profile.approved);

    return matchesSearch && matchesStatus;
  });

  const approvedCount = profiles.filter(p => p.approved).length;
  const pendingCount = profiles.filter(p => !p.approved).length;

  if (loading) {
    return (
      <div className="login-approve-container">
        <div className="login-approve-loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="login-approve-container">
      <div className="login-approve-header">
        <div className="login-approve-header-top">
          <h1 className="login-approve-page-title">🔐 로그인 승인 관리</h1>
        </div>
        
        <div className="login-approve-stats-cards">
          <div className="login-approve-stat-card total">
            <span className="login-approve-stat-label">전체</span>
            <span className="login-approve-stat-value">{profiles.length}</span>
          </div>
          <div className="login-approve-stat-card approved">
            <span className="login-approve-stat-label">승인</span>
            <span className="login-approve-stat-value">{approvedCount}</span>
          </div>
          <div className="login-approve-stat-card pending">
            <span className="login-approve-stat-label">대기</span>
            <span className="login-approve-stat-value">{pendingCount}</span>
          </div>
        </div>
      </div>

      <div className="login-approve-controls">
        <div className="login-approve-search-box">
          <input
            type="text"
            placeholder="이름, 이메일, 학번, 학과로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="login-approve-filter-buttons">
          <button
            className={`login-approve-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            전체
          </button>
          <button
            className={`login-approve-filter-btn ${filterStatus === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            승인됨
          </button>
          <button
            className={`login-approve-filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            대기중
          </button>
        </div>
      </div>

      <div className="login-approve-profiles-list">
        {filteredProfiles.length === 0 ? (
          <div className="login-approve-no-results">
            검색 결과가 없습니다.
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
                <div className="login-approve-profile-name">{profile.name}</div>
                <div className="login-approve-profile-details">
                  <span className="login-approve-detail-item">📧 {profile.email}</span>
                  <span className="login-approve-detail-item">🎓 {profile.major}</span>
                  <span className="login-approve-detail-item">🔢 {profile.stnum}</span>
                </div>
                <div className="login-approve-profile-date">
                  가입일: {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>

              <div className="login-approve-profile-actions">
                <div className={`login-approve-status-badge ${profile.approved ? 'approved' : 'pending'}`}>
                  {profile.approved ? '✅ 승인됨' : '⏳ 대기중'}
                </div>
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
                  onClick={() => rejectProfile(profile.id, profile.name)}
                  disabled={updating === profile.id}
                >
                  {updating === profile.id ? '처리중...' : '거절하기'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LoginApprove;