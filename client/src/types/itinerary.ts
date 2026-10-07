export const itineraryCategories = [
  'activity',
  'food',
  'sightseeing',
  'travel',
  'lodging',
  'other',
] as const;

export type ItineraryCategory = (typeof itineraryCategories)[number];

export interface ItineraryItem {
  _id: string;
  trip: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string | null; // e.g. "09:00"
  endTime?: string | null; // e.g. "11:30"
  location?: string | null;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  placeProviderId?: string | null;
  category: ItineraryCategory;
  notes?: string;
  status: 'planned' | 'completed';
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItineraryItemPayload {
  title: string;
  description?: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  placeProviderId?: string | null;
  category?: ItineraryCategory;
  notes?: string;
  status?: 'planned' | 'completed';
  order?: number;
}

export type UpdateItineraryItemPayload = Partial<CreateItineraryItemPayload>;
