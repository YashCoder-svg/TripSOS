import { ArrowRight, CalendarDays, Compass, MapPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTrips } from '../services/tripService';
import type { Trip, TripStatus } from '../types/trip';
import { formatBudget, formatDateRange, tripDuration } from './tripUtils';

const groups: { status: TripStatus; title: string; note: string }[] = [
  { status: 'upcoming', title: 'Upcoming trips', note: 'Trips ahead on your calendar' },
  { status: 'active', title: 'Active journeys', note: 'Journeys happening right now' },
  { status: 'planning', title: 'Planning trips', note: 'Ideas and adventures in the making' },
  { status: 'completed', title: 'Past trips', note: 'Places you have already explored' },
  { status: 'cancelled', title: 'Cancelled trips', note: 'Trips that were called off' },
];

function TripCard({ trip }: { trip: Trip }) {
  return (
    <article className="trip-list-card">
      <div className="trip-list-card__topline">
        <span className={`trip-status trip-status--${trip.status}`}>{trip.status}</span>
        <span>{tripDuration(trip.startDate, trip.endDate)} days</span>
      </div>
      <div className="trip-list-card__body">
        <div>
          <h3>
            <Link to={`/trips/${trip._id}`}>{trip.name}</Link>
          </h3>
          <p className="trip-list-card__destination">
            <Compass size={15} />
            {trip.destinationName}
          </p>
        </div>
        <Link
          className="trip-card-arrow"
          to={`/trips/${trip._id}`}
          aria-label={`Open ${trip.name}`}
        >
          <ArrowRight size={17} />
        </Link>
      </div>
      <div className="trip-list-card__facts">
        <span>
          <CalendarDays size={14} />
          {formatDateRange(trip.startDate, trip.endDate)}
        </span>
        <span>
          <Users size={14} />
          {trip.travelerCount} {trip.travelerCount === 1 ? 'traveler' : 'travelers'}
        </span>
        <strong>{formatBudget(trip.budget, trip.currency)}</strong>
      </div>
      <div className="trip-list-card__bottom">
        <span>{trip.travelStyle.replace('-', ' ')}</span>
        <span>
          {trip.interests.length ? trip.interests.slice(0, 3).join(' · ') : 'Interests not added'}
        </span>
      </div>
    </article>
  );
}

export function TripsPage() {
  const { data: trips = [], isLoading, isError } = useTrips();
  return (
    <main className="product-page trips-page">
      <div className="product-shell trips-shell">
        <header className="product-page-heading trips-heading">
          <span className="eyebrow">
            <Compass size={14} /> YOUR JOURNEYS
          </span>
          <div className="trips-heading__row">
            <div>
              <h1>Every journey, in one place.</h1>
              <p>Make space for the details that make a trip yours.</p>
            </div>
            <Link className="dashboard-primary-action" to="/trips/new">
              <MapPlus size={17} /> Plan a trip
            </Link>
          </div>
        </header>
        {isLoading ? (
          <p className="trip-query-state" role="status">
            Gathering your journeys…
          </p>
        ) : null}
        {isError ? (
          <div className="trip-query-error" role="alert">
            <h2>We couldn’t load your trips.</h2>
            <p>Please check your connection and try again.</p>
          </div>
        ) : null}
        {!isLoading && !isError && trips.length === 0 ? (
          <section className="trip-empty-large">
            <span className="trip-empty-icon">
              <Compass size={25} />
            </span>
            <span className="eyebrow">A FRESH PAGE</span>
            <h2>Your next adventure starts here.</h2>
            <p>Create a trip to keep its dates, destination, travelers, and budget together.</p>
            <Link className="dashboard-primary-action" to="/trips/new">
              <MapPlus size={17} /> Create your first trip
            </Link>
          </section>
        ) : null}
        {!isLoading &&
          !isError &&
          groups.map(({ status, title, note }) => {
            const items = trips.filter((trip) => trip.status === status);
            if (!items.length) return null;
            return (
              <section
                className="trip-list-group"
                key={status}
                aria-labelledby={`trip-group-${status}`}
              >
                <div className="trip-list-group__heading">
                  <div>
                    <span className="eyebrow">{note}</span>
                    <h2 id={`trip-group-${status}`}>{title}</h2>
                  </div>
                  <span>
                    {items.length} {items.length === 1 ? 'trip' : 'trips'}
                  </span>
                </div>
                <div className="trip-list-grid">
                  {items.map((trip) => (
                    <TripCard key={trip._id} trip={trip} />
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    </main>
  );
}
