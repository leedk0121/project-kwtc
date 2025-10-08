import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient.tsx';
import './ProfilePage.css';

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    major: string;
    email: string;
    phone: string;
    stnum: string;
    age: string;
    image_url?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('profile')
        .select('id, name, major, email, phone, stnum, age, image_url')
        .eq('id', user.id)
        .single();
      if (!error && data) setProfile(data);
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const confirmLogout = window.confirm('정말 로그아웃 하시겠습니까?');
    if (confirmLogout) {
      await supabase.auth.signOut();
      // 로컬 스토리지 정리
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_major');
      localStorage.removeItem('user_stnum');
      localStorage.removeItem('user_image_url');
      window.location.href = '/login';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !profile) return;
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.stnum}_${Date.now()}.${fileExt}`;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('사용자 정보를 가져올 수 없습니다.');
      setUploading(false);
      return;
    }

    // 기존 이미지 삭제
    if (profile.image_url) {
      const urlParts = profile.image_url.split('/');
      const oldFileName = urlParts[urlParts.length - 1];
      await supabase.storage
        .from('profile-image')
        .remove([oldFileName]);
    }

    const { error: uploadError } = await supabase.storage
      .from('profile-image')
      .upload(fileName, file);

    if (uploadError) {
      alert('이미지 업로드 실패: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from('profile-image')
      .getPublicUrl(fileName);

    const imageUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from('profile')
      .update({ image_url: imageUrl })
      .eq('id', profile.id);

    if (!updateError) {
      setProfile({ ...profile, image_url: imageUrl });
      // 로컬 스토리지 업데이트
      localStorage.setItem('user_image_url', imageUrl);
    }
    setUploading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('profile')
      .update({
        name: profile.name,
        major: profile.major,
        email: profile.email,
        phone: profile.phone,
        stnum: profile.stnum,
        age: profile.age,
        image_url: profile.image_url,
      })
      .eq('id', profile.id);
      
    if (error) {
      alert('저장 실패: ' + error.message);
    } else {
      // 로컬 스토리지 업데이트
      localStorage.setItem('user_name', profile.name);
      localStorage.setItem('user_major', profile.major);
      localStorage.setItem('user_stnum', profile.stnum);
      if (profile.image_url) {
        localStorage.setItem('user_image_url', profile.image_url);
      }
      
      alert('저장되었습니다!');
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // 원래 데이터로 되돌리기 위해 다시 fetch
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('profile')
        .select('id, name, major, email, phone, stnum, age, image_url')
        .eq('id', user.id)
        .single();
      if (!error && data) setProfile(data);
    };
    fetchProfile();
  };

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="loading-wrapper">
          <div className="loading-spinner"></div>
          <p>프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="header-actions">
          {!isEditing ? (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
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
                {profile.image_url ? (
                  <img src={profile.image_url} alt="프로필 이미지" />
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
              <h2>{profile.name}</h2>
              <p className="profile-major">{profile.major}</p>
              <p className="profile-student-id">학번: {profile.stnum}</p>
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
                      value={profile.name} 
                      onChange={handleChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-value">{profile.name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>학과</label>
                  {isEditing ? (
                    <input 
                      name="major" 
                      value={profile.major} 
                      onChange={handleChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-value">{profile.major}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>학번</label>
                  {isEditing ? (
                    <input 
                      name="stnum" 
                      value={profile.stnum} 
                      onChange={handleChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-value">{profile.stnum}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>나이</label>
                  {isEditing ? (
                    <input 
                      name="age" 
                      value={profile.age} 
                      onChange={handleChange}
                      className="form-input"
                      type="number"
                    />
                  ) : (
                    <div className="form-value">{profile.age}세</div>
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
                      value={profile.email} 
                      onChange={handleChange}
                      className="form-input"
                      type="email"
                    />
                  ) : (
                    <div className="form-value">{profile.email}</div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>전화번호</label>
                  {isEditing ? (
                    <input 
                      name="phone" 
                      value={profile.phone} 
                      onChange={handleChange}
                      className="form-input"
                      type="tel"
                    />
                  ) : (
                    <div className="form-value">{profile.phone}</div>
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