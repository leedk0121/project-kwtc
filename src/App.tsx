import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './Header';
import BoardPage from './pages/Board/BoardPage.tsx';
import RankingPage from './pages/RankingPage.tsx';
import IntroPage from './pages/Intro/IntroPage.tsx';
import VotePage from './pages/Vote/VotePage.tsx';
import HomePage from './pages/HomePage.tsx'
;
import Auth from './pages/auth/Auth.tsx';
import Signup from './pages/auth/SignupPage.tsx';
import ProfilePage from './pages/auth/ProfilePage.tsx';
import { NewPost } from './pages/Board/NewPost';
import { PostDetail } from './pages/Board/PostDetail';

import UnifiedreservationPage from './pages/reservation/UnifiedreservationPage.tsx';
import VoteAdd from './pages/Vote/VoteaddPage.tsx';
import ReservationProfile from './pages/reservation/ReservationProfile';

import AdminPage from './pages/Admin/AdminPage.tsx';
import RankedEditPage from './pages/Admin/RankeditPage.tsx';
import PostEditPage from './pages/Admin/PostEditPage.tsx';
import LeadereditPage from './pages/Admin/LeadereditPage.tsx';
import LoginApprove from './pages/Admin/Loginapprovepage.tsx';
import './App.css';

function AppRoutes() {
    const location = useLocation();
    const isRankEdit = location.pathname === "/ranking/edit";
    const isAdmin = location.pathname === "/admin";
    const isPostEdit = location.pathname === "/post/edit";
    const isLeaderEdit = location.pathname === "/leader/edit";

    if (isRankEdit) {
        // 랭킹에딧 페이지는 헤더, page_content 없이 단독 렌더링
        return <RankedEditPage />;
    }
    else if (isAdmin) {
        // Admin 페이지는 헤더, page_content 없이 단독 렌더링
        return <AdminPage />;
    }
    else if (isPostEdit) {
        // 게시글 수정 페이지는 헤더, page_content 없이 단독 렌더링
        return <PostEditPage />;
    }
    else if (location.pathname === "/reservation") {
        // 통합 예약 페이지는 헤더, page_content 없이 단독 렌더링
        return <UnifiedreservationPage />;
    }
    else if (location.pathname === "/reservation/profile") {
        // 예약 프로필 페이지는 헤더, page_content 없이 단독 렌더링
        return <ReservationProfile />;
    }
    else if (isLeaderEdit) {
        // 리더 수정 페이지는 헤더, page_content 없이 단독 렌더링
        return <LeadereditPage />;
    }
    else if (location.pathname === "/admin/login-approve") {
        // 로그인 승인 페이지는 헤더, page_content 없이 단독 렌더링
        return <LoginApprove />;
    }

    return (
        <>
            <Header />
            <div className="page_content">
                <Routes>
                    <Route path="/board" element={<BoardPage />} />
                    <Route path="/board/:id" element={<PostDetail />} />
                    <Route path="/ranking" element={<RankingPage />} />
                    <Route path="/intro" element={<IntroPage />} />
                    <Route path="/participate" element={<VotePage />} />
                    <Route path="/login" element={<Auth />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/profile/my" element={<ProfilePage />} />
                    <Route path="/board/new" element={<NewPost />} />
                    <Route path='/participate/add' element={<VoteAdd />} />
                </Routes>
            </div>
        </>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="*" element={<AppRoutes />} />
            </Routes>
        </Router>
    );
}

export default App;
