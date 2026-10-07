import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Flame,
  HeartPulse,
  Info,
  MapPin,
  Phone,
  RefreshCw,
  Share2,
  ShieldAlert,
  Smartphone,
  Trash2,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { usePwaInstall } from '../hooks/usePwaInstall';
import {
  buildOfflinePack,
  clearOfflineEmergencyPack,
  getOfflineEmergencyPack,
  isPackStale,
  saveOfflineEmergencyPack,
  VERIFIED_FIRST_AID_GUIDES,
  VERIFIED_OFFLINE_NUMBERS,
  type OfflineEmergencyPack,
} from '../services/offlinePackService';
import { authService } from '../services/authService';
import { useTrips } from '../services/tripService';
import { useOptionalAuth } from '../store/AuthProvider';
import type { EmergencyContact } from '../types/user';

export function OfflinePage() {
  const { isOnline } = useNetworkStatus();
  const { canInstall, promptInstall, isInstalled } = usePwaInstall();
  const auth = useOptionalAuth();

  // Queries (only active when online)
  const [liveContacts, setLiveContacts] = useState<EmergencyContact[]>([]);
  const { data: tripsData } = useTrips();

  const [pack, setPack] = useState<OfflineEmergencyPack | null>(() => getOfflineEmergencyPack());
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>('cpr-cardiac');
  const [copiedContactPhone, setCopiedContactPhone] = useState<string | null>(null);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  const stale = pack ? isPackStale(pack) : false;

  useEffect(() => {
    if (auth?.status === 'authenticated') {
      authService
        .getEmergencyContacts()
        .then((contacts) => setLiveContacts(contacts as unknown as EmergencyContact[]))
        .catch(() => setLiveContacts([]));
    }
  }, [auth?.status]);

  const handleUpdatePack = () => {
    const updated = buildOfflinePack({
      user: auth?.user ? { name: auth.user.name, email: auth.user.email } : undefined,
      emergencyContacts: liveContacts.length ? liveContacts : pack?.emergencyContacts ?? [],
      trips: tripsData ?? (pack?.activeTrips as unknown as typeof tripsData) ?? [],
    });
    saveOfflineEmergencyPack(updated);
    setPack(updated);
    setUpdateFeedback('Emergency Pack successfully updated for offline readiness!');
    setTimeout(() => setUpdateFeedback(null), 4000);
  };

  const handleClearPack = () => {
    if (confirm('Are you sure you want to delete your cached offline emergency pack?')) {
      clearOfflineEmergencyPack();
      setPack(null);
    }
  };

  const copyPhoneNumber = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedContactPhone(phone);
    setTimeout(() => setCopiedContactPhone(null), 2500);
  };

  return (
    <main className="offline-page" aria-labelledby="offline-page-title">
      <div className="offline-page-container">
        {/* Status Header */}
        <header className="offline-header">
          <div className="offline-header-status-row">
            <span
              className={`offline-status-badge ${isOnline ? 'offline-status-badge--online' : 'offline-status-badge--offline'}`}
            >
              {isOnline ? (
                <>
                  <Wifi size={14} aria-hidden="true" />
                  <span>Online — Sync Active</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} aria-hidden="true" />
                  <span>Offline Mode Active</span>
                </>
              )}
            </span>

            {pack && (
              <span
                className={`offline-pack-badge ${stale ? 'offline-pack-badge--stale' : 'offline-pack-badge--fresh'}`}
              >
                {stale ? 'Pack Needs Refresh' : 'Offline Pack Ready'}
              </span>
            )}
          </div>

          <h1 id="offline-page-title" className="offline-page-title">
            Offline Emergency &amp; Travel Pack
          </h1>
          <p className="offline-page-subtitle">
            Essential emergency contacts, authoritative dispatch numbers, and survival guides
            remain fully operational on your device even without an internet connection.
          </p>
        </header>

        {updateFeedback && (
          <div className="offline-feedback-banner" role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>{updateFeedback}</span>
          </div>
        )}

        {/* Immediate 1-Tap SOS Dispatch Dialers */}
        <section className="offline-quick-actions" aria-labelledby="quick-dial-heading">
          <h2 id="quick-dial-heading" className="offline-section-title">
            <ShieldAlert size={18} aria-hidden="true" />
            Immediate Dispatch Dialers (No Data Required)
          </h2>
          <div className="offline-dial-grid">
            <a href="tel:112" className="offline-dial-card offline-dial-card--sos">
              <span className="offline-dial-badge">Universal SOS</span>
              <span className="offline-dial-number">112</span>
              <span className="offline-dial-label">All-Service Emergency</span>
              <span className="offline-dial-cta">
                <Phone size={14} aria-hidden="true" /> Tap to Call
              </span>
            </a>

            <a href="tel:108" className="offline-dial-card offline-dial-card--medical">
              <span className="offline-dial-badge">Medical / Ambulance</span>
              <span className="offline-dial-number">108 / 911</span>
              <span className="offline-dial-label">Emergency Medical Care</span>
              <span className="offline-dial-cta">
                <HeartPulse size={14} aria-hidden="true" /> Tap to Call
              </span>
            </a>

            <a href="tel:100" className="offline-dial-card offline-dial-card--police">
              <span className="offline-dial-badge">Police / Security</span>
              <span className="offline-dial-number">100 / 911</span>
              <span className="offline-dial-label">Police Dispatch</span>
              <span className="offline-dial-cta">
                <Phone size={14} aria-hidden="true" /> Tap to Call
              </span>
            </a>

            <a href="tel:101" className="offline-dial-card offline-dial-card--fire">
              <span className="offline-dial-badge">Fire &amp; Rescue</span>
              <span className="offline-dial-number">101</span>
              <span className="offline-dial-label">Fire Department</span>
              <span className="offline-dial-cta">
                <Flame size={14} aria-hidden="true" /> Tap to Call
              </span>
            </a>
          </div>
        </section>

        {/* Offline Pack Controls */}
        <section className="offline-pack-manager" aria-labelledby="pack-manager-heading">
          <div className="offline-pack-manager-card">
            <div className="offline-pack-manager-info">
              <h2 id="pack-manager-heading" className="offline-pack-title">
                Device Storage &amp; Preparedness
              </h2>
              {pack ? (
                <p className="offline-pack-meta">
                  Cached on this device: <strong>{new Date(pack.savedAt).toLocaleString()}</strong>.
                  Contains {pack.emergencyContacts.length} contacts, {pack.activeTrips.length}{' '}
                  trips, and {pack.firstAidGuides.length} medical protocols.
                  {stale && (
                    <span className="offline-stale-warning">
                      <AlertTriangle size={14} aria-hidden="true" />
                      Saved over 72 hours ago. We recommend updating before your departure.
                    </span>
                  )}
                </p>
              ) : (
                <p className="offline-pack-meta">
                  No emergency pack cached on this device yet. Save your trips and emergency
                  contacts now so they are instantly accessible if you lose cellular coverage.
                </p>
              )}
            </div>

            <div className="offline-pack-manager-actions">
              <button
                type="button"
                onClick={handleUpdatePack}
                className="offline-pack-btn offline-pack-btn--primary"
              >
                {pack ? (
                  <>
                    <RefreshCw size={16} aria-hidden="true" />
                    <span>Update Offline Pack</span>
                  </>
                ) : (
                  <>
                    <Download size={16} aria-hidden="true" />
                    <span>Download Emergency Pack</span>
                  </>
                )}
              </button>

              {pack && (
                <button
                  type="button"
                  onClick={handleClearPack}
                  className="offline-pack-btn offline-pack-btn--danger"
                  aria-label="Delete offline emergency pack"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  <span>Clear Pack</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* PWA Install Notice */}
        {canInstall && !isInstalled && (
          <section className="offline-pwa-install-banner" aria-label="Install App for Offline Use">
            <div className="offline-pwa-text">
              <Smartphone size={24} className="offline-pwa-icon" aria-hidden="true" />
              <div>
                <strong>Install TripSOS on Your Device</strong>
                <p>
                  Add TripSOS directly to your home screen or desktop for 1-tap emergency access
                  even when offline.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={promptInstall}
              className="offline-pwa-install-btn"
            >
              Install App
            </button>
          </section>
        )}

        <div className="offline-grid-2col">
          {/* Emergency Contacts Section */}
          <section className="offline-contacts-card" aria-labelledby="contacts-heading">
            <h2 id="contacts-heading" className="offline-section-title">
              <Users size={18} aria-hidden="true" />
              Cached Emergency Contacts
            </h2>

            {pack && pack.emergencyContacts.length > 0 ? (
              <ul className="offline-contacts-list" role="list">
                {pack.emergencyContacts.map((contact, idx) => (
                  <li key={contact._id || idx} className="offline-contact-item">
                    <div className="offline-contact-info">
                      <div className="offline-contact-name-row">
                        <span className="offline-contact-name">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="offline-contact-primary-tag">Primary</span>
                        )}
                      </div>
                      <span className="offline-contact-rel">{contact.relationship}</span>
                      <span className="offline-contact-phone">{contact.phone}</span>
                    </div>

                    <div className="offline-contact-actions">
                      <a
                        href={`tel:${contact.phone}`}
                        className="offline-contact-call-btn"
                        aria-label={`Call ${contact.name}`}
                      >
                        <Phone size={14} aria-hidden="true" />
                        Call
                      </a>
                      <a
                        href={`sms:${contact.phone}?body=${encodeURIComponent(
                          `TripSOS Emergency Notice: I need urgent assistance. Please check in on me immediately.`,
                        )}`}
                        className="offline-contact-sms-btn"
                        aria-label={`Send emergency SMS to ${contact.name}`}
                      >
                        <Share2 size={14} aria-hidden="true" />
                        SMS
                      </a>
                      <button
                        type="button"
                        onClick={() => copyPhoneNumber(contact.phone)}
                        className="offline-contact-copy-btn"
                        aria-label={`Copy phone number for ${contact.name}`}
                      >
                        {copiedContactPhone === contact.phone ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="offline-empty-box">
                <Info size={18} aria-hidden="true" />
                <p>
                  No emergency contacts cached yet.{' '}
                  {isOnline ? (
                    <Link to="/profile" className="offline-link">
                      Add contacts in your profile
                    </Link>
                  ) : (
                    'Add contacts in your profile when back online.'
                  )}
                </p>
              </div>
            )}
          </section>

          {/* Active Trips Section */}
          <section className="offline-trips-card" aria-labelledby="trips-heading">
            <h2 id="trips-heading" className="offline-section-title">
              <MapPin size={18} aria-hidden="true" />
              Cached Trip Itinerary &amp; Destination
            </h2>

            {pack && pack.activeTrips.length > 0 ? (
              <div className="offline-trips-list">
                {pack.activeTrips.map((trip) => (
                  <article key={trip._id} className="offline-trip-item">
                    <h3 className="offline-trip-title">{trip.name}</h3>
                    <div className="offline-trip-meta">
                      <div className="offline-trip-meta-row">
                        <MapPin size={14} aria-hidden="true" />
                        <span>
                          {trip.destinationName}
                          {trip.destinationCountry ? `, ${trip.destinationCountry}` : ''}
                        </span>
                      </div>
                      <div className="offline-trip-meta-row">
                        <Calendar size={14} aria-hidden="true" />
                        <span>
                          {trip.startDate} to {trip.endDate}
                        </span>
                      </div>
                      {trip.destinationCoordinates && (
                        <div className="offline-trip-meta-row">
                          <span className="offline-coords-pill">
                            GPS: {trip.destinationCoordinates.latitude.toFixed(4)},{' '}
                            {trip.destinationCoordinates.longitude.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="offline-empty-box">
                <Info size={18} aria-hidden="true" />
                <p>
                  No active trips cached.{' '}
                  {isOnline ? (
                    <Link to="/trips" className="offline-link">
                      View your trips
                    </Link>
                  ) : (
                    'Save your trips when connected to view itinerary and coordinates offline.'
                  )}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Offline First-Aid & Protocol Library */}
        <section className="offline-guides-section" aria-labelledby="guides-heading">
          <h2 id="guides-heading" className="offline-section-title">
            <BookOpen size={18} aria-hidden="true" />
            Authoritative Offline First-Aid &amp; Crisis Protocols
          </h2>
          <p className="offline-guides-subtitle">
            Verified step-by-step procedures to stabilize emergencies while awaiting professional dispatch.
          </p>

          <div className="offline-guides-accordion">
            {(pack?.firstAidGuides ?? VERIFIED_FIRST_AID_GUIDES).map((guide) => {
              const isOpen = expandedGuideId === guide.id;
              return (
                <div key={guide.id} className="offline-guide-item">
                  <button
                    type="button"
                    onClick={() => setExpandedGuideId(isOpen ? null : guide.id)}
                    className="offline-guide-header"
                    aria-expanded={isOpen}
                  >
                    <div>
                      <span className="offline-guide-title">{guide.title}</span>
                      <p className="offline-guide-summary">{guide.urgentSummary}</p>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={20} aria-hidden="true" />
                    ) : (
                      <ChevronDown size={20} aria-hidden="true" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="offline-guide-body">
                      <ol className="offline-guide-steps">
                        {guide.steps.map((step, idx) => (
                          <li key={idx} className="offline-guide-step">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Authoritative Numbers Directory */}
        <section className="offline-numbers-section" aria-labelledby="numbers-heading">
          <h2 id="numbers-heading" className="offline-section-title">
            <ShieldAlert size={18} aria-hidden="true" />
            Authoritative Country Emergency Numbers
          </h2>
          <div className="offline-country-table-wrapper">
            <table className="offline-country-table">
              <thead>
                <tr>
                  <th scope="col">Country / Region</th>
                  <th scope="col">Universal SOS</th>
                  <th scope="col">Police</th>
                  <th scope="col">Ambulance</th>
                  <th scope="col">Fire</th>
                  <th scope="col">Authority Source</th>
                </tr>
              </thead>
              <tbody>
                {(pack?.authoritativeEmergencyNumbers ?? VERIFIED_OFFLINE_NUMBERS).map((row) => (
                  <tr key={row.code}>
                    <td>
                      <strong>{row.country}</strong>
                    </td>
                    <td>
                      <a href={`tel:${row.general}`} className="offline-table-tel">
                        {row.general}
                      </a>
                    </td>
                    <td>
                      <a href={`tel:${row.police}`} className="offline-table-tel">
                        {row.police}
                      </a>
                    </td>
                    <td>
                      <a href={`tel:${row.ambulance}`} className="offline-table-tel">
                        {row.ambulance}
                      </a>
                    </td>
                    <td>
                      <a href={`tel:${row.fire}`} className="offline-table-tel">
                        {row.fire}
                      </a>
                    </td>
                    <td className="offline-source-cell">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Emergency Mode Entry Link */}
        <div className="offline-emergency-link-row">
          <Link to="/emergency" className="offline-full-emergency-btn">
            <ShieldAlert size={20} aria-hidden="true" />
            <span>Open Full Emergency Mode Interface</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
