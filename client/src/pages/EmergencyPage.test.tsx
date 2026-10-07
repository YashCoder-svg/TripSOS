import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmergencyPage } from './EmergencyPage';

const mockStartMutate = vi.fn().mockResolvedValue({
  _id: 'session-123',
  type: 'general',
  status: 'active',
  startedAt: new Date().toISOString(),
});

const mockEndMutate = vi.fn().mockResolvedValue({
  _id: 'session-123',
  type: 'general',
  status: 'resolved',
  endedAt: new Date().toISOString(),
});

vi.mock('../services/emergencyService', () => ({
  useEmergencyNumbers: () => ({
    data: {
      countryCode: 'IN',
      countryName: 'India',
      general: '112',
      police: '100',
      ambulance: '108',
      fire: '101',
      source: 'Ministry of Home Affairs ERSS',
    },
    isLoading: false,
  }),
  useNearbyEmergencyServices: () => ({
    data: {
      services: [
        {
          provider: 'osm',
          providerId: 'hosp-1',
          name: 'Apex Trauma & Emergency Center',
          category: 'hospitals',
          latitude: 32.24,
          longitude: 77.18,
          address: 'Central Hospital Road',
          distanceMeters: 650,
          phone: '+91 1902 250 999',
        },
      ],
      source: 'OpenStreetMap',
    },
    isLoading: false,
  }),
  useStartEmergencySession: () => ({
    mutateAsync: mockStartMutate,
    isPending: false,
  }),
  useEndEmergencySession: () => ({
    mutateAsync: mockEndMutate,
    isPending: false,
  }),
}));

vi.mock('../store/AuthProvider', () => ({
  useOptionalAuth: () => ({
    status: 'authenticated',
    user: {
      id: 'u-1',
      name: 'Safe Traveler',
      email: 'traveler@example.com',
      avatarUrl: '',
      hasPassword: true,
      hasEmergencyContacts: true,
      createdAt: '',
      updatedAt: '',
    },
  }),
}));

vi.mock('../services/authService', () => ({
  authService: {
    getEmergencyContacts: vi.fn().mockResolvedValue([
      {
        _id: 'contact-1',
        name: 'Jane Doe',
        phone: '+91 98765 43210',
        relationship: 'Partner',
      },
    ]),
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EmergencyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prominent I’M IN TROUBLE button and authoritative emergency numbers', () => {
    renderWithProviders(<EmergencyPage />);

    expect(screen.getByRole('button', { name: /i'm in trouble/i })).toBeInTheDocument();
    expect(screen.getByText('112')).toBeInTheDocument();
    expect(screen.getByText(/Ministry of Home Affairs ERSS/i)).toBeInTheDocument();
  });

  it('activates emergency mode when I’M IN TROUBLE is clicked', async () => {
    renderWithProviders(<EmergencyPage />);
    const user = userEvent.setup();

    const troubleBtn = screen.getByRole('button', { name: /i'm in trouble/i });
    await user.click(troubleBtn);

    expect(screen.getByText(/EMERGENCY MODE ACTIVE/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /i am safe now/i })).toBeInTheDocument();
    expect(mockStartMutate).toHaveBeenCalled();
  });

  it('switches category when selecting Medical Emergency and updates guidance', async () => {
    renderWithProviders(<EmergencyPage />);
    const user = userEvent.setup();

    const medicalCard = screen.getByRole('radio', { name: /medical emergency/i });
    await user.click(medicalCard);

    expect(
      screen.getByText(/Call national medical emergency or local ambulance immediately/i),
    ).toBeInTheDocument();
  });

  it('loads trusted emergency contacts when logged in', async () => {
    renderWithProviders(<EmergencyPage />);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('+91 98765 43210')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /call jane doe/i })).toHaveAttribute(
      'href',
      'tel:+919876543210',
    );
  });

  it('resolves emergency session when I AM SAFE NOW is clicked', async () => {
    renderWithProviders(<EmergencyPage />);
    const user = userEvent.setup();

    // Trigger emergency mode
    await user.click(screen.getByRole('button', { name: /i'm in trouble/i }));
    expect(screen.getByText(/EMERGENCY MODE ACTIVE/i)).toBeInTheDocument();

    // End emergency mode
    const safeBtn = screen.getByRole('button', { name: /i am safe now/i });
    await user.click(safeBtn);

    expect(mockEndMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
      }),
    );
    expect(screen.queryByText(/EMERGENCY MODE ACTIVE/i)).not.toBeInTheDocument();
  });
});
