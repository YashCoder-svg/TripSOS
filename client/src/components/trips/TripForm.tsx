import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { tripFormSchema, type TripFormValues } from '../../pages/tripSchema';
import type { Trip } from '../../types/trip';
import { DestinationAutocomplete } from '../places/DestinationAutocomplete';

const styles = [
  { id: 'budget', label: 'Budget-minded', icon: '🎒', desc: 'Smart savings, hostels & transit' },
  { id: 'balanced', label: 'Balanced', icon: '⚖️', desc: 'Comfortable standard blend' },
  { id: 'comfort', label: 'Comfort', icon: '🛋️', desc: 'Upscale stays & private cabs' },
  { id: 'adventure', label: 'Adventure', icon: '🧗', desc: 'Trails, treks & expeditions' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧', desc: 'Relaxed pacing & kid-friendly' },
  { id: 'backpacking', label: 'Backpacking', icon: '🧭', desc: 'Off-the-beaten-path freedom' },
] as const;

const interests = [
  { id: 'nature', label: 'Nature', icon: '🌲' },
  { id: 'food', label: 'Food', icon: '🍲' },
  { id: 'adventure', label: 'Adventure', icon: '🧗' },
  { id: 'history', label: 'History', icon: '🏛️' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'photography', label: 'Photography', icon: '📸' },
  { id: 'nightlife', label: 'Nightlife', icon: '🍸' },
  { id: 'family', label: 'Family', icon: '🎡' },
  { id: 'culture', label: 'Culture', icon: '🎭' },
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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    mode: 'onTouched',
    defaultValues: trip
      ? {
          name: trip.name,
          destinationName: trip.destinationName,
          destinationCountry: trip.destinationCountry,
          destinationCoordinates: trip.destinationCoordinates,
          destination: trip.destination,
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
          destinationCountry: null,
          destinationCoordinates: null,
          destination: null,
          startDate: '',
          endDate: '',
          travelerCount: 1,
          budget: 0,
          currency: 'INR',
          travelStyle: 'balanced',
          interests: [],
        },
  });

  const destinationName = watch('destinationName') ?? '';
  const currentTravelStyle = watch('travelStyle') ?? 'balanced';

  useEffect(() => {
    if (trip) {
      reset({
        name: trip.name,
        destinationName: trip.destinationName,
        destinationCountry: trip.destinationCountry,
        destinationCoordinates: trip.destinationCoordinates,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelerCount: trip.travelerCount,
        budget: trip.budget,
        currency: trip.currency,
        travelStyle: trip.travelStyle,
        interests: trip.interests,
      });
    }
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
          <DestinationAutocomplete
            id="trip-destination"
            value={destinationName}
            onChange={(val) => setValue('destinationName', val, { shouldValidate: true })}
            onSelect={(result) => {
              const label = result.name
                ? `${result.name}${result.country ? `, ${result.country}` : ''}`
                : result.formattedAddress || '';
              setValue('destinationName', label, { shouldValidate: true });
              if (result.country) setValue('destinationCountry', result.country);
              setValue('destinationCoordinates', {
                latitude: result.latitude,
                longitude: result.longitude,
              });
              setValue('destination', {
                name: result.name,
                country: result.country,
                region: result.region,
                city: result.city,
                formattedAddress: result.formattedAddress,
                providerId: result.providerId,
                coordinates: {
                  latitude: result.latitude,
                  longitude: result.longitude,
                },
              });
            }}
            error={errors.destinationName?.message}
          />
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

        {/* Thematic Travel Style Section */}
        <div className="form-field trip-form-grid__wide">
          <div className="travel-style-label-row">
            <label htmlFor="trip-style">Travel style</label>
            <span className="travel-style-subtitle">Select the rhythm and tempo for this journey</span>
          </div>

          <div className="trip-style-cards-grid" role="radiogroup" aria-label="Travel styles">
            {styles.map((item) => {
              const isSelected = currentTravelStyle === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`trip-style-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setValue('travelStyle', item.id, { shouldValidate: true })}
                >
                  <span className="style-card-icon" aria-hidden="true">{item.icon}</span>
                  <div className="style-card-copy">
                    <span className="style-card-name">{item.label}</span>
                    <span className="style-card-desc">{item.desc}</span>
                  </div>
                  {isSelected && (
                    <span className="style-card-badge" aria-hidden="true">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Accessible Native Select for Form & Automated Test Parity */}
          <select
            id="trip-style"
            className="trip-style-native-select"
            {...register('travelStyle')}
            aria-label="Travel style"
          >
            {styles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interests Fieldset */}
      <fieldset className="trip-interest-fieldset">
        <legend>
          What are you interested in experiencing? <span>Optional — pick up to 9</span>
        </legend>
        <div className="trip-interest-options">
          {interests.map((item) => (
            <label className="trip-interest-chip" key={item.id} htmlFor={`interest-${item.id}`}>
              <input
                id={`interest-${item.id}`}
                type="checkbox"
                value={item.id}
                aria-label={item.label}
                {...register('interests')}
              />
              <span className="trip-interest-chip-inner">
                <span className="interest-chip-icon" aria-hidden="true">{item.icon}</span>
                <span className="interest-chip-label">{item.label}</span>
                <Check size={12} className="interest-chip-check" aria-hidden="true" />
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
