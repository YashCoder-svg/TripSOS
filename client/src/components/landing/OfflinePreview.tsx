import { Check, CloudOff, LockKeyhole, MapPin, NotebookTabs, Phone, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from './ScrollReveal';

const savedItems = [
  { icon: LockKeyhole, label: 'Stay details & Hotel address', note: 'Saved in offline storage' },
  { icon: Phone, label: 'Emergency contacts & Local SOS (112)', note: 'Available without cellular network' },
  { icon: NotebookTabs, label: 'Full Trip Itinerary', note: 'Synced on last connection' },
  { icon: MapPin, label: 'Saved Offline Places & Coordinates', note: 'Ready for GPS navigation' },
];

export function OfflinePreview() {
  return (
    <div className="offline-composition">
      <ScrollReveal className="offline-copy">
        <span className="eyebrow">
          <span className="eyebrow-dot" /> RELIABLE WITHOUT INTERNET
        </span>
        <h2>
          Even when the signal disappears, <em>your trip doesn’t.</em>
        </h2>
        <p>
          TripSOS functions as an installable Progressive Web App (PWA). Your critical trip
          itinerary, emergency contacts, local dispatch numbers, and CPR first-aid guides remain
          100% accessible offline.
        </p>
        <div className="pt-2">
          <Link
            to="/offline"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white font-semibold text-xs tracking-wide shadow-sm hover:opacity-90 transition"
          >
            <CloudOff size={16} />
            <span>Open Offline Emergency Pack</span>
          </Link>
        </div>
        <div className="offline-note mt-4">
          <CloudOff size={18} />
          <span>
            Stored safely on your device
            <br />
            <b>Always available in remote & low-connectivity zones</b>
          </span>
        </div>
      </ScrollReveal>

      <ScrollReveal className="phone-stage" delay={0.1}>
        <div className="phone-glow" />
        <div className="offline-phone">
          <div className="phone-speaker" />
          <div className="phone-content">
            <div className="phone-status">
              <span>9:41</span>
              <span>
                <WifiOff size={13} /> 72%
              </span>
            </div>
            <div className="phone-brand">
              <span className="brand-mark">
                <MapPin size={14} />
              </span>{' '}
              TRIPSOS
            </div>
            <div className="offline-status">
              <WifiOff size={15} />
              <span>OFFLINE EMERGENCY PACK ACTIVE</span>
            </div>
            <h3>
              Your trip,
              <br />
              within reach.
            </h3>
            <p>
              Manali Adventure <span>· Cached Locally</span>
            </p>
            <div className="phone-saved-label">
              SAVED FOR THIS TRIP <span>OFFLINE READY</span>
            </div>
            <div className="phone-saved-list">
              {savedItems.map(({ icon: Icon, label, note }) => (
                <div className="phone-saved-item" key={label}>
                  <span className="phone-saved-icon">
                    <Icon size={15} />
                  </span>
                  <span>
                    <b>{label}</b>
                    <small>{note}</small>
                  </span>
                  <Check size={14} />
                </div>
              ))}
            </div>
            <div className="phone-bottom">
              <span>TripSOS PWA Storage</span>
              <span>Encrypted local cache</span>
            </div>
          </div>
        </div>
        <div className="phone-side-note">
          <span className="phone-side-note__line" />
          <span>
            ESSENTIALS
            <br />
            WITHOUT SIGNAL
          </span>
        </div>
      </ScrollReveal>
    </div>
  );
}
