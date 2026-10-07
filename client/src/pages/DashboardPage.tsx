import { ArrowRight, Compass, MapPlus, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/AuthProvider';
import { useTrips } from '../services/tripService';
import { WeatherWidget } from '../components/weather/WeatherWidget';
import { formatBudget, formatDateRange, tripDuration } from './tripUtils';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { user } = useAuth();
  const greeting = greetingForHour(new Date().getHours());
  const { data: trips = [], isLoading: tripsLoading, isError: tripsError } = useTrips();
  const nextTrip =
    trips.find((trip) => trip.status === 'active') ??
    trips.find((trip) => trip.status === 'upcoming');

  return (
    <main className="product-page dashboard-page">
      <div className="product-shell">
        <header className="dashboard-welcome">
          <div>
            <span className="eyebrow">
              <Compass size={14} /> YOUR TRIPSOS
            </span>
            <h1>
              {greeting}, {user?.name.split(/\s+/)[0]}.
            </h1>
            <p>Your next journey can begin whenever you are ready.</p>
          </div>
          <Link className="dashboard-primary-action" to="/trips">
            <MapPlus size={18} /> Plan a trip
          </Link>
        </header>

        <section className="quick-actions" aria-labelledby="quick-actions-title">
          <div className="product-section-heading">
            <span className="eyebrow">READY WHEN YOU ARE</span>
            <h2 id="quick-actions-title">Where would you like to begin?</h2>
          </div>
          <div className="quick-action-grid">
            <Link className="quick-action-card quick-action-card--primary" to="/trips">
              <span className="quick-action-icon">
                <MapPlus size={20} />
              </span>
              <strong>Plan a trip</strong>
              <span>Start shaping your next journey.</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="quick-action-card" to="/explore">
              <span className="quick-action-icon">
                <Compass size={20} />
              </span>
              <strong>Explore</strong>
              <span>See what TripSOS is designed to help you find.</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="quick-action-card quick-action-card--safety" to="/emergency">
              <span className="quick-action-icon">
                <ShieldCheck size={20} />
              </span>
              <strong>Emergency guidance</strong>
              <span>Review practical steps for an unexpected moment.</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="dashboard-lower-grid" aria-label="Trip overview">
          <div className="dashboard-panel dashboard-trips-panel">
            <div className="dashboard-panel-heading">
              <div>
                <span className="eyebrow">YOUR JOURNEYS</span>
                <h2>Upcoming trips</h2>
              </div>
              <Link to="/trips">
                View trips <ArrowRight size={14} />
              </Link>
            </div>
            {tripsLoading ? (
              <p className="trip-query-state" role="status">
                Gathering your journeys…
              </p>
            ) : null}
            {tripsError ? (
              <p className="trip-query-error" role="alert">
                Your trips could not load. <Link to="/trips">Try again</Link>
              </p>
            ) : null}
            {!tripsLoading && !tripsError && nextTrip ? (
              <article className="dashboard-next-trip">
                <span className="eyebrow">
                  {nextTrip.status === 'active' ? 'HAPPENING NOW' : 'NEXT ADVENTURE'}
                </span>
                <div className="dashboard-next-trip__main">
                  <div>
                    <h3>{nextTrip.destinationName}</h3>
                    <p>{nextTrip.name}</p>
                  </div>
                  <Link to={`/trips/${nextTrip._id}`} aria-label={`Open ${nextTrip.name}`}>
                    <ArrowRight size={18} />
                  </Link>
                </div>
                <div className="dashboard-next-trip__facts">
                  <span>{formatDateRange(nextTrip.startDate, nextTrip.endDate)}</span>
                  <span>
                    {tripDuration(nextTrip.startDate, nextTrip.endDate)} days ·{' '}
                    {nextTrip.travelerCount} travelers
                  </span>
                  <strong>{formatBudget(nextTrip.budget, nextTrip.currency)}</strong>
                </div>
                <Link className="product-text-link" to={`/trips/${nextTrip._id}`}>
                  Open trip <ArrowRight size={15} />
                </Link>
              </article>
            ) : null}
            {!tripsLoading && !tripsError && !nextTrip ? (
              <div className="trip-empty-state">
                <span className="trip-empty-icon">
                  <Compass size={24} />
                </span>
                <h3>Your next adventure starts here.</h3>
                <p>Create your first trip and TripSOS will keep the details in one place.</p>
                <Link to="/trips/new" className="product-text-link">
                  Create your first trip <ArrowRight size={15} />
                </Link>
              </div>
            ) : null}
          </div>
          <div className="dashboard-side-stack">
            {nextTrip ? (
              <WeatherWidget
                latitude={
                  nextTrip.destinationCoordinates?.latitude ??
                  nextTrip.destination?.coordinates?.latitude
                }
                longitude={
                  nextTrip.destinationCoordinates?.longitude ??
                  nextTrip.destination?.coordinates?.longitude
                }
                destinationName={nextTrip.destinationName}
                startDate={nextTrip.startDate}
                endDate={nextTrip.endDate}
              />
            ) : null}
            <section className="dashboard-panel recent-activity-panel">
              <span className="eyebrow">RECENT ACTIVITY</span>
              <h2>A fresh start.</h2>
              <p>Your trip notes and updates will appear here as you use TripSOS.</p>
            </section>
            <section className="readiness-panel">
              <span className="readiness-panel__icon">
                <Sparkles size={17} />
              </span>
              <div>
                <span className="eyebrow">TRAVEL READINESS</span>
                <h2>Build your travel profile</h2>
                <p>Add your preferences and a trusted contact when you are ready.</p>
                <Link to="/profile">
                  Complete your profile <ArrowRight size={14} />
                </Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
