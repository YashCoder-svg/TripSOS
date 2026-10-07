import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { WeatherWidget } from './WeatherWidget';
import type { WeatherData } from '../../types/weather';

const mockWeatherData: WeatherData = {
  provider: 'Open-Meteo',
  location: { latitude: 32.2396, longitude: 77.1887 },
  current: {
    temperature: 18.5,
    apparentTemperature: 17.0,
    humidity: 60,
    windSpeed: 12,
    precipitation: 0,
    condition: 'Partly cloudy',
    weatherCode: 2,
    icon: 'partly_cloudy',
  },
  daily: [
    {
      date: '2026-10-07',
      temperatureMax: 22,
      temperatureMin: 12,
      apparentTemperatureMax: 21,
      precipitationProbability: 10,
      windSpeedMax: 14,
      condition: 'Clear sky',
      weatherCode: 0,
      icon: 'clear',
    },
  ],
  tripForecast: [
    {
      date: '2026-10-07',
      temperatureMax: 22,
      temperatureMin: 12,
      condition: 'Clear sky',
      weatherCode: 0,
      icon: 'clear',
    },
  ],
  forecastAvailableForDates: true,
};

vi.mock('../../services/weatherService', () => ({
  useWeather: (lat?: number, _lon?: number, startDate?: string) => {
    if (lat === 999) {
      return { data: undefined, isLoading: false, isError: true };
    }
    if (startDate === '2099-10-15') {
      return {
        data: {
          ...mockWeatherData,
          forecastAvailableForDates: false,
          tripForecast: [],
        },
        isLoading: false,
        isError: false,
      };
    }
    return { data: mockWeatherData, isLoading: false, isError: false };
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('WeatherWidget', () => {
  it('shows coordinates unavailable notice when coordinates are missing', () => {
    renderWithClient(
      <WeatherWidget destinationName="Unknown Place" startDate="2026-10-10" endDate="2026-10-15" />,
    );
    expect(screen.getByText(/coordinates unavailable for this destination/i)).toBeInTheDocument();
  });

  it('renders current temperature and condition with verified provider', () => {
    renderWithClient(
      <WeatherWidget latitude={32.2396} longitude={77.1887} destinationName="Manali, India" />,
    );
    expect(screen.getByText('Weather in Manali, India')).toBeInTheDocument();
    expect(screen.getByText('19°C')).toBeInTheDocument(); // Math.round(18.5)
    expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
    expect(screen.getByText(/Verified by Open-Meteo/i)).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('displays distant trip notice without fabricating forecasts', () => {
    renderWithClient(
      <WeatherWidget
        latitude={32.2396}
        longitude={77.1887}
        destinationName="Manali, India"
        startDate="2099-10-15"
        endDate="2099-10-20"
      />,
    );
    expect(
      screen.getByText('Forecast will become available closer to your trip.'),
    ).toBeInTheDocument();
  });

  it('handles error state gracefully', () => {
    renderWithClient(<WeatherWidget latitude={999} longitude={999} destinationName="Error Town" />);
    expect(screen.getByText(/weather information is currently unavailable/i)).toBeInTheDocument();
  });
});
