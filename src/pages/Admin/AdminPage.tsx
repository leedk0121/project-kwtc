function AdminPage() {
    return (
        <div>
            <h1>Admin Page</h1>
            <button
                style={{ marginTop: '16px', padding: '8px 16px', fontSize: '16px' }}
                onClick={() => window.open('/ranking/edit', '_blank')}
            >
                랭킹 수정 페이지로 이동
            </button>
            <button
                style={{ marginTop: '16px', padding: '8px 16px', fontSize: '16px' }}
                onClick={() => window.open('/post/edit', '_blank')}
            >
                게시글 수정 페이지로 이동
            </button>
             <button
                style={{ marginTop: '16px', padding: '8px 16px', fontSize: '16px' }}
                onClick={() => window.open('/leader/edit', '_blank')}
            >
                리더 수정 페이지로 이동
            </button>
        </div>
    );
}

export default AdminPage;
