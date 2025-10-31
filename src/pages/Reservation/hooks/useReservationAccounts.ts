import { useState, useCallback } from 'react';
import { supabase } from '../../Auth/supabaseClient';

export interface TennisAccount {
  nowon_id: string;
  nowon_pass: string;
  dobong_id: string;
  dobong_pass: string;
}

export function useReservationAccounts() {
  const [tennisAccount, setTennisAccount] = useState<TennisAccount>({
    nowon_id: '',
    nowon_pass: '',
    dobong_id: '',
    dobong_pass: ''
  });
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState<TennisAccount>({
    nowon_id: '',
    nowon_pass: '',
    dobong_id: '',
    dobong_pass: ''
  });
  const [loading, setLoading] = useState(false);

  const loadUserAccounts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: accountData } = await supabase
        .from('tennis_reservation_profile')
        .select('nowon_id, nowon_pass, dobong_id, dobong_pass')
        .eq('user_id', user.id)
        .single();

      if (accountData) {
        const hasNowonAccount = accountData.nowon_id && accountData.nowon_pass;
        const hasDobongAccount = accountData.dobong_id && accountData.dobong_pass;

        if (!hasNowonAccount || !hasDobongAccount) {
          setShowAccountModal(true);
          setAccountForm({
            nowon_id: accountData.nowon_id || '',
            nowon_pass: accountData.nowon_pass || '',
            dobong_id: accountData.dobong_id || '',
            dobong_pass: accountData.dobong_pass || ''
          });
        } else {
          setTennisAccount({
            nowon_id: accountData.nowon_id,
            nowon_pass: accountData.nowon_pass,
            dobong_id: accountData.dobong_id,
            dobong_pass: accountData.dobong_pass
          });
        }
      } else {
        setShowAccountModal(true);
      }
    } catch (error) {
      console.error('사용자 정보 로드 오류:', error);
    }
  }, []);

  const saveAccounts = useCallback(async (accounts: TennisAccount) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return { success: false, message: '로그인이 필요합니다.' };
      }

      setLoading(true);

      const { error } = await supabase
        .from('tennis_reservation_profile')
        .update({
          nowon_id: accounts.nowon_id,
          nowon_pass: accounts.nowon_pass,
          dobong_id: accounts.dobong_id,
          dobong_pass: accounts.dobong_pass
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('계정 정보 저장 실패:', error);
        return { success: false, message: '계정 정보 저장에 실패했습니다.' };
      }

      setTennisAccount(accounts);
      setShowAccountModal(false);
      return { success: true, message: '계정 정보가 저장되었습니다.' };
    } catch (error) {
      console.error('계정 정보 저장 오류:', error);
      return { success: false, message: '계정 정보 저장 중 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const validateAccounts = useCallback((accounts: TennisAccount) => {
    if (!accounts.nowon_id || !accounts.nowon_pass) {
      return { valid: false, message: '노원구 계정 정보를 입력해주세요.' };
    }

    if (!accounts.dobong_id || !accounts.dobong_pass) {
      return { valid: false, message: '도봉구 계정 정보를 입력해주세요.' };
    }

    return { valid: true, message: '' };
  }, []);

  return {
    tennisAccount,
    setTennisAccount,
    showAccountModal,
    setShowAccountModal,
    accountForm,
    setAccountForm,
    loading,
    loadUserAccounts,
    saveAccounts,
    validateAccounts
  };
}
