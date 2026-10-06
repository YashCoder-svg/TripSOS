import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  Crosshair,
  Info,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PlaceCategory, PlaceSummary } from '../../types/place';
import type { Trip } from '../../types/trip';
import { usePlaceSearch } from '../../services/placeService';
import { MapLibreMap } from '../maps/MapLibreMap';
import { CategoryFilterBar, type CategoryFilterValue } from './CategoryFilterBar';
import { PlaceCard } from './PlaceCard';
import { PlaceDetailDrawer } from './PlaceDetailDrawer';

export interface TripMapWorkspaceProps {
  trip?: Trip;
  initialCenter?: { latitude: number; longitude: number };
  initialDestinationName?: string;
  initialCountry?: string;
  allowDestinationChange?: boolean;
}

export function TripMapWorkspace({
  trip,
  initialCenter,
  initialDestinationName,
  initialCountry,
}: TripMapWorkspaceProps) {
  // Determine effective center coordinates
  const destinationCoords = useMemo(() => {
    if (trip?.destinationCoordinates?.latitude && trip?.destinationCoordinates?.longitude) {
      return {
        latitude: trip.destinationCoordinates.latitude,
        longitude: trip.destinationCoordinates.longitude,
      };
    }
    if (initialCenter?.latitude && initialCenter?.longitude) {
      return initialCenter;
    }
    return null;
  }, [trip, initialCenter]);

  const [activeCenter, setActiveCenter] = useState<{ latitude: number; longitude: number } | null>(
    destinationCoords,
  );

  // Sync activeCenter when destinationCoords resolves or changes
  useEffect(() => {
    if (destinationCoords && !activeCenter) {
      setActiveCenter(destinationCoords);
    }
  }, [destinationCoords, activeCenter]);

  // Search & Filter state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterValue>('all');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [inspectedPlace, setInspectedPlace] = useState<PlaceSummary | null>(null);

  // Geolocation state
  const [geoPromptOpen, setGeoPromptOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<
    'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  >('idle');
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  // Mobile sheet toggle
  const [mobileListOpen, setMobileListOpen] = useState(false);

  const cardListRef = useRef<HTMLDivElement>(null);

  // Debounce free-text search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 450);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Determine which query hook to use:
  // If debouncedQuery is present, use usePlaceSearch with query.
  // Else if category is not 'all', use useNearbyPlaces with category.
  // Place search query with optional text and/or category
  const hasTextQuery = debouncedQuery.length >= 2;
  const isCategorySelected = selectedCategory !== 'all';

  const categoryParam: PlaceCategory | undefined =
    selectedCategory !== 'all' ? selectedCategory : undefined;

  const placesQuery = usePlaceSearch(
    {
      query: hasTextQuery ? debouncedQuery : undefined,
      latitude: activeCenter?.latitude ?? 0,
      longitude: activeCenter?.longitude ?? 0,
      category: categoryParam,
      limit: 25,
      radiusMeters: 8000,
    },
    { enabled: Boolean(activeCenter) },
  );

  const places: PlaceSummary[] = useMemo(() => {
    return placesQuery.data?.results ?? [];
  }, [placesQuery.data]);

  // Browser Geolocation flow
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable');
      setGeoMessage('Geolocation is not supported by your browser.');
      return;
    }
    setGeoPromptOpen(true);
  };

  const confirmUseLocation = () => {
    setGeoPromptOpen(false);
    setGeoStatus('requesting');
    setGeoMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setActiveCenter({ latitude, longitude });
        setGeoStatus('granted');
        setGeoMessage('Using your current location for nearby discovery.');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus('denied');
          setGeoMessage(
            'Location access was denied. You can still explore places around your trip destination.',
          );
        } else {
          setGeoStatus('unavailable');
          setGeoMessage('Could not retrieve your location. Exploring trip destination instead.');
        }
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  };

  const resetToTripDestination = () => {
    if (destinationCoords) {
      setActiveCenter(destinationCoords);
      setGeoStatus('idle');
      setGeoMessage(null);
    }
  };

  // Scroll card into view when selected
  const handleSelectPlace = (place: PlaceSummary) => {
    setSelectedPlaceId(place.providerId);
    // Find card element in list
    if (cardListRef.current) {
      const cardEl = cardListRef.current.querySelector<HTMLElement>(
        `[aria-label*="${CSS.escape(place.name)}"]`,
      );
      if (cardEl && typeof cardEl.scrollIntoView === 'function') {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const destinationName = trip?.destinationName || initialDestinationName || 'Destination';
  const destinationCountry =
    trip?.destinationCountry || trip?.destination?.country || initialCountry;

  return (
    <div className="trip-map-workspace">
      {/* Geolocation consent dialog */}
      {geoPromptOpen && (
        <div className="trip-dialog-backdrop" role="dialog" aria-modal="true">
          <div className="trip-delete-dialog">
            <span className="trip-dialog-icon">
              <Compass size={22} />
            </span>
            <span className="eyebrow">YOUR PRIVACY MATTERS</span>
            <h2>Use your current location?</h2>
            <p>
              TripSOS uses your location solely to show nearby places right now. We do not track you
              in the background, nor do we save your precise location to any database.
            </p>
            <div className="trip-dialog-actions">
              <button
                type="button"
                className="quiet-action"
                onClick={() => setGeoPromptOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className="trip-delete-confirm" onClick={confirmUseLocation}>
                Allow location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="trip-map-layout">
        {/* Left / Sidebar Column: Search, Categories, Places List */}
        <section
          className={`trip-map-sidebar ${mobileListOpen ? 'is-mobile-open' : ''}`}
          aria-label="Places search and discovery list"
        >
          {/* Mobile Handle / Header */}
          <div className="mobile-sheet-bar md:hidden">
            <button
              type="button"
              className="mobile-sheet-toggle"
              onClick={() => setMobileListOpen(!mobileListOpen)}
            >
              <SlidersHorizontal size={14} />
              <span>{mobileListOpen ? 'Hide place list' : `Show ${places.length} places`}</span>
            </button>
          </div>

          <div className="trip-map-sidebar__content">
            {/* Search header & Location controls */}
            <div className="trip-map-search-panel">
              <div className="trip-map-input-wrap">
                <Search size={16} className="search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="trip-map-search-input"
                  placeholder="Search restaurants, hospitals, ATMs…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search places around destination"
                />
                {searchInput && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchInput('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Location actions */}
              <div className="trip-map-location-bar">
                <button
                  type="button"
                  className={`location-action-btn ${geoStatus === 'granted' ? 'is-active' : ''}`}
                  onClick={handleRequestLocation}
                  disabled={geoStatus === 'requesting'}
                  title="Use current device location"
                >
                  <Crosshair size={13} aria-hidden="true" />
                  <span>
                    {geoStatus === 'requesting' ? 'Locating…' : 'Use my current location'}
                  </span>
                </button>

                {geoStatus === 'granted' && destinationCoords && (
                  <button
                    type="button"
                    className="location-action-btn location-action-btn--reset"
                    onClick={resetToTripDestination}
                    title="Reset back to trip destination"
                  >
                    <RotateCcw size={12} aria-hidden="true" />
                    <span>Back to {destinationName}</span>
                  </button>
                )}
              </div>

              {/* Geolocation Notice / Alert */}
              {geoMessage && (
                <div
                  className={`trip-geo-banner ${geoStatus === 'denied' ? 'trip-geo-banner--warn' : 'trip-geo-banner--info'}`}
                  role="status"
                >
                  <Info size={13} aria-hidden="true" />
                  <span>{geoMessage}</span>
                  <button
                    type="button"
                    className="banner-close"
                    onClick={() => setGeoMessage(null)}
                    aria-label="Dismiss banner"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Category Filter Chips */}
              <CategoryFilterBar
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
              />
            </div>

            {/* Results Header */}
            <div className="trip-map-results-heading">
              <span className="results-count">
                {placesQuery.isLoading
                  ? 'Finding places…'
                  : `${places.length} ${places.length === 1 ? 'place' : 'places'} found`}
              </span>
              {destinationName && activeCenter && (
                <span className="results-location-tag">
                  <MapPin size={11} aria-hidden="true" />
                  <span>{geoStatus === 'granted' ? 'Near current location' : destinationName}</span>
                </span>
              )}
            </div>

            {/* Cards List / States */}
            <div ref={cardListRef} className="trip-map-cards-list">
              {placesQuery.isLoading && (
                <div className="places-loading-skeletons" aria-label="Loading places">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="place-card-skeleton">
                      <div className="skeleton-line skeleton-line--sm" />
                      <div className="skeleton-line skeleton-line--title" />
                      <div className="skeleton-line skeleton-line--text" />
                      <div className="skeleton-line skeleton-line--btn" />
                    </div>
                  ))}
                </div>
              )}

              {placesQuery.isError && (
                <div className="trip-places-error" role="alert">
                  <h3>Places are temporarily unavailable</h3>
                  <p>
                    We couldn't connect to the location provider right now. Please try again in a
                    moment.
                  </p>
                  <button
                    type="button"
                    className="quiet-action"
                    onClick={() => void placesQuery.refetch()}
                  >
                    Try again
                  </button>
                </div>
              )}

              {!placesQuery.isLoading && !placesQuery.isError && places.length === 0 && (
                <div className="trip-places-empty" role="status">
                  <Compass size={28} className="empty-icon" aria-hidden="true" />
                  <h3>Nothing nearby</h3>
                  <p>
                    {hasTextQuery || isCategorySelected
                      ? 'No places matched your query in this area. Try broadening your search or picking another category.'
                      : 'We found no places registered in this radius.'}
                  </p>
                  {(hasTextQuery || isCategorySelected) && (
                    <button
                      type="button"
                      className="quiet-action"
                      onClick={() => {
                        setSearchInput('');
                        setSelectedCategory('all');
                      }}
                    >
                      Clear search & filters
                    </button>
                  )}
                </div>
              )}

              {!placesQuery.isLoading &&
                places.map((place) => (
                  <PlaceCard
                    key={place.providerId}
                    place={place}
                    isSelected={selectedPlaceId === place.providerId}
                    onSelect={() => handleSelectPlace(place)}
                    onViewDetails={() => setInspectedPlace(place)}
                  />
                ))}
            </div>
          </div>
        </section>

        {/* Right Column: Interactive Map */}
        <section className="trip-map-viewport" aria-label="Interactive map view">
          {activeCenter ? (
            <MapLibreMap
              center={[activeCenter.longitude, activeCenter.latitude]}
              destination={
                destinationCoords
                  ? {
                      name: destinationName,
                      latitude: destinationCoords.latitude,
                      longitude: destinationCoords.longitude,
                      country: destinationCountry,
                    }
                  : undefined
              }
              places={places}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={(place) => {
                handleSelectPlace(place);
                setInspectedPlace(place);
              }}
              className="trip-map-canvas"
            />
          ) : (
            <div className="trip-no-coords-banner" role="status">
              <MapPin size={32} className="text-stone-400" />
              <h3>Choose a destination first</h3>
              <p>Set your trip destination coordinates to start exploring nearby places.</p>
              {trip && (
                <Link to={`/trips/${trip._id}/edit`} className="trip-edit-dest-link">
                  Edit trip destination
                </Link>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Place Detail Drawer */}
      <PlaceDetailDrawer
        place={inspectedPlace}
        isOpen={Boolean(inspectedPlace)}
        onClose={() => setInspectedPlace(null)}
      />
    </div>
  );
}
