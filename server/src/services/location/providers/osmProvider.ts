import { logger } from '../../../config/logger.js';
import type {
  GeocodingResult,
  LocationProvider,
  PlaceCategory,
  PlaceDetails,
  PlaceSearchParams,
  PlaceSearchResult,
  PlaceSummary,
} from '../types.js';

const USER_AGENT = 'TripSOS-TravelApp/1.0 (https://tripsos.internal; security@tripsos.internal)';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function categoryToOverpassFilters(category?: PlaceCategory): string[] {
  switch (category) {
    case 'food':
      return ['nwr["amenity"~"^(restaurant|fast_food|food_court)$"]'];
    case 'cafes':
      return ['nwr["amenity"="cafe"]'];
    case 'hotels':
      return ['nwr["tourism"~"^(hotel|motel|guest_house|hostel)$"]'];
    case 'hospitals':
      return ['nwr["amenity"="hospital"]', 'nwr["healthcare"="hospital"]'];
    case 'pharmacies':
      return ['nwr["amenity"="pharmacy"]', 'nwr["healthcare"="pharmacy"]'];
    case 'police':
      return ['nwr["amenity"="police"]'];
    case 'atms':
      return ['nwr["amenity"~"^(atm|bank)$"]'];
    case 'fuel':
      return ['nwr["amenity"="fuel"]'];
    case 'groceries':
      return ['nwr["shop"~"^(supermarket|convenience|grocery)$"]'];
    case 'transport':
      return [
        'nwr["railway"="station"]',
        'nwr["highway"="bus_stop"]',
        'nwr["amenity"="bus_station"]',
        'nwr["aeroway"="aerodrome"]',
      ];
    case 'repair':
      return ['nwr["shop"~"^(car_repair|bicycle_repair)$"]', 'nwr["amenity"="vehicle_inspection"]'];
    case 'all':
    default:
      return [
        'nwr["amenity"~"^(restaurant|cafe|hospital|pharmacy|police|atm|bank|fuel)$"]',
        'nwr["tourism"~"^(hotel|guest_house|hostel)$"]',
        'nwr["shop"~"^(supermarket|convenience|car_repair|bicycle_repair)$"]',
      ];
  }
}

function deriveCategoryFromTags(tags: Record<string, string>): PlaceCategory {
  if (tags.amenity === 'hospital' || tags.healthcare === 'hospital') return 'hospitals';
  if (tags.amenity === 'pharmacy' || tags.healthcare === 'pharmacy') return 'pharmacies';
  if (tags.amenity === 'police') return 'police';
  if (tags.amenity === 'atm' || tags.amenity === 'bank') return 'atms';
  if (tags.amenity === 'fuel') return 'fuel';
  if (tags.amenity === 'cafe') return 'cafes';
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') return 'food';
  if (['hotel', 'motel', 'guest_house', 'hostel'].includes(tags.tourism ?? '')) return 'hotels';
  if (['supermarket', 'convenience', 'grocery'].includes(tags.shop ?? '')) return 'groceries';
  if (['car_repair', 'bicycle_repair'].includes(tags.shop ?? '')) return 'repair';
  if (tags.railway || tags.highway === 'bus_stop' || tags.amenity === 'bus_station')
    return 'transport';
  return 'all';
}

function formatAddressFromTags(tags: Record<string, string>): string | undefined {
  if (tags['addr:full']) return tags['addr:full'];
  const parts: string[] = [];
  if (tags['addr:housenumber'] && tags['addr:street']) {
    parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
  } else if (tags['addr:street']) {
    parts.push(tags['addr:street']);
  }
  if (tags['addr:suburb'] || tags['addr:district']) {
    parts.push(tags['addr:suburb'] || tags['addr:district']!);
  }
  if (tags['addr:city'] || tags['addr:town'] || tags['addr:village']) {
    parts.push(tags['addr:city'] || tags['addr:town'] || tags['addr:village']!);
  }
  if (tags['addr:state']) parts.push(tags['addr:state']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
  return parts.length ? parts.join(', ') : undefined;
}

export class OpenStreetMapProvider implements LocationProvider {
  readonly name = 'osm';

  async geocode(query: string, limit = 5): Promise<GeocodingResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const url = new URL('/search', NOMINATIM_BASE);
    url.searchParams.set('q', trimmed);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 10)));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Nominatim geocode failed with HTTP ${response.status}`);
      }

      interface NominatimItem {
        place_id: number;
        osm_type?: string;
        osm_id?: number;
        lat: string;
        lon: string;
        name?: string;
        display_name: string;
        boundingbox?: [string, string, string, string];
        address?: {
          country?: string;
          state?: string;
          region?: string;
          county?: string;
          city?: string;
          town?: string;
          village?: string;
          suburb?: string;
        };
      }

      const items = (await response.json()) as NominatimItem[];
      return items.map((item) => {
        const addr = item.address ?? {};
        const primaryName =
          item.name ||
          addr.city ||
          addr.town ||
          addr.village ||
          item.display_name.split(',')[0]!.trim();
        const city = addr.city || addr.town || addr.village || addr.county;
        const region = addr.state || addr.region;
        const country = addr.country;

        return {
          provider: this.name,
          providerId: `osm_${item.osm_type || 'place'}_${item.osm_id || item.place_id}`,
          name: primaryName,
          country,
          region,
          city,
          formattedAddress: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          boundingBox: item.boundingbox
            ? [
                parseFloat(item.boundingbox[0]),
                parseFloat(item.boundingbox[1]),
                parseFloat(item.boundingbox[2]),
                parseFloat(item.boundingbox[3]),
              ]
            : undefined,
        };
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const url = new URL('/reverse', NOMINATIM_BASE);
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) return null;

      const item = (await response.json()) as {
        place_id: number;
        osm_type?: string;
        osm_id?: number;
        lat: string;
        lon: string;
        name?: string;
        display_name: string;
        address?: {
          country?: string;
          state?: string;
          city?: string;
          town?: string;
          village?: string;
        };
      };

      if (!item || !item.lat) return null;

      const addr = item.address ?? {};
      return {
        provider: this.name,
        providerId: `osm_${item.osm_type || 'place'}_${item.osm_id || item.place_id}`,
        name:
          item.name ||
          addr.city ||
          addr.town ||
          addr.village ||
          item.display_name.split(',')[0]!.trim(),
        country: addr.country,
        region: addr.state,
        city: addr.city || addr.town || addr.village,
        formattedAddress: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async searchPlaces(params: PlaceSearchParams): Promise<PlaceSearchResult> {
    const { latitude, longitude, radiusMeters = 5000, limit = 20, category, query } = params;
    const clampedRadius = Math.min(Math.max(radiusMeters, 200), 50_000);
    const clampedLimit = Math.min(Math.max(limit, 1), 50);

    // Build Overpass QL query
    const filters = categoryToOverpassFilters(category);
    const aroundClauses = filters
      .map((f) => `${f}(around:${clampedRadius},${latitude},${longitude});`)
      .join('');
    const ql = `[out:json][timeout:12];(${aroundClauses});out center ${clampedLimit * 2};`;

    let overpassData: {
      elements?: Array<{
        type: 'node' | 'way' | 'relation';
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    } | null = null;

    // Try Overpass endpoints
    for (const endpoint of OVERPASS_ENDPOINTS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: `data=${encodeURIComponent(ql)}`,
          signal: controller.signal,
        });

        if (resp.ok) {
          overpassData = await resp.json();
          break;
        }
      } catch (err) {
        logger.warn({ endpoint, err }, 'Overpass endpoint attempt failed; trying next');
      } finally {
        clearTimeout(timer);
      }
    }

    const rawElements = overpassData?.elements ?? [];
    const results: PlaceSummary[] = [];

    const queryLower = query?.trim().toLowerCase();

    for (const el of rawElements) {
      const tags = el.tags;
      if (!tags) continue;

      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat === undefined || lon === undefined) continue;

      const name = tags.name || tags['name:en'] || tags.operator || tags.brand || tags.description;
      if (!name) continue;

      // Filter by query if specified
      if (queryLower) {
        const matchesName = name.toLowerCase().includes(queryLower);
        const matchesCuisine = tags.cuisine?.toLowerCase().includes(queryLower);
        const matchesAmenity = tags.amenity?.toLowerCase().includes(queryLower);
        const matchesShop = tags.shop?.toLowerCase().includes(queryLower);
        const matchesTourism = tags.tourism?.toLowerCase().includes(queryLower);
        const matchesHealthcare = tags.healthcare?.toLowerCase().includes(queryLower);
        if (
          !matchesName &&
          !matchesCuisine &&
          !matchesAmenity &&
          !matchesShop &&
          !matchesTourism &&
          !matchesHealthcare
        ) {
          continue;
        }
      }

      const dist = calculateDistanceMeters(latitude, longitude, lat, lon);
      const placeCategory = deriveCategoryFromTags(tags);
      const address = formatAddressFromTags(tags);

      results.push({
        provider: this.name,
        providerId: `osm_${el.type}_${el.id}`,
        name,
        category: placeCategory,
        categories: [placeCategory],
        latitude: lat,
        longitude: lon,
        distanceMeters: dist,
        address,
        city: tags['addr:city'] || tags['addr:town'] || tags['addr:district'],
        region: tags['addr:state'],
        country: tags['addr:country'],
        phone: tags['contact:phone'] || tags.phone,
        website: tags['contact:website'] || tags.website,
        openingHours: tags.opening_hours ? [tags.opening_hours] : undefined,
        wheelchairAccessible: tags.wheelchair ? tags.wheelchair === 'yes' : undefined,
        sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      });
    }

    // Sort by distance
    results.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));

    return {
      results: results.slice(0, clampedLimit),
      center: { latitude, longitude },
      source: 'OpenStreetMap',
    };
  }

  async getPlaceDetails(providerId: string): Promise<PlaceDetails | null> {
    const match = providerId.match(/^osm_(node|way|relation)_(\d+)$/);
    if (!match) return null;

    const [, type, id] = match;
    const ql = `[out:json][timeout:10];${type}(${id});out center tags;`;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: `data=${encodeURIComponent(ql)}`,
          signal: controller.signal,
        });

        if (resp.ok) {
          const data = (await resp.json()) as {
            elements?: Array<{
              lat?: number;
              lon?: number;
              center?: { lat: number; lon: number };
              tags?: Record<string, string>;
            }>;
          };
          const el = data.elements?.[0];
          if (!el || !el.tags) return null;
          const lat = el.lat ?? el.center?.lat ?? 0;
          const lon = el.lon ?? el.center?.lon ?? 0;
          const tags = el.tags;
          const name = tags.name || tags['name:en'] || 'Place';
          const placeCategory = deriveCategoryFromTags(tags);

          return {
            provider: this.name,
            providerId,
            name,
            category: placeCategory,
            categories: [placeCategory],
            latitude: lat,
            longitude: lon,
            address: formatAddressFromTags(tags),
            city: tags['addr:city'],
            region: tags['addr:state'],
            country: tags['addr:country'],
            phone: tags['contact:phone'] || tags.phone,
            website: tags['contact:website'] || tags.website,
            openingHours: tags.opening_hours ? [tags.opening_hours] : undefined,
            wheelchairAccessible: tags.wheelchair ? tags.wheelchair === 'yes' : undefined,
            description: tags.description || tags.note,
            sourceUrl: `https://www.openstreetmap.org/${type}/${id}`,
          };
        }
      } catch {
        // continue
      } finally {
        clearTimeout(timer);
      }
    }
    return null;
  }
}
