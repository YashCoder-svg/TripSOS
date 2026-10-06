import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { TripMapWorkspace } from '../components/places/TripMapWorkspace';
import { useTrip } from '../services/tripService';
import { formatTripDate } from './tripUtils';

export function TripMapPage() {
  const { tripId = '' } = useParams<{ tripId: string }>();
  const { data: trip, isLoading, isError } = useTrip(tripId);

  if (isLoading) {
    return (
      <main className="product-page">
        <div className="product-shell">
          <p className="trip-query-state" role="status">
            Opening trip map workspace…
          </p>
        </div>
      </main>
    );
  }

  if (isError || !trip) {
    return (
      <main className="product-page">
        <div className="product-shell trip-query-error" role="alert">
          <h1>Trip not found</h1>
          <p>We could not find the trip requested.</p>
          <Link to="/trips">Back to your trips</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="trip-map-page">
      <div className="trip-map-page__header">
        <div className="product-shell trip-map-page__header-inner">
          <Link to={`/trips/${trip._id}`} className="trip-back-link">
            <ArrowLeft size={15} /> Back to trip overview
          </Link>

          <div className="trip-map-page__title-row">
            <div>
              <span className="eyebrow">
                <MapPin size={12} /> {trip.destinationName.toUpperCase()}
              </span>
              <h1>{trip.name} Map & Discovery</h1>
            </div>

            <div className="trip-map-page__dates">
              <CalendarDays size={14} />
              <span>
                {formatTripDate(trip.startDate, { day: 'numeric', month: 'short' })} –{' '}
                {formatTripDate(trip.endDate, { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="trip-map-page__body product-shell">
        <TripMapWorkspace trip={trip} />
      </div>
    </main>
  );
}
