import './HomePage.css';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import HeaderRegister from '../components/HeaderRegister';

interface NavLink {
  id: string;
  to: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { id: 'Home_board_button', to: '/board', label: '게시판' },
  { id: 'Home_ranking_button', to: '/ranking', label: '랭킹' },
  { id: 'Home_intro_button', to: '/intro', label: '소개' },
  { id: 'Home_vote_button', to: '/event', label: '일정' }
];

function HomePage() {
  useEffect(() => {
    // 홈 화면에서만 html, body 배경색을 브라운으로 변경
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    const originalBodyBg = document.body.style.backgroundColor;
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.setProperty('background-color', '#A52A2A', 'important');
    document.body.style.setProperty('background-color', '#A52A2A', 'important');

    return () => {
      // 다른 페이지로 이동 시 원래대로 복원
      document.body.style.overflow = originalOverflow || 'visible';
      document.documentElement.style.backgroundColor = originalHtmlBg || 'white';
      document.body.style.backgroundColor = originalBodyBg || 'white';
    };
  }, []);

  return (
    <div className="page_home">
      <img
        id='Homepage-kwtclogo'
        src="/kwtclogo.png"
        alt="KWTC Logo"
      />
      <div className='Home_Link_container'>
        {NAV_LINKS.map(link => (
          <Link
            key={link.id}
            className='Home_action_link'
            id={link.id}
            to={link.to}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className='club_name' id='home_club_name'>
        KWANGWOON UNIVERSITY TENNIS CLUB
      </div>
      <HeaderRegister />
    </div>
  );
}

export default HomePage;
