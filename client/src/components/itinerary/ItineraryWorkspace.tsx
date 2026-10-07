import { useMemo, useState } from 'react';
import { Calendar, CheckCircle, Compass, Plus } from 'lucide-react';
import type { Trip } from '../../types/trip';
import type {
  CreateItineraryItemPayload,
  ItineraryCategory,
  ItineraryItem,
} from '../../types/itinerary';
import type { PlaceSummary } from '../../types/place';
import {
  useCreateItineraryItem,
  useDeleteItineraryItem,
  useItinerary,
  useReorderItinerary,
  useUpdateItineraryItem,
} from '../../services/itineraryService';
import { ItineraryItemCard } from './ItineraryItemCard';
import { ItineraryItemModal } from './ItineraryItemModal';
import { ActivitySuggestions } from './ActivitySuggestions';

interface ItineraryWorkspaceProps {
  trip: Trip;
}

function generateTripDates(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const current = new Date(start);
    // Limit to max 30 days sanity
    let count = 0;
    while (current <= end && count < 30) {
      dates.push(current.toISOString().split('T')[0]!);
      current.setDate(current.getDate() + 1);
      count++;
    }
  } catch {
    return [startDateStr];
  }
  return dates.length > 0 ? dates : [startDateStr];
}

function formatDateTab(dateStr: string, dayIndex: number): { dayLabel: string; dateLabel: string } {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return { dayLabel: `Day ${dayIndex + 1}`, dateLabel: dateStr };
    const date = new Date(y, m - 1, d);
    const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return { dayLabel: `Day ${dayIndex + 1}`, dateLabel };
  } catch {
    return { dayLabel: `Day ${dayIndex + 1}`, dateLabel: dateStr };
  }
}

export function ItineraryWorkspace({ trip }: ItineraryWorkspaceProps) {
  const tripDates = useMemo(
    () => generateTripDates(trip.startDate, trip.endDate),
    [trip.startDate, trip.endDate],
  );

  const [selectedDate, setSelectedDate] = useState<string>(tripDates[0] || trip.startDate);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<CreateItineraryItemPayload> | null>(null);

  const { data: items = [], isLoading, isError } = useItinerary(trip._id);
  const createItem = useCreateItineraryItem(trip._id);
  const updateItem = useUpdateItineraryItem(trip._id);
  const deleteItem = useDeleteItineraryItem(trip._id);
  const reorder = useReorderItinerary(trip._id);

  // Group or filter items by selected date
  const dayItems = useMemo(() => {
    return items.filter((item) => item.date === selectedDate).sort((a, b) => a.order - b.order);
  }, [items, selectedDate]);

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === 'completed').length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setPrefillData({ date: selectedDate });
    setModalOpen(true);
  };

  const handleEdit = (item: ItineraryItem) => {
    setEditingItem(item);
    setPrefillData(null);
    setModalOpen(true);
  };

  const handleAddPlace = (place: PlaceSummary) => {
    let cat: ItineraryCategory = 'activity';
    if (place.category === 'food' || place.category === 'cafes') cat = 'food';
    else if (place.category === 'hotels') cat = 'lodging';

    setEditingItem(null);
    setPrefillData({
      title: place.name,
      location: place.address || place.name,
      date: selectedDate,
      category: cat,
      coordinates: { latitude: place.latitude, longitude: place.longitude },
      placeProviderId: place.providerId,
    });
    setModalOpen(true);
  };

  const handleSubmitModal = async (payload: CreateItineraryItemPayload) => {
    if (editingItem) {
      await updateItem.mutateAsync({
        itemId: editingItem._id,
        payload,
      });
    } else {
      await createItem.mutateAsync(payload);
    }
  };

  const handleToggleStatus = async (item: ItineraryItem) => {
    const nextStatus = item.status === 'completed' ? 'planned' : 'completed';
    await updateItem.mutateAsync({
      itemId: item._id,
      payload: { status: nextStatus },
    });
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Delete this activity from your itinerary?')) {
      await deleteItem.mutateAsync(itemId);
    }
  };

  const handleMove = async (item: ItineraryItem, direction: 'up' | 'down') => {
    const index = dayItems.findIndex((i) => i._id === item._id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dayItems.length) return;

    const other = dayItems[targetIndex]!;
    await reorder.mutateAsync([
      { id: item._id, order: other.order },
      { id: other._id, order: item.order },
    ]);
  };

  const coords =
    trip.destinationCoordinates ||
    (trip.destination?.coordinates ? trip.destination.coordinates : undefined);

  return (
    <div className="itinerary-workspace-layout">
      <div className="itinerary-main-column">
        {/* Progress & Header */}
        <section className="itinerary-header-card">
          <div className="itinerary-header-top">
            <div>
              <span className="eyebrow">SMART ITINERARY</span>
              <h2>Trip Timeline</h2>
            </div>
            <button type="button" className="itinerary-add-btn" onClick={handleOpenAdd}>
              <Plus size={16} /> Add Activity
            </button>
          </div>

          {totalItems > 0 && (
            <div className="itinerary-progress-box">
              <div className="itinerary-progress-text">
                <span>
                  <CheckCircle size={14} /> {completedItems} of {totalItems} activities completed
                </span>
                <strong>{progressPercent}%</strong>
              </div>
              <div className="itinerary-progress-track">
                <div className="itinerary-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </section>

        {/* Day Selector Tabs */}
        <nav className="itinerary-day-nav" aria-label="Trip days" role="tablist">
          {tripDates.map((dateStr, idx) => {
            const { dayLabel, dateLabel } = formatDateTab(dateStr, idx);
            const isSelected = selectedDate === dateStr;
            const countForDay = items.filter((i) => i.date === dateStr).length;

            return (
              <button
                key={dateStr}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`itinerary-day-tab ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setSelectedDate(dateStr)}
              >
                <span className="day-tab-num">{dayLabel}</span>
                <span className="day-tab-date">{dateLabel}</span>
                {countForDay > 0 && <span className="day-tab-count">{countForDay}</span>}
              </button>
            );
          })}
        </nav>

        {/* Timeline Items */}
        <div className="itinerary-day-content">
          <div className="itinerary-day-heading">
            <Calendar size={16} aria-hidden="true" />
            <h3>
              {formatDateTab(selectedDate, tripDates.indexOf(selectedDate)).dayLabel} ·{' '}
              {formatDateTab(selectedDate, tripDates.indexOf(selectedDate)).dateLabel}
            </h3>
            <span className="itinerary-count-pill">
              {dayItems.length} {dayItems.length === 1 ? 'activity' : 'activities'}
            </span>
          </div>

          {isLoading ? (
            <div className="itinerary-loading">
              <span className="spinner" aria-hidden="true" />
              <p>Loading your itinerary…</p>
            </div>
          ) : isError ? (
            <p className="itinerary-error" role="alert">
              Unable to load your itinerary. Please try again.
            </p>
          ) : dayItems.length === 0 ? (
            <div className="itinerary-empty-state">
              <Compass size={28} className="empty-icon" />
              <h4>No activities planned for this day</h4>
              <p>Add a plan or explore verified suggestions nearby to shape your schedule.</p>
              <button type="button" className="product-text-link" onClick={handleOpenAdd}>
                <Plus size={14} /> Add your first activity for this day
              </button>
            </div>
          ) : (
            <div className="itinerary-timeline-list">
              {dayItems.map((item, index) => (
                <ItineraryItemCard
                  key={item._id}
                  item={item}
                  canMoveUp={index > 0}
                  canMoveDown={index < dayItems.length - 1}
                  onToggleStatus={handleToggleStatus}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMoveUp={(it) => handleMove(it, 'up')}
                  onMoveDown={(it) => handleMove(it, 'down')}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discovery Suggestions Sidebar */}
      <div className="itinerary-sidebar-column">
        <ActivitySuggestions
          latitude={coords?.latitude}
          longitude={coords?.longitude}
          destinationName={trip.destinationName}
          onAddPlace={handleAddPlace}
        />
      </div>

      <ItineraryItemModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
          setPrefillData(null);
        }}
        onSubmit={handleSubmitModal}
        initialData={editingItem ?? prefillData}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
      />
    </div>
  );
}
