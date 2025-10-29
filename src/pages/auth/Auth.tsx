import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks';
import "./Auth.css";

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { signIn, resetPassword, loading } = useAuth();

  const handleSignIn = async () => {
    const result = await signIn(email, password);

    if (result.success) {
      alert(result.message);
      window.location.replace('/');
    } else {
      alert(result.message);
    }
  };

  const handlePasswordReset = async () => {
    const result = await resetPassword(email);
    alert(result.message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignIn();
    }
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
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>
          <button
            id="login_button"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
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
