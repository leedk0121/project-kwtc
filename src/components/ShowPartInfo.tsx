import './Showpartinfo.css';
import { useMyTier, useParticipantsInfo, useHostName, useParticipation, type PartInfo } from './ShowPartInfo/hooks';
import { ParticipantCard } from './ShowPartInfo/components';
import { TIER_OPTIONS } from '../pages/Event/utils';

interface ShowPartInfoProps {
  partInfo: PartInfo;
  onClose: () => void;
}

function ShowPartInfo({ partInfo, onClose }: ShowPartInfoProps) {
  const { myTier } = useMyTier();
  const { participants } = useParticipantsInfo(partInfo.Participants || []);
  const { hostName } = useHostName(partInfo.host);
  const { handleParticipate, handleCancel, loading } = useParticipation(partInfo, onClose);

  const isParticipateDisabled =
    loading ||
    partInfo.participant_num >= partInfo.max_people ||
    (myTier !== null && partInfo.min_tier !== null && myTier > partInfo.min_tier);

  const participateButtonStyle = isParticipateDisabled
    ? { background: '#ccc', color: '#888', cursor: 'not-allowed' }
    : {};

  const getTierName = (tierValue: number | null): string => {
    if (tierValue === null) return '제한 없음';
    const tier = TIER_OPTIONS.find(t => t.value === tierValue);
    return tier ? tier.label : `${tierValue} Tier`;
  };

  return (
    <div className="part-info-modal-overlay">
      <div className="part-info-modal-content">
        <div className="part-info-modal-date">{partInfo.date}</div>
        <ul>
          <li className="part-info-modal-info-item">
            {hostName}님의 코트 - {partInfo.where} : {partInfo.court_number}번 코트 
          </li>
        </ul>

        <div className='part-info-modal-info'>
          <div className="part-info-modal-info-item">
            &#9654; 시간: {partInfo.start_time?.slice(0, 5)} ~ {partInfo.end_time?.slice(0, 5)}
          </div>

          {partInfo.min_tier !== null && (
            <div className="part-info-modal-info-item">
              &#9654; 최소 티어: {getTierName(partInfo.min_tier)}
              {myTier !== null && myTier > partInfo.min_tier && (
                <span style={{ color: '#e74c3c', marginLeft: '8px', fontSize: '0.9em' }}>
                  (참여 불가)
                </span>
              )}
            </div>
          )}

          <div className="part-info-modal-info-item">
            &#9654; 현재 인원: {partInfo.participant_num} / {partInfo.max_people}
          </div>

          {participants.length > 0 && (
            <div className="part-info-modal-info-item" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              {participants.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
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
            disabled={isParticipateDisabled}
            style={participateButtonStyle}
          >
            {loading ? '처리중...' : '참여하기'}
          </button>
          <button
            className="part-info-modal-cancel-btn"
            onClick={handleCancel}
            disabled={loading}
          >
            참여 취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShowPartInfo;
