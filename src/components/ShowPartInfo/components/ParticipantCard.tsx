import type { ParticipantInfo } from '../hooks';

interface ParticipantCardProps {
  participant: ParticipantInfo;
}

function ParticipantCard({ participant }: ParticipantCardProps) {
  return (
    <div style={{
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
      <img
        src={participant.image_url || '/base_profile.png'}
        alt={participant.name}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid #ddd'
        }}
      />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}>
        <span style={{ fontWeight: 500 }}>
          {participant.name} #{participant.rank_all}
        </span>
        <span style={{
          color: '#666',
          fontSize: '13px',
          marginTop: '2px'
        }}>
          {participant.major}
        </span>
      </div>
    </div>
  );
}

export default ParticipantCard;
