import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import type { InviteMemberRequest, InviteMemberResponse, TripMember } from '../types/group';

export async function fetchTripMembers(tripId: string): Promise<{
  members: TripMember[];
  tripOwnerId: string;
}> {
  return apiRequest<{ members: TripMember[]; tripOwnerId: string }>(`/trips/${tripId}/members`);
}

export async function inviteTripMember(
  tripId: string,
  data: InviteMemberRequest,
): Promise<InviteMemberResponse> {
  return apiRequest<InviteMemberResponse>(`/trips/${tripId}/members/invite`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function joinTrip(
  tripId: string,
  inviteToken: string,
): Promise<{ joined: boolean; member: TripMember }> {
  return apiRequest<{ joined: boolean; member: TripMember }>(`/trips/${tripId}/members/join`, {
    method: 'POST',
    body: JSON.stringify({ inviteToken }),
  });
}

export async function removeTripMember(
  tripId: string,
  memberId: string,
): Promise<{ removed: boolean }> {
  return apiRequest<{ removed: boolean }>(`/trips/${tripId}/members/${memberId}`, {
    method: 'DELETE',
  });
}

export async function leaveTrip(tripId: string): Promise<{ left: boolean }> {
  return apiRequest<{ left: boolean }>(`/trips/${tripId}/members/leave`, {
    method: 'POST',
  });
}

export function useTripMembers(tripId: string) {
  return useQuery({
    queryKey: ['trip-members', tripId],
    queryFn: () => fetchTripMembers(tripId),
    enabled: Boolean(tripId),
  });
}

export function useInviteTripMember(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteMemberRequest) => inviteTripMember(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
    },
  });
}

export function useJoinTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteToken: string) => joinTrip(tripId, inviteToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useRemoveTripMember(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeTripMember(tripId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
    },
  });
}

export function useLeaveTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}
