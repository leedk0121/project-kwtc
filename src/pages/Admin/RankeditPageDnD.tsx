import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { withAdminAuth } from '../../services/adminHOC';
import { AdminLayout } from './components/AdminLayout';
import { useRankedUsers, RankedUser } from './hooks/useRankedUsers';
import { supabase } from '../Auth/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SortableUserCard } from './components/SortableUserCard';
import { TIER_OPTIONS } from '../Event/utils';
import '../Admin/styles/admin-shared.css';
import './RankeditPageDnD.css';

function RankeditPageDnD() {
  const { users: allUsers, loading, fetchRankedUsers } = useRankedUsers();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [usersByTier, setUsersByTier] = useState<Record<number, RankedUser[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchRankedUsers();
  }, [fetchRankedUsers]);

  // 티어별로 유저 분류
  useEffect(() => {
    const grouped: Record<number, RankedUser[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      0: [], // Bronze (테린이)
    };

    allUsers.forEach(user => {
      const tier = Number(user.rank_tier ?? 0);
      if (grouped[tier]) {
        grouped[tier].push(user);
      }
    });

    // 각 티어 내에서 rank_detail로 정렬
    Object.keys(grouped).forEach(tierKey => {
      const tier = Number(tierKey);
      grouped[tier].sort((a, b) => {
        const rankA = Number(a.rank_detail ?? 999);
        const rankB = Number(b.rank_detail ?? 999);
        return rankA - rankB;
      });
    });

    setUsersByTier(grouped);
  }, [allUsers]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 티어 컨테이너로 드래그하는 경우
    if (overId.startsWith('tier-')) {
      const targetTier = Number(overId.replace('tier-', ''));

      // 현재 유저가 어느 티어에 있는지 찾기
      let sourceTier: number | null = null;
      let userIndex = -1;

      for (const [tier, users] of Object.entries(usersByTier)) {
        const index = users.findIndex(u => u.id === activeId);
        if (index !== -1) {
          sourceTier = Number(tier);
          userIndex = index;
          break;
        }
      }

      if (sourceTier === null || userIndex === -1) return;
      if (sourceTier === targetTier) return; // 같은 티어면 무시

      setUsersByTier(prev => {
        const newState = { ...prev };
        const [movedUser] = newState[sourceTier!].splice(userIndex, 1);
        newState[targetTier] = [...newState[targetTier], movedUser];
        return newState;
      });
      return;
    }

    // 유저 카드 위로 드래그하는 경우 (순서 변경)
    const activeUser = findUser(activeId);
    const overUser = findUser(overId);

    if (!activeUser || !overUser) return;

    const activeTier = Number(activeUser.rank_tier ?? 0);
    const overTier = Number(overUser.rank_tier ?? 0);

    if (activeTier !== overTier) {
      // 다른 티어로 이동
      setUsersByTier(prev => {
        const newState = { ...prev };
        const activeIndex = newState[activeTier].findIndex(u => u.id === activeId);
        const overIndex = newState[overTier].findIndex(u => u.id === overId);

        if (activeIndex === -1) return prev;

        const [movedUser] = newState[activeTier].splice(activeIndex, 1);
        const insertIndex = overIndex === -1 ? newState[overTier].length : overIndex;
        newState[overTier].splice(insertIndex, 0, movedUser);

        return newState;
      });
    } else {
      // 같은 티어 내 순서 변경
      setUsersByTier(prev => {
        const newState = { ...prev };
        const tier = activeTier;
        const oldIndex = newState[tier].findIndex(u => u.id === activeId);
        const newIndex = newState[tier].findIndex(u => u.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          newState[tier] = arrayMove(newState[tier], oldIndex, newIndex);
        }

        return newState;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
  };

  const findUser = (userId: string): RankedUser | null => {
    for (const users of Object.values(usersByTier)) {
      const user = users.find(u => u.id === userId);
      if (user) return user;
    }
    return null;
  };

  const handleSave = async () => {
    if (!window.confirm('변경사항을 저장하시겠습니까?')) return;

    try {
      const updates: any[] = [];
      let globalRank = 1;

      // 티어 순서대로 처리 (1 → 2 → 3 → 4 → 5 → 6 → 0)
      const tierOrder = [1, 2, 3, 4, 5, 6, 0];

      for (const tier of tierOrder) {
        const users = usersByTier[tier] || [];
        users.forEach((user, index) => {
          updates.push({
            id: user.id,
            rank_tier: tier,
            rank_detail: index + 1,
            rank_all: tier === 0 ? null : globalRank++, // Bronze는 전체 랭킹 null
          });
        });
      }

      const { error } = await supabase
        .from('ranked_user')
        .upsert(updates, { onConflict: ['id'] });

      if (error) throw error;

      alert('✅ 랭킹이 성공적으로 저장되었습니다!');
      await fetchRankedUsers();
    } catch (error: any) {
      console.error('랭킹 저장 오류:', error);
      alert('❌ 저장 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleReset = () => {
    if (!window.confirm('변경사항을 취소하고 다시 불러오시겠습니까?')) return;
    fetchRankedUsers();
  };

  if (loading) {
    return (
      <AdminLayout title="🎯 랭킹 순위 관리" subtitle="로딩 중...">
        <LoadingSpinner message="랭킹 정보를 불러오는 중..." />
      </AdminLayout>
    );
  }

  const getTierLabel = (tier: number) => {
    if (tier === 0) return { label: 'Bronze (테린이)', color: '#CD7F32' };
    const tierOption = TIER_OPTIONS.find(t => t.value === tier);
    const colors: Record<number, string> = {
      1: '#B9F2FF',
      2: '#d1b3ff',
      3: '#50C878',
      4: '#FFE135',
      5: '#C0C0C0',
      6: '#CD7F32',
    };
    return { label: tierOption?.label || `Tier ${tier}`, color: colors[tier] || '#ccc' };
  };

  const activeUser = activeId ? findUser(activeId) : null;

  return (
    <AdminLayout
      title="🎯 랭킹 순위 관리"
      subtitle="카드를 드래그하여 티어와 순위를 변경하세요"
    >
      <div className="dnd-rankedit-container">
        <div className="dnd-rankedit-notice">
          💡 <strong>사용법:</strong> 유저 카드를 드래그하여 다른 티어로 이동하거나, 같은 티어 내에서 순서를 변경하세요.
          <br />
          💡 변경 후 반드시 <strong>저장</strong> 버튼을 눌러주세요!
        </div>

        <div className="dnd-rankedit-actions">
          <button onClick={handleSave} className="dnd-save-btn">
            💾 저장
          </button>
          <button onClick={handleReset} className="dnd-reset-btn">
            🔄 초기화
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="dnd-tier-grid">
            {[1, 2, 3, 4, 5, 6, 0].map(tier => {
              const tierInfo = getTierLabel(tier);
              const users = usersByTier[tier] || [];

              return (
                <div
                  key={tier}
                  className="dnd-tier-container"
                  style={{ borderColor: tierInfo.color }}
                >
                  <div
                    className="dnd-tier-header"
                    style={{ background: tierInfo.color }}
                  >
                    <h3>{tierInfo.label}</h3>
                    <span className="dnd-tier-count">{users.length}명</span>
                  </div>

                  <div
                    id={`tier-${tier}`}
                    className="dnd-tier-dropzone"
                    style={{
                      minHeight: users.length === 0 ? '200px' : '50px',
                    }}
                  >
                    {users.length === 0 ? (
                      <div className="dnd-empty-tier">
                        빈 티어 - 여기에 드롭하세요
                      </div>
                    ) : (
                      <SortableContext
                        items={users.map(u => u.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {users.map((user, index) => (
                          <SortableUserCard
                            key={user.id}
                            user={user}
                            index={index}
                            tierColor={tierInfo.color}
                          />
                        ))}
                      </SortableContext>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeUser ? (
              <div className="dnd-user-card dragging">
                <div className="dnd-user-rank">#{activeUser.rank_all || '?'}</div>
                <img
                  src={activeUser.image_url || 'https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png'}
                  alt={activeUser.name}
                  className="dnd-user-image"
                />
                <div className="dnd-user-info">
                  <div className="dnd-user-name">{activeUser.name}</div>
                  <div className="dnd-user-details">
                    {activeUser.major} ({activeUser.stnum})
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(RankeditPageDnD);
