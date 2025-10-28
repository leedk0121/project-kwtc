import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./auth/supabaseClient";
import ProfileDetailPage from "../components/ProfileDetailPage";
import "./Rankingpage.css";

function RankingPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const tiers = [1, 2, 3, 4, 5];
    const tierRefs = useRef<(HTMLDivElement | null)[]>(Array(tiers.length).fill(null));

    // 티어별 정보 객체 (아이콘 경로를 public 폴더 기준으로 지정)
    const tierInfo = {
        1: { name: 'Challenger', color: '#B9F2FF', icon: '/rank-tier-icon/tier_challenger.png', gradient: 'linear-gradient(135deg, #B9F2FF, #87CEEB)' },
        2: { name: 'Master', color: '#d1b3ff', icon: '/rank-tier-icon/tier_master.png', gradient: 'linear-gradient(135deg, #d1b3ff, #b39ddb)' }, // 연한 보라색 계열
        3: { name: 'Emerald', color: '#50C878', icon: '/rank-tier-icon/tier_emerald.png', gradient: 'linear-gradient(135deg, #E6E6FA, #50C878)' },
        4: { name: 'Gold', color: '#FFE135', icon: '/rank-tier-icon/tier_gold.png', gradient: 'linear-gradient(135deg, #FFE135, #DAA520)' },
        5: { name: 'Silver', color: '#C0C0C0', icon: '/rank-tier-icon/tier_silver.png', gradient: 'linear-gradient(135deg, #C0C0C0, #A9A9A9)' },
        0: { name: 'Bronze', color: '#CD7F32', icon: '/rank-tier-icon/tier_bronze.png', gradient: 'linear-gradient(135deg, #CD7F32, #A0522D)' }
    };

    useEffect(() => {
        const fetchData = async () => {
            // 유저 데이터 가져오기
            const { data, error } = await supabase
                .from('ranked_user')
                .select('id, major, name, stnum, rank_tier, rank_detail, rank_all, image_url, raket') // raket 추가
                .order('rank_tier', { ascending: true })
                .order('rank_detail', { ascending: true });
            if (!error && data) setUsers(data);
        };
        fetchData();
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

    const getRankMedal = (rank: number, raket?: string) => {
        if (rank === 1) {
            return (
                <span className="rank-medal-img-wrapper rank-medal-only">
                    <span className="rank-medal-number rank-medal-number-1">1</span>
                    <img
                        src={
                            raket && raket !== 'none'
                                ? `/rank-top/rank-top-${raket}.png`
                                : `/rank-top/rank-top.png`
                        }
                        alt={`${raket && raket !== 'none' ? raket + ' 라켓' : '1등 메달'}`}
                        className="rank-top-medal"
                    />
                </span>
            );
        }
        if (rank === 2) {
            return (
                <span className="rank-medal-img-wrapper rank-medal-only">
                    <span className="rank-medal-number rank-medal-number-2">2</span>
                    <img
                        src={
                            raket && raket !== 'none'
                                ? `/rank-second/rank-second-${raket}.png`
                                : `/rank-second/rank-second.png`
                        }
                        alt={`${raket && raket !== 'none' ? raket + ' 라켓' : '2등 메달'}`}
                        className="rank-second-medal"
                    />
                </span>
            );
        }
        if (rank === 3) {
            return (
                <span className="rank-medal-img-wrapper rank-medal-only">
                    <span className="rank-medal-number rank-medal-number-3">3</span>
                    <img
                        src={
                            raket && raket !== 'none'
                                ? `/rank-third/rank-third-${raket}.png`
                                : `/rank-third/rank-third.png`
                        }
                        alt={`${raket && raket !== 'none' ? raket + ' 라켓' : '3등 메달'}`}
                        className="rank-third-medal"
                    />
                </span>
            );
        }
        return null;
    };

    return (
        <div className="ranking-page">
            <div className="ranking-header">
                <h1 className="rank-page-title">
                    <span className="rank-title-icon">🏆</span>
                    KWTC 랭킹
                </h1>
                <p className="rank-page-subtitle">KWTC 멤버들의 테니스 랭킹을 보여줍니다</p>
            </div>

            <div className="tier-navigation">
                <div className="nav-buttons">
                    {tiers.map((tier, idx) => (
                        <button
                            key={tier}
                            className={`tier-nav-btn tier-${tier}`}
                            onClick={() => handleTierScroll(idx)}
                        >
                            <span className="tier-icon">
                                <img src={tierInfo[tier as keyof typeof tierInfo].icon} alt={tierInfo[tier as keyof typeof tierInfo].name} className="tier-nav-icon" />
                            </span>
                            <span className="tier-name">{tierInfo[tier as keyof typeof tierInfo].name}</span>
                        </button>
                    ))}
                    <button
                        className="tier-nav-btn tier-0"
                        onClick={handleTeriniScroll}
                    >
                        <span className="tier-icon">
                            <img src={tierInfo[0].icon} alt={tierInfo[0].name} className="tier-nav-icon" />
                        </span>
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
                                <span className="tier-icon-large">
                                    <img src={tierInfo[tier as keyof typeof tierInfo].icon} alt={tierInfo[tier as keyof typeof tierInfo].name} className="tier-icon-img" />
                                </span>
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
                                              {getRankMedal(user.rank_all, user.raket)}
                                            </div>
                                            <div className="member-profile">
                                              <div className="rank-profile-image-wrapper">
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
                                                <span className="member-major">{user.major}</span>
                                                <span className="member-stnum"> #{user.stnum}</span>
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
                                              <div className="rank-profile-image-wrapper">
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
                            <span className="tier-icon-large">
                                <img src={tierInfo[0].icon} alt={tierInfo[0].name} className="tier-icon-img" />
                            </span>
                            <div className="tier-text">
                                <h2 className="tier-title">{tierInfo[0].name}</h2>
                                <span className="tier-subtitle">테린이</span>
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
                                                    <span className="terini-text">테린이</span>
                                                </div>
                                            </div>
                                            
                                            <div className="member-profile">
                                                <div className="rank-profile-image-wrapper">
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