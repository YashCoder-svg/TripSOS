import { LifeBuoy, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOptionalAuth } from '../store/AuthProvider';

export function EmergencyPage() {
  const auth = useOptionalAuth();
  const authenticated = auth?.status === 'authenticated';

  return (
    <main className="product-page emergency-guidance-page">
      <div className="product-shell emergency-guidance-shell">
        <span className="eyebrow">
          <ShieldCheck size={14} /> STAY CALM. TAKE THE NEXT STEP.
        </span>
        <h1>When plans change, start with what keeps you safe.</h1>
        <p className="emergency-lede">
          TripSOS emergency tools are still being built. If you are in immediate danger, contact the
          local emergency services where you are.
        </p>
        <div className="emergency-guidance-grid">
          <section className="emergency-guidance-card">
            <span>
              <MapPin size={20} />
            </span>
            <h2>Move to a safer place</h2>
            <p>
              If it is safe to do so, move somewhere public and well lit. Share your location with
              someone you trust.
            </p>
          </section>
          <section className="emergency-guidance-card">
            <span>
              <LifeBuoy size={20} />
            </span>
            <h2>Contact local help</h2>
            <p>
              Use an official local emergency service or ask nearby staff for help. TripSOS does not
              dispatch responders.
            </p>
          </section>
          <section className="emergency-guidance-card">
            <span>
              <ShieldCheck size={20} />
            </span>
            <h2>Keep key details close</h2>
            <p>
              When you can, tell a trusted person where you are and what kind of support you need.
            </p>
          </section>
        </div>
        <div className={`emergency-account-note ${authenticated ? 'is-ready' : ''}`} role="status">
          {authenticated ? (
            <>
              <ShieldCheck size={18} />
              <span>
                Your emergency contacts are ready. <Link to="/profile">Manage contacts</Link>
              </span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>
                Add emergency contacts after signing in for faster assistance.{' '}
                <Link to="/login">Sign in</Link>
              </span>
            </>
          )}
        </div>
        <p className="emergency-boundary-note">
          This page offers general guidance only. It does not share your location or contact anyone.
        </p>
      </div>
    </main>
  );
}
