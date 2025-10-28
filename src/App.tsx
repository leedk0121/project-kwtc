import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Header';
import BoardPage from './pages/Board/BoardPage.tsx';
import RankingPage from './pages/RankingPage.tsx';
import IntroPage from './pages/Intro/IntroPage.tsx';
import VotePage from './pages/Vote/VotePage.tsx';
import HomePage from './pages/HomePage.tsx';
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
import AdminRoleManager from './pages/Admin/AdminRoleManager.tsx';
import MajorManagePage from './pages/Admin/MajorManagePage';
import './App.css';
import ReservationSuccessPage from './pages/reservation/ReservationSuccessPage';

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
    return (
        <Router>
            <Routes>
                {/* 홈페이지 - 레이아웃 없음 */}
                <Route path="/" element={<HomePage />} />

                {/* 헤더가 있는 일반 페이지들 */}
                <Route path="/board" element={<LayoutWithHeader><BoardPage /></LayoutWithHeader>} />
                <Route path="/board/:id" element={<LayoutWithHeader><PostDetail /></LayoutWithHeader>} />
                <Route path="/board/new" element={<LayoutWithHeader><NewPost /></LayoutWithHeader>} />
                <Route path="/ranking" element={<LayoutWithHeader><RankingPage /></LayoutWithHeader>} />
                <Route path="/intro" element={<LayoutWithHeader><IntroPage /></LayoutWithHeader>} />
                <Route path="/event" element={<LayoutWithHeader><VotePage /></LayoutWithHeader>} />
                <Route path="/event/add" element={<LayoutWithHeader><VoteAdd /></LayoutWithHeader>} />
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
                <Route path="/admin/post-edit" element={<PostEditPage />} />
                <Route path="/admin/leader-edit" element={<LeadereditPage />} />
                <Route path="/admin/major-manage" element={<MajorManagePage />} />
            </Routes>
        </Router>
    );
}

export default App;
