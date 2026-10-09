import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';

export interface NotificationItem {
  _id: string;
  recipient: string;
  type: 'trip_invite' | 'emergency_alert' | 'announcement' | 'expense_added' | 'system';
  title: string;
  message: string;
  linkUrl?: string | null;
  read: boolean;
  createdAt: string;
}

export const notificationKeys = {
  all: ['notifications'] as const,
};

export const notificationService = {
  list: () =>
    apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) =>
    apiRequest<{ notification: NotificationItem }>(
      `/notifications/${encodeURIComponent(id)}/read`,
      { method: 'PATCH' },
    ),
  markAllRead: () =>
    apiRequest<{ markedAllRead: boolean }>('/notifications/read-all', {
      method: 'PATCH',
    }),
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: notificationService.list,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
