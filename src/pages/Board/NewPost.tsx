import { supabase } from '../auth/supabaseClient.tsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewPost.css';

export function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('normal');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const createPost = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      setUploading(true);
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('post-images')
          .upload(fileName, file);

        if (error) {
          console.error('Supabase upload error:', error);
          alert('이미지 업로드 실패: ' + error.message);
          setUploading(false);
          return;
        }
        const publicUrl = supabase.storage.from('post-images').getPublicUrl(fileName).data.publicUrl;
        imageUrls.push(publicUrl);
      }
      setUploading(false);
    }

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      title,
      content,
      post_type: postType,
      image_urls: imageUrls,
    });

    if (error) alert(error.message);
    else {
      alert("게시글 등록 완료!");
      setTitle('');
      setContent('');
      setPostType('normal');
      setImageFiles([]);
      navigate('/board');
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const postTypeOptions = [
    { value: 'normal', label: '자유', icon: '💬', color: '#3b82f6' },
    { value: 'announcement', label: '공지', icon: '📢', color: '#ef4444' },
    { value: 'tour', label: '대회', icon: '🏆', color: '#f59e0b' }
  ];

  return (
    <div className='newpost-container'>
      <div className="newpost-header">
        <h1 className="page-title">
          <span className="title-icon">✏️</span>
          새 글 작성
        </h1>
      </div>

      <div className="newpost-content">
        <div className="form-card">
          {/* 글 종류 선택 */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">🏷️</span>
              글 종류
            </h3>
            <div className="post-type-options">
              {postTypeOptions.map((option) => (
                <label 
                  key={option.value}
                  className={`post-type-option ${postType === option.value ? 'selected' : ''}`}
                  style={{ '--accent-color': option.color } as React.CSSProperties}
                >
                  <input
                    type="radio"
                    name="post-type"
                    value={option.value}
                    checked={postType === option.value}
                    onChange={() => setPostType(option.value)}
                  />
                  <div className="option-content">
                    <span className="option-icon">{option.icon}</span>
                    <span className="option-label">{option.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 제목 입력 */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📝</span>
              제목
            </h3>
            <input
              type="text"
              placeholder="제목을 입력해주세요..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="title-input"
              maxLength={100}
            />
            <div className="char-count">{title.length}/100</div>
          </div>

          {/* 내용 입력 */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📄</span>
              내용
            </h3>
            <textarea
              placeholder="내용을 입력해주세요..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="content-textarea"
              rows={10}
            />
            <div className="char-count">{content.length}자</div>
          </div>

          {/* 이미지 업로드 */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">🖼️</span>
              이미지 첨부
            </h3>
            <div className="image-upload-area">
              <label htmlFor="image-upload" className="upload-label">
                <div className="upload-content">
                  <span className="upload-icon">📁</span>
                  <span className="upload-text">이미지를 선택하거나 드래그하세요</span>
                  <span className="upload-subtext">여러 이미지를 한 번에 업로드할 수 있습니다</span>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    setImageFiles(prev => [...prev, ...files]);
                  }}
                  className="hidden-input"
                />
              </label>
            </div>

            {/* 이미지 미리보기 */}
            {imageFiles.length > 0 && (
              <div className="image-preview-section">
                <h4 className="preview-title">미리보기</h4>
                <div className="image-preview-grid">
                  {imageFiles.map((file, idx) => (
                    <div key={idx} className="image-preview-item">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${idx}`}
                        className="preview-image"
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(idx)}
                      >
                        ✕
                      </button>
                      <div className="image-name">{file.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 등록 버튼 */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/board')}
              disabled={uploading}
            >
              취소
            </button>
            <button
              type="button"
              className="submit-btn"
              onClick={createPost}
              disabled={uploading || !title.trim() || !content.trim()}
            >
              {uploading ? (
                <>
                  <span className="loading-spinner"></span>
                  업로드 중...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  등록하기
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
