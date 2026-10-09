import { useEffect, useState } from 'react';
import { Compass, Menu, Search, ShieldAlert, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CTAButton } from './CTAButton';
import { useOptionalAuth } from '../../store/AuthProvider';
import { GlobalSearchModal } from '../ui/GlobalSearchModal';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

const navigationLinks = [
  { label: 'Explore', href: '/explore' },
  { label: 'My Trips', href: '/trips' },
  { label: 'Safety SOS', href: '/emergency' },
  { label: 'Offline Pack', href: '/offline' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const auth = useOptionalAuth();
  const authenticated = auth?.status === 'authenticated';
  const solid = scrolled || pathname !== '/';

  const signOut = () => {
    if (!auth) return;
    void auth
      .logout()
      .catch(() => undefined)
      .finally(() => navigate('/'));
  };

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 32);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <header className={`site-nav ${solid ? 'site-nav--solid' : ''}`}>
        <div className="site-nav__inner">
          <Link className="brand" to="/" aria-label="TripSOS home">
            <span className="brand-mark">
              <Compass size={19} strokeWidth={1.8} />
            </span>
            <span>TRIPSOS</span>
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            {navigationLinks.map((link) => (
              <Link to={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            {/* Quick Search Shortcut Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-current/20 text-xs opacity-85 hover:opacity-100 transition bg-black/5 dark:bg-white/5 cursor-pointer"
              aria-label="Open search (Ctrl+K)"
            >
              <Search size={14} />
              <span className="hidden md:inline">Search</span>
              <kbd className="font-mono text-[10px] opacity-75 px-1 py-0.5 rounded border border-current/30">
                ⌘K
              </kbd>
            </button>

            {/* Notification Center */}
            {authenticated && <NotificationDropdown />}

            {/* High-visibility Emergency Trigger */}
            <Link
              to="/emergency"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs tracking-wide shadow-sm transition transform hover:-translate-y-0.5"
              aria-label="I'm in trouble - Emergency SOS"
            >
              <ShieldAlert size={14} className="shrink-0" />
              <span className="whitespace-nowrap">I'M IN TROUBLE</span>
            </Link>

            {authenticated ? (
              <div className="flex items-center gap-3">
                <Link className="nav-login" to="/profile">
                  Profile
                </Link>
                <button className="nav-logout text-xs opacity-75 hover:opacity-100 cursor-pointer" type="button" onClick={signOut}>
                  Sign out
                </button>
              </div>
            ) : (
              <Link className="nav-login" to="/login">
                Login
              </Link>
            )}

            <CTAButton to="/trips" className="nav-cta hidden sm:inline-flex">
              {authenticated ? 'Dashboard' : 'Plan a trip'}
            </CTAButton>
          </div>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <div
          className={`mobile-nav ${menuOpen ? 'mobile-nav--open' : ''}`}
          id="mobile-navigation"
          aria-hidden={!menuOpen}
        >
          <nav aria-label="Mobile navigation">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setSearchOpen(true);
              }}
              className="w-full text-left py-2 flex items-center justify-between text-sm text-slate-700 dark:text-slate-200"
              tabIndex={menuOpen ? 0 : -1}
            >
              <span className="flex items-center gap-2">
                <Search size={16} /> Search TripSOS
              </span>
              <kbd className="font-mono text-xs border border-current/30 px-1 rounded">⌘K</kbd>
            </button>

            <Link
              to="/emergency"
              className="w-full py-2.5 px-3 rounded-xl bg-rose-600 text-white font-bold text-center flex items-center justify-center gap-2 shadow-sm my-1"
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => setMenuOpen(false)}
            >
              <ShieldAlert size={16} />
              <span>I'M IN TROUBLE (SOS)</span>
            </Link>

            {navigationLinks.map((link) => (
              <Link
                to={link.href}
                key={link.href}
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <Link to={authenticated ? '/dashboard' : '/login'} tabIndex={menuOpen ? 0 : -1}>
              {authenticated ? 'Dashboard' : 'Login'}
            </Link>

            {authenticated && (
              <Link to="/profile" tabIndex={menuOpen ? 0 : -1}>
                Your profile
              </Link>
            )}

            <CTAButton to="/trips" className="mobile-nav__cta">
              {authenticated ? 'My trips' : 'Plan a trip'}
            </CTAButton>

            {authenticated && (
              <button
                className="mobile-nav__signout cursor-pointer"
                type="button"
                tabIndex={menuOpen ? 0 : -1}
                onClick={signOut}
              >
                Sign out
              </button>
            )}
          </nav>
        </div>

        {menuOpen && (
          <button
            className="mobile-nav-scrim"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
            type="button"
          />
        )}
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
