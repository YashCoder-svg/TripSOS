import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TripForm } from './TripForm';

vi.mock('../../services/placeService', () => ({
  useGeocode: (query: string) => {
    if (query.toLowerCase().includes('manali')) {
      return {
        data: [
          {
            provider: 'mock',
            providerId: 'p-1',
            name: 'Manali',
            country: 'India',
            region: 'Himachal Pradesh',
            latitude: 32.2396,
            longitude: 77.1887,
          },
        ],
        isLoading: false,
        isError: false,
      };
    }
    return { data: [], isLoading: false, isError: false };
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TripForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates date order and does not submit invalid trip details', async () => {
    const onSubmit = vi.fn();
    renderWithClient(<TripForm submitLabel="Create trip" onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Trip name'), 'Mountain Escape');
    await user.type(screen.getByLabelText('Destination'), 'Manali, India');
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2099-10-16' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2099-10-12' } });
    await user.click(screen.getByRole('button', { name: /create trip/i }));
    expect(
      await screen.findByText('End date must be the same day or later than the start date.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits typed trip fields, supported currency, style, and selected interests', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithClient(<TripForm submitLabel="Create trip" onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Trip name'), 'Mountain Escape');
    await user.type(screen.getByLabelText('Destination'), 'Manali, India');
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2099-10-12' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2099-10-16' } });
    await user.clear(screen.getByLabelText('Number of travelers'));
    await user.type(screen.getByLabelText('Number of travelers'), '4');
    await user.clear(screen.getByLabelText('Total budget'));
    await user.type(screen.getByLabelText('Total budget'), '60000');
    await user.selectOptions(screen.getByLabelText('Travel style'), 'adventure');
    await user.click(screen.getByLabelText('Nature'));
    await user.click(screen.getByRole('button', { name: /create trip/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mountain Escape',
        destinationName: 'Manali, India',
        startDate: '2099-10-12',
        endDate: '2099-10-16',
        travelerCount: 4,
        budget: 60000,
        currency: 'INR',
        travelStyle: 'adventure',
        interests: ['nature'],
      }),
    );
  });

  it('captures coordinates and country when selecting destination from autocomplete suggestions', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithClient(<TripForm submitLabel="Create trip" onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Trip name'), 'Himalayan Retreat');
    const destInput = screen.getByLabelText('Destination');
    await user.type(destInput, 'Manali');

    const suggestion = await screen.findByRole('option', { name: /manali/i });
    await user.click(suggestion);

    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2099-10-12' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2099-10-16' } });
    await user.click(screen.getByRole('button', { name: /create trip/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Himalayan Retreat',
        destinationName: expect.stringContaining('Manali'),
        destinationCountry: 'India',
        destinationCoordinates: { latitude: 32.2396, longitude: 77.1887 },
      }),
    );
  });
});
