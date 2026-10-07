import type { PlaceSummary } from './place';

export const emergencyCategories = [
  'medical',
  'police',
  'fire',
  'accident',
  'lost',
  'general',
] as const;

export type EmergencyCategory = (typeof emergencyCategories)[number];

export interface EmergencySession {
  _id: string;
  user?: string | null;
  type: EmergencyCategory;
  status: 'active' | 'resolved' | 'cancelled';
  locationSnapshot?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
  };
  startedAt: string;
  endedAt?: string | null;
  notes?: string;
  createdAt?: string;
}

export interface CountryEmergencyNumbers {
  countryCode: string;
  countryName: string;
  general: string;
  police?: string;
  ambulance?: string;
  fire?: string;
  notes?: string;
  source: string;
}

export interface NearbyEmergencyServicesResult {
  services: PlaceSummary[];
  source: string;
}

export type LocationShareDuration = 30 | 60 | 240;

export interface LocationShareRequest {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  address?: string;
  durationMinutes: LocationShareDuration;
  note?: string;
  sessionId?: string;
}

export interface LocationShareResponse {
  token: string;
  sharePath: string;
  durationMinutes: LocationShareDuration;
  expiresAt: string;
  location: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number | null;
    address?: string | null;
  };
}

export interface SharedLocationPublicData {
  location: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number | null;
    address?: string | null;
  };
  note?: string;
  createdAt: string;
  expiresAt: string;
  durationMinutes: LocationShareDuration;
}
