import {
  Bed,
  Coffee,
  Fuel,
  Grid,
  HeartPulse,
  Landmark,
  MapPin,
  Navigation,
  Pill,
  Shield,
  ShoppingBag,
  Star,
  TrainFront,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';
import type { PlaceCategory, PlaceSummary } from '../../types/place';
import { buildDirectionsUrl, CATEGORY_METADATA, formatDistance } from '../maps/mapUtils';

export interface PlaceCardProps {
  place: PlaceSummary;
  isSelected?: boolean;
  onSelect?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

const CATEGORY_ICONS: Record<PlaceCategory, typeof UtensilsCrossed> = {
  all: Grid,
  food: UtensilsCrossed,
  hotels: Bed,
  hospitals: HeartPulse,
  pharmacies: Pill,
  police: Shield,
  atms: Landmark,
  fuel: Fuel,
  groceries: ShoppingBag,
  cafes: Coffee,
  transport: TrainFront,
  repair: Wrench,
};

export function PlaceCard({
  place,
  isSelected = false,
  onSelect,
  onViewDetails,
  className = '',
}: PlaceCardProps) {
  const meta = place.category ? CATEGORY_METADATA[place.category] : null;
  const Icon = place.category ? CATEGORY_ICONS[place.category] : MapPin;
  const formattedDistance = formatDistance(place.distanceMeters);
  const directionsUrl = buildDirectionsUrl(place.latitude, place.longitude);

  return (
    <article
      className={`place-card ${isSelected ? 'is-selected' : ''} ${className}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${place.name}, ${meta?.label || 'Place'}`}
    >
      <div className="place-card__header">
        <div className="place-card__badge" style={{ backgroundColor: meta?.badgeBg || '#f1f5f9' }}>
          <Icon size={14} style={{ color: meta?.color || '#475569' }} aria-hidden="true" />
          <span style={{ color: meta?.color || '#475569' }}>{meta?.label || 'Place'}</span>
        </div>

        {formattedDistance && <span className="place-card__distance">{formattedDistance}</span>}
      </div>

      <h3 className="place-card__title">{place.name}</h3>

      {place.address && (
        <p className="place-card__address">
          <MapPin size={12} aria-hidden="true" />
          <span>{place.address}</span>
        </p>
      )}

      {/* Status pills: only render if real data exists */}
      <div className="place-card__meta">
        {place.isOpen !== undefined && (
          <span
            className={`place-status-pill ${place.isOpen ? 'place-status-pill--open' : 'place-status-pill--closed'}`}
          >
            {place.isOpen ? 'Open now' : 'Closed'}
          </span>
        )}

        {place.rating !== undefined && place.rating > 0 && (
          <span className="place-rating-badge">
            <Star size={11} fill="currentColor" aria-hidden="true" />
            <strong>{place.rating.toFixed(1)}</strong>
            {place.reviewCount !== undefined && place.reviewCount > 0 && (
              <span className="place-review-count">({place.reviewCount})</span>
            )}
          </span>
        )}
      </div>

      <div className="place-card__actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="place-card-btn place-card-btn--secondary"
          onClick={() => onViewDetails?.()}
          aria-label={`View details for ${place.name}`}
        >
          Details
        </button>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="place-card-btn place-card-btn--primary"
          aria-label={`Get directions to ${place.name} in external maps`}
        >
          <Navigation size={12} aria-hidden="true" />
          <span>Directions</span>
        </a>
      </div>
    </article>
  );
}
