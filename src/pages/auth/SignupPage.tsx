import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.tsx';
import './SignupPage.css';
import { useNavigate } from 'react-router-dom';

const tennisPlayers = [
  "페더러", "나달", "조코비치", "머레이", "알카라즈", "프리츠", "치치파스","루네","벤 쉘튼", "즈베레프"
];

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [stnum, setstnum] = useState('');
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');
  const [playerIdx, setPlayerIdx] = useState(0);
  const [departments, setDepartments] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerIdx(prev => (prev + 1) % tennisPlayers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('major_list')
        .select('major_name')
        .order('major_name', { ascending: true });
      
      if (error) {
        console.error('학과 목록을 불러오는데 실패했습니다:', error);
        return;
      }
      
      if (data) {
        setDepartments(data.map(item => item.major_name));
      }
    };

    fetchDepartments();
  }, []);

  const handleSignup = async () => {
    if (!email.includes('@')) {
      alert('올바른 이메일을 입력하세요.');
      return;
    }
    if (password.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (!birthday) {
      alert('생년월일을 입력하세요.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
      return;
    }

    const userId = data?.user?.id;
    if (!userId) {
      alert('회원가입 후 사용자 정보를 가져올 수 없습니다.');
      return;
    }

    const { error: insertError } = await supabase.from('profile').insert([
      { 
        id: userId, 
        email, 
        name, 
        major, 
        birthday,
        phone, 
        stnum,
        image_url: "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png"
      }
    ]);
    if (insertError) {
      alert(insertError.message);
      return;
    }

    const { error: reservationError } = await supabase.from('tennis_reservation_profile').insert([
      { 
        user_id: userId
      }
    ]);
    if (reservationError) {
      console.error('예약 프로필 생성 실패:', reservationError);
    }

    alert('회원가입이 완료되었습니다! 관리자 승인 이후 로그인 가능합니다.');
    navigate('/login');
  };

  return (
    <div className="register-info-container">
      <div className="signup-form-card">
        <h2>🎾 광운대 <span className='tennis_player'>"{tennisPlayers[playerIdx]}"</span> 되기</h2>
        
        <div className="input-group">
          <div className="input-label">E-mail</div>
          <input type="email" placeholder="이메일을 입력하세요" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        
        <div className="input-group">
          <div className="input-label">비밀번호</div>
          <input type="password" placeholder="비밀번호는 최소 6자리" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        
        <div className="input-group">
          <div className="input-label">이름</div>
          <input type="text" placeholder="이름을 입력하세요" value={name} onChange={e => setName(e.target.value)} />
        </div>
        
        <div className="input-group">
          <div className="input-label">학과</div>
          <select value={major} onChange={e => setMajor(e.target.value)}>
            <option value="">학과를 선택하세요</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        
        <div className="input-group">
          <div className="input-label">학번</div>
          <input type="number" placeholder="학번을 입력하세요" value={stnum} onChange={e => setstnum(e.target.value)} />
        </div>
        
        <div className="input-group">
          <div className="input-label">생년월일</div>
          <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
        </div>
        
        <div className="input-group">
          <div className="input-label">전화번호</div>
          <input type="text" placeholder="전화번호를 입력하세요 (예: 01012345678)" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        
        <div className="button-center">
          <button id="register_button" onClick={handleSignup}>회원가입</button>
        </div>
      </div>
    </div>
  );
}

export default Signup;