// src/pages/Admin/AdminPage.tsx

import { useNavigate } from 'react-router-dom';
import { withAdminAuth } from '../../services/adminHOC';
import './AdminPage.css';

function AdminPage() {
    const navigate = useNavigate();

    const adminMenus = [
        {
            title: '🎯 랭킹 순위 관리',
            description: '드래그 앤 드롭으로 티어와 순위를 조정합니다',
            path: '/admin/rank-edit',
            color: '#3b82f6'
        },
        {
            title: '👥 랭킹 참여자 관리',
            description: '랭킹 참여자를 추가하거나 삭제합니다',
            path: '/admin/rank-participant',
            color: '#06b6d4'
        },
        {
            title: '📝 게시글 관리',
            description: '게시글을 수정하고 관리합니다',
            path: '/admin/post-edit',
            color: '#10b981'
        },
        {
            title: '👥 리더 관리',
            description: '팀 리더 정보를 수정하고 관리합니다',
            path: '/admin/leader-edit',
            color: '#f59e0b'
        },
        {
            title: '✅ 사용자 승인',
            description: '신규 회원 가입을 승인하고 사용자를 삭제합니다',
            path: '/admin/login-approve',
            color: '#ef4444'
        },
        {
            title: '👑 관리자 권한',
            description: '사용자의 관리자 권한을 부여하거나 해제합니다',
            path: '/admin/manage',
            color: '#8b5cf6'
        },
        {
            title: '🎓 전공 관리',
            description: '전공 목록을 추가하고 관리합니다',
            path: '/admin/major-manage',
            color: '#ec4899'
        }
    ];

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="admin-title">⚙️ 관리자 페이지</h1>
                <p className="admin-subtitle">시스템 관리 및 설정</p>
            </div>

            <div className="admin-menu-grid">
                {adminMenus.map((menu, index) => (
                    <div 
                        key={index} 
                        className="admin-menu-card"
                        onClick={() => window.open(menu.path, '_blank')}
                        style={{ borderTopColor: menu.color }}
                    >
                        <div className="menu-icon" style={{ background: `${menu.color}15` }}>
                            <span style={{ color: menu.color }}>{menu.title.split(' ')[0]}</span>
                        </div>
                        <h3 className="menu-title">{menu.title}</h3>
                        <p className="menu-description">{menu.description}</p>
                        <div className="menu-arrow">→</div>
                    </div>
                ))}
            </div>

            <div className="admin-footer">
                <button 
                    className="back-home-btn"
                    onClick={() => navigate('/')}
                >
                    🏠 홈으로 돌아가기
                </button>
            </div>
        </div>
    );
}

export default withAdminAuth(AdminPage);