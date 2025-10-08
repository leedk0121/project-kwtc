import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../auth/supabaseClient';
import type { Post } from './Posttypes';
import './PostDetail.css';

export function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate(); // 추가
  const [post, setPost] = useState<Post | null>(null);
    const post_type_kr: { [key: string]: string } = {
        announcement: '공지',
        tour: '대회',
        normal: '자유',
    };


  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, created_at, post_type, user_name, image_urls')
        .eq('id', id)
        .single();
      if (!error && data) setPost(data);
    };
    fetchPost();
  }, [id]);

  if (!post) return <div>로딩중...</div>;

  return (
    <div className="post-detail-ctn">
      <div className='post_detail_info'>
        <div id='post_detail_title'>{post.title}</div>
      </div>
      <div id='post_detail_meta'>
        {post.profile?.name || 'Unknown'} {new Date(post.created_at).toLocaleString()}
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
        <button id="post-detail-button" onClick={() => navigate('/board')}>목록으로</button>
      </div>
    </div>
  );
}