import React, { useEffect, useState } from 'react';
import './Showpartinfo.css'
import { supabase } from '../pages/auth/supabaseClient';

const ShowPartInfo = ({ partInfo, onClose }: { partInfo: any; onClose: () => void }) => {
  const [myTier, setMyTier] = useState<number | null>(null);
  const [participantsInfo, setParticipantsInfo] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hostName, setHostName] = useState<string>("");

  React.useEffect(() => {
    const fetchMyTier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMyTier(null);
        return;
      }
      const { data, error } = await supabase
        .from('ranked_user')
        .select('rank_tier')
        .eq('id', user.id)
        .single();
      if (!error && data) setMyTier(Number(data.rank_tier));
      else setMyTier(null);
    };
    fetchMyTier();
  }, []);

  React.useEffect(() => {
    const fetchParticipantsInfo = async () => {
      const ids = partInfo.Participants || [];
      if (ids.length === 0) {
        setParticipantsInfo([]);
        return;
      }
      const { data, error } = await supabase
        .from('ranked_user')
        .select('id, name, major, image_url, rank_all')
        .in('id', ids);
      if (!error && data) setParticipantsInfo(data);
      else setParticipantsInfo([]);
    };
    fetchParticipantsInfo();
  }, [partInfo.Participants]);

  useEffect(() => {
    const fetchHostName = async () => {
      if (!partInfo.host) {
        setHostName("");
        return;
      }
      const { data, error } = await supabase
        .from('ranked_user')
        .select('name')
        .eq('id', partInfo.host)
        .single();
      if (!error && data) setHostName(data.name);
      else setHostName(partInfo.host);
    };
    fetchHostName();
  }, [partInfo.host]);

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
  return (
    <div className="part-info-modal-overlay">
      <div className="part-info-modal-content">
        <div className="part-info-modal-date">{partInfo.date}</div>
        <ul>
          <li className="part-info-modal-info-item">
            {hostName}님의 코트 - {partInfo.where} {partInfo.court_number} 번
          </li>
        </ul>
        <div className='part-info-modal-info'>
            <div className="part-info-modal-info-item">&#9654; {partInfo.start_time?.slice(0, 5)} ~ {partInfo.end_time?.slice(0, 5)}</div>
            {partInfo.min_tier !== null && (
              <div className="part-info-modal-info-item">&#9654; 최소 티어: {partInfo.min_tier} Tier</div>
            )}
            <div className="part-info-modal-info-item">&#9654; 현재 인원: {partInfo.participant_num} / {partInfo.max_people}</div>
            {participantsInfo.length > 0 && (
              <div className="part-info-modal-info-item" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {participantsInfo.map((p, idx) => (
                  <div key={p.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f7f7f7',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    width: 'calc(50% - 8px)',
                    boxSizing: 'border-box',
                    marginBottom: '8px'
                  }}>
                    <img src={p.image_url || '/base_profile.png'} alt={p.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 500}}>{p.name} #{p.rank_all}</span>
                      <span style={{ color: '#666', fontSize: '13px', marginTop: '2px' }}>{p.major}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
        <button
          onClick={onClose}
          className="part-info-modal-close-btn"
        >
          &#10006;
        </button>
        <div className="part-info-modal-bottom-center">
          <button
            className="part-info-modal-participate-btn"
            onClick={handleParticipate}
            disabled={
              loading ||
              partInfo.participant_num >= partInfo.max_people ||
              (myTier !== null && partInfo.min_tier !== null && myTier > partInfo.min_tier)
            }
            style={
              partInfo.participant_num >= partInfo.max_people ||
              (myTier !== null && partInfo.min_tier !== null && myTier > partInfo.min_tier)
                ? { background: '#ccc', color: '#888', cursor: 'not-allowed' }
                : {}
            }
          >
            {loading ? '처리중...' : '참여하기'}
          </button>
          <button className="part-info-modal-cancel-btn" style={{marginLeft: '12px'}} onClick={handleCancel} disabled={loading}>참여 취소</button>
        </div>
      </div>
    </div>
  );
};

export default ShowPartInfo;
