import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../pages/Auth/supabaseClient';
import './HeaderRegister.css'

function HeaderRegister() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ name: string, major: string, stnum: number, image_url: string } | null>(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
            setProfile(null);
            return;
        }

        // 로컬 스토리지에서 사용자 정보 가져오기
        const userName = localStorage.getItem('user_name');
        const userMajor = localStorage.getItem('user_major');
        const userStnum = localStorage.getItem('user_stnum');
        const userImageUrl = localStorage.getItem('user_image_url');

        setProfile({ 
            name: userName || '', 
            major: userMajor || '', 
            stnum: parseInt(userStnum || '0'), 
            image_url: userImageUrl || ''
        });
    };
    fetchUserAndProfile();
  }, []);

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
              <img src={profile.image_url}/>
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