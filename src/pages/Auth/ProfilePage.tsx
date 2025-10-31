import { useState } from 'react';
import { useAuth, useProfile } from './hooks';
import type { Profile } from './hooks/useProfile';
import './ProfilePage.css';

function ProfilePage() {
  const { signOut } = useAuth();
  const { profile, loading, uploading, setProfile, updateProfile, uploadImage, refetchProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    const confirmLogout = window.confirm('정말 로그아웃 하시겠습니까?');
    if (confirmLogout) {
      const result = await signOut();
      if (result.success) {
        window.location.href = '/login';
      } else {
        alert(result.message);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !profile) return;

    const file = e.target.files[0];
    const result = await uploadImage(file);

    if (!result.success) {
      alert(result.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedProfile) return;
    const { name, value } = e.target;
    setEditedProfile({ ...editedProfile, [name]: value });
  };

  const handleEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedProfile) return;

    setSaving(true);
    const result = await updateProfile({
      name: editedProfile.name,
      major: editedProfile.major,
      email: editedProfile.email,
      phone: editedProfile.phone,
      stnum: editedProfile.stnum,
      birthday: editedProfile.birthday
    });

    if (result.success) {
      alert(result.message);
      setIsEditing(false);
      setEditedProfile(null);
    } else {
      alert(result.message);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(null);
    refetchProfile();
  };

  const displayProfile = isEditing ? editedProfile : profile;

  if (loading && !profile) {
    return (
      <div className="profile-container">
        <div className="loading-wrapper">
          <div className="loading-spinner"></div>
          <p>프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!displayProfile) {
    return (
      <div className="profile-container">
        <div className="loading-wrapper">
          <p>프로필 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="header-actions">
          {!isEditing ? (
            <button className="profile-edit-btn" onClick={handleEdit}>
              ✏️ 편집
            </button>
          ) : (
            <div className="edit-actions">
              <button className="cancel-btn" onClick={handleCancel}>
                취소
              </button>
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '저장 중...' : '💾 저장'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-image-section">
            <div className="profile-image-wrapper">
              <div className="profile-image">
                {displayProfile.image_url ? (
                  <img src={displayProfile.image_url} alt="프로필 이미지" />
                ) : (
                  <div className="default-avatar">
                    <span>👤</span>
                  </div>
                )}
                {isEditing && (
                  <label className="image-upload-overlay">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden-input"
                    />
                    <div className="upload-icon">
                      {uploading ? '⏳' : '📷'}
                    </div>
                  </label>
                )}
              </div>
            </div>
            <div className="profile-name-section">
              <h2>{displayProfile.name}</h2>
              <p className="profile-major">{displayProfile.major}</p>
              <p className="profile-student-id">학번: {displayProfile.stnum}</p>
            </div>
          </div>

          <div className="profile-form">
            <div className="form-section">
              <h3>기본 정보</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>이름</label>
                  {isEditing ? (
                    <input
                      name="name"
                      value={displayProfile.name}
                      onChange={handleChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-value">{displayProfile.name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>학과</label>
                  {isEditing ? (
                    <input
                      name="major"
                      value={displayProfile.major}
                      onChange={handleChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-value">{displayProfile.major}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>학번</label>
                  {isEditing ? (
                    <input
                      name="stnum"
                      value={displayProfile.stnum}
                      onChange={handleChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-value">{displayProfile.stnum}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>생년월일</label>
                  {isEditing ? (
                    <input
                      name="birthday"
                      value={displayProfile.birthday}
                      onChange={handleChange}
                      className="form-input"
                      type="date"
                    />
                  ) : (
                    <div className="form-value">{displayProfile.birthday}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>연락처 정보</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>이메일</label>
                  {isEditing ? (
                    <input
                      name="email"
                      value={displayProfile.email}
                      onChange={handleChange}
                      className="form-input"
                      type="email"
                    />
                  ) : (
                    <div className="form-value">{displayProfile.email}</div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>전화번호</label>
                  {isEditing ? (
                    <input
                      name="phone"
                      value={displayProfile.phone}
                      onChange={handleChange}
                      className="form-input"
                      type="tel"
                    />
                  ) : (
                    <div className="form-value">{displayProfile.phone}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="logout-btn" onClick={handleLogout}>
              🚪 로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
