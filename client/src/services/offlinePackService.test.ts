import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildOfflinePack,
  clearOfflineEmergencyPack,
  getOfflineEmergencyPack,
  isPackStale,
  saveOfflineEmergencyPack,
  VERIFIED_FIRST_AID_GUIDES,
  VERIFIED_OFFLINE_NUMBERS,
} from './offlinePackService';

describe('offlinePackService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('builds a complete offline emergency pack with verified authoritative protocols', () => {
    const pack = buildOfflinePack({
      user: { name: 'Vaishnavi', email: 'vaishnavi@example.com' },
      emergencyContacts: [
        {
          _id: 'c-1',
          name: 'Priya Sharma',
          relationship: 'family',
          phone: '+919876543210',
          isPrimary: true,
          priority: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      trips: [
        {
          _id: 't-1',
          name: 'Manali Expedition',
          destinationName: 'Manali, Himachal Pradesh',
          destinationCountry: 'India',
          destinationCoordinates: { latitude: 32.2396, longitude: 77.1887 },
          startDate: '2026-10-10',
          endDate: '2026-10-15',
          currency: 'INR',
          travelerCount: 2,
          budget: 25000,
          travelStyle: 'adventure',
          interests: ['nature'],
          status: 'upcoming',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    expect(pack.version).toBe('1.0.0');
    expect(pack.savedAt).toBeDefined();
    expect(pack.user?.name).toBe('Vaishnavi');
    expect(pack.emergencyContacts).toHaveLength(1);
    expect(pack.activeTrips).toHaveLength(1);
    expect(pack.activeTrips[0]?.destinationName).toBe('Manali, Himachal Pradesh');
    expect(pack.authoritativeEmergencyNumbers).toEqual(VERIFIED_OFFLINE_NUMBERS);
    expect(pack.firstAidGuides).toEqual(VERIFIED_FIRST_AID_GUIDES);
  });

  it('saves and retrieves the emergency pack from localStorage', () => {
    expect(getOfflineEmergencyPack()).toBeNull();

    const pack = buildOfflinePack({
      emergencyContacts: [],
    });

    saveOfflineEmergencyPack(pack);
    const loaded = getOfflineEmergencyPack();

    expect(loaded).not.toBeNull();
    expect(loaded?.version).toBe('1.0.0');
    expect(loaded?.authoritativeEmergencyNumbers.length).toBeGreaterThan(0);
  });

  it('clears the emergency pack from localStorage', () => {
    const pack = buildOfflinePack({});
    saveOfflineEmergencyPack(pack);
    expect(getOfflineEmergencyPack()).not.toBeNull();

    clearOfflineEmergencyPack();
    expect(getOfflineEmergencyPack()).toBeNull();
  });

  it('identifies fresh packs versus stale packs over 72 hours', () => {
    const freshPack = buildOfflinePack({});
    expect(isPackStale(freshPack)).toBe(false);

    const oldDate = new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString();
    const stalePack = { ...freshPack, savedAt: oldDate };
    expect(isPackStale(stalePack)).toBe(true);
  });
});
