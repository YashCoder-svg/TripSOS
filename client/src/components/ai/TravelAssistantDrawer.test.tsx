import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TravelAssistantDrawer } from './TravelAssistantDrawer';
import type { Trip } from '../../types/trip';

const mockTrip: Trip = {
  _id: 'trip-1',
  name: 'Manali Expedition',
  destinationName: 'Manali',
  destinationCountry: 'India',
  destinationCoordinates: { latitude: 32.2396, longitude: 77.1887 },
  startDate: '2026-10-10',
  endDate: '2026-10-15',
  currency: 'INR',
  travelerCount: 2,
  budget: 25000,
  travelStyle: 'adventure',
  interests: ['nature'],
  status: 'upcoming',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockChatMutate = vi.fn().mockResolvedValue({
  reply: 'Here are verified restaurants in Manali:\n\n**1. Cafe 1947**\n- Address: Old Manali\n',
  toolCalls: [
    {
      tool: 'getNearbyPlaces',
      sourceAttribution: 'OpenStreetMap Overpass verified directory',
    },
  ],
  suggestedActions: [
    {
      id: 'act_1',
      type: 'add_itinerary_item',
      title: 'Add Cafe 1947 to Itinerary',
      description: 'Schedule a visit on 2026-10-10',
      data: {
        tripId: 'trip-1',
        title: 'Visit Cafe 1947',
        date: '2026-10-10',
        startTime: '12:30',
        category: 'food',
      },
    },
  ],
});

const mockActionMutate = vi.fn().mockResolvedValue({
  executed: true,
  item: { _id: 'item-1', title: 'Visit Cafe 1947' },
});

vi.mock('../../services/aiService', () => ({
  useAiChat: () => ({
    mutateAsync: mockChatMutate,
    isPending: false,
  }),
  useExecuteAiAction: () => ({
    mutateAsync: mockActionMutate,
    isPending: false,
  }),
}));

describe('TravelAssistantDrawer', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = (isOpen = true) =>
    render(
      <QueryClientProvider client={queryClient}>
        <TravelAssistantDrawer trip={mockTrip} isOpen={isOpen} onClose={vi.fn()} />
      </QueryClientProvider>,
    );

  it('renders assistant greeting, tool badge, and prompt chips', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /tripsos travel assistant/i })).toBeInTheDocument();
    expect(screen.getByText(/grounded tools/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /plan tomorrow for me/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /find restaurants near me/i })).toBeInTheDocument();
  });

  it('sends prompt chip, displays assistant reply with tool tags, and renders action card', async () => {
    const user = userEvent.setup();
    renderComponent();

    const restaurantChip = screen.getByRole('button', { name: /find restaurants near me/i });
    await user.click(restaurantChip);

    expect(mockChatMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Find restaurants near me',
        tripId: 'trip-1',
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(/OpenStreetMap Overpass verified directory/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Cafe 1947 to Itinerary/i)).toBeInTheDocument();
    });
  });

  it('approves suggested action and updates button to confirmed state', async () => {
    const user = userEvent.setup();
    renderComponent();

    const restaurantChip = screen.getByRole('button', { name: /find restaurants near me/i });
    await user.click(restaurantChip);

    const approveBtn = await screen.findByRole('button', { name: /approve & add/i });
    await user.click(approveBtn);

    expect(mockActionMutate).toHaveBeenCalledWith({
      tripId: 'trip-1',
      actionType: 'add_itinerary_item',
      data: expect.objectContaining({
        title: 'Visit Cafe 1947',
      }),
    });

    await waitFor(() => {
      expect(screen.getByText(/Added to Itinerary/i)).toBeInTheDocument();
    });
  });
});
