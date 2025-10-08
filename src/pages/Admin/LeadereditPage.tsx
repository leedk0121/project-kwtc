import React, { useState, useEffect } from 'react';
import { supabase } from "../auth/supabaseClient.tsx";
import './LeadereditPage.tsx';

interface Profile {
  id: string;
  name: string;
  major: string;
  stnum: string;
}

interface LeaderProfile {
  user_id: string;
  position: string;
  position_description: string;
  order_num: number;
}

const LeadereditPage: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [leaderProfiles, setLeaderProfiles] = useState<LeaderProfile[]>([]);
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState({
    position: '',
    position_description: '',
    user_id: '',
    order_num: 1
  });

  // 프로필 데이터 가져오기
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('id, name, major, stnum');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  // 리더 프로필 데이터 가져오기
  const fetchLeaderProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('leader_profile')
        .select('user_id, position, position_description, order_num')
        .order('order_num', { ascending: true });

      if (error) throw error;
      setLeaderProfiles(data || []);
    } catch (error) {
      console.error('Error fetching leader profiles:', error);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProfiles(), fetchLeaderProfiles()]);
      setLoading(false);
    };

    loadData();
  }, []);

  // 새 역할 추가
  const handleAddRole = async () => {
    if (newRole.position.trim() && newRole.position_description.trim() && newRole.user_id && newRole.order_num) {
      try {
        const { data, error } = await supabase
          .from('leader_profile')
          .insert([{
            user_id: newRole.user_id,
            position: newRole.position,
            position_description: newRole.position_description,
            order_num: newRole.order_num
          }])
          .select('user_id, position, position_description, order_num');

        if (error) throw error;

        if (data && data.length > 0) {
          // order_num에 따라 정렬된 상태로 추가
          const updatedLeaderProfiles = [...leaderProfiles, data[0]]
            .sort((a, b) => a.order_num - b.order_num);
          
          setLeaderProfiles(updatedLeaderProfiles);
          setNewRole({ position: '', position_description: '', user_id: '', order_num: 1 });
          setSelectedMember(null);
          setSearchTerm('');
          setShowAddRoleForm(false);
        }
      } catch (error) {
        console.error('Error adding role:', error);
        alert('역할 추가 중 오류가 발생했습니다.');
      }
    } else {
      alert('모든 필드를 입력해주세요.');
    }
  };

  // 역할 삭제
  const handleRemoveRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('leader_profile')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setLeaderProfiles(leaderProfiles.filter(role => role.user_id !== userId));
    } catch (error) {
      console.error('Error removing role:', error);
      alert('역할 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCancelAddRole = () => {
    setNewRole({ position: '', position_description: '', user_id: '', order_num: 1 });
    setSelectedMember(null);
    setSearchTerm('');
    setShowAddRoleForm(false);
  };

  // 이미 역할이 배정된 멤버들을 제외한 사용 가능한 멤버 목록
  const availableProfiles = profiles.filter(profile => 
    !leaderProfiles.some(leaderProfile => leaderProfile.user_id === profile.id)
  );

  // 검색 기능 - 이름으로 멤버 필터링 (역할 추가용)
  const filteredAvailableProfiles = availableProfiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // user_id로 프로필 정보 찾기
  const getProfileByUserId = (userId: string) => {
    return profiles.find(profile => profile.id === userId);
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // 멤버 선택 (역할 추가 폼에서)
  const handleSelectMemberForRole = (member: Profile) => {
    setSelectedMember(member);
    setNewRole({ ...newRole, user_id: member.id });
    setSearchTerm('');
  };

  // 선택된 멤버 제거
  const handleRemoveSelectedMember = () => {
    setSelectedMember(null);
    setNewRole({ ...newRole, user_id: '' });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-message">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">리더 편집 페이지</h1>
        <button 
          className="add-role-button"
          onClick={() => setShowAddRoleForm(true)}
          disabled={availableProfiles.length === 0}
        >
          + 역할 추가
        </button>
      </div>

      {availableProfiles.length === 0 && !showAddRoleForm && (
        <div className="notice">
          모든 멤버에게 역할이 배정되었습니다.
        </div>
      )}

      {showAddRoleForm && (
        <div className="add-role-form">
          <h3 className="form-title">새 역할 추가</h3>
          
          <div className="form-group">
            <label className="label">역할 이름</label>
            <input
              className="input"
              type="text"
              value={newRole.position}
              onChange={(e) => setNewRole({ ...newRole, position: e.target.value })}
              placeholder="역할 이름을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label className="label">역할 설명</label>
            <textarea
              className="textarea"
              value={newRole.position_description}
              onChange={(e) => setNewRole({ ...newRole, position_description: e.target.value })}
              placeholder="역할에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="label">표시 순서</label>
            <input
              className="input"
              type="number"
              value={newRole.order_num}
              onChange={(e) => setNewRole({ ...newRole, order_num: parseInt(e.target.value) || 1 })}
              placeholder="표시 순서 (숫자가 낮을수록 위에 표시)"
              min="1"
            />
            <small className="input-help">숫자가 낮을수록 임원진 목록에서 위쪽에 표시됩니다.</small>
          </div>

          <div className="form-group">
            <label className="label">담당 멤버</label>
            
            {/* 선택된 멤버 표시 */}
            {selectedMember ? (
              <div className="selected-member">
                <div className="selected-member-info">
                  <span className="selected-member-name">{selectedMember.name}</span>
                  <span className="selected-member-details">({selectedMember.major} - {selectedMember.stnum})</span>
                </div>
                <button 
                  className="remove-selected-button"
                  onClick={handleRemoveSelectedMember}
                  type="button"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="member-search-container">
                  <input
                    className="search-input"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="멤버 이름으로 검색..."
                  />
                  {searchTerm && (
                    <button 
                      className="clear-search-button"
                      onClick={handleClearSearch}
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 검색 결과 멤버 목록 */}
                {searchTerm && (
                  <div className="member-search-results">
                    {filteredAvailableProfiles.length === 0 ? (
                      <div className="no-results">검색 결과가 없습니다.</div>
                    ) : (
                      <div className="member-options">
                        {filteredAvailableProfiles.slice(0, 5).map(profile => (
                          <div 
                            key={profile.id} 
                            className="member-option"
                            onClick={() => handleSelectMemberForRole(profile)}
                          >
                            <span className="member-option-name">{profile.name}</span>
                            <span className="member-option-details">({profile.major} - {profile.stnum})</span>
                          </div>
                        ))}
                        {filteredAvailableProfiles.length > 5 && (
                          <div className="more-options">
                            {filteredAvailableProfiles.length - 5}명 더 있음
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="form-actions">
            <button className="cancel-button" onClick={handleCancelAddRole}>취소</button>
            <button className="save-button" onClick={handleAddRole}>저장</button>
          </div>
        </div>
      )}

      <div className="roles-list">
        <h3 className="section-title">현재 역할</h3>
        {leaderProfiles.length === 0 ? (
          <div className="empty-state">
            추가된 역할이 없습니다. 새 역할을 추가해보세요.
          </div>
        ) : (
          leaderProfiles.map(role => {
            const profile = getProfileByUserId(role.user_id);
            return (
              <div key={role.user_id} className="role-card">
                <div className="role-header">
                  <div className="role-info">
                    <h4 className="role-name">{role.position}</h4>
                    <span className="role-order">순서: {role.order_num}</span>
                  </div>
                  <button 
                    className="remove-button"
                    onClick={() => handleRemoveRole(role.user_id)}
                  >
                    ✕
                  </button>
                </div>
                <p className="role-description">{role.position_description}</p>
                {profile && (
                  <div className="assigned-member">
                    담당자: {profile.name} ({profile.major} - {profile.stnum})
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeadereditPage;