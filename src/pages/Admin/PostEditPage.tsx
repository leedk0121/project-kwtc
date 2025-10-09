import { useEffect, useState } from "react";
import { supabase } from "../auth/supabaseClient.tsx";
import './PostEditPage.css';

function PostEditPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [checkedIds, setCheckedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async (title?: string) => {
        setLoading(true);
        let query = supabase
            .from('posts')
            .select('id, title, created_at, user_name, post_type')
            .order('created_at', { ascending: false });
        if (title && title.trim() !== "") {
            query = query.ilike('title', `%${title}%`);
        }
        const { data, error } = await query;
        if (!error && data) setPosts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPosts(search);
    };

    const handleCheck = (id: string, checked: boolean) => {
        setCheckedIds(prev => checked ? [...prev, id] : prev.filter(_id => _id !== id));
    };

    const handleSelectAll = () => {
        if (checkedIds.length === posts.length) {
            setCheckedIds([]);
        } else {
            setCheckedIds(posts.map(post => post.id));
        }
    };

    const handleDelete = async () => {
        if (checkedIds.length === 0) return alert('삭제할 게시글을 선택하세요.');
        
        if (!window.confirm(`선택한 ${checkedIds.length}개의 게시글을 삭제하시겠습니까?`)) return;

        const { error } = await supabase
            .from('posts')
            .delete()
            .in('id', checkedIds);
        if (error) alert('삭제 실패: ' + error.message);
        else {
            alert('삭제되었습니다.');
            setCheckedIds([]);
            fetchPosts(search);
        }
    };

    const getPostTypeLabel = (type: string) => {
        const typeMap: { [key: string]: { label: string; color: string } } = {
            'notice': { label: '공지', color: '#ef4444' },
            'free': { label: '자유', color: '#3b82f6' },
            'question': { label: '질문', color: '#10b981' },
            'info': { label: '정보', color: '#f59e0b' }
        };
        return typeMap[type] || { label: type, color: '#6b7280' };
    };

    if (loading) {
        return (
            <div className="postedit-container">
                <div className="loading-message">게시글을 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="postedit-container">
            <div className="postedit-header">
                <h1 className="postedit-title">📝 게시글 관리</h1>
                <p className="postedit-subtitle">총 {posts.length}개의 게시글</p>
            </div>

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
                        {checkedIds.length === posts.length ? '✓ 전체 해제' : '☑ 전체 선택'}
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
                    {posts.map(post => (
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
                                            background: `${getPostTypeLabel(post.post_type).color}15`,
                                            color: getPostTypeLabel(post.post_type).color,
                                            border: `1px solid ${getPostTypeLabel(post.post_type).color}40`
                                        }}
                                    >
                                        {getPostTypeLabel(post.post_type).label}
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
                    ))}
                </div>
            )}
        </div>
    );
}

export default PostEditPage;
