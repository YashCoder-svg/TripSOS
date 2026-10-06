import { useEffect, useState } from 'react';
import { Compass, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CTAButton } from './CTAButton';
import { useOptionalAuth } from '../../store/AuthProvider';

const links = [
  { label: 'Explore', href: '#explore' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Safety', href: '#safety' },
  { label: 'About', href: '#about' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const auth = useOptionalAuth();
  const authenticated = auth?.status === 'authenticated';
  const solid = scrolled || pathname !== '/';
  const destination = (href: string) => (pathname === '/' ? href : `/${href}`);
  const signOut = () => {
    if (!auth) return;
    void auth
      .logout()
      .catch(() => undefined)
      .finally(() => navigate('/'));
  };

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 32);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className={`site-nav ${solid ? 'site-nav--solid' : ''}`}>
      <div className="site-nav__inner">
        <Link className="brand" to="/" aria-label="TripSOS home">
          <span className="brand-mark">
            <Compass size={19} strokeWidth={1.8} />
          </span>
          <span>TRIPSOS</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <a href={destination(link.href)} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <Link className="nav-login" to={authenticated ? '/profile' : '/login'}>
            {authenticated ? 'Your profile' : 'Login'}
          </Link>
          {authenticated && (
            <button className="nav-logout" type="button" onClick={signOut}>
              Sign out
            </button>
          )}
          <CTAButton to="/trips" className="nav-cta">
            {authenticated ? 'My trips' : 'Plan a trip'}
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
      <div
        className={`mobile-nav ${menuOpen ? 'mobile-nav--open' : ''}`}
        id="mobile-navigation"
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Mobile navigation">
          {links.map((link) => (
            <a
              href={destination(link.href)}
              key={link.href}
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
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
              className="mobile-nav__signout"
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
  );
}
