import type {
  GeocodingResult,
  LocationProvider,
  PlaceCategory,
  PlaceDetails,
  PlaceSearchParams,
  PlaceSearchResult,
  PlaceSummary,
} from '../types.js';
import { calculateDistanceMeters } from './osmProvider.js';

function categoryToGeoapify(category?: PlaceCategory): string {
  switch (category) {
    case 'food':
      return 'catering.restaurant,catering.fast_food';
    case 'cafes':
      return 'catering.cafe';
    case 'hotels':
      return 'accommodation.hotel,accommodation.motel,accommodation.guest_house';
    case 'hospitals':
      return 'healthcare.hospital,healthcare.clinic';
    case 'pharmacies':
      return 'healthcare.pharmacy';
    case 'police':
      return 'service.police';
    case 'atms':
      return 'service.financial.atm,service.financial.bank';
    case 'fuel':
      return 'service.vehicle.fuel';
    case 'groceries':
      return 'commercial.supermarket,commercial.convenience';
    case 'transport':
      return 'public_transport,airport';
    case 'repair':
      return 'service.vehicle.repair';
    case 'all':
    default:
      return 'catering,accommodation,healthcare,service,commercial.supermarket';
  }
}

function geoapifyCategoryToInternal(categories: string[] = []): PlaceCategory {
  const joined = categories.join(' ');
  if (joined.includes('hospital') || joined.includes('clinic')) return 'hospitals';
  if (joined.includes('pharmacy')) return 'pharmacies';
  if (joined.includes('police')) return 'police';
  if (joined.includes('atm') || joined.includes('bank')) return 'atms';
  if (joined.includes('fuel')) return 'fuel';
  if (joined.includes('cafe')) return 'cafes';
  if (joined.includes('restaurant') || joined.includes('fast_food')) return 'food';
  if (joined.includes('hotel') || joined.includes('accommodation')) return 'hotels';
  if (joined.includes('supermarket') || joined.includes('convenience')) return 'groceries';
  if (joined.includes('repair')) return 'repair';
  if (joined.includes('transport') || joined.includes('airport')) return 'transport';
  return 'all';
}

export class GeoapifyProvider implements LocationProvider {
  readonly name = 'geoapify';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async geocode(query: string, limit = 5): Promise<GeocodingResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const url = new URL('https://api.geoapify.com/v1/geocode/search');
    url.searchParams.set('text', trimmed);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('apiKey', this.apiKey);

    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`Geoapify geocode failed with HTTP ${resp.status}`);

    const data = (await resp.json()) as {
      features?: Array<{
        properties: {
          place_id: string;
          name?: string;
          city?: string;
          state?: string;
          country?: string;
          formatted?: string;
          lat: number;
          lon: number;
          bbox?: [number, number, number, number];
        };
      }>;
    };

    return (data.features ?? []).map(({ properties: p }) => ({
      provider: this.name,
      providerId: p.place_id,
      name: p.name || p.city || p.formatted?.split(',')[0] || 'Location',
      country: p.country,
      region: p.state,
      city: p.city,
      formattedAddress: p.formatted,
      latitude: p.lat,
      longitude: p.lon,
      boundingBox: p.bbox,
    }));
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const url = new URL('https://api.geoapify.com/v1/geocode/reverse');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('apiKey', this.apiKey);

    const resp = await fetch(url.toString());
    if (!resp.ok) return null;

    const data = (await resp.json()) as {
      features?: Array<{
        properties: {
          place_id: string;
          name?: string;
          city?: string;
          state?: string;
          country?: string;
          formatted?: string;
          lat: number;
          lon: number;
        };
      }>;
    };

    const first = data.features?.[0]?.properties;
    if (!first) return null;

    return {
      provider: this.name,
      providerId: first.place_id,
      name: first.name || first.city || first.formatted?.split(',')[0] || 'Location',
      country: first.country,
      region: first.state,
      city: first.city,
      formattedAddress: first.formatted,
      latitude: first.lat,
      longitude: first.lon,
    };
  }

  async searchPlaces(params: PlaceSearchParams): Promise<PlaceSearchResult> {
    const { latitude, longitude, radiusMeters = 5000, limit = 20, category, query } = params;
    const clampedRadius = Math.min(Math.max(radiusMeters, 200), 50_000);
    const clampedLimit = Math.min(Math.max(limit, 1), 50);

    const url = new URL('https://api.geoapify.com/v2/places');
    url.searchParams.set('categories', categoryToGeoapify(category));
    url.searchParams.set('filter', `circle:${longitude},${latitude},${clampedRadius}`);
    url.searchParams.set('bias', `proximity:${longitude},${latitude}`);
    url.searchParams.set('limit', String(clampedLimit));
    url.searchParams.set('apiKey', this.apiKey);
    if (query?.trim()) url.searchParams.set('name', query.trim());

    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`Geoapify places search failed with HTTP ${resp.status}`);

    const data = (await resp.json()) as {
      features?: Array<{
        properties: {
          place_id: string;
          name?: string;
          categories?: string[];
          lat: number;
          lon: number;
          address_line2?: string;
          formatted?: string;
          city?: string;
          state?: string;
          country?: string;
          contact?: { phone?: string };
          website?: string;
          opening_hours?: string;
        };
      }>;
    };

    const results: PlaceSummary[] = (data.features ?? []).map(({ properties: p }) => {
      const internalCategory = geoapifyCategoryToInternal(p.categories);
      return {
        provider: this.name,
        providerId: p.place_id,
        name: p.name || p.formatted?.split(',')[0] || 'Place',
        category: internalCategory,
        categories: [internalCategory],
        latitude: p.lat,
        longitude: p.lon,
        distanceMeters: calculateDistanceMeters(latitude, longitude, p.lat, p.lon),
        address: p.formatted || p.address_line2,
        city: p.city,
        region: p.state,
        country: p.country,
        phone: p.contact?.phone,
        website: p.website,
        openingHours: p.opening_hours ? [p.opening_hours] : undefined,
      };
    });

    results.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));

    return {
      results,
      center: { latitude, longitude },
      source: 'Geoapify',
    };
  }

  async getPlaceDetails(providerId: string): Promise<PlaceDetails | null> {
    const url = new URL('https://api.geoapify.com/v2/place-details');
    url.searchParams.set('id', providerId);
    url.searchParams.set('apiKey', this.apiKey);

    const resp = await fetch(url.toString());
    if (!resp.ok) return null;

    const data = (await resp.json()) as {
      features?: Array<{
        properties: {
          place_id: string;
          name?: string;
          categories?: string[];
          lat: number;
          lon: number;
          formatted?: string;
          city?: string;
          state?: string;
          country?: string;
          contact?: { phone?: string };
          website?: string;
          opening_hours?: string;
          description?: string;
        };
      }>;
    };

    const p = data.features?.[0]?.properties;
    if (!p) return null;

    const internalCategory = geoapifyCategoryToInternal(p.categories);
    return {
      provider: this.name,
      providerId: p.place_id,
      name: p.name || 'Place',
      category: internalCategory,
      categories: [internalCategory],
      latitude: p.lat,
      longitude: p.lon,
      address: p.formatted,
      city: p.city,
      region: p.state,
      country: p.country,
      phone: p.contact?.phone,
      website: p.website,
      openingHours: p.opening_hours ? [p.opening_hours] : undefined,
      description: p.description,
    };
  }
}
