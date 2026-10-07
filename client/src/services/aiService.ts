import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import type { AiChatResponse } from '../types/ai';
import { tripKeys } from './tripService';

export interface SendChatMessagePayload {
  message: string;
  tripId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ExecuteAiActionPayload {
  tripId: string;
  actionType: 'add_itinerary_item';
  data: Record<string, unknown>;
}

export const aiService = {
  chat: (payload: SendChatMessagePayload) =>
    apiRequest<AiChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  executeAction: (payload: ExecuteAiActionPayload) =>
    apiRequest<{ executed: boolean; item?: unknown }>('/ai/action/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export function useAiChat() {
  return useMutation({
    mutationFn: (payload: SendChatMessagePayload) => aiService.chat(payload),
  });
}

export function useExecuteAiAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExecuteAiActionPayload) => aiService.executeAction(payload),
    onSuccess: async (_, variables) => {
      // Invalidate itinerary query to refresh live itinerary tab
      await queryClient.invalidateQueries({
        queryKey: [...tripKeys.detail(variables.tripId), 'itinerary'],
      });
    },
  });
}
