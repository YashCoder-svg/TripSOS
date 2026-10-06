import { useState } from 'react';
import { Compass, Crosshair, MapPin, Sparkles } from 'lucide-react';
import { DestinationAutocomplete } from '../components/places/DestinationAutocomplete';
import { TripMapWorkspace } from '../components/places/TripMapWorkspace';
import type { GeocodingResult } from '../types/place';

// Curated popular discovery hubs for instant exploration
const POPULAR_DESTINATIONS: { name: string; country: string; lat: number; lon: number }[] = [
  { name: 'Manali', country: 'India', lat: 32.2396, lon: 77.1887 },
  { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lon: -21.9426 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lon: 8.5417 },
  { name: 'Banff', country: 'Canada', lat: 51.1784, lon: -115.5708 },
];

export function ExplorePage() {
  const [destinationInput, setDestinationInput] = useState('Manali');
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
  } | null>({
    name: 'Manali',
    country: 'India',
    latitude: 32.2396,
    longitude: 77.1887,
  });

  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const handleSelectDestination = (result: GeocodingResult) => {
    setDestinationInput(result.name);
    setSelectedLocation({
      name: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setLocationNotice(null);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedLocation({
          name: 'Your Current Area',
          country: undefined,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationNotice(
            'Location access was denied. You can search any city or region above instead.',
          );
        } else {
          setLocationNotice('Could not retrieve device coordinates. Search a location above.');
        }
      },
      { timeout: 10000 },
    );
  };

  return (
    <main className="explore-page">
      {/* Top Banner / Discovery Search Bar */}
      <section className="explore-header-section">
        <div className="product-shell explore-header-shell">
          <div className="explore-titles">
            <span className="eyebrow">
              <Compass size={14} /> GLOBAL PLACE DISCOVERY
            </span>
            <h1>Where are you going?</h1>
            <p>
              Search real destinations worldwide to discover food, medical care, transport, and
              verified services with live interactive maps.
            </p>
          </div>

          <div className="explore-search-controls">
            <div className="explore-autocomplete-box">
              <label htmlFor="explore-destination-input" className="sr-only">
                Search a city, place, or destination
              </label>
              <DestinationAutocomplete
                id="explore-destination-input"
                value={destinationInput}
                onChange={setDestinationInput}
                placeholder="Search any destination worldwide (e.g. Manali, Tokyo, Zurich)…"
                onSelect={handleSelectDestination}
              />
            </div>

            <button
              type="button"
              className="explore-current-loc-btn"
              onClick={handleUseCurrentLocation}
              disabled={locating}
            >
              <Crosshair size={14} aria-hidden="true" />
              <span>{locating ? 'Locating…' : 'Near me'}</span>
            </button>
          </div>

          {locationNotice && (
            <p className="explore-notice-banner" role="status">
              {locationNotice}
            </p>
          )}

          {/* Quick Hub Suggestions */}
          <div className="explore-quick-hubs">
            <span className="quick-hubs-label">
              <Sparkles size={12} aria-hidden="true" /> Popular:
            </span>
            <div className="quick-hubs-list">
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest.name}
                  type="button"
                  className={`quick-hub-pill ${selectedLocation?.name === dest.name ? 'is-active' : ''}`}
                  onClick={() => {
                    setDestinationInput(dest.name);
                    setSelectedLocation({
                      name: dest.name,
                      country: dest.country,
                      latitude: dest.lat,
                      longitude: dest.lon,
                    });
                  }}
                >
                  <MapPin size={11} aria-hidden="true" />
                  <span>
                    {dest.name}, {dest.country}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Map & Places Discovery Workspace */}
      <section className="explore-workspace-section">
        <div className="product-shell explore-workspace-shell">
          {selectedLocation ? (
            <TripMapWorkspace
              initialCenter={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              initialDestinationName={selectedLocation.name}
              initialCountry={selectedLocation.country}
            />
          ) : (
            <div className="explore-empty-state">
              <Compass size={40} className="text-stone-400" />
              <h2>Search a destination to begin</h2>
              <p>Type any city or region above or tap "Near me" to explore places around you.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
