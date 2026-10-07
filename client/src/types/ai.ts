export interface AiToolCall {
  tool: string;
  sourceAttribution?: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
}

export interface AiSuggestedAction {
  id: string;
  type: 'add_itinerary_item';
  title: string;
  description: string;
  data: {
    tripId: string;
    title: string;
    description?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    placeProviderId?: string;
    category: string;
  };
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: AiToolCall[];
  suggestedActions?: AiSuggestedAction[];
}

export interface AiChatResponse {
  reply: string;
  toolCalls: AiToolCall[];
  suggestedActions: AiSuggestedAction[];
}
