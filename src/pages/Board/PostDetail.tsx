import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { usePosts } from './hooks';
import { POST_TYPE_KR, formatFullDate } from './utils';
import type { Post } from './Posttypes';
import './PostDetail.css';

export function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);

  const { fetchPostById, loading } = usePosts();

  useEffect(() => {
    if (id) {
      fetchPostById(id).then(result => {
        if (result.success && result.data) {
          setPost(result.data);
        }
      });
    }
  }, [id, fetchPostById]);

  if (loading) {
    return (
      <div className="post-detail-ctn">
        <div>로딩중...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-ctn">
        <div>게시글을 찾을 수 없습니다.</div>
        <div id='post-detail-button-ctn'>
          <button id="post-detail-button" onClick={() => navigate('/board')}>
            목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-ctn">
      <div className='post_detail_info'>
        <div id='post_detail_title'>{post.title}</div>
      </div>
      <div id='post_detail_meta'>
        {formatFullDate(post.created_at)} / {post.user_name || 'Unknown'}
      </div>
      <div id='post_detail_content'>
        {post.content.split('\n').map((line, idx) => (
          <span key={idx}>
            {line}
            <br />
          </span>
        ))}
      </div>
      {/* 이미지가 있을 경우 보여줌 */}
      {Array.isArray(post.image_urls) && post.image_urls.length > 0 && (
        <div className="post-detail-images" style={{ width: '100%' }}>
          {post.image_urls.map((url: string, idx: number) => (
            <img
              key={idx}
              src={url}
              alt={`post-img-${idx}`}
            />
          ))}
        </div>
      )}
      <div id='post-detail-button-ctn'>
        <button id="post-detail-button" onClick={() => navigate('/board')}>
          목록으로
        </button>
      </div>
    </div>
  );
}
