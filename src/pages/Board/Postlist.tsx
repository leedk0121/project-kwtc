import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../auth/supabaseClient';
import type { Post } from './Posttypes';
import './Postlist.css';

export function PostList() {
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSearch, setShowSearch] = useState(false); // 검색창 표시 여부 추가
  const POSTS_PER_PAGE = 10;
  const navigate = useNavigate();
  
  const post_type_kr: { [key: string]: string } = {
    announcement: '공지',
    tour: '대회',
    normal: '자유',
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const sortPosts = (postsData: Post[]) => {
    return postsData.sort((a, b) => {
      // 공지사항을 맨 위로
      if (a.post_type === 'announcement' && b.post_type !== 'announcement') {
        return -1;
      }
      if (a.post_type !== 'announcement' && b.post_type === 'announcement') {
        return 1;
      }
      // 같은 타입이면 최신순으로 정렬
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('id, user_id, title, content, created_at, post_type, user_name')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
    } else if (data) {
      const sortedPosts = sortPosts(data);
      setPosts(sortedPosts);
    }
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      fetchPosts();
      setHasSearched(false);
      return;
    }
    
    setSearchLoading(true);
    setHasSearched(true);
    const { data, error } = await supabase
      .from('posts')
      .select('id, user_id, title, content, created_at, post_type, user_name')
      .ilike('title', `%${search}%`)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      const sortedPosts = sortPosts(data);
      setPosts(sortedPosts);
      setPage(1);
    }
    setSearchLoading(false);
  };

  const clearSearch = () => {
    setSearch("");
    setHasSearched(false);
    fetchPosts();
    setPage(1);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      // 검색창을 닫을 때 검색 초기화
      setSearch("");
      setHasSearched(false);
      fetchPosts();
      setPage(1);
    }
  };

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const pagedPosts = posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInHours < 48) {
      return '1일 전';
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <div className="post-list-container">
        <div className="loading-wrapper">
          <div className="loading-spinner"></div>
          <p>게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='post-list-container'>
      {/* VotePage 스타일의 페이지 헤더 */}
      <div className="post-page-header">
        <h1 className="post-page-title">
          <span className="title-icon">📝</span>
          게시판
        </h1>
        <p className="post-page-subtitle">자유롭게 의견을 나누는 공간입니다.</p>
      </div>

      {/* VotePage 스타일의 액션 버튼들 */}
      <div className="post-action-buttons">
        <button 
          className="search-toggle-btn"
          onClick={toggleSearch}
        >
          🔍 {showSearch ? '검색 닫기' : '검색'}
        </button>
        <button 
          className="write-btn"
          onClick={() => navigate('/board/new')}
        >
          ✏️ 글 작성
        </button>
      </div>

      {/* 검색창을 조건부로 렌더링 */}
      {showSearch && (
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="제목으로 검색해주세요..."
                className="search-input"
              />
              {search && (
                <button 
                  type="button" 
                  className="clear-btn"
                  onClick={clearSearch}
                >
                  ✕
                </button>
              )}
            </div>
            <button 
              type="submit" 
              className="search-btn"
              disabled={searchLoading}
            >
              {searchLoading ? '🔄' : '🔍'}
            </button>
          </form>
        </div>
      )}

      <div className="post-list-content">
        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>게시글이 없습니다</h3>
            <p>로그인 하지 않으면 글을 볼 수 없습니다.</p>
            <button 
              className="empty-write-btn"
              onClick={() => navigate('/board/new')}
            >
              글 작성하기
            </button>
          </div>
        ) : (
          <>
            {/* 검색을 실행했을 때만 통계 표시 */}
            {hasSearched && (
              <div className="post-stats">
                <span>총 {posts.length}개의 게시글</span>
                {search && <span>'{search}' 검색 결과</span>}
              </div>
            )}
            
            <div className="post-list">
              {pagedPosts.map(post => (
                <div 
                  key={post.id} 
                  className={`post-item ${post.post_type}`}
                  onClick={() => navigate(`/board/${post.id}`)}
                >
                  <div className="post-main">
                    <div className="post-header">
                      <span className={`post-badge ${post.post_type}`}>
                        {post_type_kr[post.post_type] || post.post_type}
                      </span>
                      {post.post_type === 'announcement' && (
                        <span className="pin-icon">📌</span>
                      )}
                    </div>
                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-preview">
                      {post.content?.substring(0, 80)}
                      {post.content?.length > 80 && '...'}
                    </div>
                  </div>
                  <div className="post-meta">
                    <div className="post-author">
                      <span className="author-icon">👤</span>
                      {post.user_name || 'Unknown'}
                    </div>
                    <div className="post-date">
                      <span className="date-icon">🕒</span>
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  ⏪
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  ◀
                </button>
                
                <div className="pagination-info">
                  <span className="current-page">{page}</span>
                  <span className="page-separator">/</span>
                  <span className="total-pages">{totalPages}</span>
                </div>
                
                <button
                  className="pagination-btn"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  ▶
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  ⏩
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
