import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  Compass,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  PhoneCall,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { useSharedLocation } from '../services/emergencyService';
import { MapLibreMap } from '../components/maps/MapLibreMap';

export function EmergencySharePage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useSharedLocation(token || '');

  const [copied, setCopied] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  useEffect(() => {
    if (!data?.expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(data.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeftStr('Expired');
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      if (hours > 0) {
        setTimeLeftStr(`${hours}h ${mins}m remaining`);
      } else {
        setTimeLeftStr(`${mins}m ${secs}s remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data?.expiresAt]);

  const handleCopyCoords = async () => {
    if (!data?.location) return;
    const text = `${data.location.latitude.toFixed(6)}, ${data.location.longitude.toFixed(6)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  if (isLoading) {
    return (
      <main className="emergency-share-page" role="main" aria-label="Loading emergency location">
        <div className="emergency-share-container">
          <div className="emergency-card emergency-loading-card">
            <div className="emergency-spinner" aria-hidden="true" />
            <h1 className="emergency-h1">Retrieving Shared Emergency Location…</h1>
            <p className="emergency-body-muted">
              Connecting securely to the verified TripSOS emergency broadcast network.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    const errorMsg =
      error instanceof Error ? error.message : 'Emergency location link is unavailable.';
    const isRevoked = errorMsg.toLowerCase().includes('revoked');
    const isExpired = errorMsg.toLowerCase().includes('expired');

    return (
      <main
        className="emergency-share-page"
        role="main"
        aria-label="Emergency location unavailable"
      >
        <div className="emergency-share-container">
          <div className="emergency-card emergency-alert-card">
            <div className="emergency-alert-icon-box">
              <ShieldAlert className="w-12 h-12 text-amber-500" aria-hidden="true" />
            </div>
            <h1 className="emergency-h1">
              {isRevoked
                ? 'Location Share Revoked'
                : isExpired
                  ? 'Location Share Expired'
                  : 'Emergency Link Unavailable'}
            </h1>
            <p className="emergency-body">
              {isRevoked
                ? 'This emergency location share link has been revoked by the sender.'
                : isExpired
                  ? 'This temporary emergency location link has reached its expiration time.'
                  : errorMsg}
            </p>

            <div className="emergency-safety-guidance">
              <h2 className="emergency-h2">Urgent Safety Instructions</h2>
              <p className="emergency-guidance-text">
                If you believe the sender is currently in immediate danger or facing a
                life-threatening crisis, do not wait. Contact local emergency authorities
                immediately.
              </p>
              <div className="emergency-quick-dial-grid">
                <a href="tel:112" className="emergency-call-btn">
                  <PhoneCall className="w-5 h-5 mr-2" aria-hidden="true" />
                  Call 112 (Universal / India / EU)
                </a>
                <a href="tel:911" className="emergency-call-btn">
                  <PhoneCall className="w-5 h-5 mr-2" aria-hidden="true" />
                  Call 911 (North America)
                </a>
              </div>
            </div>

            <div className="emergency-action-footer">
              <Link to="/emergency" className="emergency-link-btn">
                Go to TripSOS Emergency Center
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { location, note, createdAt, expiresAt } = data;
  const lat = location.latitude;
  const lon = location.longitude;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${lat},${lon}`;

  return (
    <main className="emergency-share-page" role="main" aria-label="Shared emergency location">
      <div className="emergency-share-container">
        {/* Urgent Header Banner */}
        <header className="emergency-share-header">
          <div className="emergency-badge-pulse">
            <Shield className="w-5 h-5 mr-1 text-red-400" aria-hidden="true" />
            <span>ACTIVE EMERGENCY LOCATION BROADCAST</span>
          </div>
          <h1 className="emergency-share-title">Emergency Location Received</h1>
          <p className="emergency-share-subtitle">
            A TripSOS user shared their verified coordinates with you for emergency assistance.
          </p>
        </header>

        {/* Location Snapshot Card */}
        <section className="emergency-card emergency-details-card" aria-label="Location Details">
          <div className="emergency-details-header">
            <div className="emergency-coords-group">
              <span className="emergency-label">COORDINATES</span>
              <div className="emergency-coords-value">
                <MapPin className="w-5 h-5 text-red-500 mr-1.5 flex-shrink-0" aria-hidden="true" />
                <span>
                  {lat.toFixed(6)}, {lon.toFixed(6)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCoords}
                  className="emergency-copy-btn"
                  title="Copy coordinates"
                  aria-label="Copy coordinates"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="emergency-timer-group">
              <span className="emergency-label">SECURITY LINK TIMER</span>
              <div className="emergency-timer-value">
                <Clock className="w-4 h-4 text-amber-400 mr-1.5" aria-hidden="true" />
                <span>{timeLeftStr || 'Active'}</span>
              </div>
            </div>
          </div>

          {location.accuracyMeters != null && (
            <div className="emergency-accuracy-chip">
              <Compass className="w-4 h-4 mr-1 text-sky-400" aria-hidden="true" />
              <span>GPS Accuracy: ±{Math.round(location.accuracyMeters)} meters</span>
            </div>
          )}

          {location.address && (
            <div className="emergency-address-block">
              <span className="emergency-label">REPORTED LOCATION / ADDRESS</span>
              <p className="emergency-address-text">{location.address}</p>
            </div>
          )}

          {note && (
            <div className="emergency-note-block">
              <span className="emergency-label">SENDER'S EMERGENCY NOTE</span>
              <p className="emergency-note-text">"{note}"</p>
            </div>
          )}

          <div className="emergency-metadata-row">
            <span>Broadcast initiated: {new Date(createdAt).toLocaleTimeString()}</span>
            <span>Link expires: {new Date(expiresAt).toLocaleTimeString()}</span>
          </div>

          {/* Directions and Navigation Actions */}
          <div className="emergency-directions-actions">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="emergency-btn-primary"
            >
              <ExternalLink className="w-5 h-5 mr-2" aria-hidden="true" />
              Open in Google Maps
            </a>
            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="emergency-btn-secondary"
            >
              <ExternalLink className="w-5 h-5 mr-2" aria-hidden="true" />
              Open in Apple Maps
            </a>
          </div>
        </section>

        {/* Live Interactive Map */}
        <section className="emergency-card emergency-map-card" aria-label="Interactive Map">
          <div className="emergency-map-header">
            <h2 className="emergency-h2">Location Map</h2>
            <span className="emergency-tag-verified">Verified Coordinates</span>
          </div>
          <div className="emergency-map-embed-wrapper">
            <MapLibreMap
              center={[lon, lat]}
              zoom={14}
              destination={{
                name: note || 'Shared SOS Location',
                latitude: lat,
                longitude: lon,
              }}
              className="emergency-maplibre-container"
            />
          </div>
        </section>

        {/* Urgent Emergency Call Assistance */}
        <section
          className="emergency-card emergency-call-card"
          aria-label="Local Emergency Services"
        >
          <div className="emergency-call-card-header">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-2" aria-hidden="true" />
            <h2 className="emergency-h2">Dispatch Emergency Services</h2>
          </div>
          <p className="emergency-body-muted mb-4">
            If you are responding to this emergency or contacting authorities on the sender's
            behalf, use the direct buttons below to dial verified emergency dispatchers:
          </p>

          <div className="emergency-quick-dial-grid">
            <a href="tel:112" className="emergency-call-btn">
              <PhoneCall className="w-5 h-5 mr-2 text-red-400" aria-hidden="true" />
              <span>Dial 112 (Universal / India / Europe)</span>
            </a>
            <a href="tel:911" className="emergency-call-btn">
              <PhoneCall className="w-5 h-5 mr-2 text-red-400" aria-hidden="true" />
              <span>Dial 911 (North America)</span>
            </a>
            <a href="tel:999" className="emergency-call-btn">
              <PhoneCall className="w-5 h-5 mr-2 text-red-400" aria-hidden="true" />
              <span>Dial 999 (United Kingdom)</span>
            </a>
          </div>
        </section>

        {/* Privacy Shield Notice */}
        <footer className="emergency-privacy-shield">
          <Shield className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" aria-hidden="true" />
          <p>
            <strong>TripSOS Privacy Shield:</strong> This link contains only the minimum location
            snapshot explicitly confirmed by the user. No personal account credentials, passwords,
            or financial data are shared or accessible.
          </p>
        </footer>
      </div>
    </main>
  );
}
