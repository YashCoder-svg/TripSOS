import { ArrowLeft, Compass } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TripForm } from '../components/trips/TripForm';
import { useCreateTrip, useTrip, useUpdateTrip } from '../services/tripService';
import type { TripFormValues } from './tripSchema';

export function TripFormPage({ editing = false }: { editing?: boolean }) {
  const { tripId = '' } = useParams();
  const navigate = useNavigate();
  const tripQuery = useTrip(editing ? tripId : '');
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip(tripId);
  const [error, setError] = useState('');

  const submit = async (values: TripFormValues) => {
    setError('');
    try {
      const trip = editing
        ? await updateTrip.mutateAsync(values)
        : await createTrip.mutateAsync(values);
      navigate(`/trips/${trip._id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save this trip. Try again.');
    }
  };

  if (editing && tripQuery.isLoading)
    return (
      <main className="product-page">
        <div className="product-shell">
          <p className="trip-query-state" role="status">
            Opening your trip…
          </p>
        </div>
      </main>
    );
  if (editing && (tripQuery.isError || !tripQuery.data))
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
    <main className="product-page trip-form-page">
      <div className="product-shell trip-form-shell">
        <Link
          className="trip-back-link"
          to={editing && tripQuery.data ? `/trips/${tripQuery.data._id}` : '/trips'}
        >
          <ArrowLeft size={15} /> {editing ? 'Back to trip' : 'All trips'}
        </Link>
        <header className="product-page-heading">
          <span className="eyebrow">
            <Compass size={14} /> {editing ? 'REFINE YOUR PLANS' : 'MAKE IT YOURS'}
          </span>
          <h1>{editing ? 'Shape the details.' : 'Where will you go?'}</h1>
          <p>
            {editing
              ? 'Keep the important trip details up to date.'
              : 'A few thoughtful details give your journey a place to begin.'}
          </p>
        </header>
        {error && (
          <p className="form-server-error" role="alert">
            {error}
          </p>
        )}
        <section className="profile-section trip-form-panel">
          <TripForm
            trip={editing ? tripQuery.data : undefined}
            submitLabel={editing ? 'Save changes' : 'Create trip'}
            onSubmit={submit}
          />
        </section>
      </div>
    </main>
  );
}
