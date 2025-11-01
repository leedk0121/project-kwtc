import './Header.css';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HeaderRegister from './components/HeaderRegister.tsx';

function Header() {
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const width = window.innerWidth;
            const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;

            if (width <= 768) { // 모바일 환경
                if (scrollY > 10) {
                    setIsScrolled(true);
                } else {
                    setIsScrolled(false);
                }
            } else {
                setIsScrolled(false); // 데스크톱에서는 항상 false
            }
        };

        // 초기 실행
        handleScroll();

        // 여러 방식으로 스크롤 이벤트 감지
        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    // location 변경 시 스크롤 위치 리셋
    useEffect(() => {
        setIsScrolled(false);
    }, [location.pathname]);

    let pageText = '';
    if (location.pathname.startsWith('/board')) {
        pageText = 'BOARD';
    }
    else if (location.pathname.startsWith('/event')) {
        pageText = 'PARTICIPATE';
    } else {
        switch (location.pathname) {
            case '/ranking':
                pageText = 'RANKING';
                break;
            case '/ranking/edit':
                pageText = 'EDIT';
                break;
            case '/intro':
                pageText = 'INTRO';
                break;
            case '/login':
                pageText = 'LOGIN';
                break;
            case '/signup':
                pageText = 'SIGNUP';
                break;
            case '/profile/my':
                pageText = 'PROFILE';
                break;
            default:
                pageText = '';
        }
    }

    return (
        <div className={`header_container ${isScrolled ? 'scrolled' : ''}`}>
            <div className='content_container'>
                <img src='kwtc_initial_logo.png' className='logo' />
                <div className="background_circle"></div>
                <div className="logo_background_circle"></div>
                <div className='club_name' id='header_club_name'>
                    <div id ='club_initial'>KWTC</div>
                    <div id ='club_full_name'>KwangWoon Tennis Club</div>
                </div>
                <div id='current_page'>
                    {pageText === 'BOARD' && <span className="page_board">BOARD</span>}
                    {pageText === 'RANKING' && <span className="page_ranking">RANKING</span>}
                    {pageText === 'INTRO' && <span className="page_intro">INTRO</span>}
                    {pageText === 'PARTICIPATE' && <span className="page_participate">EVENT</span>}
                    {pageText === 'LOGIN' && <span className="page_login">LOGIN</span>}
                    {pageText === 'SIGNUP' && <span className="page_signup">REGISTER</span>}
                    {pageText === 'PROFILE' && <span className="page_profile">PROFILE</span>}
                    {pageText === 'EDIT' && <span className="page_edit">EDIT</span>}
                </div>
            </div>
            <div className={`Link_container ${isScrolled ? 'hidden' : ''}`}>
                <Link className='action_link' id='board_button' to="/board">게시판</Link>
                <Link className='action_link' id='ranking_button' to="/ranking">랭킹</Link>
                <Link className='action_link' id='intro_button' to="/intro">소개</Link>
                <Link className='action_link' id='vote_button' to="/event">일정</Link>
            </div>
            <div>
                <Link className='home_link' id='home_button' to="/">  
                    <img
                        src="/home-btn.png"
                        alt="Home"
                        style={{ width: 28, height: 28, verticalAlign: 'middle' }}
                    />
                </Link>
            </div>
            <div className='login_register_container'>
                <HeaderRegister />
            </div>
        </div>
    );
}
export default Header;