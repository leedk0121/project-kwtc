import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from './hooks';
import { POST_TYPE_OPTIONS } from './utils';
import './NewPost.css';

export function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('normal');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  const { createPost, uploading } = usePosts();

  const handleCreatePost = async () => {
    const result = await createPost(title, content, postType, imageFiles);

    if (result.success) {
      alert(result.message);
      navigate('/board');
    } else {
      alert(result.message || '게시글 등록에 실패했습니다.');
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className='newpost-container'>
      <div className="newpost-header">
        <h1 className="page-title">
          <span className="title-icon">✏️</span>
          새 글 작성
        </h1>
        <p className="page-subtitle">KWTC에 새로운 소식을 전해주세요</p>
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
              {POST_TYPE_OPTIONS.map((option) => (
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
              onClick={handleCreatePost}
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
