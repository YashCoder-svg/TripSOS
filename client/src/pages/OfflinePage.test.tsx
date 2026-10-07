import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflinePage } from './OfflinePage';
import { saveOfflineEmergencyPack, buildOfflinePack } from '../services/offlinePackService';

describe('OfflinePage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <OfflinePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it('renders immediate one-touch dispatch dialers (112, 108, 100, 101)', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: /offline emergency & travel pack/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('112').length).toBeGreaterThan(0);
    expect(screen.getAllByText('108 / 911').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100 / 911').length).toBeGreaterThan(0);
    expect(screen.getAllByText('101').length).toBeGreaterThan(0);
  });

  it('displays cached emergency contacts and active trips when pack is saved', () => {
    const pack = buildOfflinePack({
      user: { name: 'Vaishnavi' },
      emergencyContacts: [
        {
          _id: 'c-1',
          name: 'Aman Verma',
          relationship: 'family',
          phone: '+919999988888',
          isPrimary: true,
          priority: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      trips: [
        {
          _id: 't-1',
          name: 'Goa Coastal Retreat',
          destinationName: 'Goa',
          destinationCountry: 'India',
          startDate: '2026-11-01',
          endDate: '2026-11-06',
          currency: 'INR',
          travelerCount: 2,
          budget: 30000,
          travelStyle: 'balanced',
          interests: ['food'],
          status: 'upcoming',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    saveOfflineEmergencyPack(pack);

    renderComponent();

    expect(screen.getByText('Aman Verma')).toBeInTheDocument();
    expect(screen.getByText('family')).toBeInTheDocument();
    expect(screen.getByText('+919999988888')).toBeInTheDocument();
    expect(screen.getByText('Goa Coastal Retreat')).toBeInTheDocument();
    expect(screen.getByText(/offline pack ready/i)).toBeInTheDocument();
  });

  it('allows expanding and reviewing medical and first aid protocols', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Default expanded is CPR
    expect(screen.getByText(/Adult CPR/i)).toBeInTheDocument();

    // Click Severe Bleeding
    const bleedingHeader = screen.getByRole('button', { name: /Severe Bleeding/i });
    await user.click(bleedingHeader);

    expect(screen.getByText(/Apply direct firm pressure immediately/i)).toBeInTheDocument();
  });

  it('updates the offline pack when download/update button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const updateBtn = screen.getByRole('button', {
      name: /download emergency pack|update offline pack/i,
    });
    await user.click(updateBtn);

    expect(
      await screen.findByText(/Emergency Pack successfully updated for offline readiness!/i),
    ).toBeInTheDocument();
  });
});
