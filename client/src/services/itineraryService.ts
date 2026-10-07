import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import type {
  CreateItineraryItemPayload,
  ItineraryItem,
  UpdateItineraryItemPayload,
} from '../types/itinerary';

export async function fetchItinerary(tripId: string): Promise<ItineraryItem[]> {
  const data = await apiRequest<{ items: ItineraryItem[] }>(`/trips/${tripId}/itinerary`);
  return data.items;
}

export async function createItineraryItem(
  tripId: string,
  payload: CreateItineraryItemPayload,
): Promise<ItineraryItem> {
  const data = await apiRequest<{ item: ItineraryItem }>(`/trips/${tripId}/itinerary`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.item;
}

export async function updateItineraryItem(
  tripId: string,
  itemId: string,
  payload: UpdateItineraryItemPayload,
): Promise<ItineraryItem> {
  const data = await apiRequest<{ item: ItineraryItem }>(`/trips/${tripId}/itinerary/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data.item;
}

export async function deleteItineraryItem(tripId: string, itemId: string): Promise<void> {
  await apiRequest<{ deleted: boolean }>(`/trips/${tripId}/itinerary/${itemId}`, {
    method: 'DELETE',
  });
}

export async function reorderItinerary(
  tripId: string,
  items: { id: string; order: number }[],
): Promise<ItineraryItem[]> {
  const data = await apiRequest<{ items: ItineraryItem[] }>(`/trips/${tripId}/itinerary/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
  return data.items;
}

export function useItinerary(tripId: string) {
  return useQuery({
    queryKey: ['itinerary', tripId],
    queryFn: () => fetchItinerary(tripId),
    enabled: Boolean(tripId),
  });
}

export function useCreateItineraryItem(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateItineraryItemPayload) => createItineraryItem(tripId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
    },
  });
}

export function useUpdateItineraryItem(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdateItineraryItemPayload }) =>
      updateItineraryItem(tripId, itemId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
    },
  });
}

export function useDeleteItineraryItem(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteItineraryItem(tripId, itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
    },
  });
}

export function useReorderItinerary(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; order: number }[]) => reorderItinerary(tripId, items),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
    },
  });
}
