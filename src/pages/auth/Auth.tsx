import { useState } from 'react';
import { supabase } from './supabaseClient.tsx';
import type { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import "./Auth.css";


function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // 로그인 (Edge Function 사용)
  const signIn = async () => {
    try {
      // Edge Function 호출
      const { data, error } = await supabase.functions.invoke('check-approved-login', {
        body: {
          email: email,
          password: password
        }
      });

      // Edge Function에서 에러 응답 (401, 403, 404, 500 등)
      if (error) {
        // error.context가 Response 객체인 경우 body 파싱
        if (error.context && error.context instanceof Response) {
          try {
            const errorBody = await error.context.json();
            
            // approved가 false인 경우
            if (errorBody.approved === false) {
              alert(errorBody.message || '관리자에게 승인을 요청하세요.');
              return;
            }
            
            // 기타 에러 메시지
            alert(errorBody.message || '로그인에 실패했습니다.');
            return;
          } catch (parseError) {
            // 파싱 실패 시 아무것도 하지 않음
          }
        }
        
        // Response 객체가 아니거나 파싱 실패한 경우
        alert('로그인 중 오류가 발생했습니다.');
        return;
      }

      // data가 없는 경우
      if (!data) {
        alert('서버 응답이 없습니다.');
        return;
      }

      // 승인되지 않은 사용자 (approved: false)
      if (data.approved === false) {
        alert(data.message || '관리자에게 승인을 요청하세요.');
        return;
      }

      // 로그인 실패 (이메일/비밀번호 오류 등)
      if (data.success === false) {
        alert(data.message || '로그인에 실패했습니다.');
        return;
      }

      // 로그인 성공 - approved가 true인 경우
      if (data.success === true && data.approved === true) {
        const { user, session } = data;
        
        // 🔑 중요: 세션 설정
        if (session) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          });
          
          if (sessionError) {
            alert('세션 설정에 실패했습니다.');
            return;
          }
        }
        
        // 이제 세션이 설정되었으므로 profile 조회 가능
        const { data: profileData, error: profileError } = await supabase
          .from('profile')
          .select('name, major, stnum, image_url')
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
      } else {
        // 예상치 못한 응답 구조
        alert('예상치 못한 응답입니다.');
      }

    } catch (err) {
      alert('예상치 못한 오류가 발생했습니다.');
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