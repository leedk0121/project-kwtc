import { useState, useMemo, useEffect } from 'react';
import { withAdminAuth } from '../../services/adminHOC';
import { AdminLayout } from './components/AdminLayout';
import { useRankedUsers, RankedUser } from './hooks/useRankedUsers';
import '../Admin/styles/admin-shared.css';
import './RankeditPage.css';

function RankedEditPage() {
  const [search, setSearch] = useState('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [tierInputs, setTierInputs] = useState<Record<string, string>>({});
  const [rankInputs, setRankInputs] = useState<Record<string, string>>({});
  const [raketInputs, setRaketInputs] = useState<Record<string, string>>({});

  const {
    users,
    loading,
    mode,
    rankedIds,
    fetchRankedUsers,
    fetchAllUsers,
    addUsersToRanking,
    deleteFromRanking,
    updateRankings,
    calculateAndSaveAllRanks,
    refreshProfileData
  } = useRankedUsers();

  useEffect(() => {
    fetchRankedUsers();
  }, [fetchRankedUsers]);

  const sortedAndFiltered = useMemo(() => {
    let filtered = users;

    if (search) {
      filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (mode === 'ranked') {
      return filtered.sort((a, b) => {
        const tierA = a.rank_tier;
        const tierB = b.rank_tier;

        if (tierA === null && tierB !== null) return -1;
        if (tierA !== null && tierB === null) return 1;
        if (tierA === null && tierB === null) return 0;

        const tierNumA = Number(tierA);
        const tierNumB = Number(tierB);

        if (tierNumA === 0 && tierNumB !== 0) return 1;
        if (tierNumA !== 0 && tierNumB === 0) return -1;

        if (tierNumA !== tierNumB) return tierNumA - tierNumB;

        const rankA = Number(a.rank_detail ?? 0);
        const rankB = Number(b.rank_detail ?? 0);
        return rankA - rankB;
      });
    }

    return filtered;
  }, [users, search, mode]);

  const handleModeChange = async (newMode: 'ranked' | 'all') => {
    setSearch('');
    setCheckedIds([]);
    setTierInputs({});
    setRankInputs({});
    setRaketInputs({});

    if (newMode === 'ranked') {
      await fetchRankedUsers();
    } else {
      await fetchAllUsers();
    }
  };

  const handleCheck = (id: string) => {
    setCheckedIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleAddUsers = async () => {
    if (checkedIds.length === 0) {
      alert('추가할 사용자를 선택하세요.');
      return;
    }

    const result = await addUsersToRanking(checkedIds, tierInputs, rankInputs);
    alert(result.message);

    if (result.success) {
      setCheckedIds([]);
      await fetchRankedUsers();
    }
  };

  const handleDeleteRanked = async () => {
    if (checkedIds.length === 0) {
      alert('삭제할 사용자를 선택하세요.');
      return;
    }

    if (!window.confirm(`선택한 ${checkedIds.length}명을 랭킹에서 삭제하시겠습니까?`)) {
      return;
    }

    const result = await deleteFromRanking(checkedIds);
    alert(result.message);

    if (result.success) {
      setCheckedIds([]);
      await fetchRankedUsers();
    }
  };

  const handleUpdateRanked = async () => {
    const updates = sortedAndFiltered.map((user, idx) => ({
      id: user.id,
      rank_tier: tierInputs[user.id] ?? user.rank_tier ?? '',
      rank_detail: rankInputs[user.id] ?? user.rank_detail ?? '',
      ...(idx < 3 && {
        raket: raketInputs[user.id] !== undefined
          ? raketInputs[user.id]
          : user.raket ?? 'none'
      })
    }));

    const result = await updateRankings(updates);
    alert(result.message);

    if (result.success) {
      const rankResult = await calculateAndSaveAllRanks(sortedAndFiltered);
      alert(rankResult.message);

      setCheckedIds([]);
      await fetchRankedUsers();
    }
  };

  const handleRefresh = async () => {
    const result = await refreshProfileData(users);
    alert(result.message);

    if (result.success) {
      await fetchRankedUsers();
    }
  };

  const renderUserItem = (user: RankedUser, index: number) => (
    <li
      key={user.id}
      className={`rank-edit-user-item ${checkedIds.includes(user.id) ? 'selected' : ''}`}
    >
      {mode === 'ranked' && (
        <div className="rank-edit-rank-number">{index + 1}</div>
      )}

      <div className="rank-edit-user-profile">
        <img
          src={user.image_url || "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png"}
          alt="프로필"
          className="rank-edit-profile-image"
        />
        <div className="rank-edit-user-profile-info">
          <div className="rank-edit-user-name">{user.name}</div>
          <div className="rank-edit-user-details">{user.major} ({user.stnum})</div>
        </div>
      </div>

      {mode === 'ranked' && (
        <>
          <div className="rank-edit-user-tier-rank">
            <div className="rank-edit-user-tier">
              <label>티어:</label>
              <input
                type="number"
                placeholder="티어"
                value={tierInputs[user.id] ?? user.rank_tier ?? ''}
                onChange={e => setTierInputs(prev => ({ ...prev, [user.id]: e.target.value }))}
              />
            </div>
            <div className="rank-edit-user-rank">
              <label>티어 내 랭킹:</label>
              <input
                type="number"
                placeholder="랭킹"
                value={rankInputs[user.id] ?? user.rank_detail ?? ''}
                onChange={e => setRankInputs(prev => ({ ...prev, [user.id]: e.target.value }))}
              />
            </div>
            {index < 3 && (
              <div className="rank-edit-user-raket">
                <label>라켓:</label>
                <select
                  value={raketInputs[user.id] ?? user.raket ?? 'none'}
                  onChange={e => setRaketInputs(prev => ({ ...prev, [user.id]: e.target.value }))}
                >
                  <option value="none">none</option>
                  <option value="yonex">yonex</option>
                  <option value="wilson">wilson</option>
                  <option value="head">head</option>
                  <option value="babolat">babolat</option>
                </select>
              </div>
            )}
          </div>
          <div className="rank-edit-user-check-top">
            <input
              type="checkbox"
              checked={checkedIds.includes(user.id)}
              onChange={() => handleCheck(user.id)}
              id={`check-${user.id}`}
            />
            <label htmlFor={`check-${user.id}`}></label>
          </div>
        </>
      )}

      {mode === 'all' && (
        <div className="rank-edit-user-check">
          <input
            type="checkbox"
            checked={checkedIds.includes(user.id)}
            onChange={() => handleCheck(user.id)}
            id={`check-${user.id}`}
          />
          <label htmlFor={`check-${user.id}`}></label>
        </div>
      )}
    </li>
  );

  return (
    <AdminLayout title="📊 랭킹 관리" subtitle={`총 ${sortedAndFiltered.length}명`}>
      <div className="rank-edit-rankedit-notice">
        💡 테린이 티어의 티어값은 0 입니다. <br />
        💡 라켓 브랜드는 저장할때마다 선택해야합니다.
      </div>

      <div className="rank-edit-rankedit-controls">
        <div className="rank-edit-view-buttons">
          <button
            onClick={() => handleModeChange('ranked')}
            className={`rank-edit-view-btn ${mode === 'ranked' ? 'active' : ''}`}
          >
            🏆 랭킹 유저
          </button>
          <button
            onClick={() => handleModeChange('all')}
            className={`rank-edit-view-btn ${mode === 'all' ? 'active' : ''}`}
          >
            👥 전체 유저
          </button>
          <button
            onClick={handleRefresh}
            className="rank-edit-refresh-btn"
            disabled={loading}
          >
            🔄 새로고침
          </button>
        </div>

        <div className="rank-edit-action-row">
          <input
            type="text"
            placeholder="유저 이름 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rank-edit-search-input"
          />
          {mode === 'all' && (
            <button
              onClick={handleAddUsers}
              className="rank-edit-action-btn rank-edit-add-btn"
              disabled={loading}
            >
              ➕ 추가 ({checkedIds.length})
            </button>
          )}
          {mode === 'ranked' && (
            <>
              <button
                onClick={handleUpdateRanked}
                className="rank-edit-action-btn rank-edit-save-btn"
                disabled={loading}
              >
                💾 저장
              </button>
              <button
                onClick={handleDeleteRanked}
                className="rank-edit-action-btn rank-edit-delete-btn"
                disabled={checkedIds.length === 0 || loading}
              >
                🗑️ 삭제 ({checkedIds.length})
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rank-edit-loading-message">랭킹 정보를 불러오는 중...</div>
      ) : (
        <>
          {sortedAndFiltered.length > 0 && (
            <div className={`rank-edit-list-header ${mode}`}>
              <span className="rank-edit-header-profile">프로필 정보</span>
              {mode === 'all' && (
                <span className="rank-edit-header-check">추가</span>
              )}
              {mode === 'ranked' && (
                <>
                  <span className="rank-edit-header-tier-rank"></span>
                  <span className="rank-edit-header-check">선택</span>
                </>
              )}
            </div>
          )}
          <ul className="rank-edit-user-list">
            {sortedAndFiltered.length === 0 ? (
              <li className="rank-edit-empty-state">데이터가 없습니다.</li>
            ) : (
              sortedAndFiltered.map((user, index) => renderUserItem(user, index))
            )}
          </ul>
        </>
      )}
    </AdminLayout>
  );
}

export default withAdminAuth(RankedEditPage);
