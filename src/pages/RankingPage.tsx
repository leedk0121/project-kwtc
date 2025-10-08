import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./auth/supabaseClient";
import ProfileDetailPage from "../components/ProfileDetailPage";
import "./Rankingpage.css";

function RankingPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const tiers = [1, 2, 3, 4, 5];
    const tierRefs = useRef<(HTMLDivElement | null)[]>(Array(tiers.length).fill(null));

    // 티어별 정보 객체
    const tierInfo = {
        1: { name: 'Master', color: '#FFD700', icon: '👑', gradient: 'linear-gradient(135deg, #FFD700, #FFA500)' },
        2: { name: 'Diamond', color: '#B9F2FF', icon: '💎', gradient: 'linear-gradient(135deg, #B9F2FF, #87CEEB)' },
        3: { name: 'Platinum', color: '#E6E6FA', icon: '⭐', gradient: 'linear-gradient(135deg, #E6E6FA, #DDA0DD)' },
        4: { name: 'Gold', color: '#FFE135', icon: '🥇', gradient: 'linear-gradient(135deg, #FFE135, #DAA520)' },
        5: { name: 'Silver', color: '#C0C0C0', icon: '🥈', gradient: 'linear-gradient(135deg, #C0C0C0, #A9A9A9)' },
        0: { name: 'Terini', color: '#98FB98', icon: '🌱', gradient: 'linear-gradient(135deg, #98FB98, #90EE90)' }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase
                .from('ranked_user')
                .select('id, major, name, stnum, rank_tier, rank_detail, rank_all, image_url')
                .order('rank_tier', { ascending: true })
                .order('rank_detail', { ascending: true });
            if (!error && data) setUsers(data);
        };
        fetchUsers();
    }, []);

    const handleTierScroll = (tierIdx: number) => {
        const ref = tierRefs.current[tierIdx];
        if (ref) {
            ref.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleTeriniScroll = () => {
        const terinSection = document.querySelector('.terini-section');
        if (terinSection) {
            terinSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleMemberClick = (memberId: string) => {
        setSelectedMemberId(memberId);
    };

    const handleCloseProfile = () => {
        setSelectedMemberId(null);
    };

    const handleModalBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleCloseProfile();
        }
    };

    const getRankMedal = (rank: number) => {
        if (rank === 1) return '🥇🥇🥇';
        if (rank === 2) return '🥈🥈🥈';
        if (rank === 3) return '🥉🥉🥉';
        return null;
    };

    return (
        <div className="ranking-page">
            <div className="ranking-header">
                <h1 className="page-title">
                    <span className="title-icon">🏆</span>
                    KWTC 랭킹
                </h1>
                <p className="page-subtitle">KWTC 테니스 실력 랭킹을 확인하세요</p>
            </div>

            <div className="tier-navigation">
                <div className="nav-buttons">
                    {tiers.map((tier, idx) => (
                        <button
                            key={tier}
                            className={`tier-nav-btn tier-${tier}`}
                            onClick={() => handleTierScroll(idx)}
                        >
                            <span className="tier-icon">{tierInfo[tier as keyof typeof tierInfo].icon}</span>
                            <span className="tier-name">{tierInfo[tier as keyof typeof tierInfo].name}</span>
                        </button>
                    ))}
                    <button
                        className="tier-nav-btn tier-0"
                        onClick={handleTeriniScroll}
                    >
                        <span className="tier-icon">{tierInfo[0].icon}</span>
                        <span className="tier-name">{tierInfo[0].name}</span>
                    </button>
                </div>
            </div>

            <div className="ranking-content">
                {tiers.map((tier, idx) => (
                    <div key={tier} ref={el => { tierRefs.current[idx] = el; }} className="tier-section">
                        <div 
                            className="tier-header"
                            style={{ background: tierInfo[tier as keyof typeof tierInfo].gradient }}
                        >
                            <div className="tier-info">
                                <span className="tier-icon-large">{tierInfo[tier as keyof typeof tierInfo].icon}</span>
                                <div className="tier-text">
                                    <h2 className="tier-title">{tierInfo[tier as keyof typeof tierInfo].name}</h2>
                                    <span className="tier-subtitle">Tier {tier}</span>
                                </div>
                            </div>
                            <div className="tier-count">
                                {users.filter(u => Number(u.rank_tier) === tier && Number(u.rank_tier) !== 0).length}명
                            </div>
                        </div>

                        <div className="members-container">
                            {users.filter(u => Number(u.rank_tier) === tier && Number(u.rank_tier) !== 0).length === 0 ? (
                                <div className="empty-tier">
                                    <div className="empty-icon">😴</div>
                                    <p>로그인 하지 않으면 유저 정보가 보이지 않습니다.</p>
                                </div>
                            ) : (
                                <>
                                  {/* 상위 3위 따로 렌더링 */}
                                  {users
                                    .filter(u => Number(u.rank_tier) === tier && Number(u.rank_tier) !== 0 && u.rank_all <= 3)
                                    .length > 0 && (
                                    <div className="member-grid top-rankers">
                                      {users
                                        .filter(u => Number(u.rank_tier) === tier && Number(u.rank_tier) !== 0 && u.rank_all <= 3)
                                        .map((user, index) => (
                                          <div 
                                            key={user.id} 
                                            className="member-card top-rank"
                                            onClick={() => handleMemberClick(user.id)}
                                            style={{ cursor: 'pointer' }}
                                          >
                                            <div className="member-rank-section">
                                              {getRankMedal(user.rank_all) ? (
                                                // 1-3등은 메달만 표시
                                                <span className="rank-medal-only">{getRankMedal(user.rank_all)}</span>
                                              ) : (
                                                // 4등 이상은 기존 방식
                                                <>
                                                  <div 
                                                    className="rank-badge"
                                                    style={{ background: tierInfo[tier as keyof typeof tierInfo].gradient }}
                                                  >
                                                    <span className="rank-number">#{user.rank_all}</span>
                                                  </div>
                                                  <span className="rank-detail">({user.rank_detail})</span>
                                                </>
                                              )}
                                            </div>
                                            
                                            <div className="member-profile">
                                              <div className="profile-image-wrapper">
                                                <img
                                                  src={
                                                    user.image_url ||
                                                    "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png"
                                                  }
                                                  alt={`${user.name} 프로필`}
                                                  className="profile-image"
                                                />
                                                <div 
                                                  className="tier-indicator"
                                                  style={{ background: tierInfo[tier as keyof typeof tierInfo].color }}
                                                ></div>
                                              </div>
                                              
                                              <div className="member-info">
                                                <h3 className="member-name">{user.name}</h3>
                                                <p className="member-major">{user.major}</p>
                                                <p className="member-stnum">#{user.stnum}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      }
                                    </div>
                                  )}
                                  
                                  {/* 4위 이하 컴팩트하게 렌더링 */}
                                  {users
                                    .filter(u => Number(u.rank_tier) === tier && Number(u.rank_tier) !== 0 && u.rank_all > 3)
                                    .length > 0 && (
                                    <div className="member-grid regular-rankers">
                                      {users
                                        .filter(u => Number(u.rank_tier) === tier && Number(u.rank_tier) !== 0 && u.rank_all > 3)
                                        .map((user, index) => (
                                          <div 
                                            key={user.id} 
                                            className="member-card regular-rank"
                                            onClick={() => handleMemberClick(user.id)}
                                            style={{ cursor: 'pointer' }}
                                          >
                                            <div className="member-rank-section">
                                              <div 
                                                className="rank-badge"
                                                style={{ background: tierInfo[tier as keyof typeof tierInfo].gradient }}
                                              >
                                                <span className="rank-number">#{user.rank_all}</span>
                                              </div>
                                              <span className="rank-detail">({user.rank_detail})</span>
                                            </div>
                                            
                                            <div className="member-profile">
                                              <div className="profile-image-wrapper">
                                                <img
                                                  src={
                                                    user.image_url ||
                                                    "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png"
                                                  }
                                                  alt={`${user.name} 프로필`}
                                                  className="profile-image"
                                                />
                                                <div 
                                                  className="tier-indicator"
                                                  style={{ background: tierInfo[tier as keyof typeof tierInfo].color }}
                                                ></div>
                                              </div>
                                              
                                              <div className="member-info">
                                                <h3 className="member-name">{user.name}</h3>
                                                <p className="member-major">{user.major}</p>
                                                <p className="member-stnum">#{user.stnum}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      }
                                    </div>
                                  )}
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {/* Terini 티어 */}
                <div className="tier-section terini-section">
                    <div 
                        className="tier-header terini-header"
                        style={{ background: tierInfo[0].gradient }}
                    >
                        <div className="tier-info">
                            <span className="tier-icon-large">{tierInfo[0].icon}</span>
                            <div className="tier-text">
                                <h2 className="tier-title">{tierInfo[0].name}</h2>
                                <span className="tier-subtitle">새싹 테린이</span>
                            </div>
                        </div>
                        <div className="tier-count">
                            {users.filter(u => Number(u.rank_tier) === 0).length}명
                        </div>
                    </div>

                    <div className="members-container">
                        {users.filter(u => Number(u.rank_tier) === 0).length === 0 ? (
                            <div className="empty-tier">
                                <div className="empty-icon">🌱</div>
                                <p>새싹 테린이가 없습니다</p>
                            </div>
                        ) : (
                            <div className="member-grid">
                                {users
                                    .filter(u => Number(u.rank_tier) === 0)
                                    .map(user => (
                                        <div 
                                            key={user.id} 
                                            className="member-card terini-card regular-rank"
                                            onClick={() => handleMemberClick(user.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="member-rank-section">
                                                <div 
                                                    className="rank-badge terini-badge"
                                                    style={{ background: tierInfo[0].gradient }}
                                                >
                                                    <span className="terini-text">새싹</span>
                                                </div>
                                            </div>
                                            
                                            <div className="member-profile">
                                                <div className="profile-image-wrapper">
                                                    <img
                                                        src={
                                                            user.image_url ||
                                                            "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png"
                                                        }
                                                        alt={`${user.name} 프로필`}
                                                        className="profile-image"
                                                    />
                                                    <div 
                                                        className="tier-indicator"
                                                        style={{ background: tierInfo[0].color }}
                                                    ></div>
                                                </div>
                                                
                                                <div className="member-info">
                                                    <h3 className="member-name">{user.name}</h3>
                                                    <p className="member-major">{user.major}</p>
                                                    <p className="member-stnum">#{user.stnum}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 모달 */}
            {selectedMemberId && (
                <div 
                    className="profile-modal-overlay"
                    onClick={handleModalBackdropClick}
                >
                    <div className="profile-modal-container">
                        <button 
                            className="profile-modal-close"
                            onClick={handleCloseProfile}
                        >
                            ×
                        </button>
                        <div className="profile-modal-content">
                            <ProfileDetailPage id={selectedMemberId} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RankingPage;