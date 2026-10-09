import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Trip } from '../types/trip';
import { TripsPage } from './TripsPage';
import { TripDetailPage } from './TripDetailPage';
import { TripFormPage } from './TripFormPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 } },
});

const hooks = vi.hoisted(() => ({
  trips: [] as Trip[],
  trip: null as Trip | null,
  isLoading: false,
  isError: false,
  deleteMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  updateStatusMutateAsync: vi.fn(),
}));

vi.mock('../services/tripService', () => ({
  useTrips: () => ({ data: hooks.trips, isLoading: hooks.isLoading, isError: hooks.isError }),
  useTrip: () => ({ data: hooks.trip, isLoading: hooks.isLoading, isError: hooks.isError }),
  useDeleteTrip: () => ({ mutateAsync: hooks.deleteMutateAsync, isPending: false }),
  useCreateTrip: () => ({ mutateAsync: vi.fn() }),
  useUpdateTrip: () => ({ mutateAsync: hooks.updateMutateAsync }),
  useUpdateTripStatus: () => ({ mutateAsync: hooks.updateStatusMutateAsync, isPending: false }),
  useJoinTripByCode: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../services/expenseService', () => ({
  useTripExpenses: () => ({
    data: {
      expenses: [],
      summary: {
        totalExpense: 0,
        currency: 'INR',
        memberBalances: [],
        settlements: [],
      },
    },
    isLoading: false,
  }),
  useCreateExpense: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteExpense: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../services/groupService', () => ({
  useTripMembers: () => ({
    data: {
      members: [],
      tripOwnerId: 'user-1',
    },
    isLoading: false,
  }),
  useInviteTripMember: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useJoinTrip: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveTripMember: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useLeaveTrip: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTripMessages: () => ({ data: [], isLoading: false }),
  useSendTripMessage: () => ({ mutate: vi.fn(), isPending: false }),
  usePinTripMessage: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../services/socketService', () => ({
  getSocket: () => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  }),
  disconnectSocket: vi.fn(),
}));

const trip: Trip = {
  _id: 'trip-one',
  name: 'Mountain Escape',
  destinationName: 'Manali, India',
  destinationCountry: 'India',
  destinationCoordinates: null,
  startDate: '2099-10-12',
  endDate: '2099-10-16',
  travelerCount: 4,
  budget: 60000,
  currency: 'INR',
  travelStyle: 'adventure',
  interests: ['nature', 'photography'],
  status: 'upcoming',
  createdAt: '2098-01-01T00:00:00.000Z',
  updatedAt: '2098-01-01T00:00:00.000Z',
};

function renderTrips(path = '/trips') {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />} />
          <Route path="/" element={<p>Trips home</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('trip pages', () => {
  beforeEach(() => {
    hooks.trips = [];
    hooks.trip = null;
    hooks.isLoading = false;
    hooks.isError = false;
    hooks.deleteMutateAsync.mockReset();
    hooks.updateMutateAsync.mockReset();
    hooks.updateStatusMutateAsync.mockReset();
  });

  it('shows the first-trip empty state without inventing trip data', () => {
    renderTrips();
    expect(
      screen.getByRole('heading', { name: 'Your next adventure starts here.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create your first trip/i })).toHaveAttribute(
      'href',
      '/trips/new',
    );
  });

  it('lists trip details and links to the trip workspace', () => {
    hooks.trips = [trip];
    renderTrips();
    expect(screen.getByRole('heading', { name: 'Upcoming trips' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mountain Escape' })).toHaveAttribute(
      'href',
      '/trips/trip-one',
    );
    expect(screen.getByText(/12 Oct – 16 Oct/)).toBeInTheDocument();
    expect(screen.getByText('5 days')).toBeInTheDocument();
  });

  it('lists planning and past trips in distinct categories', () => {
    hooks.trips = [
      { ...trip, _id: 'planning-1', name: 'Kyoto Journey', status: 'planning' },
      { ...trip, _id: 'past-1', name: 'Rome Holiday', status: 'completed' },
    ];
    renderTrips();
    expect(screen.getByRole('heading', { name: 'Planning trips' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Past trips' })).toBeInTheDocument();
  });

  it('shows trip overview, coming-next tabs, edit navigation, cancel action, and a deliberate delete confirmation', async () => {
    hooks.trip = trip;
    hooks.deleteMutateAsync.mockResolvedValue({ deleted: true });
    hooks.updateStatusMutateAsync.mockResolvedValue({ ...trip, status: 'cancelled' });
    renderTrips('/trips/trip-one');
    expect(await screen.findByRole('heading', { name: 'Mountain Escape' })).toBeInTheDocument();
    expect(screen.getByText('5 travel days')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Itinerary' }));
    expect(screen.getByRole('heading', { name: 'Trip Timeline' })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Expenses' }));
    expect(screen.getByText(/TOTAL TRIP SPENDING/i)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Group' }));
    expect(screen.getByText(/Trip Travelers/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /edit trip/i })).toHaveAttribute(
      'href',
      '/trips/trip-one/edit',
    );

    // Cancel trip action
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel trip' }));
    await waitFor(() => expect(hooks.updateStatusMutateAsync).toHaveBeenCalledWith('cancelled'));

    // Delete confirmation flow
    await userEvent.setup().click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('dialog', { name: 'Delete this trip?' })).toBeInTheDocument();
    expect(hooks.deleteMutateAsync).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Keep trip' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Delete trip' }));
    await waitFor(() => expect(hooks.deleteMutateAsync).toHaveBeenCalledWith('trip-one'));
  });

  it('allows restoring a cancelled trip', async () => {
    hooks.trip = { ...trip, status: 'cancelled' };
    hooks.updateStatusMutateAsync.mockResolvedValue({ ...trip, status: 'upcoming' });
    renderTrips('/trips/trip-one');
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Restore trip' }));
    await waitFor(() => expect(hooks.updateStatusMutateAsync).toHaveBeenCalledWith('upcoming'));
  });

  it('loads the shared form for editing and saves the updated trip', async () => {
    hooks.trip = trip;
    hooks.updateMutateAsync.mockResolvedValue({ ...trip, name: 'A Northern Escape' });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/trips/trip-one/edit']}>
          <Routes>
            <Route path="/trips/:tripId/edit" element={<TripFormPage editing />} />
            <Route path="/trips/:tripId" element={<p>Trip overview</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const nameField = await screen.findByLabelText('Trip name');
    await userEvent.setup().clear(nameField);
    await userEvent.setup().type(nameField, 'A Northern Escape');
    await userEvent.setup().click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(hooks.updateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'A Northern Escape' }),
      ),
    );
    expect(await screen.findByText('Trip overview')).toBeInTheDocument();
  });
});
