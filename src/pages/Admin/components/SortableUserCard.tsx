import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RankedUser } from '../hooks/useRankedUsers';

interface SortableUserCardProps {
  user: RankedUser;
  index: number;
  tierColor: string;
}

export function SortableUserCard({ user, index, tierColor }: SortableUserCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: user.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`dnd-user-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="dnd-user-rank" style={{ background: tierColor }}>
        #{index + 1}
      </div>
      <img
        src={user.image_url || 'https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png'}
        alt={user.name}
        className="dnd-user-image"
      />
      <div className="dnd-user-info">
        <div className="dnd-user-name">{user.name}</div>
        <div className="dnd-user-details">
          {user.major} ({user.stnum})
        </div>
      </div>
      <div className="dnd-drag-handle">⋮⋮</div>
    </div>
  );
}
