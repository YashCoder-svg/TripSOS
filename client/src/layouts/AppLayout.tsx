import { Outlet, useLocation } from 'react-router-dom';
import { MapPinned } from 'lucide-react';
import { Navbar } from '../components/landing/Navbar';
import { OfflineBanner } from '../components/offline/OfflineBanner';

export function AppLayout() {
  const { pathname } = useLocation();
  return (
    <div className="app-shell">
      <Navbar />
      <OfflineBanner />
      <Outlet />
      {pathname !== '/' && pathname !== '/login' && pathname !== '/register' && (
        <footer className="site-footer">
          <span>Travel prepared. Stay connected.</span>
          <MapPinned size={16} />
        </footer>
      )}
    </div>
  );
}
