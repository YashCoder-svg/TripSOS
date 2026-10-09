import { useState } from 'react';
import { ArrowRight, CalendarDays, Compass, Hash, KeyRound, MapPlus, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useJoinTripByCode, useTrips } from '../services/tripService';
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
        <div className="flex items-center gap-2">
          <span className={`trip-status trip-status--${trip.status}`}>{trip.status}</span>
          {trip.tripCode && (
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {trip.tripCode}
            </span>
          )}
        </div>
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
  const joinByCodeMutation = useJoinTripByCode();
  const navigate = useNavigate();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [tripCodeInput, setTripCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (!tripCodeInput.trim()) return;

    try {
      const res = await joinByCodeMutation.mutateAsync(tripCodeInput.trim().toUpperCase());
      setShowJoinModal(false);
      navigate(`/trips/${res.trip._id}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Invalid or expired trip code.');
    }
  };

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
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowJoinModal(true);
                  setTripCodeInput('');
                  setJoinError(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold border border-[var(--line)] bg-[var(--paper-light)] hover:bg-white text-[var(--ink)] transition shadow-2xs cursor-pointer"
              >
                <KeyRound size={15} className="text-[var(--forest)]" /> Join with Code
              </button>
              <Link className="dashboard-primary-action" to="/trips/new">
                <MapPlus size={17} /> Plan a trip
              </Link>
            </div>
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
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                <KeyRound size={15} /> Join with Code
              </button>
              <Link className="dashboard-primary-action" to="/trips/new">
                <MapPlus size={17} /> Create your first trip
              </Link>
            </div>
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

      {/* Join Trip by Code Modal */}
      {showJoinModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-code-title"
        >
          <div className="group-modal-card max-w-md w-full bg-white border border-[var(--line)] rounded-2xl p-6 text-[var(--ink)] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[var(--forest)]">
                <Hash size={20} />
                <h3 id="join-code-title" className="text-lg font-bold text-[var(--ink)]">
                  Join Group Trip
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] p-1 rounded-lg"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] mb-5">
              Enter the unique 8-character trip code shared by your trip organizer (e.g. <code className="bg-[var(--paper)] px-1.5 py-0.5 rounded font-mono text-[var(--forest)] font-bold">TRP-82K7</code>).
            </p>

            <form onSubmit={handleJoinTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1.5 uppercase tracking-wider">
                  Trip Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={tripCodeInput}
                  onChange={(e) => setTripCodeInput(e.target.value.toUpperCase())}
                  placeholder="TRP-82K7"
                  className="w-full bg-[var(--paper-light)] border border-[var(--line)] rounded-xl px-4 py-3 text-center text-xl font-mono font-bold tracking-widest text-[var(--forest)] focus:outline-none focus:border-[var(--forest)] uppercase placeholder:text-[var(--muted)]"
                />
              </div>

              {joinError && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 font-medium">
                  {joinError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinByCodeMutation.isPending || !tripCodeInput.trim()}
                  className="modal-submit-btn inline-flex items-center gap-1.5"
                >
                  {joinByCodeMutation.isPending ? 'Joining…' : 'Join Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
