import React, { useState, useEffect, useMemo } from 'react';
import { withAdminAuth } from '../../services/adminHOC';
import { useLeaderProfiles } from './hooks';
import { AdminLayout } from './components';
import type { Profile } from './hooks/useLeaderProfiles';
import './LeadereditPage.css';

const LeadereditPage: React.FC = () => {
  const {
    profiles,
    leaderProfiles,
    loading,
    fetchAll,
    addLeaderRole,
    removeLeaderRole,
    getAvailableProfiles,
    getLeaderProfilesWithDetails
  } = useLeaderProfiles();

  const [showAddRoleForm, setShowAddRoleForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState({
    position: '',
    position_description: '',
    order_num: 1
  });

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const availableProfiles = useMemo(() => getAvailableProfiles(), [getAvailableProfiles]);

  const filteredAvailableProfiles = useMemo(() => {
    return availableProfiles.filter(profile =>
      profile.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableProfiles, searchTerm]);

  const leaderProfilesWithDetails = useMemo(() =>
    getLeaderProfilesWithDetails(),
    [getLeaderProfilesWithDetails]
  );

  const handleAddRole = async () => {
    if (!selectedMember) {
      alert('담당 멤버를 선택해주세요.');
      return;
    }

    if (!newRole.position.trim() || !newRole.position_description.trim()) {
      alert('역할 이름과 설명을 모두 입력해주세요.');
      return;
    }

    const result = await addLeaderRole(
      selectedMember.id,
      newRole.position,
      newRole.position_description,
      newRole.order_num
    );

    if (result.success) {
      setNewRole({ position: '', position_description: '', order_num: 1 });
      setSelectedMember(null);
      setSearchTerm('');
      setShowAddRoleForm(false);
    } else {
      alert(result.message || '역할 추가 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveRole = async (userId: string) => {
    const result = await removeLeaderRole(userId);
    if (!result.success) {
      alert(result.message || '역할 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCancelAddRole = () => {
    setNewRole({ position: '', position_description: '', order_num: 1 });
    setSelectedMember(null);
    setSearchTerm('');
    setShowAddRoleForm(false);
  };

  const handleSelectMemberForRole = (member: Profile) => {
    setSelectedMember(member);
    setSearchTerm('');
  };

  const handleRemoveSelectedMember = () => {
    setSelectedMember(null);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="leader-edit-container">
        <div className="leader-edit-loading-message">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="리더 편집 페이지"
      backPath="/admin"
      actions={
        <button
          className="leader-edit-add-role-button"
          onClick={() => setShowAddRoleForm(true)}
          disabled={availableProfiles.length === 0}
        >
          + 역할 추가
        </button>
      }
    >
      {availableProfiles.length === 0 && !showAddRoleForm && (
        <div className="leader-edit-notice">
          모든 멤버에게 역할이 배정되었습니다.
        </div>
      )}

      {showAddRoleForm && (
        <div className="leader-edit-add-role-form">
          <h3 className="leader-edit-form-title">새 역할 추가</h3>

          <div className="leader-edit-form-group">
            <label className="leader-edit-label">역할 이름</label>
            <input
              className="leader-edit-input"
              type="text"
              value={newRole.position}
              onChange={(e) => setNewRole({ ...newRole, position: e.target.value })}
              placeholder="역할 이름을 입력하세요"
            />
          </div>

          <div className="leader-edit-form-group">
            <label className="leader-edit-label">역할 설명</label>
            <textarea
              className="leader-edit-textarea"
              value={newRole.position_description}
              onChange={(e) => setNewRole({ ...newRole, position_description: e.target.value })}
              placeholder="역할에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="leader-edit-form-group">
            <label className="leader-edit-label">표시 순서</label>
            <input
              className="leader-edit-input"
              type="number"
              value={newRole.order_num}
              onChange={(e) => setNewRole({ ...newRole, order_num: parseInt(e.target.value) || 1 })}
              placeholder="표시 순서 (숫자가 낮을수록 위에 표시)"
              min="1"
            />
            <small className="leader-edit-input-help">숫자가 낮을수록 임원진 목록에서 위쪽에 표시됩니다.</small>
          </div>

          <div className="leader-edit-form-group">
            <label className="leader-edit-label">담당 멤버</label>

            {selectedMember ? (
              <div className="leader-edit-selected-member">
                <div className="leader-edit-selected-member-info">
                  <span className="leader-edit-selected-member-name">{selectedMember.name}</span>
                  <span className="leader-edit-selected-member-details">({selectedMember.major} - {selectedMember.stnum})</span>
                </div>
                <button
                  className="leader-edit-remove-selected-button"
                  onClick={handleRemoveSelectedMember}
                  type="button"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="leader-edit-member-search-container">
                  <input
                    className="leader-edit-search-input"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="멤버 이름으로 검색..."
                  />
                  {searchTerm && (
                    <button
                      className="leader-edit-clear-search-button"
                      onClick={handleClearSearch}
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {searchTerm && (
                  <div className="leader-edit-member-search-results">
                    {filteredAvailableProfiles.length === 0 ? (
                      <div className="leader-edit-no-results">검색 결과가 없습니다.</div>
                    ) : (
                      <div className="leader-edit-member-options">
                        {filteredAvailableProfiles.slice(0, 5).map(profile => (
                          <div
                            key={profile.id}
                            className="leader-edit-member-option"
                            onClick={() => handleSelectMemberForRole(profile)}
                          >
                            <span className="leader-edit-member-option-name">{profile.name}</span>
                            <span className="leader-edit-member-option-details">({profile.major} - {profile.stnum})</span>
                          </div>
                        ))}
                        {filteredAvailableProfiles.length > 5 && (
                          <div className="leader-edit-more-options">
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

          <div className="leader-edit-form-actions">
            <button className="leader-edit-cancel-button" onClick={handleCancelAddRole}>취소</button>
            <button className="leader-edit-save-button" onClick={handleAddRole}>저장</button>
          </div>
        </div>
      )}

      <div className="leader-edit-roles-list">
        <h3 className="leader-edit-section-title">현재 역할</h3>
        {leaderProfilesWithDetails.length === 0 ? (
          <div className="leader-edit-empty-state">
            추가된 역할이 없습니다. 새 역할을 추가해보세요.
          </div>
        ) : (
          leaderProfilesWithDetails.map(({ user_id, position, position_description, order_num, profile }) => (
            <div key={user_id} className="leader-edit-role-card">
              <div className="leader-edit-role-header">
                <div className="leader-edit-role-info">
                  <h4 className="leader-edit-role-name">{position}</h4>
                  <span className="leader-edit-role-order">순서: {order_num}</span>
                </div>
                <button
                  className="leader-edit-remove-button"
                  onClick={() => handleRemoveRole(user_id)}
                >
                  ✕
                </button>
              </div>
              <p className="leader-edit-role-description">{position_description}</p>
              {profile && (
                <div className="leader-edit-assigned-member">
                  담당자: {profile.name} ({profile.major} - {profile.stnum})
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default withAdminAuth(LeadereditPage);
