import { useEffect, useRef } from 'react';
import {
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import type { PlaceSummary } from '../../types/place';
import { buildDirectionsUrl, CATEGORY_METADATA, formatDistance } from '../maps/mapUtils';

export interface PlaceDetailDrawerProps {
  place: PlaceSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaceDetailDrawer({ place, isOpen, onClose }: PlaceDetailDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      panelRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !place) return null;

  const meta = place.category ? CATEGORY_METADATA[place.category] : null;
  const formattedDistance = formatDistance(place.distanceMeters);
  const directionsUrl = buildDirectionsUrl(place.latitude, place.longitude);

  return (
    <div
      className="place-drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
        className="place-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-detail-title"
      >
        <div className="place-drawer-header">
          <div
            className="place-drawer-badge"
            style={{ backgroundColor: meta?.badgeBg || '#f1f5f9' }}
          >
            <span style={{ color: meta?.color || '#475569' }}>{meta?.label || 'Place'}</span>
          </div>
          <button
            type="button"
            className="place-drawer-close"
            onClick={onClose}
            aria-label="Close place details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="place-drawer-body">
          <h2 id="place-detail-title" className="place-drawer-title">
            {place.name}
          </h2>

          {place.rating !== undefined && place.rating > 0 && (
            <div className="place-drawer-rating">
              <Star size={14} fill="currentColor" aria-hidden="true" />
              <strong>{place.rating.toFixed(1)}</strong>
              {place.reviewCount !== undefined && (
                <span className="place-drawer-reviews">({place.reviewCount} verified reviews)</span>
              )}
            </div>
          )}

          <div className="place-drawer-facts">
            {place.address && (
              <div className="place-fact-item">
                <MapPin size={16} className="place-fact-icon" aria-hidden="true" />
                <div>
                  <small>ADDRESS</small>
                  <p>{place.address}</p>
                </div>
              </div>
            )}

            {formattedDistance && (
              <div className="place-fact-item">
                <Navigation size={16} className="place-fact-icon" aria-hidden="true" />
                <div>
                  <small>DISTANCE</small>
                  <p>{formattedDistance} from center</p>
                </div>
              </div>
            )}

            {place.isOpen !== undefined && (
              <div className="place-fact-item">
                <Clock size={16} className="place-fact-icon" aria-hidden="true" />
                <div>
                  <small>CURRENT STATUS</small>
                  <p className={place.isOpen ? 'text-green-700' : 'text-stone-600'}>
                    {place.isOpen ? 'Open now' : 'Closed at this time'}
                  </p>
                </div>
              </div>
            )}

            {place.openingHours && place.openingHours.length > 0 && (
              <div className="place-fact-item">
                <Clock size={16} className="place-fact-icon" aria-hidden="true" />
                <div>
                  <small>HOURS</small>
                  <ul className="place-hours-list">
                    {place.openingHours.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="place-fact-item">
              <ShieldCheck size={16} className="place-fact-icon" aria-hidden="true" />
              <div>
                <small>COORDINATES</small>
                <p>
                  {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
                </p>
              </div>
            </div>
          </div>

          <div className="place-drawer-actions">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="place-action-primary"
            >
              <Navigation size={16} aria-hidden="true" />
              <span>Get Directions</span>
            </a>

            {place.phone && (
              <a href={`tel:${place.phone}`} className="place-action-secondary">
                <Phone size={15} aria-hidden="true" />
                <span>Call ({place.phone})</span>
              </a>
            )}

            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="place-action-secondary"
              >
                <Globe size={15} aria-hidden="true" />
                <span>Visit Website</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
          </div>

          <div className="place-drawer-attribution">
            <small>
              Data provided by <strong>{place.provider.toUpperCase()}</strong>. Information shown is
              as reported by the provider.
            </small>
          </div>
        </div>
      </aside>
    </div>
  );
}
