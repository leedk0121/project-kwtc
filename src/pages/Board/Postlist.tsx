import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../Auth/supabaseClient';
import { usePosts } from './hooks';
import { POST_TYPE_KR, formatDate } from './utils';
import './Postlist.css';

export function PostList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const POSTS_PER_PAGE = 10;
  const navigate = useNavigate();

  const { posts, loading, fetchPosts, searchPosts } = usePosts();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      fetchPosts();
      setHasSearched(false);
      return;
    }

    setSearchLoading(true);
    setHasSearched(true);
    await searchPosts(search);
    setPage(1);
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
      setSearch("");
      setHasSearched(false);
      fetchPosts();
      setPage(1);
    }
  };

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const pagedPosts = useMemo(() =>
    posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE),
    [posts, page]
  );

  if (loading && posts.length === 0) {
    return (
      <div className="board-list-container">
        <div className="board-loading-wrapper">
          <div className="board-loading-spinner"></div>
          <p>게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='board-list-container'>
      <div className="board-page-header">
        <h1 className="board-page-title">
          <span className="board-title-icon">📝</span>
          KWTC 게시판
        </h1>
        <p className="board-page-subtitle">KWTC에 대한 다양한 정보를 공유해보세요</p>
      </div>

      <div className="board-action-buttons">
        <button
          className="board-search-toggle-btn"
          onClick={toggleSearch}
        >
          🔍 {showSearch ? '검색 닫기' : '검색'}
        </button>
        <button
          className="board-write-btn"
          onClick={() => {
            if (!userId) {
              alert('로그인이 필요한 서비스입니다.');
              navigate('/login');
              return;
            }
            navigate('/board/new');
          }}
        >
          ✏️ 글 작성
        </button>
      </div>

      {showSearch && (
        <div className="board-search-section">
          <form onSubmit={handleSearch} className="board-search-form">
            <div className="board-search-input-wrapper">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="제목으로 검색해주세요..."
                className="board-search-input"
              />
              {search && (
                <button
                  type="button"
                  className="board-clear-btn"
                  onClick={clearSearch}
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="board-search-btn"
              disabled={searchLoading}
            >
              {searchLoading ? '🔄' : '🔍'}
            </button>
          </form>
        </div>
      )}

      <div className="board-list-content">
        {posts.length === 0 ? (
          <div className="board-empty-state">
            <div className="board-empty-icon">📭</div>
            <h3>게시글이 없습니다</h3>
            <p>로그인 하지 않으면 글을 볼 수 없습니다.</p>
            <button
              className="board-empty-write-btn"
              onClick={() => {
                if (!userId) {
                  alert('로그인이 필요한 서비스입니다.');
                  navigate('/login');
                  return;
                }
                navigate('/board/new');
              }}
            >
              글 작성하기
            </button>
          </div>
        ) : (
          <>
            {hasSearched && (
              <div className="board-post-stats">
                <span>총 {posts.length}개의 게시글</span>
                {search && <span>'{search}' 검색 결과</span>}
              </div>
            )}

            <div className="board-list">
              {pagedPosts.map(post => (
                <div
                  key={post.id}
                  className={`board-item board-${post.post_type}`}
                  onClick={() => navigate(`/board/${post.id}`)}
                >
                  <div className="board-main">
                    <div className="board-header">
                      <span className={`board-badge board-${post.post_type}`}>
                        {POST_TYPE_KR[post.post_type] || post.post_type}
                      </span>
                      {post.post_type === 'announcement' && (
                        <span className="board-pin-icon">📌</span>
                      )}
                    </div>
                    <h3 className="board-title">{post.title}</h3>
                    <div className="board-preview">
                      {post.content?.substring(0, 80)}
                      {post.content?.length > 80 && '...'}
                    </div>
                  </div>
                  <div className="board-meta">
                    <div className="board-author">
                      <span className="board-author-icon">👤</span>
                      {post.user_name || 'Unknown'}
                    </div>
                    <div className="board-date">
                      <span className="board-date-icon">🕒</span>
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="board-pagination">
                <button
                  className="board-pagination-btn"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  ⏪
                </button>
                <button
                  className="board-pagination-btn"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  ◀
                </button>

                <div className="board-pagination-info">
                  <span className="board-current-page">{page}</span>
                  <span className="board-page-separator">/</span>
                  <span className="board-total-pages">{totalPages}</span>
                </div>

                <button
                  className="board-pagination-btn"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  ▶
                </button>
                <button
                  className="board-pagination-btn"
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
