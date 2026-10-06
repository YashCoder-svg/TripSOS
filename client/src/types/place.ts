export const placeCategories = [
  'all',
  'food',
  'hotels',
  'hospitals',
  'pharmacies',
  'police',
  'atms',
  'fuel',
  'groceries',
  'cafes',
  'transport',
  'repair',
] as const;

export type PlaceCategory = (typeof placeCategories)[number];

export interface GeocodingResult {
  provider: string;
  providerId: string;
  name: string;
  country?: string;
  region?: string;
  city?: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  boundingBox?: [number, number, number, number];
}

export interface PlaceSummary {
  provider: string;
  providerId: string;
  name: string;
  category?: PlaceCategory;
  categories?: string[];
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  distanceMeters?: number;
  phone?: string;
  website?: string;
  openingHours?: string[];
  isOpen?: boolean;
  rating?: number;
  reviewCount?: number;
  wheelchairAccessible?: boolean;
  sourceUrl?: string;
}

export interface PlaceSearchResult {
  results: PlaceSummary[];
  center: {
    latitude: number;
    longitude: number;
  };
  source: string;
}

export interface PlaceDetails extends PlaceSummary {
  description?: string;
}

export interface PlaceSearchParams {
  query?: string;
  category?: PlaceCategory;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  limit?: number;
}
