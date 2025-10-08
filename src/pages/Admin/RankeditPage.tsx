import { useState, useEffect } from 'react';
import { supabase } from '../auth/supabaseClient.tsx';
import './RankeditPage.tsx';

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
        setLoading(false); // 즉시 false로 변경
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

    const filteredUsers = users.filter(user => user.tier !== 0)
        .sort((a, b) => {
            // 티어 오름차순
            const tierA = Number(a.rank_tier ?? 0);
            const tierB = Number(b.rank_tier ?? 0);
            if (tierA !== tierB) return tierA - tierB;
            // 티어가 같으면 랭킹 오름차순
            const rankA = Number(a.rank_detail ?? 0);
            const rankB = Number(b.rank_detail ?? 0);
            return rankA - rankB;
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

    // 추가 버튼 클릭 시 체크된 유저를 랭킹 유저에 추가
    const handleAddUsers = async () => {
        let msg = '';
        // 랭킹 유저 추가
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

    // 삭제 버튼 클릭 시 체크된 유저를 ranked_user에서 삭제
    const handleDeleteRanked = async () => {
        if (checkedIds.length === 0) return;
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

    // 랭킹 유저 티어/랭킹 수정 함수: 체크박스와 상관없이 전체 수정
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
            // 수정 후 전체 랭킹 자동 저장
            await handleSaveAllRank();
        }
    };

    // 전체 랭킹 저장 함수는 버튼 없이 그대로 사용
    const handleSaveAllRank = async () => {
        // 티어가 0인 경우 rank_tier를 99로 미리 설정
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
                if (tierA !== tierB) return tierA - tierB; // 티어 낮은 순
                const rankA = Number(a.rank_detail ?? 0);
                const rankB = Number(b.rank_detail ?? 0);
                return rankA - rankB; // 티어 내 랭킹 낮은 순
            });

        const rankAll = sorted.map((user, idx) => ({
            id: user.id,
            rank_all: idx + 1 // 티어가 99인 경우에도 순서대로 랭킹 부여
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

    // 랭킹 멤버 정보 새로고침
    const handleRefreshRankedProfiles = async () => {
        setLoading(true);
        // 1. 현재 랭킹유저 id 목록
        const rankedIds = users.map(u => u.id);
        if (rankedIds.length === 0) {
            setLoading(false);
            return;
        }
        // 2. profile 테이블에서 최신 정보 가져오기
        const { data: profileData, error } = await supabase
            .from('profile')
            .select('id, name, major, stnum, image_url')
            .in('id', rankedIds);
        if (error || !profileData) {
            alert('프로필 데이터 불러오기 실패: ' + error?.message);
            setLoading(false);
            return;
        }
        // 3. 기존 티어/랭킹 유지하며 병합
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
        // 4. ranked_user 테이블에 업데이트
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
        <div className='Rankedit-ctn'>
            <div className="Rankedit-title">
                <h2>랭킹 수정</h2>
            </div>
            <p>*데이터 없음이라고 뜰 경우 전체 유저보기를 눌렀다가 다시 랭킹유저 보기를 눌러주세요</p>
            <div className="rankedit-btn-row">
                <button onClick={handleShowRanked}>랭킹 유저</button>
                <button onClick={handleShowAll}>전체 유저</button>
                <button onClick={handleRefreshRankedProfiles}>새로고침</button>
            </div>
            {/* 검색 및 액션 버튼은 랭킹/전체 유저 보기에서만 */}
            {(listType === 'all' || listType === 'ranked') && (
                <div className="rankedit-search-row">
                    <input
                        type="text"
                        placeholder="유저 이름 검색"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {listType === 'all' && (
                        <button onClick={handleAddUsers}>추가</button>
                    )}
                    {listType === 'ranked' && (
                        <>
                            <button onClick={handleUpdateRanked}>저장</button>
                            <button onClick={handleDeleteRanked}>삭제</button>
                        </>
                    )}
                </div>
            )}
            {loading ? (
                <div className="loading-text">로딩중...</div>
            ) : (
                // 랭킹/전체 유저 보기일 때만 헤더와 리스트 렌더링
                <>
                    {filteredUsers.length > 0 && (
                        <div className={`member-edit-header ${listType}`}>
                            <span className="profile-info">프로필 정보</span>
                            {listType === 'all' && (
                                <span className="ranked-checkbox">랭킹 유저</span>
                            )}
                            {listType === 'ranked' && (
                                <>
                                    <span className="tier-input">티어</span>
                                    <span className="rank-input">랭킹</span>
                                    <span className="select-checkbox">선택</span>
                                </>
                            )}
                        </div>
                    )}
                    <ul className="member-edit-list">
                        {filteredUsers.length === 0 ? (
                            <li className="no-data">데이터가 없습니다.</li>
                        ) : (
                            filteredUsers.map(user => (
                                <li key={user.id} className="member-edit-item">
                                    <span className="profile-info">
                                        <img
                                            src={user.image_url
                                                ? user.image_url
                                                : "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png"
                                            }
                                            alt="프로필"
                                            className="profile-img"
                                        />
                                        <span>
                                            <div className="user-name">{user.name}</div>
                                            <div className="user-major">{user.major} ({user.stnum})</div>
                                        </span>
                                    </span>
                                    {listType === 'all' && (
                                        <span id={`ranked-checkbox-${user.id}`} className="ranked-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={checkedIds.includes(user.id)}
                                                onChange={() => handleCheck(user.id)}
                                                title="랭킹 유저에 추가"
                                            />
                                        </span>
                                    )}
                                    {listType === 'ranked' && (
                                        <>
                                            <span id={`tier-input-${user.id}`} className="tier-input">
                                                <input
                                                    type="text"
                                                    placeholder="티어"
                                                    value={tierInputs[user.id] ?? user.rank_tier ?? ''}
                                                    onChange={e => handleTierChange(user.id, e.target.value)}
                                                />
                                            </span>
                                            <span id={`rank-input-${user.id}`} className="rank-input">
                                                <input
                                                    type="text"
                                                    placeholder="랭킹"
                                                    value={rankInputs[user.id] ?? user.rank_detail ?? ''}
                                                    onChange={e => handleRankChange(user.id, e.target.value)}
                                                />
                                            </span>
                                            <span id={`select-checkbox-${user.id}`} className="select-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={checkedIds.includes(user.id)}
                                                    onChange={() => handleCheck(user.id)}
                                                    title="랭킹 유저 선택"
                                                />
                                            </span>
                                        </>
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