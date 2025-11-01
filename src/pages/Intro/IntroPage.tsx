import "./styles/intro-shared.css";
import { useState, useEffect } from "react";
import Showmember from '../../components/Showmember';
import ProfileDetailPage from '../../components/ProfileDetailPage';
import { useLeaders } from './hooks';
import { getPositionBadgeClass, CLUB_INFO } from './utils';

type TabType = "club" | "leader" | "member";

function IntroPage() {
    const [selected, setSelected] = useState<TabType>("club");
    const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
    const { leaders, loading, fetchLeaders } = useLeaders();

    useEffect(() => {
        if (selected === "leader") {
            fetchLeaders();
        }
    }, [selected, fetchLeaders]);

    return (
        <div className="intro-page">
            <div className="intro-page-header">
                <h1 className="intro-page-title">
                    <span className="intro-title-icon">📢</span>
                    KWTC 소개
                </h1>
                <p className="intro-page-subtitle">KWTC 동아리, 임원진과 멤버들을 소개합니다</p>
            </div>

            <div className="intro-navigation">
                <div className="nav-container">
                    <button
                        className={`nav-tab ${selected === "club" ? "active" : ""}`}
                        onClick={() => setSelected("club")}
                    >
                        <span className="tab-icon">🏛️</span>
                        <span className="tab-text">동아리</span>
                    </button>

                    <button
                        className={`nav-tab ${selected === "leader" ? "active" : ""}`}
                        onClick={() => setSelected("leader")}
                    >
                        <span className="tab-icon">👑</span>
                        <span className="tab-text">임원진</span>
                    </button>

                    <button
                        className={`nav-tab ${selected === "member" ? "active" : ""}`}
                        onClick={() => setSelected("member")}
                    >
                        <span className="tab-icon">👥</span>
                        <span className="tab-text">멤버</span>
                    </button>
                </div>
                <div className="tab-indicator"></div>
            </div>

            <div className="intro-content">
                {selected === "club" && (
                    <div className="club-section">
                        <div className="club-card">
                            <div className="club-logo-section">
                                <div className="logo-wrapper">
                                    <img src="kwtclogo.png" className="club-logo" alt="KWTC Logo" />
                                    <div className="logo-glow"></div>
                                </div>
                                <h2 className="club-name">{CLUB_INFO.name}</h2>
                                <p className="club-tagline">{CLUB_INFO.fullName}</p>
                            </div>

                            <div className="club-description">
                                <div className="description-card">
                                    <h3 className="description-title">
                                        <span className="description-icon">📚</span>
                                        동아리 소개
                                    </h3>
                                    <p className="description-text">
                                        {CLUB_INFO.description}
                                    </p>
                                </div>

                                <div className="info-grid">
                                    <div className="info-item">
                                        <div className="info-icon">🗓️</div>
                                        <div className="info-content">
                                            <h4>창립년도</h4>
                                            <p>{CLUB_INFO.foundedYear}</p>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-icon">🏫</div>
                                        <div className="info-content">
                                            <h4>소속</h4>
                                            <p>{CLUB_INFO.affiliation}</p>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-icon">🎾</div>
                                        <div className="info-content">
                                            <h4>종목</h4>
                                            <p>{CLUB_INFO.sport}</p>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-icon">👨‍👩‍👧‍👦</div>
                                        <div className="info-content">
                                            <h4>활동</h4>
                                            <p>{CLUB_INFO.activities}</p>
                                        </div>
                                    </div>

                                    <div className="info-item instagram-item">
                                        <div className="info-icon">📱</div>
                                        <div className="info-content">
                                            <h4>인스타그램</h4>
                                            <a
                                                href={CLUB_INFO.instagram.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {CLUB_INFO.instagram.handle}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {selected === "leader" && (
                    <div className="leader-section">
                        <div className="leader-card">
                            <div className="leader-header">
                                <h3 className="section-title">
                                    <span className="section-icon">👑</span>
                                    임원진 소개
                                </h3>
                                <p className="section-subtitle">KWTC를 이끌어가는 임원진들을 소개합니다</p>
                            </div>

                            {loading ? (
                                <div className="loading-spinner">로딩 중...</div>
                            ) : (
                                <div className="leader-grid">
                                    {leaders.map((leader) => (
                                        <div
                                            key={leader.user_id}
                                            className="leader-item"
                                            onClick={() => setSelectedLeaderId(leader.user_id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="leader-avatar">
                                                <img
                                                    src={leader.profile?.image_url || "https://via.placeholder.com/80"}
                                                    alt={leader.position}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/80";
                                                    }}
                                                />
                                                <div className={`leader-badge ${getPositionBadgeClass(leader.position)}`}>
                                                    {leader.position}
                                                </div>
                                            </div>
                                            <div className="leader-info">
                                                <h4 className="leader-name">
                                                    {leader.profile?.name || '이름 없음'}
                                                </h4>
                                                <p className="leader-description">
                                                    {leader.position_description || '설명이 없습니다.'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {leaders.length === 0 && !loading && (
                                        <div className="no-data">
                                            <p>등록된 임원진 정보가 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {selected === "member" && (
                    <div className="member-section">
                        <div className="member-header">
                            <h3 className="section-title">
                                <span className="section-icon">👥</span>
                                멤버 소개
                            </h3>
                            <p className="section-subtitle">KWTC의 소중한 멤버들을 만나보세요</p>
                        </div>
                        <Showmember />
                    </div>
                )}
            </div>

            {/* 프로필 모달 */}
            {selectedLeaderId && (
                <div
                    className="profile-modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedLeaderId(null);
                        }
                    }}
                >
                    <div className="profile-modal-container">
                        <button
                            className="profile-modal-close"
                            onClick={() => setSelectedLeaderId(null)}
                        >
                            ×
                        </button>
                        <div className="profile-modal-content">
                            <ProfileDetailPage id={selectedLeaderId} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IntroPage;
