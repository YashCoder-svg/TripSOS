import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import type {
  CountryEmergencyNumbers,
  EmergencyCategory,
  EmergencySession,
  NearbyEmergencyServicesResult,
} from '../types/emergency';

export async function startEmergencySession(
  type: EmergencyCategory,
  location?: { latitude: number; longitude: number; accuracyMeters?: number },
): Promise<EmergencySession> {
  const data = await apiRequest<{ session: EmergencySession }>('/emergency/sessions', {
    method: 'POST',
    body: JSON.stringify({
      type,
      latitude: location?.latitude,
      longitude: location?.longitude,
      accuracyMeters: location?.accuracyMeters,
    }),
  });
  return data.session;
}

export async function updateEmergencySessionStatus(
  sessionId: string,
  status: 'resolved' | 'cancelled',
): Promise<EmergencySession> {
  const data = await apiRequest<{ session: EmergencySession }>(
    `/emergency/sessions/${sessionId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
  return data.session;
}

export async function fetchNearbyEmergencyServices(
  latitude: number,
  longitude: number,
  category = 'all',
  radius = 5000,
): Promise<NearbyEmergencyServicesResult> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    category,
    radius: String(radius),
  });
  return apiRequest<NearbyEmergencyServicesResult>(`/emergency/services?${params.toString()}`);
}

export async function fetchEmergencyNumbers(
  countryCode?: string,
): Promise<CountryEmergencyNumbers> {
  const params = new URLSearchParams();
  if (countryCode) params.set('countryCode', countryCode);
  const data = await apiRequest<{ numbers: CountryEmergencyNumbers }>(
    `/emergency/numbers?${params.toString()}`,
  );
  return data.numbers;
}

export function useEmergencyNumbers(countryCode?: string) {
  return useQuery({
    queryKey: ['emergency-numbers', countryCode],
    queryFn: () => fetchEmergencyNumbers(countryCode),
    staleTime: 60 * 60 * 1000, // 1 hour cache
  });
}

export function useNearbyEmergencyServices(
  latitude?: number,
  longitude?: number,
  category = 'all',
) {
  const enabled = typeof latitude === 'number' && typeof longitude === 'number';
  return useQuery({
    queryKey: ['emergency-services', latitude, longitude, category],
    queryFn: () => fetchNearbyEmergencyServices(latitude!, longitude!, category),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStartEmergencySession() {
  return useMutation({
    mutationFn: ({
      type,
      location,
    }: {
      type: EmergencyCategory;
      location?: { latitude: number; longitude: number; accuracyMeters?: number };
    }) => startEmergencySession(type, location),
  });
}

export function useEndEmergencySession() {
  return useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: 'resolved' | 'cancelled' }) =>
      updateEmergencySessionStatus(sessionId, status),
  });
}

export async function createLocationShare(
  payload: import('../types/emergency').LocationShareRequest,
): Promise<import('../types/emergency').LocationShareResponse> {
  return apiRequest<import('../types/emergency').LocationShareResponse>('/emergency/share', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function revokeLocationShare(
  token: string,
): Promise<{ revoked: boolean; revokedAt: string }> {
  return apiRequest<{ revoked: boolean; revokedAt: string }>(`/emergency/share/${token}/revoke`, {
    method: 'POST',
  });
}

export async function fetchSharedLocation(
  token: string,
): Promise<import('../types/emergency').SharedLocationPublicData> {
  return apiRequest<import('../types/emergency').SharedLocationPublicData>(
    `/emergency/share/${token}`,
  );
}

export function useSharedLocation(token: string) {
  return useQuery({
    queryKey: ['emergency-share', token],
    queryFn: () => fetchSharedLocation(token),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useCreateLocationShare() {
  return useMutation({
    mutationFn: createLocationShare,
  });
}

export function useRevokeLocationShare() {
  return useMutation({
    mutationFn: (token: string) => revokeLocationShare(token),
  });
}
