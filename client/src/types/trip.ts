export const travelStyles = [
  'budget',
  'balanced',
  'comfort',
  'adventure',
  'family',
  'backpacking',
] as const;
export type TravelStyle = (typeof travelStyles)[number];

export const tripInterests = [
  'nature',
  'food',
  'adventure',
  'history',
  'shopping',
  'photography',
  'nightlife',
  'family',
  'culture',
] as const;
export type TripInterest = (typeof tripInterests)[number];

export type TripStatus = 'planning' | 'upcoming' | 'active' | 'completed' | 'cancelled';
export type TripCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';

export type TripDestination = {
  name?: string;
  city?: string;
  region?: string;
  country?: string;
  formattedAddress?: string;
  providerId?: string;
  coordinates?: { latitude: number; longitude: number };
};

export type Trip = {
  _id: string;
  name: string;
  destination?: TripDestination | null;
  destinationName: string;
  destinationCountry?: string | null;
  destinationCoordinates?: { latitude: number; longitude: number } | null;
  startDate: string;
  endDate: string;
  travelerCount: number;
  budget: number;
  currency: TripCurrency;
  travelStyle: TravelStyle;
  interests: TripInterest[];
  status: TripStatus;
  tripCode?: string;
  createdAt: string;
  updatedAt: string;
};

export type TripInput = Omit<Trip, '_id' | 'status' | 'createdAt' | 'updatedAt'>;
