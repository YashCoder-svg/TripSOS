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
import { ScrollReveal } from './ScrollReveal';

const itinerary = [
  {
    time: 'DAY 01',
    title: 'Arrive & settle in',
    detail: 'Your first day, at your pace',
    tint: 'sage',
  },
  {
    time: 'DAY 02',
    title: 'Explore the valley',
    detail: 'A day saved for discovery',
    tint: 'clay',
  },
  {
    time: 'DAY 03',
    title: 'Leave room to wander',
    detail: 'Plans can change. That’s okay.',
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
            TripSOS <span className="demo-pill">PRODUCT PREVIEW</span>
          </div>
          <button type="button" aria-label="Trip options preview" className="icon-quiet" disabled>
            <MoreHorizontal size={20} />
          </button>
        </header>
        <div className="trip-window__body">
          <div className="trip-overview">
            <div>
              <span className="eyebrow">
                MOUNTAIN ESCAPE <span className="demo-dot" /> DEMO
              </span>
              <h3>Manali, India</h3>
              <p>
                <CalendarDays size={15} /> Sample dates · 5 days{' '}
                <span className="trip-separator">·</span> 3 travelers
              </p>
            </div>
            <button type="button" className="trip-overview__more" disabled>
              Trip details <ArrowDownRight size={15} />
            </button>
          </div>
          <div className="trip-summary">
            <div className="summary-tile summary-tile--weather">
              <span className="summary-icon">
                <CloudSun size={17} />
              </span>
              <span>WEATHER</span>
              <b>Forecast preview</b>
              <small>Check again closer to departure</small>
            </div>
            <div className="summary-tile">
              <span className="summary-icon">
                <Wallet size={17} />
              </span>
              <span>TRIP BUDGET</span>
              <b>Set by your group</b>
              <small>Shared trip planning</small>
            </div>
            <div className="summary-tile">
              <span className="summary-icon">
                <MapPin size={17} />
              </span>
              <span>SAVED PLACES</span>
              <b>Your shortlist</b>
              <small>Private to your group</small>
            </div>
          </div>
          <div className="trip-planner">
            <div className="itinerary-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">MAKE IT YOURS</span>
                  <h4>Trip outline</h4>
                </div>
                <button
                  type="button"
                  aria-label="Add an itinerary item preview"
                  className="add-item"
                  disabled
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="itinerary-list">
                {itinerary.map((item) => (
                  <div className="itinerary-row" key={item.time}>
                    <span className={`itinerary-marker itinerary-marker--${item.tint}`} />
                    <span className="itinerary-row__copy">
                      <small>{item.time} · DEMO</small>
                      <b>{item.title}</b>
                      <span>{item.detail}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="map-preview"
              role="img"
              aria-label="Illustrative map preview, not a live map"
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
                <MapPin size={13} /> ILLUSTRATIVE MAP
              </div>
              <span className="map-preview__caption">A sense of where things are</span>
            </div>
          </div>
          <div className="trip-demo-note">
            <span className="demo-dot" /> Demonstration content only · no live forecast, places,
            route, or pricing
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
