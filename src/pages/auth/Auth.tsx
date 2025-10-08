import { useState } from 'react';
import { supabase } from './supabaseClient.tsx';
import type { User } from '@supabase/supabase-js';
// import { User } from './types.tsx';
import { useNavigate } from 'react-router-dom';
import "./Auth.css";


function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // 로그인
  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      // 프로필에서 이름과 학과 가져오기
      const { user } = data;
      const { data: profileData, error: profileError } = await supabase
        .from('profile') // 실제 테이블명에 맞게 수정
        .select('name, major, stnum, image_url') // name과 major 필드 선택
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        // 로컬 스토리지에 사용자 정보 저장
        localStorage.setItem('user_id', user.id);
        localStorage.setItem('user_name', profileData.name || '');
        localStorage.setItem('user_major', profileData.major || '');
        localStorage.setItem('user_stnum', profileData.stnum || 0);
        localStorage.setItem('user_image_url', profileData.image_url || '');

        alert(`${profileData.name}님 환영합니다.`);
      } else {
        // 프로필 정보가 없는 경우에도 user_id는 저장
        localStorage.setItem('user_id', user.id);
        alert('로그인 성공');
      }
      setUser(user);
      window.location.replace('/');
    }
  };

  // 로그아웃
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
    else {
      setUser(null);
      // 로그아웃 시 로컬 스토리지 정리
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_major');
      localStorage.removeItem('user_stnum');
      localStorage.removeItem('user_image_url');
    }
  };

  // 비밀번호 재설정
  const handlePasswordReset = async () => {
    if (!email) {
      alert('이메일 칸에 이메일을 입력해주세요.');
      return;
    }
    if (!email.includes('@')) {
      alert('올바른 이메일을 입력하세요.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      alert(error.message);
      return;
    }
    alert('비밀번호 재설정 메일이 발송되었습니다.');
  };

  return (
    <div className="auth-container">
      <div className="auth-form-card">
        <div className="auth-header">
          <h1 className="auth-title">
            🎾 KWTC
          </h1>
          <p className="auth-subtitle">로그인하여 모든 서비스를 확인하세요</p>
        </div>

        <div className="input-row">
          <div className="input-col">
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button id="login_button" onClick={signIn}>로그인</button>
        </div>

        <div className="pw-reset-link">
          <a href="#" onClick={e => { e.preventDefault(); handlePasswordReset(); }}>
            비밀번호를 잊으셨나요?
          </a>
        </div>

        <div className="auth-divider">
          <span>또는</span>
        </div>

        <button id="signup_button" onClick={() => navigate('/signup')}>
          회원가입
        </button>
      </div>
    </div>
  );
}

export default Auth;