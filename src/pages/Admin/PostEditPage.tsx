import { useEffect, useState } from "react";
import { supabase } from "../auth/supabaseClient.tsx";
import './PostEditPage.tsx';

function PostEditPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [checkedIds, setCheckedIds] = useState<string[]>([]);

    const fetchPosts = async (title?: string) => {
        let query = supabase
            .from('posts')
            .select('id, title, created_at, user_name, post_type')
            .order('created_at', { ascending: false });
        if (title && title.trim() !== "") {
            query = query.ilike('title', `%${title}%`);
        }
        const { data, error } = await query;
        if (!error && data) setPosts(data);
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

    const handleDelete = async () => {
        if (checkedIds.length === 0) return alert('삭제할 게시글을 선택하세요.');
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

    return (
        <div>
            <h1>Post Edit Page</h1>
            <form onSubmit={handleSearch} className="postedit-search-bar">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="제목으로 검색"
                    className="postedit-search-input"
                />
                <button type="submit" className="postedit-search-btn">검색</button>
                <button
                    type="button"
                    onClick={handleDelete}
                    className="postedit-delete-btn"
                >
                    삭제
                </button>
            </form>
            <div className="postedit-list-scroll">
                <ul className="postedit-list">
                    {posts.map(post => (
                        <li key={post.id} className="postedit-list-item">
                            <div>
                                <div><strong>제목:</strong> {post.title}</div>
                                <div><strong>작성일:</strong> {new Date(post.created_at).toLocaleString('ko-KR')}</div>
                                <div><strong>작성자:</strong> {post.user_name}</div>
                                <div><strong>타입:</strong> {post.post_type}</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={checkedIds.includes(post.id)}
                                onChange={e => handleCheck(post.id, e.target.checked)}
                                className="postedit-checkbox"
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default PostEditPage;
