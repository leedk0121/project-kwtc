import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.tsx';
import './SignupPage.css';
import { useNavigate } from 'react-router-dom';

const tennisPlayers = [
  "페더러", "나달", "조코비치", "머레이", "알카라즈", "프리츠", "치치파스","루네","벤 쉘튼", "즈베레프"
  // 원하는 선수 이름을 추가하세요
];

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [stnum, setstnum] = useState('');
  const [age, setAge] = useState('');
  const [career, setCareer] = useState('');
  const [phone, setPhone] = useState('');
  const [playerIdx, setPlayerIdx] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerIdx(prev => (prev + 1) % tennisPlayers.length);
    }, 5000); // 5초마다 변경
    return () => clearInterval(interval);
  }, []);

  const departments = [
    "전자공학과",
    "전자융합공학과",
    "전자재료공학과",
    "전자통신공학과",
    "전기공학과",
    "반도체시스템공학부",
    "컴퓨터정보공학부",
    "정보융합학부",
    "지능형로봇학과",
    "소프트웨어학부",
    "로봇학부(AI로봇전공, 정보제어.지능시스템전공)",
    "건축공학과",
    "환경공학과",
    "화학공학과",
    "건축학과",
    "수학과",
    "화학과",
    "전자바이오물리학과",
    "스포츠융합과학과",
    "국어국문학과",
    "영어산업학과",
    "미디어커뮤니케이션학부",
    "산업심리학과",
    "동북아문화산업학부",
    "행정학과",
    "법학부",
    "국제학부",
    "경영학부",
    "국제통상학부"

    // 필요한 학과를 추가하세요
];

  const handleSignup = async () => {
    if (!email.includes('@')) {
      alert('올바른 이메일을 입력하세요.');
      return;
    }
    if (password.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    // 회원가입 (이메일/비밀번호)
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    // user id 가져오기
    const userId = data?.user?.id;
    if (!userId) {
      alert('회원가입 후 사용자 정보를 가져올 수 없습니다.');
      return;
    }
    // 추가 정보 저장 (profile 테이블에 user_id 포함)
    const { error: insertError } = await supabase.from('profile').insert([
      { 
        id: userId, 
        email, 
        name, 
        major, 
        age, 
        career, 
        phone, 
        stnum,
        image_url: "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png"
      }
    ]);
    if (insertError) {
      alert(insertError.message);
      return;
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
          <div className="input-label">나이</div>
          <input type="number" placeholder="나이를 입력하세요" value={age} onChange={e => setAge(e.target.value)} />
        </div>
        
        <div className="input-group">
          <div className="input-label">전화번호</div>
          <input type="text" placeholder="전화번호를 입력하세요 (예: 010-1234-5678)" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        
        <div className="button-center">
          <button id="register_button" onClick={handleSignup}>회원가입</button>
        </div>
      </div>
    </div>
  );
}

export default Signup;