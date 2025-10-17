import { useEffect, useState } from "react";
import { supabase } from "../pages/auth/supabaseClient";
import './ProfileDetailPage.css';

type ProfileDetailPageProps = {
    id: string;
};

function ProfileDetailPage({ id }: ProfileDetailPageProps) {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!id) return;
            
            setLoading(true);
            const { data, error } = await supabase
                .from('ranked_user')
                .select('name, major, stnum, rank_all, image_url, birthday, phone, rank_tier')
                .eq('id', id)
                .single();
            
            if (!error && data) {
                setProfile(data);
            }
            setLoading(false);
        };
        fetchProfile();
    }, [id]);

    // 랭킹 표시 함수 추가
    const getRankDisplay = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    // 티어 색상 정보 - 플래티넘 원래 색상으로 복원
    const tierInfo = {
        1: { name: 'Master', color: '#FFE066', icon: '👑', gradient: 'linear-gradient(135deg, #FFF2CC, #FFE066)' },
        2: { name: 'Diamond', color: '#CCE7FF', icon: '💎', gradient: 'linear-gradient(135deg, #F0F8FF, #CCE7FF)' },
        3: { name: 'Platinum', color: '#E6E6FA', icon: '⭐', gradient: 'linear-gradient(135deg, #E6E6FA, #DDA0DD)' }, /* 원래 색상 복원 */
        4: { name: 'Gold', color: '#FFF2AA', icon: '🥇', gradient: 'linear-gradient(135deg, #FFFACD, #FFF2AA)' },
        5: { name: 'Silver', color: '#E8E8E8', icon: '🥈', gradient: 'linear-gradient(135deg, #F5F5F5, #E8E8E8)' },
        0: { name: 'Terini', color: '#D4F4D4', icon: '🌱', gradient: 'linear-gradient(135deg, #F0FFF0, #D4F4D4)' }
    };

    // 현재 사용자의 티어 정보 가져오기
    const currentTierInfo = profile ? tierInfo[profile.rank_tier as keyof typeof tierInfo] : null;

    if (loading) {
        return (
            <div className="profile-detail-loading">
                <div className="profile-detail-loading-spinner"></div>
                <p>프로필을 불러오는 중...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-detail-error">
                <div className="profile-detail-error-icon">😕</div>
                <h2>프로필을 찾을 수 없습니다</h2>
                <p>요청하신 사용자의 정보를 찾을 수 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="profile-detail-container">
            {/* Header Section */}
            <div 
                className="profile-detail-header"
                style={{
                    background: currentTierInfo?.gradient || tierInfo[0].gradient,
                    boxShadow: `0 8px 32px ${currentTierInfo?.color || tierInfo[0].color}66`
                }}
            >
                <div className="profile-detail-decorations">
                    <div className="profile-detail-decoration-circle profile-detail-decoration-1"></div>
                    <div className="profile-detail-decoration-circle profile-detail-decoration-2"></div>
                    <div className="profile-detail-decoration-circle profile-detail-decoration-3"></div>
                </div>
                
                {/* Rank positioned at top left */}
                <div className="profile-detail-rank">
                    <div className="profile-detail-rank-container">
                        {/* <span className="profile-detail-rank-label">전체 랭킹</span> */}
                        <div className="profile-detail-rank-value-wrapper">
                            {profile.rank_all <= 3 ? (
                                <span className="profile-detail-rank-medal">{getRankDisplay(profile.rank_all)}</span>
                            ) : (
                                <>
                                    <span className="profile-detail-rank-hash">#</span>
                                    <span className="profile-detail-rank-value">{profile.rank_all}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Profile Image */}
                <div className="profile-detail-image-section">
                    <div 
                        className="profile-detail-image-wrapper"
                        style={{ 
                            background: 'linear-gradient(135deg, #ffffff, #f8f8f8)',
                            boxShadow: `0 8px 32px rgba(255, 255, 255, 0.7)`
                        }}
                    >
                        <img
                            className="profile-detail-image"
                            src={profile.image_url || "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png"}
                            alt={`${profile.name}의 프로필`}
                        />
                        <div className="profile-detail-image-border"></div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="profile-detail-basic-info">
                    <h1 className="profile-detail-name">{profile.name}</h1>
                    <p className="profile-detail-major">{profile.major}</p>
                    <p className="profile-detail-student-id">학번: {profile.stnum}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="profile-detail-stats">
                <div className="profile-detail-stats-grid">
                    <div className="profile-detail-stat-card profile-detail-age-card">
                        <div className="profile-detail-stat-icon">
                            <span>🎂</span>
                        </div>
                        <div className="profile-detail-stat-content">
                            <h3 className="profile-detail-stat-label">생년월일</h3>
                            <p className="profile-detail-stat-value">{profile.birthday}</p>
                        </div>
                    </div>
                    
                    <div className="profile-detail-stat-card profile-detail-contact-card">
                        <div className="profile-detail-stat-icon">
                            <span>📱</span>
                        </div>
                        <div className="profile-detail-stat-content">
                            <h3 className="profile-detail-stat-label">연락처</h3>
                            <p className="profile-detail-stat-value">{profile.phone}</p>
                        </div>
                    </div>
                    
                    <div className={`profile-detail-stat-card profile-detail-tier-card tier-${profile.rank_tier}`}>
                        <div className="profile-detail-stat-icon">
                            {currentTierInfo?.icon || tierInfo[0].icon}
                        </div>
                        <div className="profile-detail-stat-content">
                            <div className="profile-detail-stat-label">티어</div>
                            <div className="profile-detail-stat-value">
                                {currentTierInfo?.name || tierInfo[0].name}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Club Info Section */}
        </div>
    );
}

export default ProfileDetailPage;

