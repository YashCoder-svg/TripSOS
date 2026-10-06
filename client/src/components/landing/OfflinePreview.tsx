import { Check, CloudOff, LockKeyhole, MapPin, NotebookTabs, Phone, WifiOff } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const savedItems = [
  { icon: LockKeyhole, label: 'Stay details', note: 'Saved by you' },
  { icon: Phone, label: 'Trusted contacts', note: 'Available offline' },
  { icon: NotebookTabs, label: 'Trip outline', note: 'Last saved recently' },
  { icon: MapPin, label: 'Important places', note: 'Saved for the journey' },
];

export function OfflinePreview() {
  return (
    <div className="offline-composition">
      <ScrollReveal className="offline-copy">
        <span className="eyebrow">
          <span className="eyebrow-dot" /> THE JOURNEY KEEPS GOING
        </span>
        <h2>
          Even when the signal disappears, <em>your trip doesn’t.</em>
        </h2>
        <p>
          Keep the essentials you choose close at hand. Offline access is a product concept here;
          nothing is stored on this device yet.
        </p>
        <div className="offline-note">
          <CloudOff size={18} />
          <span>
            Stored on your device
            <br />
            <b>Only when you choose to save it</b>
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
              <span>OFFLINE MODE · PREVIEW</span>
            </div>
            <h3>
              Your trip,
              <br />
              within reach.
            </h3>
            <p>
              Mountain Escape <span>· DEMO</span>
            </p>
            <div className="phone-saved-label">
              SAVED FOR THIS TRIP <span>DEMO</span>
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
              <span>TripSOS preview</span>
              <span>Not saved on device</span>
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
