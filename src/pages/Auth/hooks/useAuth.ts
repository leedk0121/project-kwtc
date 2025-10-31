import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

interface UserStorage {
  user_id: string;
  user_name: string;
  user_major: string;
  user_stnum: string;
  user_image_url: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const saveToLocalStorage = useCallback((data: Partial<UserStorage>) => {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        localStorage.setItem(key, String(value));
      }
    });
  }, []);

  const clearLocalStorage = useCallback(() => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_major');
    localStorage.removeItem('user_stnum');
    localStorage.removeItem('user_image_url');
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email || !password) {
      return { success: false, message: '이메일과 비밀번호를 입력해주세요.' };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-approved-login', {
        body: { email, password }
      });

      if (error) {
        if (error.context && error.context instanceof Response) {
          try {
            const errorBody = await error.context.json();
            if (errorBody.approved === false) {
              return { success: false, message: errorBody.message || '관리자에게 승인을 요청하세요.' };
            }
            return { success: false, message: errorBody.message || '로그인에 실패했습니다.' };
          } catch {
            // Parsing failed
          }
        }
        return { success: false, message: '로그인 중 오류가 발생했습니다.' };
      }

      if (!data) {
        return { success: false, message: '서버 응답이 없습니다.' };
      }

      if (data.approved === false) {
        return { success: false, message: data.message || '관리자에게 승인을 요청하세요.' };
      }

      if (data.success === false) {
        return { success: false, message: data.message || '로그인에 실패했습니다.' };
      }

      if (data.success === true && data.approved === true) {
        const { user, session } = data;

        if (session) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          });

          if (sessionError) {
            return { success: false, message: '세션 설정에 실패했습니다.' };
          }
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profile')
          .select('name, major, stnum, image_url')
          .eq('id', user.id)
          .single();

        if (!profileError && profileData) {
          saveToLocalStorage({
            user_id: user.id,
            user_name: profileData.name || '',
            user_major: profileData.major || '',
            user_stnum: profileData.stnum || '',
            user_image_url: profileData.image_url || ''
          });

          setUser(user);
          return {
            success: true,
            message: `${profileData.name}님 환영합니다.`,
            user
          };
        } else {
          saveToLocalStorage({ user_id: user.id });
          setUser(user);
          return { success: true, message: '로그인 성공', user };
        }
      }

      return { success: false, message: '예상치 못한 응답입니다.' };
    } catch (err) {
      console.error('로그인 오류:', err);
      return { success: false, message: '예상치 못한 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  }, [saveToLocalStorage]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, message: error.message };
      }

      setUser(null);
      clearLocalStorage();
      return { success: true, message: '로그아웃되었습니다.' };
    } catch (err) {
      console.error('로그아웃 오류:', err);
      return { success: false, message: '로그아웃 중 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  }, [clearLocalStorage]);

  const resetPassword = useCallback(async (email: string) => {
    if (!email) {
      return { success: false, message: '이메일을 입력해주세요.' };
    }

    if (!email.includes('@')) {
      return { success: false, message: '올바른 이메일을 입력하세요.' };
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: '비밀번호 재설정 메일이 발송되었습니다.' };
    } catch (err) {
      console.error('비밀번호 재설정 오류:', err);
      return { success: false, message: '비밀번호 재설정 중 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    profile: {
      name: string;
      major: string;
      stnum: string;
      birthday: string;
      phone: string;
    }
  ) => {
    if (!email.includes('@')) {
      return { success: false, message: '올바른 이메일을 입력하세요.' };
    }

    if (password.length < 6) {
      return { success: false, message: '비밀번호는 6자 이상이어야 합니다.' };
    }

    if (!profile.birthday) {
      return { success: false, message: '생년월일을 입력하세요.' };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        return { success: false, message: error.message };
      }

      const userId = data?.user?.id;
      if (!userId) {
        return { success: false, message: '회원가입 후 사용자 정보를 가져올 수 없습니다.' };
      }

      const { error: insertError } = await supabase.from('profile').insert([
        {
          id: userId,
          email,
          name: profile.name,
          major: profile.major,
          birthday: profile.birthday,
          phone: profile.phone,
          stnum: profile.stnum,
          image_url: "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png"
        }
      ]);

      if (insertError) {
        return { success: false, message: insertError.message };
      }

      const { error: reservationError } = await supabase
        .from('tennis_reservation_profile')
        .insert([{ user_id: userId }]);

      if (reservationError) {
        console.error('예약 프로필 생성 실패:', reservationError);
      }

      return {
        success: true,
        message: '회원가입이 완료되었습니다! 관리자 승인 이후 로그인 가능합니다.'
      };
    } catch (err) {
      console.error('회원가입 오류:', err);
      return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    signIn,
    signOut,
    resetPassword,
    signUp,
    saveToLocalStorage,
    clearLocalStorage
  };
}
