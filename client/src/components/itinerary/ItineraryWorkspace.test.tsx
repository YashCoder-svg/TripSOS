import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItineraryWorkspace } from './ItineraryWorkspace';
import type { Trip } from '../../types/trip';
import type { ItineraryItem } from '../../types/itinerary';

const mockTrip: Trip = {
  _id: 'trip-123',
  name: 'Himalayan Journey',
  destinationName: 'Manali, India',
  destinationCountry: 'India',
  destinationCoordinates: { latitude: 32.2396, longitude: 77.1887 },
  startDate: '2026-10-15',
  endDate: '2026-10-17',
  travelerCount: 2,
  budget: 45000,
  currency: 'INR',
  travelStyle: 'adventure',
  interests: ['nature'],
  status: 'upcoming',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

const mockItems: ItineraryItem[] = [
  {
    _id: 'item-1',
    trip: 'trip-123',
    title: 'Hike to Jogini Waterfall',
    date: '2026-10-15',
    startTime: '09:00',
    endTime: '12:00',
    location: 'Vashisht',
    category: 'activity',
    status: 'planned',
    order: 0,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  {
    _id: 'item-2',
    trip: 'trip-123',
    title: 'Dinner at Johnson Cafe',
    date: '2026-10-15',
    startTime: '19:30',
    endTime: '21:30',
    category: 'food',
    status: 'completed',
    order: 1,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];

const mockCreateMutate = vi.fn().mockResolvedValue({});
const mockUpdateMutate = vi.fn().mockResolvedValue({});
const mockDeleteMutate = vi.fn().mockResolvedValue({});
const mockReorderMutate = vi.fn().mockResolvedValue([]);

vi.mock('../../services/itineraryService', () => ({
  useItinerary: () => ({
    data: mockItems,
    isLoading: false,
    isError: false,
  }),
  useCreateItineraryItem: () => ({
    mutateAsync: mockCreateMutate,
    isPending: false,
  }),
  useUpdateItineraryItem: () => ({
    mutateAsync: mockUpdateMutate,
    isPending: false,
  }),
  useDeleteItineraryItem: () => ({
    mutateAsync: mockDeleteMutate,
    isPending: false,
  }),
  useReorderItinerary: () => ({
    mutateAsync: mockReorderMutate,
    isPending: false,
  }),
}));

vi.mock('../../services/placeService', () => ({
  placeKeys: {
    search: () => ['places', 'search'],
  },
  placeService: {
    search: vi.fn().mockResolvedValue({
      results: [],
      center: { latitude: 32.2396, longitude: 77.1887 },
      source: 'OpenStreetMap',
    }),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('ItineraryWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders days navigation and activities for the selected date', () => {
    renderWithClient(<ItineraryWorkspace trip={mockTrip} />);

    expect(screen.getByText('Trip Timeline')).toBeInTheDocument();
    expect(screen.getByText('Hike to Jogini Waterfall')).toBeInTheDocument();
    expect(screen.getByText('Dinner at Johnson Cafe')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 activities completed')).toBeInTheDocument();
  });

  it('toggles activity status when check button is clicked', async () => {
    renderWithClient(<ItineraryWorkspace trip={mockTrip} />);
    const user = userEvent.setup();

    const checkBtn = screen.getByLabelText('Mark Hike to Jogini Waterfall as completed');
    await user.click(checkBtn);

    expect(mockUpdateMutate).toHaveBeenCalledWith({
      itemId: 'item-1',
      payload: { status: 'completed' },
    });
  });

  it('opens the add activity modal and submits new item', async () => {
    renderWithClient(<ItineraryWorkspace trip={mockTrip} />);
    const user = userEvent.setup();

    const addBtn = screen.getByRole('button', { name: /add activity/i });
    await user.click(addBtn);

    expect(screen.getByRole('heading', { name: 'Add Activity' })).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/activity title/i);
    await user.type(titleInput, 'River Rafting in Beas');

    const submitBtn = screen.getByRole('button', { name: 'Save Activity' });
    await user.click(submitBtn);

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'River Rafting in Beas',
        date: '2026-10-15',
        category: 'activity',
      }),
    );
  });

  it('shows empty state when selecting a day without activities', async () => {
    renderWithClient(<ItineraryWorkspace trip={mockTrip} />);
    const user = userEvent.setup();

    // Click on Day 2 tab (Oct 16)
    const day2Tab = screen.getByText('Day 2');
    await user.click(day2Tab);

    expect(screen.getByText('No activities planned for this day')).toBeInTheDocument();
  });
});
