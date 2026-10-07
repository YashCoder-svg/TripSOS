import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, WifiOff, X } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [reconnectedDismissed, setReconnectedDismissed] = useState(false);

  // If online and was never offline, or reconnected banner dismissed, render nothing
  if (isOnline && (!wasOffline || reconnectedDismissed)) {
    return null;
  }

  if (!isOnline) {
    return (
      <aside
        className="offline-banner"
        role="status"
        aria-live="polite"
        aria-label="Offline connection alert"
      >
        <div className="offline-banner-content">
          <div className="offline-banner-text">
            <WifiOff size={18} className="offline-banner-icon" aria-hidden="true" />
            <span>
              <strong>You&apos;re offline.</strong> Live map searches and sync are paused. Your
              cached Emergency Pack is ready.
            </span>
          </div>
          <Link to="/offline" className="offline-banner-link">
            <ShieldAlert size={14} aria-hidden="true" />
            <span>Offline Pack</span>
          </Link>
        </div>
      </aside>
    );
  }

  // Brief reconnected banner
  return (
    <aside
      className="offline-banner offline-banner--restored"
      role="status"
      aria-live="polite"
      aria-label="Network restored"
    >
      <div className="offline-banner-content">
        <div className="offline-banner-text">
          <CheckCircle2 size={18} className="offline-banner-icon" aria-hidden="true" />
          <span>
            <strong>Connection restored.</strong> You are back online.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setReconnectedDismissed(true)}
          className="offline-banner-dismiss"
          aria-label="Dismiss restored notice"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
