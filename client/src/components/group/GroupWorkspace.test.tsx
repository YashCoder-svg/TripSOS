import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupWorkspace } from './GroupWorkspace';
import type { Trip } from '../../types/trip';

const mockInviteMutate = vi.fn().mockResolvedValue({
  member: {
    _id: 'm-2',
    invitedEmail: 'friend@example.com',
    role: 'member',
    status: 'pending',
  },
  inviteToken: 'mock-invite-token-xyz',
  inviteLink: '/trips/trip-1/group?invite=mock-invite-token-xyz',
});

const mockJoinMutate = vi.fn().mockResolvedValue({
  joined: true,
  member: {
    _id: 'm-3',
    status: 'active',
  },
});

const mockRemoveMutate = vi.fn().mockResolvedValue({ removed: true });

vi.mock('../../services/groupService', () => ({
  useTripMembers: () => ({
    data: {
      tripOwnerId: 'u-1',
      members: [
        {
          _id: 'm-1',
          user: { _id: 'u-1', name: 'Rahul Sharma', email: 'rahul@example.com' },
          role: 'owner',
          status: 'active',
          joinedAt: '2026-10-01T00:00:00.000Z',
        },
        {
          _id: 'm-2',
          invitedEmail: 'pending@example.com',
          role: 'member',
          status: 'pending',
          inviteToken: 'mock-pending-token',
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
  useInviteTripMember: () => ({
    mutateAsync: mockInviteMutate,
    isPending: false,
  }),
  useJoinTrip: () => ({
    mutateAsync: mockJoinMutate,
    isPending: false,
  }),
  useRemoveTripMember: () => ({
    mutateAsync: mockRemoveMutate,
    isPending: false,
  }),
  useLeaveTrip: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../../store/AuthProvider', () => ({
  useOptionalAuth: () => ({
    status: 'authenticated',
    user: { id: 'u-1', name: 'Rahul Sharma' },
  }),
}));

const mockTrip: Trip = {
  _id: 'trip-1',
  name: 'Himachal Adventure',
  destinationName: 'Manali',
  destinationCountry: 'India',
  destinationCoordinates: null,
  startDate: '2026-11-01',
  endDate: '2026-11-07',
  travelerCount: 3,
  budget: 45000,
  currency: 'INR',
  travelStyle: 'adventure',
  interests: ['adventure'],
  status: 'upcoming',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

function renderGroup(initialEntries = ['/trips/trip-1']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <GroupWorkspace trip={mockTrip} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('GroupWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active travelers with owner badge and pending invitations', () => {
    renderGroup();

    expect(screen.getByText(/Trip Travelers \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
    expect(screen.getByText(/Trip Owner/i)).toBeInTheDocument();
    expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Pending Acceptance/i)).toBeInTheDocument();
  });

  it('opens invite modal and generates an invitation token link', async () => {
    renderGroup();
    const user = userEvent.setup();

    const inviteBtn = screen.getByRole('button', { name: /invite traveler/i });
    await user.click(inviteBtn);

    expect(screen.getByRole('heading', { name: /invite traveler to trip/i })).toBeInTheDocument();
    const emailInput = screen.getByLabelText(/traveler's email address/i);
    await user.type(emailInput, 'friend@example.com');

    const submitBtn = screen.getByRole('button', { name: /generate invitation/i });
    await user.click(submitBtn);

    expect(mockInviteMutate).toHaveBeenCalledWith({
      email: 'friend@example.com',
      role: 'member',
    });

    expect(await screen.findByText(/Invitation Link Ready!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^copy$/i })).toBeInTheDocument();
  });

  it('displays invitation banner and accepts join when invite query param present', async () => {
    renderGroup(['/trips/trip-1?invite=test-join-token']);
    const user = userEvent.setup();

    expect(
      screen.getByText(/You've been invited to join "Himachal Adventure"!/i),
    ).toBeInTheDocument();

    const acceptBtn = screen.getByRole('button', { name: /accept & join trip/i });
    await user.click(acceptBtn);

    expect(mockJoinMutate).toHaveBeenCalledWith('test-join-token');
  });
});
