import {
  ArrowDown,
  ArrowUp,
  Bed,
  CheckCircle2,
  Circle,
  Coffee,
  Compass,
  Edit2,
  Eye,
  MapPin,
  Plane,
  Trash2,
} from 'lucide-react';
import type { ItineraryCategory, ItineraryItem } from '../../types/itinerary';

interface ItineraryItemCardProps {
  item: ItineraryItem;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggleStatus(item: ItineraryItem): void;
  onEdit(item: ItineraryItem): void;
  onDelete(itemId: string): void;
  onMoveUp(item: ItineraryItem): void;
  onMoveDown(item: ItineraryItem): void;
}

function getCategoryIcon(cat: ItineraryCategory) {
  switch (cat) {
    case 'food':
      return Coffee;
    case 'sightseeing':
      return Eye;
    case 'travel':
      return Plane;
    case 'lodging':
      return Bed;
    case 'activity':
    default:
      return Compass;
  }
}

export function ItineraryItemCard({
  item,
  canMoveUp,
  canMoveDown,
  onToggleStatus,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ItineraryItemCardProps) {
  const Icon = getCategoryIcon(item.category);
  const isCompleted = item.status === 'completed';

  return (
    <article
      className={`itinerary-item-card ${isCompleted ? 'itinerary-item-card--completed' : ''}`}
      aria-label={`Activity: ${item.title}`}
    >
      <button
        type="button"
        className={`itinerary-check-btn ${isCompleted ? 'is-completed' : ''}`}
        onClick={() => onToggleStatus(item)}
        title={isCompleted ? 'Mark as planned' : 'Mark as completed'}
        aria-label={
          isCompleted ? `Mark ${item.title} as planned` : `Mark ${item.title} as completed`
        }
      >
        {isCompleted ? (
          <CheckCircle2 size={20} className="check-done-icon" />
        ) : (
          <Circle size={20} className="check-circle-icon" />
        )}
      </button>

      <div className="itinerary-item-body">
        <div className="itinerary-item-meta">
          {(item.startTime || item.endTime) && (
            <span className="itinerary-time-badge">
              {item.startTime ?? ''}
              {item.startTime && item.endTime ? ' – ' : ''}
              {item.endTime ?? ''}
            </span>
          )}
          <span className={`itinerary-category-pill cat-${item.category}`}>
            <Icon size={12} aria-hidden="true" />
            {item.category}
          </span>
        </div>

        <h4 className="itinerary-item-title">{item.title}</h4>

        {item.location && (
          <div className="itinerary-item-location">
            <MapPin size={13} aria-hidden="true" />
            <span>{item.location}</span>
          </div>
        )}

        {item.notes && <p className="itinerary-item-notes">{item.notes}</p>}
      </div>

      <div className="itinerary-item-actions">
        <div className="itinerary-order-buttons">
          <button
            type="button"
            className="itinerary-icon-action"
            onClick={() => onMoveUp(item)}
            disabled={!canMoveUp}
            title="Move up"
            aria-label="Move item earlier"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            className="itinerary-icon-action"
            onClick={() => onMoveDown(item)}
            disabled={!canMoveDown}
            title="Move down"
            aria-label="Move item later"
          >
            <ArrowDown size={14} />
          </button>
        </div>

        <button
          type="button"
          className="itinerary-icon-action"
          onClick={() => onEdit(item)}
          title="Edit activity"
          aria-label={`Edit ${item.title}`}
        >
          <Edit2 size={14} />
        </button>

        <button
          type="button"
          className="itinerary-icon-action itinerary-icon-action--delete"
          onClick={() => onDelete(item._id)}
          title="Delete activity"
          aria-label={`Delete ${item.title}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}
