import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../Auth/supabaseClient";
import { withAdminAuth } from '../../services/adminHOC';
import { AdminLayout } from './components';
import LoadingSpinner from '../../components/LoadingSpinner';
import './PostEditPage.css';

interface Post {
  id: string;
  title: string;
  created_at: string;
  user_name: string;
  post_type: string;
}

const POST_TYPE_MAP: { [key: string]: { label: string; color: string } } = {
  'notice': { label: '공지', color: '#ef4444' },
  'free': { label: '자유', color: '#3b82f6' },
  'question': { label: '질문', color: '#10b981' },
  'info': { label: '정보', color: '#f59e0b' }
};

function PostEditPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async (title?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('id, title, created_at, user_name, post_type')
        .order('created_at', { ascending: false });

      if (title && title.trim() !== "") {
        query = query.ilike('title', `%${title}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('게시글 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(search);
  }, [search, fetchPosts]);

  const handleCheck = useCallback((id: string, checked: boolean) => {
    setCheckedIds(prev => checked ? [...prev, id] : prev.filter(_id => _id !== id));
  }, []);

  const handleSelectAll = useCallback(() => {
    if (checkedIds.length === posts.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(posts.map(post => post.id));
    }
  }, [checkedIds.length, posts]);

  const handleDelete = useCallback(async () => {
    if (checkedIds.length === 0) {
      alert('삭제할 게시글을 선택하세요.');
      return;
    }

    if (!window.confirm(`선택한 ${checkedIds.length}개의 게시글을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .in('id', checkedIds);

      if (error) throw error;

      alert('삭제되었습니다.');
      setCheckedIds([]);
      fetchPosts(search);
    } catch (error: any) {
      alert('삭제 실패: ' + error.message);
    }
  }, [checkedIds, search, fetchPosts]);

  const getPostTypeLabel = useCallback((type: string) => {
    return POST_TYPE_MAP[type] || { label: type, color: '#6b7280' };
  }, []);

  const isAllSelected = useMemo(() =>
    posts.length > 0 && checkedIds.length === posts.length,
    [posts.length, checkedIds.length]
  );

  if (loading) {
    return (
      <div className="postedit-container">
        <LoadingSpinner message="게시글을 불러오는 중..." />
      </div>
    );
  }

  return (
    <AdminLayout
      title="📝 게시글 관리"
      subtitle={`총 ${posts.length}개의 게시글`}
      backPath="/admin"
    >
      <div className="postedit-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="제목으로 검색..."
            className="search-input"
          />
          <button type="submit" className="search-btn">🔍 검색</button>
        </form>

        <div className="action-buttons">
          <button
            type="button"
            onClick={handleSelectAll}
            className="select-all-btn"
          >
            {isAllSelected ? '✓ 전체 해제' : '☑ 전체 선택'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="delete-btn"
            disabled={checkedIds.length === 0}
          >
            🗑️ 삭제 ({checkedIds.length})
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>게시글이 없습니다.</p>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map(post => {
            const typeInfo = getPostTypeLabel(post.post_type);
            return (
              <div
                key={post.id}
                className={`post-card ${checkedIds.includes(post.id) ? 'selected' : ''}`}
              >
                <div className="post-checkbox">
                  <input
                    type="checkbox"
                    checked={checkedIds.includes(post.id)}
                    onChange={e => handleCheck(post.id, e.target.checked)}
                    id={`check-${post.id}`}
                  />
                  <label htmlFor={`check-${post.id}`}></label>
                </div>

                <div className="post-content">
                  <div className="post-header">
                    <h3 className="post-title">{post.title}</h3>
                    <span
                      className="post-type-badge"
                      style={{
                        background: `${typeInfo.color}15`,
                        color: typeInfo.color,
                        border: `1px solid ${typeInfo.color}40`
                      }}
                    >
                      {typeInfo.label}
                    </span>
                  </div>

                  <div className="post-meta">
                    <span className="meta-item">
                      👤 {post.user_name}
                    </span>
                    <span className="meta-item">
                      📅 {new Date(post.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

export default withAdminAuth(PostEditPage);
