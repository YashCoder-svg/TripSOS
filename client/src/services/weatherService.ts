import { useQuery } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import type { WeatherData } from '../types/weather';

export async function fetchWeather(
  latitude: number,
  longitude: number,
  startDate?: string,
  endDate?: string,
): Promise<WeatherData> {
  const params = new URLSearchParams();
  params.set('lat', latitude.toString());
  params.set('lon', longitude.toString());
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  return apiRequest<WeatherData>(`/weather?${params.toString()}`);
}

export function useWeather(
  latitude?: number,
  longitude?: number,
  startDate?: string,
  endDate?: string,
) {
  const enabled = typeof latitude === 'number' && typeof longitude === 'number';
  return useQuery({
    queryKey: ['weather', latitude, longitude, startDate, endDate],
    queryFn: () => fetchWeather(latitude!, longitude!, startDate, endDate),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes cache in client
    retry: 1,
  });
}
