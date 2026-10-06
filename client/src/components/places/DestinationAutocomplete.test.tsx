import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DestinationAutocomplete } from './DestinationAutocomplete';
import * as placeService from '../../services/placeService';
import type { GeocodingResult } from '../../types/place';

const mockResults: GeocodingResult[] = [
  {
    provider: 'osm',
    providerId: 'node-1',
    name: 'Manali',
    country: 'India',
    region: 'Himachal Pradesh',
    latitude: 32.2396,
    longitude: 77.1887,
  },
  {
    provider: 'osm',
    providerId: 'node-2',
    name: 'Manali, Utah',
    country: 'United States',
    region: 'Utah',
    latitude: 40.1234,
    longitude: -111.5678,
  },
];

describe('DestinationAutocomplete', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    vi.restoreAllMocks();
  });

  const renderComponent = (props: Partial<Parameters<typeof DestinationAutocomplete>[0]> = {}) => {
    const defaultProps = {
      value: '',
      onChange: vi.fn(),
      onSelect: vi.fn(),
      ...props,
    };

    return {
      ...render(
        <QueryClientProvider client={queryClient}>
          <DestinationAutocomplete {...defaultProps} />
        </QueryClientProvider>,
      ),
      props: defaultProps,
    };
  };

  it('renders input with placeholder and accessible attributes', () => {
    renderComponent({ placeholder: 'Search where to go' });
    const input = screen.getByPlaceholderText('Search where to go');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('role', 'combobox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('debounces input and queries geocoding results', async () => {
    const geocodeSpy = vi
      .spyOn(placeService.placeService, 'geocode')
      .mockResolvedValue(mockResults);
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <DestinationAutocomplete value="Man" onChange={onChange} onSelect={vi.fn()} />
      </QueryClientProvider>,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    await waitFor(() => {
      expect(geocodeSpy).toHaveBeenCalledWith('Man');
    });

    await waitFor(() => {
      expect(screen.getByText('Manali')).toBeInTheDocument();
      expect(screen.getByText('Himachal Pradesh, India')).toBeInTheDocument();
    });
  });

  it('selects result on click and passes geocoding coordinates', async () => {
    vi.spyOn(placeService.placeService, 'geocode').mockResolvedValue(mockResults);
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <DestinationAutocomplete value="Manali" onChange={vi.fn()} onSelect={onSelect} />
      </QueryClientProvider>,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    await user.click(options[0]!);

    expect(onSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it('navigates with keyboard and selects with Enter', async () => {
    vi.spyOn(placeService.placeService, 'geocode').mockResolvedValue(mockResults);
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <DestinationAutocomplete value="Manali" onChange={vi.fn()} onSelect={onSelect} />
      </QueryClientProvider>,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    await screen.findByRole('listbox');

    // Arrow down to first option
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it('closes dropdown on Escape', async () => {
    vi.spyOn(placeService.placeService, 'geocode').mockResolvedValue(mockResults);
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <DestinationAutocomplete value="Manali" onChange={vi.fn()} onSelect={vi.fn()} />
      </QueryClientProvider>,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    await screen.findByRole('listbox');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
