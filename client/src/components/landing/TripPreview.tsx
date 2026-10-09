import {
  ArrowDownRight,
  CalendarDays,
  CloudSun,
  MapPin,
  MoreHorizontal,
  Navigation,
  Plus,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from './ScrollReveal';

const itinerary = [
  {
    time: 'DAY 01',
    title: 'Arrive in Old Manali & Settle In',
    detail: 'Check into hotel, acclimatize, local cafe walk',
    tint: 'sage',
  },
  {
    time: 'DAY 02',
    title: 'Solang Valley & Rohtang Pass Route',
    detail: 'Scenic viewpoint, photography & mountain trail',
    tint: 'clay',
  },
  {
    time: 'DAY 03',
    title: 'Jogini Waterfall Trek & Vashisht Baths',
    detail: 'Natural hot springs, hiking & group evening dinner',
    tint: 'blue',
  },
];

export function TripPreview() {
  return (
    <ScrollReveal className="trip-preview-wrap">
      <div className="trip-window">
        <header className="trip-window__top">
          <div className="preview-brand">
            <span className="brand-mark">
              <Navigation size={14} />
            </span>{' '}
            TripSOS <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">LIVE WORKSPACE</span>
          </div>
          <Link to="/trips" className="text-xs text-slate-300 hover:text-white flex items-center gap-1">
            <span>Explore Dashboard</span>
            <MoreHorizontal size={18} />
          </Link>
        </header>

        <div className="trip-window__body">
          <div className="trip-overview">
            <div>
              <span className="eyebrow">
                MANALI ADVENTURE <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-1" />
              </span>
              <h3>Manali, Himachal Pradesh</h3>
              <p>
                <CalendarDays size={15} /> 5 Days Trip{' '}
                <span className="trip-separator">·</span> 3 Travelers{' '}
                <span className="trip-separator">·</span> Code: <strong className="font-mono text-emerald-400">TRP-82K7</strong>
              </p>
            </div>
            <Link to="/trips" className="trip-overview__more">
              Open my trips <ArrowDownRight size={15} />
            </Link>
          </div>

          <div className="trip-summary">
            <div className="summary-tile summary-tile--weather">
              <span className="summary-icon">
                <CloudSun size={17} />
              </span>
              <span>LIVE WEATHER</span>
              <b>14°C · Mild & Clear</b>
              <small>Open-Meteo live hourly forecast</small>
            </div>

            <div className="summary-tile">
              <span className="summary-icon">
                <Wallet size={17} />
              </span>
              <span>EXPENSE SPLIT</span>
              <b>₹24,000 Total</b>
              <small>Debt minimization algorithm</small>
            </div>

            <div className="summary-tile">
              <span className="summary-icon">
                <MapPin size={17} />
              </span>
              <span>SAVED PLACES</span>
              <b>8 Locations</b>
              <small>Synced across all group members</small>
            </div>
          </div>

          <div className="trip-planner">
            <div className="itinerary-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">DYNAMIC ITINERARY</span>
                  <h4>Interactive schedule</h4>
                </div>
                <Link
                  to="/trips"
                  aria-label="Add an itinerary item"
                  className="add-item"
                >
                  <Plus size={16} />
                </Link>
              </div>

              <div className="itinerary-list">
                {itinerary.map((item) => (
                  <div className="itinerary-row" key={item.time}>
                    <span className={`itinerary-marker itinerary-marker--${item.tint}`} />
                    <span className="itinerary-row__copy">
                      <small>{item.time}</small>
                      <b>{item.title}</b>
                      <span>{item.detail}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/explore"
              className="map-preview group"
              role="img"
              aria-label="Interactive map preview"
            >
              <div className="map-grid" />
              <div className="map-ridge map-ridge--one" />
              <div className="map-ridge map-ridge--two" />
              <svg className="map-route" viewBox="0 0 260 170" aria-hidden="true">
                <path d="M27 139 C63 118 52 68 101 78 S157 124 180 83 S215 46 239 32" />
              </svg>
              <span className="map-pin map-pin--start">
                <span />
              </span>
              <span className="map-pin map-pin--end">
                <span />
              </span>
              <div className="map-preview__label">
                <MapPin size={13} /> OPENSTREETMAP DISCOVERY
              </div>
              <span className="map-preview__caption group-hover:text-emerald-300 transition">
                Tap to explore nearby hospitals, food & fuel →
              </span>
            </Link>
          </div>

          <div className="trip-demo-note">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            Real-time synchronization · Verified OpenStreetMap amenities & Open-Meteo forecasts
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
