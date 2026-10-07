import { useEffect, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Crosshair,
  ExternalLink,
  Flame,
  Hospital,
  MapPin,
  Navigation,
  PhoneCall,
  Pill,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import {
  useCreateLocationShare,
  useEmergencyNumbers,
  useEndEmergencySession,
  useNearbyEmergencyServices,
  useRevokeLocationShare,
  useStartEmergencySession,
} from '../services/emergencyService';
import { useOptionalAuth } from '../store/AuthProvider';
import type {
  EmergencyCategory,
  EmergencySession,
  LocationShareDuration,
  LocationShareResponse,
} from '../types/emergency';
import type { EmergencyContact } from '../types/user';

interface GeolocationState {
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  error?: string;
  loading: boolean;
  consented: boolean;
}

const emergencyCategoryList: {
  type: EmergencyCategory;
  label: string;
  desc: string;
  icon: typeof Hospital;
}[] = [
  {
    type: 'medical',
    label: 'Medical Emergency',
    desc: 'Severe illness, injury, or urgent healthcare need',
    icon: Hospital,
  },
  {
    type: 'police',
    label: 'Police / Security',
    desc: 'Crime, threat, harassment, or physical danger',
    icon: ShieldAlert,
  },
  {
    type: 'accident',
    label: 'Accident',
    desc: 'Vehicle collision, road accident, or trauma',
    icon: AlertOctagon,
  },
  {
    type: 'fire',
    label: 'Fire',
    desc: 'Fire outbreak, smoke, or explosion hazard',
    icon: Flame,
  },
  {
    type: 'lost',
    label: 'Lost / Stranded',
    desc: 'Disoriented, off-trail, or vehicle breakdown',
    icon: Crosshair,
  },
  {
    type: 'general',
    label: 'Need Help',
    desc: 'Immediate distress or general emergency assistance',
    icon: AlertTriangle,
  },
];

const guidanceSteps: Record<EmergencyCategory, string[]> = {
  medical: [
    'Call national medical emergency or local ambulance immediately.',
    'Keep the patient still and warm; do not move if spinal injury is suspected.',
    'If bleeding heavily, apply firm, continuous pressure with a clean cloth.',
    'Note symptoms, medications, and time to tell paramedics.',
  ],
  police: [
    'If in immediate physical danger, move to a brightly lit, populated space.',
    'Dial the emergency police dispatch number below.',
    'Do not confront threats or escalate confrontational situations.',
    'Inform a trusted emergency contact of your exact location.',
  ],
  fire: [
    'Evacuate immediately without pausing to gather non-essential belongings.',
    'Stay low to avoid smoke and toxic fumes.',
    'Feel closed doors with the back of your hand before opening.',
    'Call the fire dispatch number once in a safe open area.',
  ],
  accident: [
    'Move away from active traffic lanes to a safe roadside or barrier.',
    'Turn on hazard flashers if a vehicle is involved.',
    'Check yourself and companions for urgent injuries.',
    'Call emergency response and avoid moving injured persons unless threatened by fire.',
  ],
  lost: [
    'Stop and stay in one recognizable, sheltered location to conserve energy.',
    'Conserve mobile battery: dim brightness, disable non-essential apps.',
    'Share your exact GPS coordinates with your emergency contacts or dispatch.',
    'Remain visible with bright clothing or a whistle if off-road.',
  ],
  general: [
    'Take a breath and prioritize your immediate physical safety.',
    'Call the official emergency dispatch number shown below.',
    'Share your coordinates with local emergency personnel and emergency contacts.',
    'Stay calm and follow instructions from authorized responders.',
  ],
};

export function EmergencyPage() {
  const auth = useOptionalAuth();
  const authenticated = auth?.status === 'authenticated';

  const [activeSession, setActiveSession] = useState<EmergencySession | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory>('general');
  const [inEmergencyMode, setInEmergencyMode] = useState(false);
  const [geoState, setGeoState] = useState<GeolocationState>({
    loading: false,
    consented: false,
  });
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Phase 7: Explicit Location Sharing State
  const [activeShare, setActiveShare] = useState<LocationShareResponse | null>(null);
  const [shareDuration, setShareDuration] = useState<LocationShareDuration>(60);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const startSession = useStartEmergencySession();
  const endSession = useEndEmergencySession();
  const createShareMutation = useCreateLocationShare();
  const revokeShareMutation = useRevokeLocationShare();

  // Load authoritative emergency numbers
  const { data: numbersData } = useEmergencyNumbers();
  const numbers = numbersData;

  // Nearby emergency services based on consented location
  const { data: nearbyData, isLoading: nearbyLoading } = useNearbyEmergencyServices(
    geoState.latitude,
    geoState.longitude,
    selectedCategory === 'medical' ? 'hospitals' : selectedCategory === 'police' ? 'police' : 'all',
  );

  // Load user emergency contacts if authenticated
  useEffect(() => {
    if (authenticated) {
      setContactsLoading(true);
      authService
        .getEmergencyContacts()
        .then((data) => setContacts(data))
        .catch(() => setContacts([]))
        .finally(() => setContactsLoading(false));
    }
  }, [authenticated]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
        loading: false,
      }));
      return;
    }

    setGeoState((prev) => ({ ...prev, loading: true, error: undefined }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: Math.round(pos.coords.accuracy),
          loading: false,
          consented: true,
        });
      },
      (err) => {
        let msg = 'Location request was declined.';
        if (err.code === err.TIMEOUT) msg = 'Location request timed out. Please try again.';
        else if (err.code === err.POSITION_UNAVAILABLE)
          msg = 'Location information is currently unavailable.';
        setGeoState((prev) => ({ ...prev, loading: false, error: msg, consented: false }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleTriggerEmergency = async (category: EmergencyCategory) => {
    setSelectedCategory(category);
    setInEmergencyMode(true);

    try {
      const session = await startSession.mutateAsync({
        type: category,
        location:
          geoState.latitude && geoState.longitude
            ? {
                latitude: geoState.latitude,
                longitude: geoState.longitude,
                accuracyMeters: geoState.accuracyMeters,
              }
            : undefined,
      });
      setActiveSession(session);
    } catch {
      // Local emergency mode still stays active even if network session failed
    }

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // jsdom fallback
      }
    }
  };

  const handleEndEmergency = async () => {
    if (activeSession) {
      try {
        await endSession.mutateAsync({
          sessionId: activeSession._id,
          status: 'resolved',
        });
      } catch {
        // Ignored
      }
    }
    setActiveSession(null);
    setInEmergencyMode(false);
  };

  const handleShareLocation = async () => {
    setShareError(null);
    if (!geoState.latitude || !geoState.longitude) {
      requestLocation();
      return;
    }

    try {
      const result = await createShareMutation.mutateAsync({
        latitude: geoState.latitude,
        longitude: geoState.longitude,
        accuracyMeters: geoState.accuracyMeters,
        durationMinutes: shareDuration,
        sessionId: activeSession?._id,
        note: inEmergencyMode
          ? `Emergency SOS (${selectedCategory.toUpperCase()})`
          : 'Emergency Location Snapshot',
      });
      setActiveShare(result);
    } catch (err) {
      setShareError(
        err instanceof Error ? err.message : 'Failed to generate emergency location share link.',
      );
    }
  };

  const handleRevokeShare = async () => {
    if (!activeShare) return;
    try {
      await revokeShareMutation.mutateAsync(activeShare.token);
      setActiveShare(null);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Failed to revoke location share link.');
    }
  };

  const handleCopyShareLink = async () => {
    if (!activeShare) return;
    const shareUrl = `${window.location.origin}${activeShare.sharePath}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <main
      className={`product-page emergency-page-root ${inEmergencyMode ? 'emergency-mode-active' : ''}`}
      role="region"
      aria-label="TripSOS Emergency Center"
    >
      <div className="product-shell emergency-shell">
        {/* ACTIVE EMERGENCY BANNER */}
        {inEmergencyMode && (
          <aside className="emergency-alert-banner" role="alert" aria-live="assertive">
            <div className="emergency-alert-banner__content">
              <span className="emergency-alert-pulse" aria-hidden="true" />
              <div>
                <strong>EMERGENCY MODE ACTIVE · {selectedCategory.toUpperCase()}</strong>
                <p>Stay calm. Immediate telephone dispatch and verified nearby help are below.</p>
              </div>
            </div>
            <button
              type="button"
              className="emergency-safe-btn"
              onClick={handleEndEmergency}
              disabled={endSession.isPending}
            >
              <CheckCircle size={16} /> I AM SAFE NOW
            </button>
          </aside>
        )}

        {/* PRIMARY "I'M IN TROUBLE" HERO CTA */}
        {!inEmergencyMode && (
          <header className="emergency-hero-cta-section">
            <span className="emergency-eyebrow">
              <ShieldAlert size={16} /> IMMEDIATE SAFETY RESPONSE
            </span>
            <h1>Emergency Assistance</h1>
            <p className="emergency-subhead">
              Press the button below or choose an emergency category for immediate telephone
              dispatch and nearby verified emergency facilities.
            </p>

            <button
              type="button"
              id="emergency-trouble-cta"
              className="emergency-big-trouble-btn"
              onClick={() => void handleTriggerEmergency('general')}
              aria-label="I'm in trouble. Activate emergency mode now."
            >
              <AlertOctagon size={36} aria-hidden="true" />
              <span>I'M IN TROUBLE</span>
            </button>
          </header>
        )}

        {/* IMMEDIATE EMERGENCY NUMBERS (TOP PRIORITY) */}
        <section className="emergency-dispatch-section" aria-labelledby="dispatch-heading">
          <div className="emergency-section-header">
            <div>
              <span className="emergency-eyebrow">ONE-TOUCH DIAL</span>
              <h2 id="dispatch-heading">
                {numbers?.countryName
                  ? `${numbers.countryName} Emergency Dispatch`
                  : 'Emergency Dispatch'}
              </h2>
            </div>
            {numbers?.source && (
              <span className="emergency-source-tag">Source: {numbers.source}</span>
            )}
          </div>

          <div className="emergency-numbers-grid">
            <a
              href={`tel:${numbers?.general ?? '112'}`}
              className="emergency-dial-card emergency-dial-card--primary"
              aria-label={`Call general emergency number ${numbers?.general ?? '112'}`}
            >
              <div className="emergency-dial-info">
                <span className="emergency-dial-label">NATIONAL EMERGENCY / SOS</span>
                <strong className="emergency-dial-num">{numbers?.general ?? '112'}</strong>
                <span className="emergency-dial-sub">Tap to call emergency operator</span>
              </div>
              <PhoneCall size={28} className="dial-icon" aria-hidden="true" />
            </a>

            {numbers?.police && numbers.police !== numbers.general && (
              <a
                href={`tel:${numbers.police}`}
                className="emergency-dial-card"
                aria-label={`Call police dispatch ${numbers.police}`}
              >
                <div className="emergency-dial-info">
                  <span className="emergency-dial-label">POLICE / SECURITY</span>
                  <strong className="emergency-dial-num">{numbers.police}</strong>
                  <span className="emergency-dial-sub">Law enforcement dispatch</span>
                </div>
                <Shield size={24} className="dial-icon" aria-hidden="true" />
              </a>
            )}

            {numbers?.ambulance && numbers.ambulance !== numbers.general && (
              <a
                href={`tel:${numbers.ambulance}`}
                className="emergency-dial-card"
                aria-label={`Call ambulance ${numbers.ambulance}`}
              >
                <div className="emergency-dial-info">
                  <span className="emergency-dial-label">AMBULANCE / MEDICAL</span>
                  <strong className="emergency-dial-num">{numbers.ambulance}</strong>
                  <span className="emergency-dial-sub">Medical paramedics dispatch</span>
                </div>
                <Hospital size={24} className="dial-icon" aria-hidden="true" />
              </a>
            )}

            {numbers?.fire && numbers.fire !== numbers.general && (
              <a
                href={`tel:${numbers.fire}`}
                className="emergency-dial-card"
                aria-label={`Call fire brigade ${numbers.fire}`}
              >
                <div className="emergency-dial-info">
                  <span className="emergency-dial-label">FIRE BRIGADE</span>
                  <strong className="emergency-dial-num">{numbers.fire}</strong>
                  <span className="emergency-dial-sub">Fire and rescue service</span>
                </div>
                <Flame size={24} className="dial-icon" aria-hidden="true" />
              </a>
            )}
          </div>
        </section>

        {/* EMERGENCY CATEGORIES (SELECTABLE) */}
        <section className="emergency-categories-section" aria-labelledby="categories-heading">
          <div className="emergency-section-header">
            <div>
              <span className="emergency-eyebrow">ASSISTANCE TYPE</span>
              <h2 id="categories-heading">Choose Your Situation</h2>
            </div>
            <span className="emergency-badge">Tailored steps & services</span>
          </div>

          <div className="emergency-category-grid" role="radiogroup">
            {emergencyCategoryList.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.type;
              return (
                <button
                  key={cat.type}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`emergency-category-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => void handleTriggerEmergency(cat.type)}
                >
                  <span className="category-icon-wrap">
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <strong>{cat.label}</strong>
                  <p>{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* STEP-BY-STEP GUIDANCE FOR THE CHOSEN SITUATION */}
        <section className="emergency-guidance-container" aria-labelledby="guidance-heading">
          <div className="emergency-section-header">
            <div>
              <span className="emergency-eyebrow">WHAT TO DO RIGHT NOW</span>
              <h2 id="guidance-heading">Immediate Steps for {selectedCategory.toUpperCase()}</h2>
            </div>
          </div>
          <ol className="emergency-steps-list">
            {guidanceSteps[selectedCategory].map((step, index) => (
              <li key={index} className="emergency-step-item">
                <span className="step-num">{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* LOCATION CONSENT & COORDINATES */}
        <section className="emergency-location-section" aria-labelledby="loc-heading">
          <div className="emergency-location-card">
            <div className="emergency-location-info">
              <span className="emergency-eyebrow">
                <MapPin size={14} /> PRIVACY-FIRST GEOLOCATION
              </span>
              <h2 id="loc-heading">Your Location for Emergency Responders</h2>
              <p>
                TripSOS never silently tracks your location. Click below to retrieve your exact GPS
                coordinates to share with dispatchers or discover nearby emergency care.
              </p>

              {geoState.consented && geoState.latitude && geoState.longitude ? (
                <div className="emergency-coords-display">
                  <div className="coords-row">
                    <span>
                      LATITUDE: <strong>{geoState.latitude.toFixed(5)}</strong>
                    </span>
                    <span>
                      LONGITUDE: <strong>{geoState.longitude.toFixed(5)}</strong>
                    </span>
                    {geoState.accuracyMeters && (
                      <span className="accuracy-pill">±{geoState.accuracyMeters}m accuracy</span>
                    )}
                  </div>
                  <p className="coords-share-hint">
                    Read these coordinates out loud to the emergency operator.
                  </p>
                </div>
              ) : null}

              {geoState.error && (
                <p className="emergency-loc-error" role="alert">
                  <XCircle size={15} /> {geoState.error}
                </p>
              )}
            </div>

            <button
              type="button"
              className="emergency-locate-btn"
              onClick={requestLocation}
              disabled={geoState.loading}
            >
              <Crosshair size={18} />
              {geoState.loading
                ? 'Acquiring GPS…'
                : geoState.consented
                  ? 'Update Current Location'
                  : 'Use My Current Location'}
            </button>
          </div>
        </section>

        {/* VERIFIED NEARBY EMERGENCY SERVICES */}
        <section className="emergency-services-section" aria-labelledby="services-heading">
          <div className="emergency-section-header">
            <div>
              <span className="emergency-eyebrow">VERIFIED LOCAL RESCUE</span>
              <h2 id="services-heading">Nearby Emergency Facilities</h2>
            </div>
            {nearbyData?.source && (
              <span className="emergency-source-tag">Discovered via {nearbyData.source}</span>
            )}
          </div>

          {!geoState.consented ? (
            <div className="emergency-loc-prompt-card">
              <MapPin size={24} aria-hidden="true" />
              <h3>Allow location access to find nearby hospitals & police</h3>
              <p>
                Nearby facilities are calculated from your real-time coordinates using verified
                mapping providers.
              </p>
              <button
                type="button"
                className="emergency-locate-prompt-btn"
                onClick={requestLocation}
              >
                <Crosshair size={16} /> Enable location to discover nearby facilities
              </button>
            </div>
          ) : nearbyLoading ? (
            <div className="emergency-loading-state" role="status">
              <span className="emergency-spinner" aria-hidden="true" />
              <p>Searching for nearby hospitals, pharmacies, and police stations…</p>
            </div>
          ) : !nearbyData?.services || nearbyData.services.length === 0 ? (
            <div className="emergency-empty-state">
              <Building2 size={24} />
              <h3>No verified emergency facilities found within 5 km</h3>
              <p>
                Contact national emergency dispatch ({numbers?.general ?? '112'}) directly for
                immediate medical or security routing.
              </p>
            </div>
          ) : (
            <div className="emergency-facilities-grid">
              {nearbyData.services.map((place) => (
                <article key={place.providerId} className="emergency-facility-card">
                  <div className="facility-card-header">
                    <span className={`facility-cat-badge cat-${place.category ?? 'hospitals'}`}>
                      {place.category === 'police' ? (
                        <Shield size={12} />
                      ) : place.category === 'pharmacies' ? (
                        <Pill size={12} />
                      ) : (
                        <Hospital size={12} />
                      )}
                      {place.category ?? 'facility'}
                    </span>
                    {place.distanceMeters !== undefined && (
                      <span className="facility-distance">
                        {(place.distanceMeters / 1000).toFixed(1)} km away
                      </span>
                    )}
                  </div>

                  <h3 className="facility-title">{place.name}</h3>

                  {place.address && (
                    <p className="facility-address">
                      <MapPin size={13} aria-hidden="true" />
                      <span>{place.address}</span>
                    </p>
                  )}

                  <div className="facility-actions">
                    {place.phone ? (
                      <a
                        href={`tel:${place.phone.replace(/\s+/g, '')}`}
                        className="facility-call-btn"
                        aria-label={`Call ${place.name}`}
                      >
                        <PhoneCall size={14} /> Call {place.phone}
                      </a>
                    ) : (
                      <span className="facility-no-phone">Phone not listed</span>
                    )}

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="facility-nav-btn"
                      aria-label={`Directions to ${place.name}`}
                    >
                      <Navigation size={14} /> Directions
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* PHASE 7: USER-CONTROLLED EMERGENCY LOCATION SHARING */}
        <section className="emergency-share-section" aria-labelledby="share-heading">
          <div className="emergency-section-header">
            <div>
              <span className="emergency-eyebrow">PRIVACY-FIRST BROADCAST</span>
              <h2 id="share-heading">Share My Emergency Location</h2>
            </div>
          </div>

          <div className="emergency-share-panel">
            <p className="emergency-share-panel-desc">
              Generate a cryptographically secure, temporary link to share your exact GPS coordinates
              with trusted responders, friends, or family. The link expires automatically and does not
              expose any account credentials or sensitive information.
            </p>

            {activeShare ? (
              <div className="emergency-active-share-box">
                <div className="active-share-badge">
                  <Clock size={16} className="text-amber-400" />
                  <span>
                    Active SOS Share • Expires at{' '}
                    {new Date(activeShare.expiresAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="active-share-link-row">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${activeShare.sharePath}`}
                    className="active-share-input"
                    aria-label="Secure location share link"
                  />
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="active-share-copy-btn"
                  >
                    {shareCopied ? (
                      <>
                        <Check size={16} className="text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copy Link
                      </>
                    )}
                  </button>
                </div>

                <div className="active-share-actions">
                  <a
                    href={activeShare.sharePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="active-share-open-btn"
                  >
                    <ExternalLink size={15} /> Preview Public SOS View
                  </a>
                  <button
                    type="button"
                    onClick={handleRevokeShare}
                    className="active-share-revoke-btn"
                    disabled={revokeShareMutation.isPending}
                  >
                    Revoke Link Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="emergency-create-share-flow">
                <div className="share-duration-selector">
                  <span className="selector-label">Auto-Expiration Duration:</span>
                  <div className="duration-pill-group">
                    {([30, 60, 240] as const).map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        className={`duration-pill ${shareDuration === duration ? 'active' : ''}`}
                        onClick={() => setShareDuration(duration)}
                      >
                        {duration === 30 ? '30 Minutes' : duration === 60 ? '1 Hour' : '4 Hours'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="share-trigger-row">
                  {!geoState.consented ? (
                    <button
                      type="button"
                      className="emergency-locate-prompt-btn"
                      onClick={requestLocation}
                      disabled={geoState.loading}
                    >
                      <Crosshair size={16} /> Enable GPS to generate share link
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="emergency-generate-share-btn"
                      onClick={handleShareLocation}
                      disabled={createShareMutation.isPending}
                    >
                      <Share2 size={18} />
                      {createShareMutation.isPending
                        ? 'Generating Secure Link…'
                        : 'Generate Secure Location Share Link'}
                    </button>
                  )}
                </div>

                {shareError && <p className="emergency-share-error">{shareError}</p>}
              </div>
            )}
          </div>
        </section>

        {/* EMERGENCY CONTACTS */}
        <section className="emergency-contacts-section" aria-labelledby="contacts-heading">
          <div className="emergency-section-header">
            <div>
              <span className="emergency-eyebrow">TRUSTED NETWORK</span>
              <h2 id="contacts-heading">Your Emergency Contacts</h2>
            </div>
            {authenticated && (
              <Link to="/profile" className="emergency-manage-link">
                Manage contacts
              </Link>
            )}
          </div>

          {!authenticated ? (
            <div className="emergency-guest-note">
              <Users size={20} />
              <div>
                <strong>Guest Mode</strong>
                <p>
                  Emergency mode and official dispatch numbers are fully operational without logging
                  in. If you have an account, sign in to instantly notify your designated personal
                  contacts.
                </p>
                <Link to="/login" className="product-text-link">
                  Sign in to view saved contacts
                </Link>
              </div>
            </div>
          ) : contactsLoading ? (
            <div className="emergency-loading-state" role="status">
              <span className="emergency-spinner" aria-hidden="true" />
              <p>Loading your emergency contacts…</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="emergency-empty-state">
              <UserCheck size={24} />
              <h3>No emergency contacts saved yet</h3>
              <p>Add trusted family, friends, or companions from your profile for rapid calling.</p>
              <Link to="/profile" className="product-text-link">
                Add emergency contacts in profile
              </Link>
            </div>
          ) : (
            <div className="emergency-contacts-grid">
              {contacts.map((contact) => (
                <article key={contact._id} className="emergency-contact-card">
                  <div className="contact-card-info">
                    <div className="contact-badge-row">
                      <span className="contact-relation-pill">{contact.relationship}</span>
                      {contact.isPrimary && (
                        <span className="contact-primary-tag">Primary</span>
                      )}
                      {contact.priority !== undefined && contact.priority > 1 && (
                        <span className="contact-priority-tag">Priority #{contact.priority}</span>
                      )}
                    </div>
                    <h3>{contact.name}</h3>
                    <p>{contact.phone}</p>
                  </div>
                  <div className="contact-card-actions">
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                      className="contact-call-btn"
                      aria-label={`Call ${contact.name}`}
                    >
                      <PhoneCall size={16} /> Call
                    </a>
                    <a
                      href={`sms:${contact.phone.replace(/\s+/g, '')}${
                        activeShare
                          ? `?body=EMERGENCY SOS: I need help. My live emergency location link: ${window.location.origin}${activeShare.sharePath}`
                          : geoState.latitude && geoState.longitude
                          ? `?body=EMERGENCY SOS: I need assistance. My coordinates: ${geoState.latitude},${geoState.longitude}`
                          : '?body=EMERGENCY SOS: I need assistance. Please contact me.'
                      }`}
                      className="contact-sms-btn"
                      aria-label={`Send SMS to ${contact.name}`}
                    >
                      <Send size={15} /> SMS
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER BOUNDARY NOTICE */}
        <footer className="emergency-disclaimer-footer">
          <p>
            <strong>Emergency Disclosure:</strong> TripSOS provides verified public emergency
            dispatch telephone numbers and location assistance. TripSOS is not an emergency dispatch
            agency and does not directly deploy first responders. Always call official emergency
            telephone lines for urgent life-threatening situations.
          </p>
        </footer>
      </div>
    </main>
  );
}
