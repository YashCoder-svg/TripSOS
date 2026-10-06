import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TripMapWorkspace } from './TripMapWorkspace';
import * as placeService from '../../services/placeService';
import type { PlaceSummary } from '../../types/place';
import type { Trip } from '../../types/trip';

// Mock the MapLibreMap component to avoid WebGL context issues in jsdom
vi.mock('../maps/MapLibreMap', () => ({
  MapLibreMap: ({
    destination,
    places,
    selectedPlaceId,
    onSelectPlace,
  }: {
    destination?: { name: string };
    places: PlaceSummary[];
    selectedPlaceId?: string | null;
    onSelectPlace?: (p: PlaceSummary) => void;
  }) => (
    <div data-testid="mock-map">
      <div data-testid="map-destination">{destination?.name}</div>
      <div data-testid="map-places-count">{places.length}</div>
      <div data-testid="map-selected-id">{selectedPlaceId}</div>
      {places.map((p) => (
        <button
          key={p.providerId}
          type="button"
          data-testid={`marker-${p.providerId}`}
          aria-label={`Marker pin for ${p.name}`}
          onClick={() => onSelectPlace?.(p)}
        >
          Pin
        </button>
      ))}
    </div>
  ),
}));

const mockTrip: Trip = {
  _id: 'trip-999',
  name: 'Himalayan Expedition',
  destinationName: 'Manali',
  destinationCountry: 'India',
  destinationCoordinates: {
    latitude: 32.2396,
    longitude: 77.1887,
  },
  startDate: '2026-06-01T00:00:00.000Z',
  endDate: '2026-06-10T00:00:00.000Z',
  travelerCount: 2,
  budget: 1500,
  currency: 'USD',
  travelStyle: 'adventure',
  interests: ['adventure', 'nature'],
  status: 'upcoming',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const samplePlaces: PlaceSummary[] = [
  {
    provider: 'osm',
    providerId: 'hospital-1',
    name: 'Manali Civil Hospital',
    category: 'hospitals',
    latitude: 32.241,
    longitude: 77.189,
    address: 'Mall Road',
    distanceMeters: 300,
  },
  {
    provider: 'osm',
    providerId: 'cafe-1',
    name: 'Old Manali Cafe',
    category: 'cafes',
    latitude: 32.245,
    longitude: 77.192,
    address: 'Old Manali Village',
    distanceMeters: 750,
  },
];

describe('TripMapWorkspace', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    vi.restoreAllMocks();
  });

  const renderComponent = (trip: Trip = mockTrip) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TripMapWorkspace trip={trip} />
      </QueryClientProvider>,
    );
  };

  it('renders destination, fetches nearby places, and synchronizes with map', async () => {
    vi.spyOn(placeService.placeService, 'search').mockResolvedValue({
      results: samplePlaces,
      center: { latitude: 32.2396, longitude: 77.1887 },
      source: 'osm',
    });

    renderComponent();

    expect(await screen.findByText('Manali Civil Hospital')).toBeInTheDocument();
    expect(screen.getByText('Old Manali Cafe')).toBeInTheDocument();
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
    expect(screen.getByTestId('map-destination')).toHaveTextContent('Manali');
    expect(screen.getByTestId('map-places-count')).toHaveTextContent('2');
  });

  it('filters places when a category chip is selected', async () => {
    const searchSpy = vi.spyOn(placeService.placeService, 'search').mockResolvedValue({
      results: [samplePlaces[0]!],
      center: { latitude: 32.2396, longitude: 77.1887 },
      source: 'osm',
    });

    const user = userEvent.setup();
    renderComponent();

    const hospitalChip = screen.getByRole('button', { name: /Hospitals/i });
    await user.click(hospitalChip);

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'hospitals',
        }),
      );
    });
  });

  it('synchronizes selection between map marker and place card', async () => {
    vi.spyOn(placeService.placeService, 'search').mockResolvedValue({
      results: samplePlaces,
      center: { latitude: 32.2396, longitude: 77.1887 },
      source: 'osm',
    });

    const user = userEvent.setup();
    renderComponent();

    // Click marker on map
    const marker = await screen.findByTestId('marker-hospital-1');
    await user.click(marker);

    // Map selected ID should update
    expect(screen.getByTestId('map-selected-id')).toHaveTextContent('hospital-1');

    // Place card should have aria-pressed="true"
    const hospitalCard = screen.getByRole('button', { name: 'Manali Civil Hospital, Hospitals' });
    expect(hospitalCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles explicit user geolocation permission flow without background tracking', async () => {
    vi.spyOn(placeService.placeService, 'search').mockResolvedValue({
      results: samplePlaces,
      center: { latitude: 32.2396, longitude: 77.1887 },
      source: 'osm',
    });

    const getCurrentPositionMock = vi.fn().mockImplementation((success) => {
      success({
        coords: {
          latitude: 31.1048,
          longitude: 77.1734,
        },
      });
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: getCurrentPositionMock },
      configurable: true,
      writable: true,
    });

    const user = userEvent.setup();
    renderComponent();

    // 1. Click "Use my current location"
    const locationBtn = screen.getByRole('button', { name: /Use my current location/i });
    await user.click(locationBtn);

    // 2. Explainer modal appears
    expect(screen.getByText('Use your current location?')).toBeInTheDocument();
    expect(screen.getByText(/We do not track you in the background/i)).toBeInTheDocument();

    // 3. User grants permission
    const allowBtn = screen.getByRole('button', { name: /Allow location/i });
    await user.click(allowBtn);

    expect(getCurrentPositionMock).toHaveBeenCalledTimes(1);

    // 4. Banner shows active status
    await waitFor(() => {
      expect(screen.getByText(/Using your current location/i)).toBeInTheDocument();
    });
  });

  it('handles denied geolocation gracefully with polite guidance', async () => {
    vi.spyOn(placeService.placeService, 'search').mockResolvedValue({
      results: samplePlaces,
      center: { latitude: 32.2396, longitude: 77.1887 },
      source: 'osm',
    });

    const getCurrentPositionMock = vi.fn().mockImplementation((_success, error) => {
      error({ code: 1, PERMISSION_DENIED: 1, message: 'User denied geolocation' });
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: getCurrentPositionMock },
      configurable: true,
      writable: true,
    });

    const user = userEvent.setup();
    renderComponent();

    const locationBtn = screen.getByRole('button', { name: /Use my current location/i });
    await user.click(locationBtn);

    const allowBtn = screen.getByRole('button', { name: /Allow location/i });
    await user.click(allowBtn);

    await waitFor(() => {
      expect(screen.getByText(/Location access was denied/i)).toBeInTheDocument();
    });
  });
});
