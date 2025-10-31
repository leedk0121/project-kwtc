import { useState } from 'react';
import { supabase } from '../../../pages/Auth/supabaseClient';

export interface PartInfo {
  date: string;
  court_number: number;
  where: string;
  Participants: string[];
  participant_num: number;
  [key: string]: any;
}

export function useParticipation(partInfo: PartInfo, onClose: () => void) {
  const [loading, setLoading] = useState(false);

  const handleParticipate = async () => {
    setLoading(true);

    // 현재 유저 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    const userId = user.id;

    // 이미 참가했는지 확인
    const currentParticipants = partInfo.Participants || [];
    if (currentParticipants.includes(userId)) {
      alert('이미 참여하셨습니다.');
      setLoading(false);
      return;
    }

    // 참가자 추가 및 인원 증가
    const newParticipants = [...currentParticipants, userId];
    const newParticipantNum = (partInfo.participant_num || 0) + 1;

    // DB 업데이트
    const { error } = await supabase
      .from('vote')
      .update({ Participants: newParticipants, participant_num: newParticipantNum })
      .eq('date', partInfo.date)
      .eq('court_number', partInfo.court_number)
      .eq('where', partInfo.where);

    if (error) {
      alert('참여에 실패했습니다.');
    } else {
      alert('참여 완료!');
      onClose();
      window.location.reload(); // 참여 완료 후 새로고침
    }

    setLoading(false);
  };

  const handleCancel = async () => {
    setLoading(true);

    // 현재 유저 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    const userId = user.id;
    const currentParticipants = partInfo.Participants || [];

    if (!currentParticipants.includes(userId)) {
      alert('참여한 코트가 아닙니다.');
      setLoading(false);
      return;
    }

    // 참가자 제거 및 인원 감소
    const newParticipants = currentParticipants.filter((id: string) => id !== userId);
    const newParticipantNum = Math.max((partInfo.participant_num || 1) - 1, 0);

    // DB 업데이트
    const { error } = await supabase
      .from('vote')
      .update({ Participants: newParticipants, participant_num: newParticipantNum })
      .eq('date', partInfo.date)
      .eq('court_number', partInfo.court_number)
      .eq('where', partInfo.where);

    if (error) {
      alert('참여 취소에 실패했습니다.');
    } else {
      alert('참여 취소 완료!');
      onClose();
      window.location.reload(); // 참여 취소 후 새로고침
    }

    setLoading(false);
  };

  return { handleParticipate, handleCancel, loading };
}
