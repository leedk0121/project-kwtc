import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import ScrollToTop from './components/ScrollToTop';
import BoardPage from './pages/Board/BoardPage';
import RankingPage from './pages/Ranking/RankingPage';
import IntroPage from './pages/Intro/IntroPage';
import EventPage from './pages/Event/EventPage';
import HomePage from './pages/HomePage';
import Auth from './pages/Auth/Auth';
import Signup from './pages/Auth/SignupPage';
import ProfilePage from './pages/Auth/ProfilePage';
import { NewPost } from './pages/Board/NewPost';
import { PostDetail } from './pages/Board/PostDetail';
import UnifiedreservationPage from './pages/Reservation/UnifiedreservationPage';
import EventAdd from './pages/Event/EventAddPage';
import ReservationProfile from './pages/Reservation/ReservationProfile';
import AdminPage from './pages/Admin/AdminPage';
import RankedEditPage from './pages/Admin/RankeditPageDnD';
import RankParticipantPage from './pages/Admin/RankParticipantPage';
import PostEditPage from './pages/Admin/PostEditPage';
import LeadereditPage from './pages/Admin/LeadereditPage';
import LoginApprove from './pages/Admin/LoginApprovePage';
import AdminRoleManager from './pages/Admin/AdminRoleManager';
import MajorManagePage from './pages/Admin/MajorManagePage';
import './App.css';
import ReservationSuccessPage from './pages/Reservation/ReservationSuccessPage';

// 헤더가 있는 레이아웃
function LayoutWithHeader({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            <div className="page_content">
                {children}
            </div>
        </>
    );
}

function App() {
    useEffect(() => {
        // body의 unresolved 속성 제거 및 스크롤 강제 활성화
        const enableScroll = () => {
            document.body.removeAttribute('unresolved');
            document.body.style.overflow = 'visible';
            document.body.style.position = 'static';
            document.documentElement.style.overflow = 'visible';
        };

        // 즉시 실행
        enableScroll();

        // MutationObserver로 속성 변경 감지 및 자동 제거
        const observer = new MutationObserver(() => {
            if (document.body.hasAttribute('unresolved')) {
                enableScroll();
            }
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['unresolved']
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <Router>
            <ScrollToTop />
            <Routes>
                {/* 홈페이지 - 레이아웃 없음 */}
                <Route path="/" element={<HomePage />} />

                {/* 헤더가 있는 일반 페이지들 */}
                <Route path="/board" element={<LayoutWithHeader><BoardPage /></LayoutWithHeader>} />
                <Route path="/board/:id" element={<LayoutWithHeader><PostDetail /></LayoutWithHeader>} />
                <Route path="/board/new" element={<LayoutWithHeader><NewPost /></LayoutWithHeader>} />
                <Route path="/ranking" element={<LayoutWithHeader><RankingPage /></LayoutWithHeader>} />
                <Route path="/intro" element={<LayoutWithHeader><IntroPage /></LayoutWithHeader>} />
                <Route path="/event" element={<LayoutWithHeader><EventPage /></LayoutWithHeader>} />
                <Route path="/event/add" element={<LayoutWithHeader><EventAdd /></LayoutWithHeader>} />
                <Route path="/login" element={<LayoutWithHeader><Auth /></LayoutWithHeader>} />
                <Route path="/signup" element={<LayoutWithHeader><Signup /></LayoutWithHeader>} />
                <Route path="/profile/my" element={<LayoutWithHeader><ProfilePage /></LayoutWithHeader>} />

                {/* 레이아웃 없는 독립 페이지들 */}
                <Route path="/reservation" element={<UnifiedreservationPage />} />
                <Route path="/reservation/success" element={<ReservationSuccessPage />} />
                <Route path="/reservation/profile" element={<ReservationProfile />} />

                {/* 관리자 페이지들 - 레이아웃 없음 */}
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/login-approve" element={<LoginApprove />} />
                <Route path="/admin/manage" element={<AdminRoleManager />} />
                <Route path="/admin/rank-edit" element={<RankedEditPage />} />
                <Route path="/admin/rank-participant" element={<RankParticipantPage />} />
                <Route path="/admin/post-edit" element={<PostEditPage />} />
                <Route path="/admin/leader-edit" element={<LeadereditPage />} />
                <Route path="/admin/major-manage" element={<MajorManagePage />} />
            </Routes>
        </Router>
    );
}

export default App;
