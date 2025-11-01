import React from "react";
import ProfileDetailPage from "../../components/ProfileDetailPage";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./Rankingpage.css";
import { useRankingData, useProfileModal, useTierScroll } from './hooks';
import { TIER_INFO, TIERS, TERINI_TIER, getRankMedal, getDefaultProfileImage } from './utils';

function RankingPage() {
    const { users, loading } = useRankingData();
    const { selectedMemberId, openProfile, closeProfile, handleBackdropClick } = useProfileModal();
    const { tierRefs, scrollToTier, scrollToTerini } = useTierScroll(TIERS.length);

    if (loading) {
        return (
            <div className="ranking-page">
                <LoadingSpinner message="랭킹 정보를 불러오는 중..." />
            </div>
        );
    }

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
                    {TIERS.map((tier, idx) => (
                        <button
                            key={tier}
                            className={`tier-nav-btn tier-${tier}`}
                            onClick={() => scrollToTier(idx)}
                        >
                            <span className="tier-icon">
                                <img src={TIER_INFO[tier].icon} alt={TIER_INFO[tier].name} className="tier-nav-icon" />
                            </span>
                            <span className="tier-name">{TIER_INFO[tier].name}</span>
                        </button>
                    ))}
                    <button
                        className="tier-nav-btn tier-0"
                        onClick={scrollToTerini}
                    >
                        <span className="tier-icon">
                            <img src={TIER_INFO[0].icon} alt={TIER_INFO[0].name} className="tier-nav-icon" />
                        </span>
                        <span className="tier-name">{TIER_INFO[0].name}</span>
                    </button>
                </div>
            </div>

            <div className="ranking-content">
                {TIERS.map((tier, idx) => (
                    <div key={tier} ref={el => { tierRefs.current[idx] = el; }} className="tier-section">
                        <div
                            className="tier-header"
                            style={{ background: TIER_INFO[tier].gradient }}
                        >
                            <div className="tier-info">
                                <span className="tier-icon-large">
                                    <img src={TIER_INFO[tier].icon} alt={TIER_INFO[tier].name} className="tier-icon-img" />
                                </span>
                                <div className="tier-text">
                                    <h2 className="tier-title">{TIER_INFO[tier].name}</h2>
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
                                        .map((user) => (
                                          <div
                                            key={user.id}
                                            className="member-card top-rank"
                                            data-rank={user.rank_all}
                                            onClick={() => openProfile(user.id)}
                                            style={{ cursor: 'pointer' }}
                                          >
                                            <div className="member-rank-section">
                                              {getRankMedal(user.rank_all, user.raket)}
                                            </div>
                                            <div className="member-profile">
                                              <div className="rank-profile-image-wrapper">
                                                <img
                                                  src={user.image_url || getDefaultProfileImage()}
                                                  alt={`${user.name} 프로필`}
                                                  className="profile-image"
                                                />
                                                <div
                                                  className="tier-indicator"
                                                  style={{ background: TIER_INFO[tier].color }}
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
                                        .map((user) => (
                                          <div
                                            key={user.id}
                                            className="member-card regular-rank"
                                            onClick={() => openProfile(user.id)}
                                            style={{ cursor: 'pointer' }}
                                          >
                                            <div className="member-rank-section">
                                              <div
                                                className="rank-badge"
                                                style={{ background: TIER_INFO[tier].gradient }}
                                              >
                                                <span className="rank-number">#{user.rank_all}</span>
                                              </div>
                                              <span className="rank-detail">({user.rank_detail})</span>
                                            </div>

                                            <div className="member-profile">
                                              <div className="rank-profile-image-wrapper">
                                                <img
                                                  src={user.image_url || getDefaultProfileImage()}
                                                  alt={`${user.name} 프로필`}
                                                  className="profile-image"
                                                />
                                                <div
                                                  className="tier-indicator"
                                                  style={{ background: TIER_INFO[tier].color }}
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
                        style={{ background: TIER_INFO[0].gradient }}
                    >
                        <div className="tier-info">
                            <span className="tier-icon-large">
                                <img src={TIER_INFO[0].icon} alt={TIER_INFO[0].name} className="tier-icon-img" />
                            </span>
                            <div className="tier-text">
                                <h2 className="tier-title">{TIER_INFO[0].name}</h2>
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
                                            onClick={() => openProfile(user.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="member-rank-section">
                                                <div
                                                    className="rank-badge terini-badge"
                                                    style={{ background: TIER_INFO[0].gradient }}
                                                >
                                                    <span className="terini-text">테린이</span>
                                                </div>
                                            </div>

                                            <div className="member-profile">
                                                <div className="rank-profile-image-wrapper">
                                                    <img
                                                        src={user.image_url || getDefaultProfileImage()}
                                                        alt={`${user.name} 프로필`}
                                                        className="profile-image"
                                                    />
                                                    <div
                                                        className="tier-indicator"
                                                        style={{ background: TIER_INFO[0].color }}
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
                    onClick={handleBackdropClick}
                >
                    <div className="profile-modal-container">
                        <button
                            className="profile-modal-close"
                            onClick={closeProfile}
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
