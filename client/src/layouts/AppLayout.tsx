import { Link, Outlet } from 'react-router-dom';
import { Compass, LifeBuoy, MapPinned } from 'lucide-react';

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="TripSOS home">
          <span className="brand-mark">
            <Compass size={18} />
          </span>
          tripsos
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/trips">My trips</Link>
          <Link to="/explore">Explore</Link>
          <Link className="help-link" to="/emergency">
            <LifeBuoy size={16} /> Get help
          </Link>
        </nav>
      </header>
      <Outlet />
      <footer className="site-footer">
        <span>Travel prepared. Stay connected.</span>
        <MapPinned size={16} />
      </footer>
    </div>
  );
}
