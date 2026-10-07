import { useEffect, useRef, useState } from 'react';
import { Calendar, Clock, MapPin, Tag, X } from 'lucide-react';
import type {
  CreateItineraryItemPayload,
  ItineraryCategory,
  ItineraryItem,
} from '../../types/itinerary';
import { itineraryCategories } from '../../types/itinerary';

interface ItineraryItemModalProps {
  isOpen: boolean;
  onClose(): void;
  onSubmit(payload: CreateItineraryItemPayload): Promise<void>;
  initialData?: Partial<CreateItineraryItemPayload> | ItineraryItem | null;
  tripStartDate: string;
  tripEndDate: string;
}

export function ItineraryItemModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  tripStartDate,
  tripEndDate,
}: ItineraryItemModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(tripStartDate || new Date().toISOString().split('T')[0]!);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState<ItineraryCategory>('activity');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title ?? '');
      setDate(initialData.date ?? tripStartDate ?? '');
      setStartTime(initialData.startTime ?? '');
      setEndTime(initialData.endTime ?? '');
      setCategory(initialData.category ?? 'activity');
      setLocation(initialData.location ?? '');
      setNotes(initialData.notes ?? '');
    } else {
      setTitle('');
      setDate(tripStartDate || new Date().toISOString().split('T')[0]!);
      setStartTime('');
      setEndTime('');
      setCategory('activity');
      setLocation('');
      setNotes('');
    }
    setError('');
  }, [initialData, tripStartDate, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const element = modalRef.current;
    if (!element) return;
    const firstInput = element.querySelector<HTMLInputElement>('input, button');
    firstInput?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key !== 'Tab') return;
      const controls = [
        ...element.querySelectorAll<HTMLElement>(
          'input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)',
        ),
      ];
      if (!controls.length) return;
      const first = controls[0]!;
      const last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an activity title.');
      return;
    }
    if (!date) {
      setError('Please select a date.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await onSubmit({
        title: title.trim(),
        date,
        startTime: startTime || null,
        endTime: endTime || null,
        category,
        location: location.trim() || null,
        notes: notes.trim() || undefined,
        coordinates:
          initialData && 'coordinates' in initialData ? initialData.coordinates : undefined,
        placeProviderId:
          initialData && 'placeProviderId' in initialData ? initialData.placeProviderId : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save activity.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="trip-dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="itinerary-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="itinerary-modal-title"
      >
        <header className="itinerary-modal-header">
          <div>
            <span className="eyebrow">ITINERARY ACTIVITY</span>
            <h2 id="itinerary-modal-title">
              {initialData && '_id' in initialData ? 'Edit Activity' : 'Add Activity'}
            </h2>
          </div>
          <button
            type="button"
            className="trip-dialog-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </header>

        {error && (
          <p className="form-server-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="itinerary-form">
          <div className="form-field">
            <label htmlFor="itinerary-title">Activity Title *</label>
            <input
              id="itinerary-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Visit Old Manali Cafe or Hike to Jogini Falls"
              required
              maxLength={120}
              disabled={busy}
            />
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="itinerary-date">
                <Calendar size={14} /> Date *
              </label>
              <input
                id="itinerary-date"
                type="date"
                value={date}
                min={tripStartDate}
                max={tripEndDate}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={busy}
              />
            </div>
            <div className="form-field">
              <label htmlFor="itinerary-category">
                <Tag size={14} /> Category
              </label>
              <select
                id="itinerary-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ItineraryCategory)}
                disabled={busy}
              >
                {itineraryCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="itinerary-start-time">
                <Clock size={14} /> Start Time
              </label>
              <input
                id="itinerary-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="form-field">
              <label htmlFor="itinerary-end-time">
                <Clock size={14} /> End Time
              </label>
              <input
                id="itinerary-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="itinerary-location">
              <MapPin size={14} /> Location / Address
            </label>
            <input
              id="itinerary-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Club House Road, Old Manali"
              maxLength={200}
              disabled={busy}
            />
          </div>

          <div className="form-field">
            <label htmlFor="itinerary-notes">Notes or Reminders</label>
            <textarea
              id="itinerary-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring booking confirmation, entry fee ₹50, wear hiking boots"
              rows={3}
              maxLength={1000}
              disabled={busy}
            />
          </div>

          <div className="itinerary-modal-actions">
            <button type="button" className="quiet-action" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="itinerary-submit-btn" disabled={busy}>
              {busy
                ? 'Saving…'
                : initialData && '_id' in initialData
                  ? 'Save Changes'
                  : 'Save Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
