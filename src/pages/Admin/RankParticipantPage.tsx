import { useState, useEffect, useMemo } from 'react';
import { withAdminAuth } from '../../services/adminHOC';
import { AdminLayout } from './components/AdminLayout';
import { supabase } from '../Auth/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import './RankParticipantPage.css';

interface User {
  id: string;
  name: string;
  major: string;
  stnum: string;
  image_url?: string;
  email: string;
}

function RankParticipantPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [rankedUsers, setRankedUsers] = useState<User[]>([]);
  const [unrankedUsers, setUnrankedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'ranked' | 'unranked'>('ranked');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 모든 유저 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('profile')
        .select('id, name, major, stnum, image_url, email')
        .order('name');

      if (profileError) throw profileError;

      // 랭킹에 등록된 유저 가져오기
      const { data: rankedData, error: rankedError } = await supabase
        .from('ranked_user')
        .select('id, name, major, stnum, image_url');

      if (rankedError) throw rankedError;

      const rankedIds = new Set(rankedData?.map(u => u.id) || []);

      setAllUsers(profileData || []);
      setRankedUsers((profileData || []).filter(u => rankedIds.has(u.id)));
      setUnrankedUsers((profileData || []).filter(u => !rankedIds.has(u.id)));
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const users = selectedTab === 'ranked' ? rankedUsers : unrankedUsers;
    if (!searchTerm) return users;

    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.stnum.includes(searchTerm)
    );
  }, [rankedUsers, unrankedUsers, selectedTab, searchTerm]);

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleAddToRanking = async () => {
    if (selectedUsers.size === 0) {
      alert('추가할 유저를 선택해주세요.');
      return;
    }

    if (!window.confirm(`선택한 ${selectedUsers.size}명을 랭킹에 추가하시겠습니까?\n\n초기 티어는 Bronze(테린이)로 설정됩니다.`)) {
      return;
    }

    try {
      const usersToAdd = unrankedUsers
        .filter(u => selectedUsers.has(u.id))
        .map(user => ({
          id: user.id,
          name: user.name,
          major: user.major,
          stnum: user.stnum,
          image_url: user.image_url,
          rank_tier: 0, // Bronze (테린이)
          rank_detail: 1,
          rank_all: null,
        }));

      const { error } = await supabase
        .from('ranked_user')
        .insert(usersToAdd);

      if (error) throw error;

      alert(`✅ ${usersToAdd.length}명이 랭킹에 추가되었습니다!`);
      setSelectedUsers(new Set());
      await fetchData();
    } catch (error: any) {
      console.error('랭킹 추가 오류:', error);
      alert('❌ 추가 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleRemoveFromRanking = async () => {
    if (selectedUsers.size === 0) {
      alert('삭제할 유저를 선택해주세요.');
      return;
    }

    if (!window.confirm(`선택한 ${selectedUsers.size}명을 랭킹에서 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ranked_user')
        .delete()
        .in('id', Array.from(selectedUsers));

      if (error) throw error;

      alert(`✅ ${selectedUsers.size}명이 랭킹에서 삭제되었습니다.`);
      setSelectedUsers(new Set());
      await fetchData();
    } catch (error: any) {
      console.error('랭킹 삭제 오류:', error);
      alert('❌ 삭제 중 오류가 발생했습니다: ' + error.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="👥 랭킹 참여자 관리" subtitle="로딩 중...">
        <LoadingSpinner message="사용자 정보를 불러오는 중..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="👥 랭킹 참여자 관리"
      subtitle={`전체 ${allUsers.length}명 | 랭킹 등록 ${rankedUsers.length}명 | 미등록 ${unrankedUsers.length}명`}
    >
      <div className="rank-participant-container">
        <div className="rank-participant-notice">
          💡 <strong>사용법:</strong>
          <br />• 미등록 유저를 선택하여 랭킹에 추가할 수 있습니다 (초기 티어: Bronze)
          <br />• 랭킹 등록 유저를 선택하여 랭킹에서 삭제할 수 있습니다
          <br />• 티어 조정은 "드래그 앤 드롭 랭킹 관리" 메뉴에서 가능합니다
        </div>

        {/* 탭 네비게이션 */}
        <div className="rank-participant-tabs">
          <button
            className={`rank-participant-tab ${selectedTab === 'ranked' ? 'active' : ''}`}
            onClick={() => {
              setSelectedTab('ranked');
              setSelectedUsers(new Set());
              setSearchTerm('');
            }}
          >
            🏆 랭킹 등록 ({rankedUsers.length}명)
          </button>
          <button
            className={`rank-participant-tab ${selectedTab === 'unranked' ? 'active' : ''}`}
            onClick={() => {
              setSelectedTab('unranked');
              setSelectedUsers(new Set());
              setSearchTerm('');
            }}
          >
            📋 미등록 ({unrankedUsers.length}명)
          </button>
        </div>

        {/* 검색 및 액션 */}
        <div className="rank-participant-actions">
          <div className="rank-participant-search">
            <input
              type="text"
              placeholder="이름, 학과, 학번으로 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="rank-participant-search-input"
            />
            {searchTerm && (
              <button
                className="rank-participant-clear-btn"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="rank-participant-action-buttons">
            <button
              className="rank-participant-select-all-btn"
              onClick={handleSelectAll}
            >
              {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0
                ? '✓ 전체 선택 해제'
                : '☐ 전체 선택'}
            </button>

            {selectedTab === 'unranked' ? (
              <button
                className="rank-participant-add-btn"
                onClick={handleAddToRanking}
                disabled={selectedUsers.size === 0}
              >
                ➕ 랭킹에 추가 ({selectedUsers.size})
              </button>
            ) : (
              <button
                className="rank-participant-remove-btn"
                onClick={handleRemoveFromRanking}
                disabled={selectedUsers.size === 0}
              >
                🗑️ 랭킹에서 삭제 ({selectedUsers.size})
              </button>
            )}
          </div>
        </div>

        {/* 유저 목록 */}
        <div className="rank-participant-list">
          {filteredUsers.length === 0 ? (
            <div className="rank-participant-empty">
              <div className="rank-participant-empty-icon">
                {searchTerm ? '🔍' : '📭'}
              </div>
              <p>
                {searchTerm
                  ? '검색 결과가 없습니다.'
                  : selectedTab === 'ranked'
                  ? '랭킹에 등록된 유저가 없습니다.'
                  : '미등록 유저가 없습니다. 모든 유저가 랭킹에 등록되어 있습니다!'}
              </p>
            </div>
          ) : (
            <div className="rank-participant-grid">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`rank-participant-card ${
                    selectedUsers.has(user.id) ? 'selected' : ''
                  }`}
                  onClick={() => handleSelectUser(user.id)}
                >
                  <div className="rank-participant-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  <img
                    src={
                      user.image_url ||
                      'https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png'
                    }
                    alt={user.name}
                    className="rank-participant-image"
                  />
                  <div className="rank-participant-info">
                    <div className="rank-participant-name">{user.name}</div>
                    <div className="rank-participant-details">{user.major}</div>
                    <div className="rank-participant-stnum">#{user.stnum}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 통계 정보 */}
        {filteredUsers.length > 0 && (
          <div className="rank-participant-stats">
            총 {filteredUsers.length}명 표시 중
            {selectedUsers.size > 0 && ` • ${selectedUsers.size}명 선택됨`}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(RankParticipantPage);
