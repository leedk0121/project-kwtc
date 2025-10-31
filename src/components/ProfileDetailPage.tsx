import './ProfileDetailPage.css';
import { useProfileData } from './ProfileDetail/hooks';
import { formatPhone, getDefaultProfileImage } from './ProfileDetail/utils';
import { TIER_INFO } from '../pages/Ranking/utils';
import LoadingSpinner from './LoadingSpinner';

type ProfileDetailPageProps = {
    id: string;
};

function ProfileDetailPage({ id }: ProfileDetailPageProps) {
    const { profile, loading } = useProfileData(id);

    // 현재 사용자의 티어 정보 가져오기
    const currentTierInfo = profile ? TIER_INFO[profile.rank_tier as keyof typeof TIER_INFO] : null;

    if (loading) {
        return (
            <div className="profile-detail-loading">
                <LoadingSpinner message="프로필을 불러오는 중..." />
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
                    background: currentTierInfo?.gradient || TIER_INFO[0].gradient,
                    boxShadow: `0 8px 32px ${currentTierInfo?.color || TIER_INFO[0].color}66`
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
                        <div className="profile-detail-rank-value-wrapper">
                            {profile.rank_tier === 0 ? (
                                <span className="profile-detail-rank-medal">🌱</span>
                            ) : profile.rank_all === 1 ? (
                                <span className="profile-detail-rank-medal">🥇</span>
                            ) : profile.rank_all === 2 ? (
                                <span className="profile-detail-rank-medal">🥈</span>
                            ) : profile.rank_all === 3 ? (
                                <span className="profile-detail-rank-medal">🥉</span>
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
                    {profile.rank_all === 123 ? (
                        <div className="profile-detail-image-wrapper oni-bookmark-bg">
                            <img
                                className="profile-detail-image oni-large-image"
                                src={profile.image_url || getDefaultProfileImage()}
                                alt={`${profile.name}의 프로필`}
                            />
                            <div className="profile-detail-image-border"></div>
                        </div>
                    ) : (
                        <div
                            className="profile-detail-image-wrapper"
                            style={{
                                background: 'linear-gradient(135deg, #ffffff, #f8f8f8)',
                                boxShadow: `0 8px 32px rgba(255, 255, 255, 0.7)`
                            }}
                        >
                            <img
                                className="profile-detail-image"
                                src={profile.image_url || getDefaultProfileImage()}
                                alt={`${profile.name}의 프로필`}
                            />
                            <div className="profile-detail-image-border"></div>
                        </div>
                    )}
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
                            <h3 className="profile-detail-stat-label">생일</h3>
                            <p className="profile-detail-stat-value">{profile.birthday}</p>
                        </div>
                    </div>

                    <div className="profile-detail-stat-card profile-detail-contact-card">
                        <div className="profile-detail-stat-icon">
                            <span>📱</span>
                        </div>
                        <div className="profile-detail-stat-content">
                            <h3 className="profile-detail-stat-label">연락처</h3>
                            <p className="profile-detail-stat-value">{formatPhone(profile.phone)}</p>
                        </div>
                    </div>

                    <div className={`profile-detail-stat-card profile-detail-tier-card tier-${profile.rank_tier}`}>
                        <div className="profile-detail-stat-icon">
                            <img
                                src={currentTierInfo?.icon || TIER_INFO[0].icon}
                                alt={currentTierInfo?.name || TIER_INFO[0].name}
                                style={{ width: 50, height: 50 }}
                            />
                        </div>
                        <div className="profile-detail-stat-content">
                            <div className="profile-detail-stat-label">티어</div>
                            <div className="profile-detail-stat-value">
                                {currentTierInfo?.name || TIER_INFO[0].name}
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
