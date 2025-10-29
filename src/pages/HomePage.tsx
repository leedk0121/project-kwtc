import './HomePage.css';
import { Link } from 'react-router-dom';
import HeaderRegister from '../components/HeaderRegister';

function HomePage() {

    return (
        <div className="page_home">
            <img id='Homepage-kwtclogo' src="/kwtclogo.png" />
            <div className='Home_Link_container'>
                <Link className='Home_action_link' id='Home_board_button' to="/board">게시판</Link>
                <Link className='Home_action_link' id='Home_ranking_button' to="/ranking">랭킹</Link>
                <Link className='Home_action_link' id='Home_intro_button' to="/intro">소개</Link>
                <Link className='Home_action_link' id='Home_vote_button' to="/event">일정</Link>
            </div>
            <div className='club_name' id='home_club_name'>KWANGWOON UNIVERSITY TENNIS CLUB</div>
            <HeaderRegister />
        </div>
    );
}
export default HomePage;