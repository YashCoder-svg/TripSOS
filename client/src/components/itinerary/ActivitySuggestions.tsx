import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Plus, Sparkles, Star } from 'lucide-react';
import { placeKeys, placeService } from '../../services/placeService';
import type { PlaceCategory, PlaceSummary } from '../../types/place';

interface ActivitySuggestionsProps {
  latitude?: number;
  longitude?: number;
  destinationName: string;
  onAddPlace(place: PlaceSummary): void;
}

const suggestionCategories: { label: string; value: PlaceCategory }[] = [
  { label: 'Top Places', value: 'all' },
  { label: 'Food & Dining', value: 'food' },
  { label: 'Cafés', value: 'cafes' },
  { label: 'Hotels & Stays', value: 'hotels' },
];

export function ActivitySuggestions({
  latitude,
  longitude,
  destinationName,
  onAddPlace,
}: ActivitySuggestionsProps) {
  const [activeCategory, setActiveCategory] = useState<PlaceCategory>('all');

  const { data, isLoading } = useQuery({
    queryKey: placeKeys.search({
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      category: activeCategory,
      radiusMeters: 10000,
      limit: 10,
    }),
    queryFn: () =>
      placeService.search({
        latitude: latitude!,
        longitude: longitude!,
        category: activeCategory,
        radiusMeters: 10000,
        limit: 10,
      }),
    enabled: typeof latitude === 'number' && typeof longitude === 'number',
    staleTime: 5 * 60 * 1000,
  });

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return (
      <aside className="activity-suggestions-panel" aria-label="Place suggestions">
        <div className="activity-suggestions-header">
          <span className="eyebrow">
            <Sparkles size={14} /> SUGGESTED ACTIVITIES
          </span>
          <h3>Places in {destinationName}</h3>
        </div>
        <p className="suggestions-empty-text">
          Destination coordinates are not set. Search or update destination to see real place
          suggestions.
        </p>
      </aside>
    );
  }

  const places = data?.results ?? [];

  return (
    <aside className="activity-suggestions-panel" aria-label="Place suggestions">
      <div className="activity-suggestions-header">
        <div>
          <span className="eyebrow">
            <Sparkles size={14} /> DISCOVERY SUGGESTIONS
          </span>
          <h3>Explore around {destinationName}</h3>
        </div>
        <span className="suggestions-badge">Verified Places</span>
      </div>

      <div className="suggestions-category-chips" role="tablist">
        {suggestionCategories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            className={`suggestion-chip ${activeCategory === cat.value ? 'is-active' : ''}`}
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="suggestions-loading" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>Finding places near {destinationName}…</span>
        </div>
      ) : places.length === 0 ? (
        <p className="suggestions-empty-text">
          No verified places discovered in this category nearby.
        </p>
      ) : (
        <div className="suggestions-list">
          {places.map((place) => (
            <article key={place.providerId} className="suggestion-place-card">
              <div className="suggestion-place-info">
                <h4>{place.name}</h4>
                {place.address && (
                  <p className="suggestion-place-address">
                    <MapPin size={12} aria-hidden="true" />
                    <span>{place.address}</span>
                  </p>
                )}
                <div className="suggestion-place-meta">
                  {place.rating !== undefined && (
                    <span className="suggestion-rating">
                      <Star size={11} fill="currentColor" /> {place.rating.toFixed(1)}
                    </span>
                  )}
                  {place.distanceMeters !== undefined && (
                    <span className="suggestion-distance">
                      {(place.distanceMeters / 1000).toFixed(1)} km away
                    </span>
                  )}
                  {place.category && (
                    <span className="suggestion-category-tag">{place.category}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="add-to-itinerary-btn"
                onClick={() => onAddPlace(place)}
                title={`Add ${place.name} to itinerary`}
                aria-label={`Add ${place.name} to itinerary`}
              >
                <Plus size={15} /> Add
              </button>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}
