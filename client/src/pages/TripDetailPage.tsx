import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarDays,
  Check,
  Compass,
  Edit3,
  MapPinned,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { travelPhotos } from '../services/imageService';
import { useDeleteTrip, useTrip, useUpdateTripStatus } from '../services/tripService';
import type { Trip, TripStatus } from '../types/trip';
import { TripMapWorkspace } from '../components/places/TripMapWorkspace';
import { WeatherWidget } from '../components/weather/WeatherWidget';
import { ItineraryWorkspace } from '../components/itinerary/ItineraryWorkspace';
import { ExpenseWorkspace } from '../components/expenses/ExpenseWorkspace';
import { GroupWorkspace } from '../components/group/GroupWorkspace';
import { TravelAssistantDrawer } from '../components/ai/TravelAssistantDrawer';
import { formatBudget, formatDateRange, formatTripDate, tripDuration } from './tripUtils';

const tabs = [
  ['overview', 'Overview'],
  ['map', 'Map'],
  ['itinerary', 'Itinerary'],
  ['expenses', 'Expenses'],
  ['group', 'Group'],
] as const;
type TripTab = (typeof tabs)[number][0];

function DeleteTripDialog({
  tripName,
  busy,
  onCancel,
  onConfirm,
}: {
  tripName: string;
  busy: boolean;
  onCancel(): void;
  onConfirm(): void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = dialogRef.current;
    if (!element) return;
    const first = element.querySelector<HTMLElement>('button');
    first?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
      if (event.key !== 'Tab') return;
      const controls = [...element.querySelectorAll<HTMLElement>('button:not(:disabled)')];
      if (!controls.length) return;
      const firstControl = controls[0]!;
      const lastControl = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel]);
  return (
    <div
      className="trip-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="trip-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-trip-title"
        aria-describedby="delete-trip-description"
      >
        <button
          type="button"
          className="trip-dialog-close"
          aria-label="Close delete confirmation"
          onClick={onCancel}
          disabled={busy}
        >
          <X size={18} />
        </button>
        <span className="trip-dialog-icon">
          <Compass size={20} />
        </span>
        <span className="eyebrow">A MOMENT TO CONFIRM</span>
        <h2 id="delete-trip-title">Delete this trip?</h2>
        <p id="delete-trip-description">
          <strong>{tripName}</strong> will be removed from your account. This can’t be undone.
        </p>
        <div className="trip-dialog-actions">
          <button type="button" className="quiet-action" onClick={onCancel} disabled={busy}>
            Keep trip
          </button>
          <button type="button" className="trip-delete-confirm" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete trip'}
          </button>
        </div>
      </section>
    </div>
  );
}

function TripOverview({ trip }: { trip: Trip }) {
  const checks = [
    ['Trip created', true],
    ['Destination added', Boolean(trip.destinationName)],
    ['Dates confirmed', Boolean(trip.startDate && trip.endDate)],
    ['Budget set', trip.budget > 0],
  ] as const;
  return (
    <div className="trip-overview-layout">
      <section className="trip-detail-panel">
        <span className="eyebrow">THE DETAILS</span>
        <h2>A little more about this journey.</h2>
        <div className="trip-detail-facts">
          <div>
            <CalendarDays size={17} />
            <span>
              <small>DATES</small>
              <strong>{formatDateRange(trip.startDate, trip.endDate)}</strong>
              <em>{tripDuration(trip.startDate, trip.endDate)} travel days</em>
            </span>
          </div>
          <div>
            <Users size={17} />
            <span>
              <small>TRAVELERS</small>
              <strong>
                {trip.travelerCount} {trip.travelerCount === 1 ? 'traveler' : 'travelers'}
              </strong>
            </span>
          </div>
          <div>
            <Wallet size={17} />
            <span>
              <small>TRIP BUDGET</small>
              <strong>{formatBudget(trip.budget, trip.currency)}</strong>
              <em>Currency shown as entered; no conversion</em>
            </span>
          </div>
          <div>
            <Compass size={17} />
            <span>
              <small>TRAVEL STYLE</small>
              <strong>{trip.travelStyle.replace('-', ' ')}</strong>
            </span>
          </div>
        </div>
        <div className="trip-interest-summary">
          <h3>Interests</h3>
          {trip.interests.length ? (
            <div>
              {trip.interests.map((interest) => (
                <span key={interest}>{interest}</span>
              ))}
            </div>
          ) : (
            <p>No interests added yet.</p>
          )}
        </div>
      </section>
      <section className="trip-detail-panel trip-readiness-panel">
        <span className="eyebrow">TRAVEL READINESS</span>
        <h2>Small steps, thoughtfully taken.</h2>
        <p className="trip-readiness-note">
          Planning indicators help organize your trip. They are not a safety assessment or
          guarantee.
        </p>
        <ul>
          {checks.map(([label, done]) => (
            <li key={label}>
              <span className={done ? 'readiness-check is-done' : 'readiness-check'}>
                {done ? <Check size={13} /> : <span />}
              </span>
              {label}
              <span>{done ? 'Ready' : 'To do'}</span>
            </li>
          ))}
          {[
            ['Itinerary', 'Pending'],
            ['Local discovery', 'Pending'],
            ['Emergency preparation', 'Pending'],
          ].map(([label, status]) => (
            <li key={label}>
              <span className="readiness-check">
                <span />
              </span>
              {label}
              <span>{status}</span>
            </li>
          ))}
        </ul>
      </section>
      <WeatherWidget
        latitude={trip.destinationCoordinates?.latitude ?? trip.destination?.coordinates?.latitude}
        longitude={
          trip.destinationCoordinates?.longitude ?? trip.destination?.coordinates?.longitude
        }
        destinationName={trip.destinationName}
        startDate={trip.startDate}
        endDate={trip.endDate}
      />
    </div>
  );
}

function ComingNext({ tab }: { tab: Exclude<TripTab, 'overview' | 'map' | 'itinerary'> }) {
  const labels: Record<
    Exclude<TripTab, 'overview' | 'map' | 'itinerary'>,
    { eyebrow: string; title: string; description: string }
  > = {
    expenses: {
      eyebrow: 'EXPENSES',
      title: 'Keep the budget in view.',
      description: 'Expense tracking is planned for a future TripSOS release.',
    },
    group: {
      eyebrow: 'GROUP',
      title: 'Make room for your travelers.',
      description: 'Shared trip collaboration is planned for a future release.',
    },
  };
  const copy = labels[tab];
  return (
    <section className="trip-coming-next">
      <span className="trip-coming-next__icon">
        <Compass size={22} />
      </span>
      <span className="eyebrow">{copy.eyebrow} · COMING NEXT</span>
      <h2>{copy.title}</h2>
      <p>{copy.description}</p>
    </section>
  );
}

export function TripDetailPage() {
  const { tripId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const current = searchParams.get('tab') as TripTab | null;
  const selectedTab = tabs.some(([id]) => id === current) ? current! : 'overview';
  const { data: trip, isLoading, isError } = useTrip(tripId);
  const deleteTrip = useDeleteTrip();
  const updateStatus = useUpdateTripStatus(tripId);
  const [showDelete, setShowDelete] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const confirmDelete = async () => {
    setError('');
    try {
      await deleteTrip.mutateAsync(tripId);
      navigate('/trips');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete this trip.');
      setShowDelete(false);
    }
  };

  const handleStatusChange = async (nextStatus: TripStatus) => {
    setError('');
    try {
      await updateStatus.mutateAsync(nextStatus);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update trip status.');
    }
  };

  if (isLoading)
    return (
      <main className="product-page">
        <div className="product-shell">
          <p className="trip-query-state" role="status">
            Opening your trip…
          </p>
        </div>
      </main>
    );
  if (isError || !trip)
    return (
      <main className="product-page">
        <div className="product-shell trip-query-error" role="alert">
          <h1>Trip not found</h1>
          <p>This trip may have been removed or may not belong to your account.</p>
          <Link to="/trips">Back to your trips</Link>
        </div>
      </main>
    );

  return (
    <main className="product-page trip-detail-page">
      <div className="product-shell trip-detail-shell">
        <Link className="trip-back-link" to="/trips">
          <ArrowLeft size={15} /> All trips
        </Link>
        <m.section
          className="trip-hero"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <img
            src={travelPhotos.closing.fallbackUrl.replace('w=2200', 'w=1600')}
            alt=""
            aria-hidden="true"
          />
          <div className="trip-hero-shade" />
          <div className="trip-hero-content">
            <span className="eyebrow">{trip.destinationName.toLocaleUpperCase()}</span>
            <h1>{trip.name}</h1>
            <p>
              <CalendarDays size={15} />
              {formatTripDate(trip.startDate, { day: 'numeric', month: 'short' })} –{' '}
              {formatTripDate(trip.endDate, { day: 'numeric', month: 'short' })}
              <span>·</span>
              <Users size={15} />
              {trip.travelerCount} {trip.travelerCount === 1 ? 'traveler' : 'travelers'}
            </p>
            <span className={`trip-status trip-status--${trip.status}`}>{trip.status}</span>
          </div>
          <div className="trip-hero-actions">
            <Link to={`/trips/${trip._id}/edit`}>
              <Edit3 size={14} /> Edit trip
            </Link>
            {trip.status === 'cancelled' ? (
              <button
                type="button"
                onClick={() => void handleStatusChange('upcoming')}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Updating…' : 'Restore trip'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleStatusChange('cancelled')}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Updating…' : 'Cancel trip'}
              </button>
            )}
            <button
              type="button"
              className="trip-hero-ai-btn"
              onClick={() => setShowAiAssistant(true)}
              aria-label="Open TripSOS AI Travel Assistant"
            >
              <Sparkles size={14} /> AI Assistant
            </button>
            <button type="button" onClick={() => setShowDelete(true)}>
              Delete
            </button>
          </div>
          <span className="trip-image-note">Decorative travel photography</span>
        </m.section>
        {error && (
          <p className="form-server-error" role="alert">
            {error}
          </p>
        )}
        <nav className="trip-tabs" aria-label="Trip sections" role="tablist">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              id={`trip-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selectedTab === id}
              aria-controls="trip-tab-panel"
              onClick={() => setSearchParams(id === 'overview' ? {} : { tab: id })}
            >
              {label}
            </button>
          ))}
        </nav>
        <section
          id="trip-tab-panel"
          className="trip-tab-panel"
          role="tabpanel"
          aria-labelledby={`trip-tab-${selectedTab}`}
        >
          {selectedTab === 'overview' ? (
            <TripOverview trip={trip} />
          ) : selectedTab === 'map' ? (
            <TripMapWorkspace trip={trip} />
          ) : selectedTab === 'itinerary' ? (
            <ItineraryWorkspace trip={trip} />
          ) : selectedTab === 'expenses' ? (
            <ExpenseWorkspace trip={trip} />
          ) : selectedTab === 'group' ? (
            <GroupWorkspace trip={trip} />
          ) : (
            <ComingNext tab={selectedTab} />
          )}
        </section>
        <div className="trip-detail-footer">
          <MapPinned size={15} />
          <span>More ways to make the most of your trip are on the way.</span>
          <ArrowRight size={14} />
        </div>
      </div>
      {showDelete && (
        <DeleteTripDialog
          tripName={trip.name}
          busy={deleteTrip.isPending}
          onCancel={() => setShowDelete(false)}
          onConfirm={() => void confirmDelete()}
        />
      )}

      {/* Floating AI Assistant Trigger */}
      <button
        type="button"
        className="trip-floating-ai-fab"
        onClick={() => setShowAiAssistant(true)}
        aria-label="Open TripSOS AI Assistant"
      >
        <Bot size={20} aria-hidden="true" />
        <span>Ask AI</span>
      </button>

      <TravelAssistantDrawer
        trip={trip}
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
      />
    </main>
  );
}
