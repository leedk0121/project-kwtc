import { Link } from 'react-router-dom';
import './HeaderRegister.css';
import { useUserProfile } from './HeaderRegister/hooks';

function HeaderRegister() {
  const { user, profile } = useUserProfile();

  return (
    <div>
      {user && profile ? (
        <Link className='login_link' id='header_profile_button' to="/profile/my">
          <div className='header_profile_container'>
            <div className='header_profile_info'>
              <div id='header_profile_major'>{profile.major}</div>
              {profile.name}
            </div>
            <div className='header_profile_image'>
              <img src={profile.image_url} alt={`${profile.name} 프로필`} />
            </div>
          </div>
        </Link>
      ) : (
        <Link className='login_link' id='login-register_button' to="/login">
          login/register
        </Link>
      )}
    </div>
  );
}

export default HeaderRegister;
