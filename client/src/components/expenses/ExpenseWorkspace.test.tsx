import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpenseWorkspace } from './ExpenseWorkspace';
import type { Trip } from '../../types/trip';

const mockCreateMutate = vi.fn().mockResolvedValue({
  expense: {
    _id: 'exp-3',
    amount: 1200,
    currency: 'INR',
    description: 'Campfire snacks',
    category: 'food',
    date: '2026-11-04',
  },
});

const mockDeleteMutate = vi.fn().mockResolvedValue({ deleted: true });

vi.mock('../../services/expenseService', () => ({
  useTripExpenses: () => ({
    data: {
      expenses: [
        {
          _id: 'exp-1',
          description: 'Cottage Stay',
          amount: 3000,
          currency: 'INR',
          convertedAmount: 3000,
          category: 'accommodation',
          date: '2026-11-02',
          paidBy: { _id: 'u-1', name: 'Rahul Sharma' },
          splitMethod: 'equal',
          participants: [],
        },
        {
          _id: 'exp-2',
          description: 'Rafting Gear',
          amount: 20,
          currency: 'USD',
          convertedAmount: 1670,
          exchangeRateSource: 'European Central Bank via Frankfurter',
          category: 'activities',
          date: '2026-11-03',
          paidBy: { _id: 'u-2', name: 'Vaishnavi Rao' },
          splitMethod: 'equal',
          participants: [],
        },
      ],
      summary: {
        totalExpense: 4670,
        currency: 'INR',
        memberBalances: [
          {
            userId: 'u-1',
            name: 'Rahul Sharma',
            paidTotal: 3000,
            owedTotal: 2335,
            netBalance: 665,
          },
          {
            userId: 'u-2',
            name: 'Vaishnavi Rao',
            paidTotal: 1670,
            owedTotal: 2335,
            netBalance: -665,
          },
        ],
        settlements: [
          {
            from: { userId: 'u-2', name: 'Vaishnavi Rao' },
            to: { userId: 'u-1', name: 'Rahul Sharma' },
            amount: 665,
            currency: 'INR',
          },
        ],
      },
    },
    isLoading: false,
    error: null,
  }),
  useCreateExpense: () => ({
    mutateAsync: mockCreateMutate,
    isPending: false,
  }),
  useDeleteExpense: () => ({
    mutateAsync: mockDeleteMutate,
    isPending: false,
  }),
}));

vi.mock('../../services/groupService', () => ({
  useTripMembers: () => ({
    data: {
      members: [
        { _id: 'm-1', user: { _id: 'u-1', name: 'Rahul Sharma' }, status: 'active' },
        { _id: 'm-2', user: { _id: 'u-2', name: 'Vaishnavi Rao' }, status: 'active' },
      ],
    },
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
  travelerCount: 2,
  budget: 45000,
  currency: 'INR',
  travelStyle: 'adventure',
  interests: ['adventure'],
  status: 'upcoming',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

function renderExpenses() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ExpenseWorkspace trip={mockTrip} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ExpenseWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders total spending, user balance, and suggested settlements', () => {
    renderExpenses();

    expect(screen.getByText(/TOTAL TRIP SPENDING/i)).toBeInTheDocument();
    expect(screen.getByText('INR 4,670')).toBeInTheDocument();
    expect(screen.getByText(/You are owed INR 665/i)).toBeInTheDocument();

    expect(screen.getByText(/Suggested Settlement Transfers/i)).toBeInTheDocument();
    expect(screen.getAllByText('Vaishnavi Rao').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/665/).length).toBeGreaterThanOrEqual(1);
  });

  it('displays recorded expenses with foreign currency exchange rate source note', () => {
    renderExpenses();

    expect(screen.getByText('Cottage Stay')).toBeInTheDocument();
    expect(screen.getByText('Rafting Gear')).toBeInTheDocument();
    expect(
      screen.getByText(/Converted from USD 20 using European Central Bank via Frankfurter/i),
    ).toBeInTheDocument();
  });

  it('opens record expense modal, submits new expense', async () => {
    renderExpenses();
    const user = userEvent.setup();

    const addBtn = screen.getByRole('button', { name: /add expense/i });
    await user.click(addBtn);

    expect(screen.getByRole('heading', { name: /record an expense/i })).toBeInTheDocument();

    const descInput = screen.getByLabelText(/description/i);
    await user.type(descInput, 'Campfire snacks');

    const amountInput = screen.getByLabelText(/amount/i);
    await user.type(amountInput, '1200');

    const submitBtn = screen.getByRole('button', { name: /save expense/i });
    await user.click(submitBtn);

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Campfire snacks',
        amount: 1200,
        currency: 'INR',
      }),
    );
  });
});
