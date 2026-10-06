import { Compass, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="landing-footer" id="about">
      <div className="footer-main">
        <div className="footer-brand-col">
          <Link className="brand brand--footer" to="/" aria-label="TripSOS home">
            <span className="brand-mark">
              <Compass size={18} />
            </span>
            <span>TRIPSOS</span>
          </Link>
          <p>
            Travel prepared.
            <br />
            Stay connected.
          </p>
          <span className="footer-world">MADE FOR THE MILES BETWEEN HERE AND THERE.</span>
        </div>
        <div className="footer-links">
          <div>
            <h3>PRODUCT</h3>
            <a href="#explore">Explore</a>
            <a href="#safety">Safety</a>
            <a href="#how-it-works">How it works</a>
            <Link to="/trips">Plan a trip</Link>
          </div>
          <div>
            <h3>COMPANY</h3>
            <a href="#about">About TripSOS</a>
            <span className="footer-unavailable">Contact · planned</span>
            <a href="#about">
              Privacy <span className="footer-note">(planned)</span>
            </a>
            <a href="#about">
              Terms <span className="footer-note">(planned)</span>
            </a>
          </div>
        </div>
        <div className="footer-social">
          <span>FOLLOW THE JOURNEY</span>
          <div>
            <span className="footer-social__placeholder" title="Instagram — coming soon">
              <Instagram size={17} />
              <span>SOON</span>
            </span>
            <span className="footer-social__placeholder" title="LinkedIn — coming soon">
              <Linkedin size={17} />
              <span>SOON</span>
            </span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} TripSOS · A product in progress</span>
        <span>
          Photography fallback via{' '}
          <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">
            Unsplash
          </a>
        </span>
      </div>
    </footer>
  );
}
