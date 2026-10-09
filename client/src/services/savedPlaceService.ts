import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';

export interface SavedPlace {
  _id: string;
  name: string;
  category: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  providerId?: string | null;
  phone?: string | null;
  website?: string | null;
  userNotes?: string;
  tripId?: string | null;
  createdAt: string;
}

export interface SavePlaceInput {
  name: string;
  category: string;
  address?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  providerId?: string | null;
  phone?: string | null;
  website?: string | null;
  userNotes?: string;
  tripId?: string | null;
}

export const savedPlaceKeys = {
  all: ['saved-places'] as const,
  byTrip: (tripId?: string) => ['saved-places', tripId ?? 'all'] as const,
};

export const savedPlaceService = {
  list: (tripId?: string) => {
    const url = tripId
      ? `/saved-places?tripId=${encodeURIComponent(tripId)}`
      : '/saved-places';
    return apiRequest<{ places: SavedPlace[] }>(url).then((res) => res.places);
  },
  save: (input: SavePlaceInput) =>
    apiRequest<{ place: SavedPlace; alreadySaved?: boolean }>('/saved-places', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/saved-places/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

export function useSavedPlaces(tripId?: string) {
  return useQuery({
    queryKey: savedPlaceKeys.byTrip(tripId),
    queryFn: () => savedPlaceService.list(tripId),
    staleTime: 30_000,
  });
}

export function useSavePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savedPlaceService.save,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: savedPlaceKeys.all });
    },
  });
}

export function useDeleteSavedPlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savedPlaceService.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: savedPlaceKeys.all });
    },
  });
}
