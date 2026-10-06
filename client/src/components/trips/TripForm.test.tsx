import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TripForm } from './TripForm';

describe('TripForm', () => {
  it('validates date order and does not submit invalid trip details', async () => {
    const onSubmit = vi.fn();
    render(<TripForm submitLabel="Create trip" onSubmit={onSubmit} />);
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
    render(<TripForm submitLabel="Create trip" onSubmit={onSubmit} />);
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
});
