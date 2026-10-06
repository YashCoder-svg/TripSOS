import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AlertCircle, Maximize2, RotateCcw } from 'lucide-react';
import type { PlaceSummary } from '../../types/place';
import { CATEGORY_METADATA } from './mapUtils';

export interface MapLibreMapProps {
  center: [number, number]; // [longitude, latitude]
  zoom?: number;
  destination?: {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    region?: string;
  };
  places?: PlaceSummary[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (place: PlaceSummary) => void;
  className?: string;
}

const DEFAULT_STYLE =
  (import.meta.env.VITE_MAP_STYLE_URL as string | undefined) ||
  'https://tiles.openfreemap.org/styles/liberty';

export function MapLibreMap({
  center,
  zoom = 13,
  destination,
  places = [],
  selectedPlaceId,
  onSelectPlace,
  className = '',
}: MapLibreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const destinationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const placeMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isDisposed = false;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: DEFAULT_STYLE,
        center,
        zoom,
        attributionControl: false,
      });

      // Attribution control in bottom-right
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: '© OpenStreetMap contributors | OpenFreeMap',
        }),
        'bottom-right',
      );

      // Navigation control (zoom and pitch/rotation)
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

      map.on('load', () => {
        if (!isDisposed) {
          mapRef.current = map;
          setIsMapReady(true);
          setMapError(null);
        }
      });

      map.on('error', (e: maplibregl.ErrorEvent) => {
        // Tile or source 404s shouldn't break whole map, but style parse errors should
        if (e.error && !isDisposed) {
          const msg = e.error.message || '';
          if (msg.includes('style') || msg.includes('WebGL')) {
            setMapError('The map could not be loaded. Please refresh and try again.');
          }
        }
      });

      // Resize observer to ensure map canvas adjusts to flex/grid container changes
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        isDisposed = true;
        resizeObserver.disconnect();
        // Remove markers
        if (destinationMarkerRef.current) {
          destinationMarkerRef.current.remove();
          destinationMarkerRef.current = null;
        }
        placeMarkersRef.current.forEach((marker) => marker.remove());
        placeMarkersRef.current.clear();
        map.remove();
        mapRef.current = null;
        setIsMapReady(false);
      };
    } catch {
      setMapError('The map could not be loaded. Please check your browser WebGL support.');
    }
  }, []); // Run once on mount

  // Sync center when prop changes and map is ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    const currentCenter = map.getCenter();
    const [targetLng, targetLat] = center;
    const diff = Math.hypot(currentCenter.lng - targetLng, currentCenter.lat - targetLat);
    if (diff > 0.0001) {
      map.flyTo({
        center: [targetLng, targetLat],
        zoom: Math.max(map.getZoom(), 13),
        essential: true,
        duration: 1000,
      });
    }
  }, [center, isMapReady]);

  // Destination Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (destination && destination.latitude && destination.longitude) {
      const el = document.createElement('div');
      el.className = 'map-marker-destination';
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `Destination: ${destination.name}`);
      el.innerHTML = `
        <div class="destination-pulse"></div>
        <div class="destination-pin">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div class="map-popup-destination">
          <span class="map-popup-eyebrow">YOUR DESTINATION</span>
          <strong>${destination.name}</strong>
          ${destination.region || destination.country ? `<span>${[destination.region, destination.country].filter(Boolean).join(', ')}</span>` : ''}
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([destination.longitude, destination.latitude])
        .setPopup(popup)
        .addTo(map);

      destinationMarkerRef.current = marker;
    }
  }, [destination, isMapReady]);

  // Place markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    // Remove obsolete markers
    const currentIds = new Set(places.map((p) => p.providerId));
    placeMarkersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        placeMarkersRef.current.delete(id);
      }
    });

    // Add or update markers
    places.forEach((place) => {
      const isSelected = selectedPlaceId === place.providerId;
      const meta = place.category
        ? CATEGORY_METADATA[place.category]
        : { label: 'Place', color: '#315b48', badgeBg: '#edf1e9' };

      let marker = placeMarkersRef.current.get(place.providerId);

      if (!marker) {
        const el = document.createElement('div');
        el.className = `map-marker-place ${isSelected ? 'is-selected' : ''}`;
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `${place.name} (${meta.label})`);
        el.style.setProperty('--marker-color', meta.color);

        el.innerHTML = `
          <div class="marker-dot">
            <span class="marker-inner-icon"></span>
          </div>
        `;

        el.addEventListener('click', () => {
          onSelectPlace?.(place);
        });

        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectPlace?.(place);
          }
        });

        const popup = new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(`
          <div class="map-popup-place">
            <span class="map-popup-cat" style="color: ${meta.color};">${meta.label}</span>
            <strong>${place.name}</strong>
            ${place.address ? `<address>${place.address}</address>` : ''}
          </div>
        `);

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([place.longitude, place.latitude])
          .setPopup(popup)
          .addTo(map);

        placeMarkersRef.current.set(place.providerId, marker);
      } else {
        // Update selection styling on existing marker
        const el = marker.getElement();
        if (isSelected) {
          el.classList.add('is-selected');
        } else {
          el.classList.remove('is-selected');
        }
      }
    });
  }, [places, selectedPlaceId, isMapReady, onSelectPlace]);

  // Selected place camera focus
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !selectedPlaceId) return;

    const place = places.find((p) => p.providerId === selectedPlaceId);
    if (place) {
      map.easeTo({
        center: [place.longitude, place.latitude],
        zoom: Math.max(map.getZoom(), 14.5),
        duration: 800,
      });

      const marker = placeMarkersRef.current.get(selectedPlaceId);
      if (marker && !marker.getPopup()?.isOpen()) {
        marker.togglePopup();
      }
    }
  }, [selectedPlaceId, places, isMapReady]);

  // Fit all bounds (destination + places)
  const fitAllBounds = () => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = new maplibregl.LngLatBounds();
    let count = 0;

    if (destination && destination.latitude && destination.longitude) {
      bounds.extend([destination.longitude, destination.latitude]);
      count++;
    }

    places.forEach((p) => {
      bounds.extend([p.longitude, p.latitude]);
      count++;
    });

    if (count > 0) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
    } else {
      map.flyTo({ center, zoom: 13, duration: 800 });
    }
  };

  const resetToCenter = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center, zoom: 13, duration: 800 });
  };

  return (
    <div className={`map-wrapper ${className}`}>
      <div ref={mapContainerRef} className="map-canvas-container" />

      {mapError && (
        <div className="map-error-overlay" role="alert">
          <AlertCircle size={24} className="map-error-icon" />
          <h3>Map Temporarily Unavailable</h3>
          <p>{mapError}</p>
          <button
            type="button"
            className="map-retry-btn"
            onClick={() => {
              setMapError(null);
              window.location.reload();
            }}
          >
            Retry Map
          </button>
        </div>
      )}

      {/* Floating custom controls */}
      {isMapReady && !mapError && (
        <div className="map-floating-controls">
          <button
            type="button"
            className="map-control-btn"
            title="Fit all places in view"
            aria-label="Fit all places in view"
            onClick={fitAllBounds}
          >
            <Maximize2 size={16} />
          </button>
          <button
            type="button"
            className="map-control-btn"
            title="Reset to center"
            aria-label="Reset to center"
            onClick={resetToCenter}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
