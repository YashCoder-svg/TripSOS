import type { EmergencyContact } from '../types/user';
import type { Trip } from '../types/trip';

export interface AuthoritativeCountryNumber {
  country: string;
  code: string;
  general: string;
  police: string;
  ambulance: string;
  fire: string;
  source: string;
}

export interface OfflineFirstAidGuide {
  id: string;
  title: string;
  category: 'medical' | 'trauma' | 'survival' | 'accident';
  urgentSummary: string;
  steps: string[];
}

export interface CachedEmergencyPlace {
  id: string;
  name: string;
  category: 'hospital' | 'police' | 'pharmacy' | 'stay' | 'other';
  address?: string;
  phone?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface OfflineEmergencyPack {
  version: string;
  savedAt: string;
  user?: {
    name?: string;
    email?: string;
  };
  emergencyContacts: EmergencyContact[];
  activeTrips: Array<{
    _id: string;
    name: string;
    destinationName: string;
    destinationCountry?: string | null;
    destinationCoordinates?: {
      latitude: number;
      longitude: number;
    } | null;
    startDate: string;
    endDate: string;
    currency: string;
  }>;
  authoritativeEmergencyNumbers: AuthoritativeCountryNumber[];
  firstAidGuides: OfflineFirstAidGuide[];
  cachedPlaces: CachedEmergencyPlace[];
}

const STORAGE_KEY = 'tripsos_offline_emergency_pack_v1';

export const VERIFIED_OFFLINE_NUMBERS: AuthoritativeCountryNumber[] = [
  {
    country: 'India',
    code: 'IN',
    general: '112',
    police: '100',
    ambulance: '108',
    fire: '101',
    source: 'National Emergency Response System (112.gov.in)',
  },
  {
    country: 'United States',
    code: 'US',
    general: '911',
    police: '911',
    ambulance: '911',
    fire: '911',
    source: 'Federal Communications Commission (911.gov)',
  },
  {
    country: 'European Union / UK',
    code: 'EU',
    general: '112',
    police: '112 / 999',
    ambulance: '112 / 999',
    fire: '112 / 999',
    source: 'European Emergency Number Association (EENA)',
  },
  {
    country: 'International Maritime & Universal SOS',
    code: 'GLOBAL',
    general: '112',
    police: '112',
    ambulance: '112',
    fire: '112',
    source: 'International Telecommunication Union (ITU-T E.161.1)',
  },
];

export const VERIFIED_FIRST_AID_GUIDES: OfflineFirstAidGuide[] = [
  {
    id: 'severe-bleeding',
    title: 'Severe Bleeding & Hemorrhage',
    category: 'trauma',
    urgentSummary:
      'Apply direct firm pressure immediately. Do not remove saturated bandages—add more on top.',
    steps: [
      'Call emergency dispatch immediately (112 or local dispatch).',
      'Use a clean cloth or sterile dressing to apply firm, uninterrupted manual pressure directly over the wound.',
      'If bleeding does not stop on an extremity, apply a commercial tourniquet 2-3 inches above the wound (never over a joint) and record the exact time.',
      'Keep the injured person calm, lying down, and warm to prevent circulatory shock.',
    ],
  },
  {
    id: 'cpr-cardiac',
    title: 'Adult CPR (Hands-Only & Rescue)',
    category: 'medical',
    urgentSummary:
      'If unresponsive and not breathing normally, start chest compressions immediately.',
    steps: [
      'Check responsiveness: shout and tap shoulders firmly. Check breathing for no more than 10 seconds.',
      'Call 112 / 911 or direct a specific bystander to call and locate an AED.',
      'Place heel of one hand in center of chest, other hand on top with interlocked fingers.',
      'Compress hard and fast: 100-120 compressions per minute at 2 inches (5 cm) depth (to the beat of "Stayin Alive").',
      'Allow complete chest recoil between compressions. Continue until emergency personnel take over.',
    ],
  },
  {
    id: 'heatstroke',
    title: 'Heatstroke & Severe Dehydration',
    category: 'medical',
    urgentSummary:
      'Medical emergency. Body temperature > 40°C with confusion or loss of consciousness.',
    steps: [
      'Call emergency dispatch immediately.',
      'Move person to shade or air-conditioned area immediately.',
      'Rapidly cool: immerse in cool water or place cold wet cloths/ice packs under armpits, groin, and neck.',
      'Do NOT give fluids to someone who is drowsy or unconscious.',
    ],
  },
  {
    id: 'wilderness-lost',
    title: 'Lost or Stranded in Remote Areas',
    category: 'survival',
    urgentSummary: 'Follow the S.T.O.P protocol. Conserve phone battery and stay together.',
    steps: [
      'S — Stop: As soon as you realize you are lost, halt movement. Panic causes poor decisions.',
      'T — Think: Assess your immediate safety, weather conditions, remaining daylight, and resources.',
      'O — Observe: Look for landmarks, shelters, trail markers, and hazards. Check mobile signal bursts on higher ground.',
      'P — Plan: If shelter is required before dark, prepare it immediately. Stay in one place—search teams track from last known points.',
      'Signal for help: 3 loud whistle blasts or 3 mirror/flash pulses is the universal distress signal.',
    ],
  },
  {
    id: 'road-accident',
    title: 'Vehicle / Road Traffic Incident',
    category: 'accident',
    urgentSummary: 'Secure the scene first to prevent secondary collisions.',
    steps: [
      'Turn on hazard lights. Place warning triangles 50 meters behind the scene if safe.',
      'Call emergency services with your exact highway marker or GPS coordinates.',
      'Do not move injured persons unless there is imminent fire or explosion hazard (risk of permanent spinal cord injury).',
      'Turn off vehicle ignitions to minimize fuel vapor explosion risk.',
    ],
  },
];

export function getOfflineEmergencyPack(): OfflineEmergencyPack | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineEmergencyPack;
  } catch (err) {
    console.warn('Failed to parse offline emergency pack:', err);
    return null;
  }
}

export function saveOfflineEmergencyPack(pack: OfflineEmergencyPack): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pack));
  } catch (err) {
    console.error('Failed to store offline emergency pack in localStorage:', err);
  }
}

export function clearOfflineEmergencyPack(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear offline pack:', err);
  }
}

export function buildOfflinePack(params: {
  user?: { name?: string; email?: string };
  emergencyContacts?: EmergencyContact[];
  trips?: Trip[];
  cachedPlaces?: CachedEmergencyPlace[];
}): OfflineEmergencyPack {
  return {
    version: '1.0.0',
    savedAt: new Date().toISOString(),
    user: params.user,
    emergencyContacts: params.emergencyContacts ?? [],
    activeTrips: (params.trips ?? []).map((t) => ({
      _id: t._id,
      name: t.name,
      destinationName: t.destinationName,
      destinationCountry: t.destinationCountry,
      destinationCoordinates: t.destinationCoordinates,
      startDate: t.startDate,
      endDate: t.endDate,
      currency: t.currency,
    })),
    authoritativeEmergencyNumbers: VERIFIED_OFFLINE_NUMBERS,
    firstAidGuides: VERIFIED_FIRST_AID_GUIDES,
    cachedPlaces: params.cachedPlaces ?? [],
  };
}

export function isPackStale(pack: OfflineEmergencyPack, maxAgeHours = 72): boolean {
  try {
    const savedTime = new Date(pack.savedAt).getTime();
    const ageHours = (Date.now() - savedTime) / (1000 * 60 * 60);
    return ageHours > maxAgeHours;
  } catch {
    return true;
  }
}
