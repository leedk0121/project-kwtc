import { useState, useEffect } from 'react';
import { supabase } from '../auth/supabaseClient.tsx';
import './RankeditPage.css';

function RankedEditPage() {
    const [listType, setListType] = useState<'ranked' | 'all'>('ranked');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [checkedIds, setCheckedIds] = useState<string[]>([]);
    const [tierInputs, setTierInputs] = useState<{ [id: string]: string }>({});
    const [rankInputs, setRankInputs] = useState<{ [id: string]: string }>({});

    useEffect(() => {
        if (listType === 'ranked') {
            fetchRankedUsers();
        } else if (listType === 'all') {
            fetchAllUsers();
        }
        // eslint-disable-next-line
    }, [listType]);

    const fetchRankedUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ranked_user')
            .select('id, name, major, stnum, rank_tier, rank_detail, image_url');
        if (!error && data) setUsers(data);
        setCheckedIds([]);
        setTierInputs({});
        setRankInputs({});
        setLoading(false);
    };

    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            const { data: allData, error: allError } = await supabase
                .from('profile')
                .select('id, name, age, phone, major, stnum, image_url');
            if (allError) {
                console.error('전체 유저 데이터 로딩 오류:', allError.message, allError.details);
            }
            if (!allData || allData.length === 0) {
                console.warn('전체 유저 데이터가 비어있음:', allData);
            }
            const { data: rankedData, error: rankedError } = await supabase
                .from('ranked_user')
                .select('id');
            if (rankedError) {
                console.error('랭킹 유저 데이터 로딩 오류:', rankedError.message, rankedError.details);
            }
            if (!allError && allData) setUsers(allData);
            else setUsers([]);
            if (!rankedError && rankedData) {
                setCheckedIds(rankedData.map((u: any) => u.id));
            } else {
                setCheckedIds([]);
            }
            setTierInputs({});
            setRankInputs({});
        } finally {
            setLoading(false);
        }
    };

    const handleShowRanked = () => {
        setListType('ranked');
        setSearch('');
        fetchRankedUsers();
    };
    const handleShowAll = () => {
        setListType('all');
        setSearch('');
        fetchAllUsers();
    };

    const filteredUsers = users.filter(user => {
        if (search) {
            return user.name?.toLowerCase().includes(search.toLowerCase());
        }
        if (listType === 'ranked') {
            return Number(user.rank_tier ?? 0) !== 0;
        }
        return true;
    }).sort((a, b) => {
        if (listType === 'ranked') {
            const tierA = Number(a.rank_tier ?? 0);
            const tierB = Number(b.rank_tier ?? 0);
            if (tierA !== tierB) return tierA - tierB;
            const rankA = Number(a.rank_detail ?? 0);
            const rankB = Number(b.rank_detail ?? 0);
            return rankA - rankB;
        }
        return 0;
    });

    const handleCheck = (id: string) => {
        setCheckedIds(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
    };

    const handleTierChange = (id: string, value: string) => {
        setTierInputs(prev => ({ ...prev, [id]: value }));
    };

    const handleRankChange = (id: string, value: string) => {
        setRankInputs(prev => ({ ...prev, [id]: value }));
    };

    const handleAddUsers = async () => {
        let msg = '';
        if (checkedIds.length > 0) {
            const { data: rankedData, error: rankedError } = await supabase
                .from('ranked_user')
                .select('id');
            const rankedIds = rankedData ? rankedData.map((u: any) => u.id) : [];
            const newIds = checkedIds.filter(id => !rankedIds.includes(id));
            if (newIds.length > 0) {
                const selectedRanked = filteredUsers
                    .filter(user => newIds.includes(user.id))
                    .map(user => ({
                        ...user,
                        rank_tier: tierInputs[user.id] !== undefined && tierInputs[user.id] !== '' ? tierInputs[user.id] : '0',
                        rank_detail: rankInputs[user.id] !== undefined && rankInputs[user.id] !== '' ? rankInputs[user.id] : '0'
                    }));
                const { error } = await supabase
                    .from('ranked_user')
                    .upsert(selectedRanked);
                if (error) msg += '랭킹 추가 실패: ' + error.message + '\n';
                else msg += '새로운 랭킹 유저만 추가되었습니다.\n';
            } else {
                msg += '이미 추가된 유저만 선택되어 있습니다.\n';
            }
        }
        if (msg) alert(msg.trim());
        setCheckedIds([]);
        fetchRankedUsers();
        setListType('ranked');
    };

    const handleDeleteRanked = async () => {
        if (checkedIds.length === 0) return alert('삭제할 유저를 선택하세요.');
        if (!window.confirm(`선택한 ${checkedIds.length}명을 랭킹에서 삭제하시겠습니까?`)) return;
        
        const { error } = await supabase
            .from('ranked_user')
            .delete()
            .in('id', checkedIds);
        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            alert('랭킹에서 삭제되었습니다.');
            setCheckedIds([]);
            fetchRankedUsers();
        }
    };

    const handleUpdateRanked = async () => {
        if (filteredUsers.length === 0) return;
        const selectedUsers = filteredUsers.map(user => ({
            id: user.id,
            rank_tier: tierInputs[user.id] ?? user.rank_tier ?? '',
            rank_detail: rankInputs[user.id] ?? user.rank_detail ?? ''
        }));
        const { error } = await supabase
            .from('ranked_user')
            .upsert(selectedUsers, { onConflict: ['id'] });
        if (error) {
            alert('수정 실패: ' + error.message);
        } else {
            alert('랭킹이 수정되었습니다.');
            setCheckedIds([]);
            fetchRankedUsers();
            await handleSaveAllRank();
        }
    };

    const handleSaveAllRank = async () => {
        const preprocessed = users.map(user => {
            if (Number(user.rank_tier ?? 0) === 0) {
                return { ...user, rank_tier: 99 };
            }
            return { ...user };
        });
        const sorted = [...preprocessed]
            .sort((a, b) => {
                const tierA = Number(a.rank_tier ?? 0);
                const tierB = Number(b.rank_tier ?? 0);
                if (tierA !== tierB) return tierA - tierB;
                const rankA = Number(a.rank_detail ?? 0);
                const rankB = Number(b.rank_detail ?? 0);
                return rankA - rankB;
            });

        const rankAll = sorted.map((user, idx) => ({
            id: user.id,
            rank_all: idx + 1
        }));

        const { error } = await supabase
            .from('ranked_user')
            .upsert(rankAll, { onConflict: ['id'] });
        if (error) {
            alert('전체 랭킹 저장 실패: ' + error.message);
        } else {
            alert('전체 랭킹이 저장되었습니다.');
        }
    };

    const handleRefreshRankedProfiles = async () => {
        setLoading(true);
        const rankedIds = users.map(u => u.id);
        if (rankedIds.length === 0) {
            setLoading(false);
            return;
        }
        const { data: profileData, error } = await supabase
            .from('profile')
            .select('id, name, major, stnum, image_url')
            .in('id', rankedIds);
        if (error || !profileData) {
            alert('프로필 데이터 불러오기 실패: ' + error?.message);
            setLoading(false);
            return;
        }
        const updatedUsers = users.map(user => {
            const profile = profileData.find((p: any) => p.id === user.id);
            return {
                ...user,
                name: profile?.name ?? user.name,
                major: profile?.major ?? user.major,
                stnum: profile?.stnum ?? user.stnum,
                image_url: profile?.image_url ?? user.image_url,
            };
        });
        const { error: upsertError } = await supabase
            .from('ranked_user')
            .upsert(updatedUsers, { onConflict: ['id'] });
        if (upsertError) {
            alert('랭킹 멤버 정보 업데이트 실패: ' + upsertError.message);
        } else {
            alert('랭킹 멤버 정보가 새로고침되었습니다.');
            fetchRankedUsers();
        }
        setLoading(false);
    };

    return (
        <div className='rank-edit-rankedit-container'>
            <div className="rank-edit-rankedit-header">
                <h1 className="rank-edit-rankedit-title">📊 랭킹 관리</h1>
                <p className="rank-edit-rankedit-subtitle">총 {filteredUsers.length}명</p>
            </div>

            <div className="rank-edit-rankedit-notice">
                💡 데이터가 표시되지 않으면 '전체 유저'를 클릭 후 다시 '랭킹 유저'를 클릭해주세요.
            </div>

            <div className="rank-edit-rankedit-controls">
                <div className="rank-edit-view-buttons">
                    <button 
                        onClick={handleShowRanked}
                        className={`rank-edit-view-btn ${listType === 'ranked' ? 'active' : ''}`}
                    >
                        🏆 랭킹 유저
                    </button>
                    <button 
                        onClick={handleShowAll}
                        className={`rank-edit-view-btn ${listType === 'all' ? 'active' : ''}`}
                    >
                        👥 전체 유저
                    </button>
                    <button 
                        onClick={handleRefreshRankedProfiles}
                        className="rank-edit-refresh-btn"
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
                    {listType === 'all' && (
                        <button onClick={handleAddUsers} className="rank-edit-action-btn rank-edit-add-btn">
                            ➕ 추가 ({checkedIds.length})
                        </button>
                    )}
                    {listType === 'ranked' && (
                        <>
                            <button onClick={handleUpdateRanked} className="rank-edit-action-btn rank-edit-save-btn">
                                💾 저장
                            </button>
                            <button 
                                onClick={handleDeleteRanked} 
                                className="rank-edit-action-btn rank-edit-delete-btn"
                                disabled={checkedIds.length === 0}
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
                    {filteredUsers.length > 0 && (
                        <div className={`rank-edit-list-header ${listType}`}>
                            <span className="rank-edit-header-profile">프로필 정보</span>
                            {listType === 'all' && (
                                <span className="rank-edit-header-check">추가</span>
                            )}
                            {listType === 'ranked' && (
                                <>
                                    <span className="rank-edit-header-tier-rank"></span>
                                    <span className="rank-edit-header-check">선택</span>
                                </>
                            )}
                        </div>
                    )}
                    <ul className="rank-edit-user-list">
                        {filteredUsers.length === 0 ? (
                            <li className="rank-edit-empty-state">데이터가 없습니다.</li>
                        ) : (
                            filteredUsers.map((user, index) => (
                                <li key={user.id} className={`rank-edit-user-item ${checkedIds.includes(user.id) ? 'selected' : ''}`}>
                                    {listType === 'ranked' && (
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
                                    {listType === 'ranked' && (
                                        <>
                                            <div className="rank-edit-user-tier-rank">
                                                <div className="rank-edit-user-tier">
                                                    <label>티어:</label>
                                                    <input
                                                        type="number"
                                                        placeholder="티어"
                                                        value={tierInputs[user.id] ?? user.rank_tier ?? ''}
                                                        onChange={e => handleTierChange(user.id, e.target.value)}
                                                    />
                                                </div>
                                                <div className="rank-edit-user-rank">
                                                    <label>티어 내 랭킹:</label>
                                                    <input
                                                        type="number"
                                                        placeholder="랭킹"
                                                        value={rankInputs[user.id] ?? user.rank_detail ?? ''}
                                                        onChange={e => handleRankChange(user.id, e.target.value)}
                                                    />
                                                </div>
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
                                    {listType === 'all' && (
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
                            ))
                        )}
                    </ul>
                </>
            )}
        </div>
    );
}

export default RankedEditPage;