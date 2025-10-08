import "./IntroPage.css";
import { useState, useEffect } from "react";
import Showmember from '../../components/Showmember';
import { supabase } from "../auth/supabaseClient";

function IntroPage() {
    const [selected, setSelected] = useState("club");
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(false);

    // 임원진 데이터 가져오기
    const fetchLeaders = async () => {
        setLoading(true);
        try {
            // 1. leader_profile 데이터 가져오기 (order_num 기준으로 정렬)
            const { data: leaderData, error: leaderError } = await supabase
                .from('leader_profile')
                .select('user_id, position, position_description, order_num')
                .order('order_num', { ascending: true }); // order_num이 낮을수록 위로

            if (leaderError) {
                console.error('Error fetching leader_profile:', leaderError);
                return;
            }

            // 2. profile 데이터 가져오기 (id 필드 사용)
            const userIds = leaderData.map(leader => leader.user_id);
            const { data: profileData, error: profileError } = await supabase
                .from('profile')
                .select('id, name, major, image_url')
                .in('id', userIds);

            if (profileError) {
                console.error('Error fetching profiles:', profileError);
                return;
            }

            // 3. 데이터 병합 (id와 user_id 매칭)
            const mergedData = leaderData.map(leader => {
                const profile = profileData.find(p => p.id === leader.user_id);
                return {
                    ...leader,
                    profile: profile || null
                };
            });

            setLeaders(mergedData);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selected === "leader") {
            fetchLeaders();
        }
    }, [selected]);

    // 포지션별 배지 스타일 결정
    const getPositionBadgeClass = (position) => {
        switch (position.toLowerCase()) {
            case '회장':
            case 'president':
                return 'president';
            case '부회장':
            case 'vice-president':
                return 'vice-president';
            case '총무':
            case 'treasurer':
                return 'treasurer';
            case '운영진':
            case 'manager':
                return 'manager';
            default:
                return 'member';
        }
    };

    return (
        <div className="intro-page">
            <div className="intro-header">
                <h1 className="intro-title">
                    <span className="title-icon">🎾</span>
                    KWTC 소개
                </h1>
                <p className="intro-subtitle">광운대학교 테니스 동아리를 소개합니다</p>
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
                                <h2 className="club-name">KWTC</h2>
                                <p className="club-tagline">광운대학교 테니스 동아리</p>
                            </div>
                            
                            <div className="club-description">
                                <div className="description-card">
                                    <h3 className="description-title">
                                        <span className="description-icon">📚</span>
                                        동아리 소개
                                    </h3>
                                    <p className="description-text">
                                        광운대학교 테니스 동아리 KWTC는 1978년에 처음 창립된 광운대학교의 중앙동아리입니다. 
                                        45년의 오랜 전통과 역사를 자랑하며, 수많은 테니스 애호가들과 함께 성장해왔습니다.
                                    </p>
                                </div>
                                
                                <div className="info-grid">
                                    <div className="info-item">
                                        <div className="info-icon">🗓️</div>
                                        <div className="info-content">
                                            <h4>창립년도</h4>
                                            <p>1978년</p>
                                        </div>
                                    </div>
                                    
                                    <div className="info-item">
                                        <div className="info-icon">🏫</div>
                                        <div className="info-content">
                                            <h4>소속</h4>
                                            <p>광운대학교 중앙동아리</p>
                                        </div>
                                    </div>
                                    
                                    <div className="info-item">
                                        <div className="info-icon">🎾</div>
                                        <div className="info-content">
                                            <h4>종목</h4>
                                            <p>테니스</p>
                                        </div>
                                    </div>
                                    
                                    <div className="info-item">
                                        <div className="info-icon">👨‍👩‍👧‍👦</div>
                                        <div className="info-content">
                                            <h4>활동</h4>
                                            <p>정기 연습, 대회 참가</p>
                                        </div>
                                    </div>
                                    
                                    <div className="info-item instagram-item">
                                        <div className="info-icon">📱</div>
                                        <div className="info-content">
                                            <h4>인스타그램</h4>
                                            <a 
                                                href="https://instagram.com/kwtc_official" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="instagram-link"
                                            >
                                                @kwtc_official
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
                                        <div key={leader.user_id} className="leader-item">
                                            <div className="leader-avatar">
                                                <img 
                                                    src={leader.profile?.image_url || "https://via.placeholder.com/80"} 
                                                    alt={leader.position}
                                                    onError={(e) => {
                                                        e.target.src = "https://via.placeholder.com/80";
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
                                                <p className="leader-major">
                                                    {leader.profile?.major || '전공 정보 없음'}
                                                </p>
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
        </div>
    );
}

export default IntroPage;