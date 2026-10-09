import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import type { Trip, TripInput, TripStatus } from '../types/trip';

export const tripKeys = {
  all: ['trips'] as const,
  detail: (id: string) => ['trips', id] as const,
};

export const tripService = {
  list: () => apiRequest<{ trips: Trip[] }>('/trips').then((data) => data.trips),
  get: (id: string) =>
    apiRequest<{ trip: Trip }>(`/trips/${encodeURIComponent(id)}`).then((data) => data.trip),
  create: (input: TripInput) =>
    apiRequest<{ trip: Trip }>('/trips', { method: 'POST', body: JSON.stringify(input) }).then(
      (data) => data.trip,
    ),
  update: (id: string, input: Partial<TripInput>) =>
    apiRequest<{ trip: Trip }>(`/trips/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }).then((data) => data.trip),
  updateStatus: (id: string, status: TripStatus) =>
    apiRequest<{ trip: Trip }>(`/trips/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).then((data) => data.trip),
  remove: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/trips/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  joinByCode: (code: string) =>
    apiRequest<{ trip: Trip; alreadyMember: boolean; role: string }>('/trips/join-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};

export function useTrips() {
  return useQuery({ queryKey: tripKeys.all, queryFn: tripService.list, staleTime: 30_000 });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => tripService.get(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripService.create,
    onSuccess: async (trip) => {
      queryClient.setQueryData(tripKeys.detail(trip._id), trip);
      await queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<TripInput>) => tripService.update(id, input),
    onSuccess: async (trip) => {
      queryClient.setQueryData(tripKeys.detail(id), trip);
      await queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useUpdateTripStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: TripStatus) => tripService.updateStatus(id, status),
    onSuccess: async (trip) => {
      queryClient.setQueryData(tripKeys.detail(id), trip);
      await queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripService.remove,
    onSuccess: async (_result, id) => {
      queryClient.removeQueries({ queryKey: tripKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useJoinTripByCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => tripService.joinByCode(code),
    onSuccess: async (data) => {
      queryClient.setQueryData(tripKeys.detail(data.trip._id), data.trip);
      await queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}
