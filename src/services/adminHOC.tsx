// src/services/adminHOC.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from './adminService';

/**
 * Admin 페이지 접근 제어를 위한 HOC (Higher Order Component)
 */
export const withAdminAuth = (Component: React.ComponentType) => {
  return (props: any) => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      verifyAdmin();
    }, []);

    const verifyAdmin = async () => {
      try {
        const isAdmin = await adminService.checkIsAdmin();
        
        if (!isAdmin) {
          alert('관리자만 접근할 수 있습니다.');
          navigate('/');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('권한 확인 오류:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          권한 확인 중...
        </div>
      );
    }

    if (!isAuthorized) {
      return null;
    }

    return <Component {...props} />;
  };
};