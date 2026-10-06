import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { tripFormSchema, type TripFormValues } from '../../pages/tripSchema';
import type { Trip } from '../../types/trip';

const styles = [
  ['budget', 'Budget-minded'],
  ['balanced', 'Balanced'],
  ['comfort', 'Comfort'],
  ['adventure', 'Adventure'],
  ['family', 'Family'],
  ['backpacking', 'Backpacking'],
] as const;
const interests = [
  ['nature', 'Nature'],
  ['food', 'Food'],
  ['adventure', 'Adventure'],
  ['history', 'History'],
  ['shopping', 'Shopping'],
  ['photography', 'Photography'],
  ['nightlife', 'Nightlife'],
  ['family', 'Family'],
  ['culture', 'Culture'],
] as const;

export function TripForm({
  trip,
  submitLabel,
  onSubmit,
}: {
  trip?: Trip;
  submitLabel: string;
  onSubmit(values: TripFormValues): Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    mode: 'onTouched',
    defaultValues: trip
      ? {
          name: trip.name,
          destinationName: trip.destinationName,
          startDate: trip.startDate,
          endDate: trip.endDate,
          travelerCount: trip.travelerCount,
          budget: trip.budget,
          currency: trip.currency,
          travelStyle: trip.travelStyle,
          interests: trip.interests,
        }
      : {
          name: '',
          destinationName: '',
          startDate: '',
          endDate: '',
          travelerCount: 1,
          budget: 0,
          currency: 'INR',
          travelStyle: 'balanced',
          interests: [],
        },
  });
  useEffect(() => {
    if (trip)
      reset({
        name: trip.name,
        destinationName: trip.destinationName,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelerCount: trip.travelerCount,
        budget: trip.budget,
        currency: trip.currency,
        travelStyle: trip.travelStyle,
        interests: trip.interests,
      });
  }, [trip, reset]);
  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <form className="trip-form" onSubmit={submit} noValidate>
      <div className="trip-form-grid">
        <div className="form-field">
          <label htmlFor="trip-name">Trip name</label>
          <input
            id="trip-name"
            autoComplete="off"
            placeholder="Mountain Escape"
            {...register('name')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'trip-name-error' : undefined}
          />
          {errors.name && (
            <span className="form-field__error" id="trip-name-error">
              {errors.name.message}
            </span>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="trip-destination">Destination</label>
          <input
            id="trip-destination"
            autoComplete="off"
            placeholder="Manali, India"
            {...register('destinationName')}
            aria-invalid={Boolean(errors.destinationName)}
            aria-describedby={errors.destinationName ? 'trip-destination-error' : undefined}
          />
          {errors.destinationName && (
            <span className="form-field__error" id="trip-destination-error">
              {errors.destinationName.message}
            </span>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="trip-start">Start date</label>
          <input
            id="trip-start"
            type="date"
            {...register('startDate')}
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={errors.startDate ? 'trip-start-error' : undefined}
          />
          {errors.startDate && (
            <span className="form-field__error" id="trip-start-error">
              {errors.startDate.message}
            </span>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="trip-end">End date</label>
          <input
            id="trip-end"
            type="date"
            {...register('endDate')}
            aria-invalid={Boolean(errors.endDate)}
            aria-describedby={errors.endDate ? 'trip-end-error' : undefined}
          />
          {errors.endDate && (
            <span className="form-field__error" id="trip-end-error">
              {errors.endDate.message}
            </span>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="trip-travelers">Number of travelers</label>
          <input
            id="trip-travelers"
            type="number"
            min="1"
            max="30"
            step="1"
            inputMode="numeric"
            {...register('travelerCount', { valueAsNumber: true })}
            aria-invalid={Boolean(errors.travelerCount)}
            aria-describedby={errors.travelerCount ? 'trip-travelers-error' : undefined}
          />
          {errors.travelerCount && (
            <span className="form-field__error" id="trip-travelers-error">
              {errors.travelerCount.message}
            </span>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="trip-budget">Total budget</label>
          <div className="trip-budget-field">
            <select aria-label="Budget currency" {...register('currency')}>
              <option value="INR">INR ₹</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="GBP">GBP £</option>
            </select>
            <input
              id="trip-budget"
              type="number"
              min="0"
              max="100000000"
              step="0.01"
              inputMode="decimal"
              {...register('budget', { valueAsNumber: true })}
              aria-invalid={Boolean(errors.budget)}
              aria-describedby={errors.budget ? 'trip-budget-error' : undefined}
            />
          </div>
          {errors.budget && (
            <span className="form-field__error" id="trip-budget-error">
              {errors.budget.message}
            </span>
          )}
        </div>
        <div className="form-field trip-form-grid__wide">
          <label htmlFor="trip-style">Travel style</label>
          <select id="trip-style" {...register('travelStyle')}>
            {styles.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <fieldset className="trip-interest-fieldset">
        <legend>
          What are you interested in? <span>Optional</span>
        </legend>
        <div className="trip-interest-options">
          {interests.map(([value, label]) => (
            <label className="trip-interest-chip" key={value}>
              <input type="checkbox" value={value} {...register('interests')} />
              <span>
                <Check size={13} aria-hidden="true" />
                {label}
              </span>
            </label>
          ))}
        </div>
        {errors.interests && (
          <span className="form-field__error">Choose up to nine interests.</span>
        )}
      </fieldset>
      <p className="trip-date-note">
        Dates stay as local calendar days, with both the start and end dates counted in your trip
        length.
      </p>
      <div className="trip-form-actions">
        <button type="submit" className="product-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving your trip…' : submitLabel}
          <ArrowRight size={15} />
        </button>
      </div>
    </form>
  );
}
