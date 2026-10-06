import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlaceCard } from './PlaceCard';
import type { PlaceSummary } from '../../types/place';

const samplePlace: PlaceSummary = {
  provider: 'osm',
  providerId: 'node-101',
  name: 'Lady Willingdon Hospital',
  category: 'hospitals',
  latitude: 32.2396,
  longitude: 77.1887,
  address: 'Mall Road, Manali',
  distanceMeters: 450,
  isOpen: true,
  rating: 4.6,
  reviewCount: 38,
};

const minimalPlace: PlaceSummary = {
  provider: 'osm',
  providerId: 'node-102',
  name: 'Central Pharmacy',
  category: 'pharmacies',
  latitude: 32.241,
  longitude: 77.189,
};

describe('PlaceCard', () => {
  it('renders place name, category badge, address and distance', () => {
    render(<PlaceCard place={samplePlace} />);

    expect(screen.getByText('Lady Willingdon Hospital')).toBeInTheDocument();
    expect(screen.getByText('Hospitals')).toBeInTheDocument();
    expect(screen.getByText('Mall Road, Manali')).toBeInTheDocument();
    expect(screen.getByText('450 m away')).toBeInTheDocument();
  });

  it('renders verified rating and open status when present', () => {
    render(<PlaceCard place={samplePlace} />);

    expect(screen.getByText('Open now')).toBeInTheDocument();
    expect(screen.getByText('4.6')).toBeInTheDocument();
    expect(screen.getByText('(38)')).toBeInTheDocument();
  });

  it('never invents fake rating or open status when provider data lacks them', () => {
    render(<PlaceCard place={minimalPlace} />);

    expect(screen.getByText('Central Pharmacy')).toBeInTheDocument();
    expect(screen.queryByText(/Open now/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Closed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d\.\d/)).not.toBeInTheDocument();
  });

  it('triggers onSelect when card is clicked or activated with Enter', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<PlaceCard place={samplePlace} onSelect={onSelect} />);

    const card = screen.getByRole('button', { name: 'Lady Willingdon Hospital, Hospitals' });
    await user.click(card);
    expect(onSelect).toHaveBeenCalledTimes(1);

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('generates a safe external directions link without triggering card onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<PlaceCard place={samplePlace} onSelect={onSelect} />);

    const directionsLink = screen.getByRole('link', { name: /Get directions to/i });
    expect(directionsLink).toHaveAttribute(
      'href',
      expect.stringContaining('https://www.google.com/maps/dir/'),
    );
    expect(directionsLink).toHaveAttribute('href', expect.stringContaining('32.239600'));
    expect(directionsLink).toHaveAttribute('target', '_blank');
    expect(directionsLink).toHaveAttribute('rel', 'noopener noreferrer');

    await user.click(directionsLink);
    // Card onSelect shouldn't be called because stopPropagation is handled
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('triggers onViewDetails when Details button is clicked', async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();

    render(<PlaceCard place={samplePlace} onViewDetails={onViewDetails} />);

    const detailsBtn = screen.getByRole('button', { name: /View details for/i });
    await user.click(detailsBtn);

    expect(onViewDetails).toHaveBeenCalledTimes(1);
  });
});
