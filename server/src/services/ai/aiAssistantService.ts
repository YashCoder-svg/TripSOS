import { AiTools, type AiPlace, type ToolExecutionResult } from './aiTools.js';
import type { PlaceCategory } from '../location/types.js';
import type { CurrentWeather, DailyForecastItem } from '../weather/types.js';
import type { ItineraryCategory } from '../../models/ItineraryItem.js';

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
    category: ItineraryCategory;
  };
}

export interface AiAssistantResponse {
  reply: string;
  toolCalls: ToolExecutionResult[];
  suggestedActions: AiSuggestedAction[];
}

interface TripContext {
  _id: string;
  name: string;
  destinationName: string;
  destinationCountry?: string | null;
  destinationCoordinates?: { latitude?: number | null; longitude?: number | null } | null;
  startDate: string;
  endDate: string;
  budget?: number | null;
}

const PLACE_LABELS: Record<PlaceCategory, string> = {
  all: 'Places',
  food: 'Restaurants',
  cafes: 'Cafés',
  hotels: 'Hotels',
  hospitals: 'Hospitals',
  pharmacies: 'Pharmacies',
  police: 'Police Stations',
  atms: 'ATMs',
  fuel: 'Fuel Stations',
  groceries: 'Groceries',
  transport: 'Transport',
  repair: 'Repair Services',
};

const EMERGENCY_KEYWORDS = [
  'emergency',
  'hospital',
  'police',
  'ambulance',
  'hurt',
  'injur',
  'accident',
  'bleeding',
  'danger',
  'trouble',
  'fire',
  'sos',
];

function isToolError(x: unknown): x is { error: string } {
  return (
    typeof x === 'object' && x !== null && typeof (x as { error?: unknown }).error === 'string'
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches keywords at a word start so "rain" doesn't match "train" and "eat" doesn't match "great". */
function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(w)}`, 'u').test(text));
}

/** Maps free-text to a supported provider place category. Returns null when no supported category applies. */
export function detectPlaceCategory(text: string): PlaceCategory | null {
  if (includesAny(text, ['cafe', 'café', 'coffee'])) return 'cafes';
  if (
    includesAny(text, ['restaurant', 'food', 'eat', 'dinner', 'lunch', 'breakfast', 'vegetarian'])
  )
    return 'food';
  if (includesAny(text, ['hotel', 'stay', 'accommodation', 'lodging'])) return 'hotels';
  if (includesAny(text, ['pharmacy', 'chemist', 'medicine'])) return 'pharmacies';
  if (includesAny(text, ['atm', 'cash'])) return 'atms';
  if (includesAny(text, ['fuel', 'petrol', 'gas station'])) return 'fuel';
  if (includesAny(text, ['grocery', 'groceries', 'supermarket'])) return 'groceries';
  if (includesAny(text, ['bus stop', 'bus station', 'train', 'railway', 'metro', 'transport']))
    return 'transport';
  return null;
}

function toItineraryCategory(category: PlaceCategory): ItineraryCategory {
  if (category === 'food' || category === 'cafes') return 'food';
  if (category === 'hotels') return 'lodging';
  if (category === 'transport') return 'travel';
  return 'activity';
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

/**
 * Picks a planning date that lies within the trip range.
 * "tomorrow" → tomorrow if within the trip, otherwise the closest valid trip day.
 */
export function pickPlanDate(
  text: string,
  startDate: string,
  endDate: string,
  now = new Date(),
): string {
  const today = isoDate(now);
  const tomorrow = isoDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  const preferred = text.includes('tomorrow') ? tomorrow : today;
  if (preferred < startDate) return startDate;
  if (preferred > endDate) return startDate;
  return preferred;
}

function formatDistance(meters?: number): string {
  if (typeof meters !== 'number') return '';
  return meters < 1000 ? `~${Math.round(meters)} m` : `~${(meters / 1000).toFixed(1)} km`;
}

export class AiAssistantService {
  async processMessage(params: {
    message: string;
    tripId?: string;
    userId?: string;
    location?: { latitude: number; longitude: number };
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<AiAssistantResponse> {
    const text = params.message.toLowerCase();
    const toolCalls: ToolExecutionResult[] = [];
    const suggestedActions: AiSuggestedAction[] = [];

    // Load trip context (authorization is enforced inside the tool)
    let trip: TripContext | null = null;
    if (params.tripId) {
      const tripRes = await AiTools.getTrip(params.tripId, params.userId);
      if (!('error' in tripRes)) {
        trip = tripRes as unknown as TripContext;
        toolCalls.push({
          tool: 'getTrip',
          parameters: { tripId: params.tripId },
          result: tripRes,
          sourceAttribution: 'TripSOS trip records',
        });
      }
    }

    // Reference coordinates: explicit user location (consented on client) first for "near me", else trip destination.
    const tripLat = trip?.destinationCoordinates?.latitude ?? undefined;
    const tripLon = trip?.destinationCoordinates?.longitude ?? undefined;
    const nearMe =
      text.includes('near me') || text.includes('nearby') || text.includes('around me');
    const useUser = Boolean(params.location) && (nearMe || typeof tripLat !== 'number');
    const refLat = useUser ? params.location?.latitude : (tripLat ?? params.location?.latitude);
    const refLon = useUser ? params.location?.longitude : (tripLon ?? params.location?.longitude);
    const hasCoords = typeof refLat === 'number' && typeof refLon === 'number';
    const refCountry = trip?.destinationCountry ?? undefined;
    const placeName = useUser ? 'your location' : (trip?.destinationName ?? 'your location');

    // 1. EMERGENCY SAFEGUARD — always first, never delayed by other intents.
    if (includesAny(text, EMERGENCY_KEYWORDS)) {
      const emergencyData = await AiTools.getEmergencyServices(refLat, refLon, refCountry);
      toolCalls.push({
        tool: 'getEmergencyServices',
        parameters: { country: refCountry ?? null, hasLocation: hasCoords },
        result: emergencyData,
        sourceAttribution: `${emergencyData.authoritativeNumbers.source} · OpenStreetMap`,
      });

      const num = emergencyData.authoritativeNumbers;
      let reply = `⚠️ **URGENT SAFETY NOTICE**\n\n`;
      reply += `If this is an immediate danger, **contact local emergency services now**. I cannot diagnose conditions or replace emergency responders.\n\n`;
      reply += `**Emergency numbers (${num.countryName})**\n`;
      reply += `- **General emergency:** ${num.general}\n`;
      if (num.police && num.police !== num.general) reply += `- **Police:** ${num.police}\n`;
      if (num.ambulance && num.ambulance !== num.general)
        reply += `- **Ambulance:** ${num.ambulance}\n`;
      if (num.fire && num.fire !== num.general) reply += `- **Fire:** ${num.fire}\n`;
      reply += `\n_Source: ${num.source}_\n\n`;

      const hospitals = emergencyData.nearbyHospitals as Array<{
        name: string;
        address?: string;
        phone?: string;
        distanceMeters?: number;
      }>;
      if (hospitals.length > 0) {
        reply += `**Nearby hospitals (OpenStreetMap data near ${placeName})**\n`;
        for (const h of hospitals) {
          const dist = formatDistance(h.distanceMeters);
          reply += `- **${h.name}**${dist ? ` (${dist})` : ''}${h.address ? ` — ${h.address}` : ''}${h.phone ? ` · ☎ ${h.phone}` : ''}\n`;
        }
        reply += `\n`;
      } else if (!hasCoords) {
        reply += `Share your location or open a trip with a destination to list verified nearby hospitals.\n\n`;
      } else {
        reply += `Nearby hospital information unavailable right now.\n\n`;
      }

      reply += `Open **Emergency Mode** for one-tap calling, directions and secure location sharing.`;
      return { reply, toolCalls, suggestedActions };
    }

    // 2. EXPENSES
    if (
      params.tripId &&
      includesAny(text, ['spent', 'spend', 'expense', 'cost', 'owe', 'balance', 'settle', 'budget'])
    ) {
      const expenseData = await AiTools.getExpenses(params.tripId, params.userId);
      toolCalls.push({
        tool: 'getExpenses',
        parameters: { tripId: params.tripId },
        result: expenseData,
        sourceAttribution: 'TripSOS deterministic settlement algorithm',
      });

      if (isToolError(expenseData)) {
        return {
          reply: `I couldn't retrieve the expense ledger for this trip: ${expenseData.error}`,
          toolCalls,
          suggestedActions,
        };
      }

      const cur = expenseData.currency;
      let reply = `### 💰 Trip Expense Overview\n\n`;
      reply += `- **Total trip expenses:** ${cur} ${expenseData.totalExpense.toLocaleString('en-US')}\n`;
      reply += `- **Recorded expenses:** ${expenseData.expenseCount}\n`;
      if (typeof trip?.budget === 'number' && trip.budget > 0) {
        reply += `- **Budget used:** ${Math.round((expenseData.totalExpense / trip.budget) * 100)}% of ${cur} ${trip.budget.toLocaleString('en-US')}\n`;
      }
      reply += `\n`;

      if (expenseData.memberBalances.length > 0) {
        reply += `**Member balances**\n`;
        for (const mb of expenseData.memberBalances) {
          const status =
            mb.netBalance > 0
              ? `gets back ${cur} ${mb.netBalance.toFixed(2)}`
              : mb.netBalance < 0
                ? `owes ${cur} ${Math.abs(mb.netBalance).toFixed(2)}`
                : 'settled up';
          reply += `- **${mb.name}**: paid ${cur} ${mb.paidTotal.toFixed(2)} (${status})\n`;
        }
      }

      if (expenseData.settlements.length > 0) {
        reply += `\n**Suggested settlements**\n`;
        for (const s of expenseData.settlements) {
          reply += `- **${s.from.name}** owes **${s.to.name}** ${s.currency} ${s.amount.toFixed(2)}\n`;
        }
      } else if (expenseData.expenseCount > 0) {
        reply += `\n_Everyone is settled up._`;
      } else {
        reply += `No expenses recorded yet. Add one from the trip's Expenses tab.`;
      }

      return { reply, toolCalls, suggestedActions };
    }

    // 3. WEATHER
    if (
      includesAny(text, ['weather', 'forecast', 'temperature', 'rain', 'climate', 'sunny', 'snow'])
    ) {
      if (!hasCoords) {
        return {
          reply: `Weather requires a location. Open a trip with a verified destination or share your location.`,
          toolCalls,
          suggestedActions,
        };
      }

      const weatherData = await AiTools.getWeather(
        refLat!,
        refLon!,
        trip?.startDate,
        trip?.endDate,
      );
      toolCalls.push({
        tool: 'getWeather',
        parameters: { latitude: refLat, longitude: refLon },
        result: weatherData,
        sourceAttribution: 'source' in weatherData ? weatherData.source : 'Weather provider',
      });

      if (!('current' in weatherData) || !weatherData.current) {
        return {
          reply: `Weather information unavailable right now. Please try again shortly.`,
          toolCalls,
          suggestedActions,
        };
      }

      const cur: CurrentWeather = weatherData.current;
      let reply = `### 🌤️ Weather for ${placeName}\n\n`;
      reply += `Currently **${cur.condition}**, **${Math.round(cur.temperature)}°C**`;
      if (typeof cur.apparentTemperature === 'number')
        reply += ` (feels like ${Math.round(cur.apparentTemperature)}°C)`;
      reply += `.\n\n`;
      if (typeof cur.humidity === 'number') reply += `- **Humidity:** ${cur.humidity}%\n`;
      if (typeof cur.windSpeed === 'number')
        reply += `- **Wind:** ${Math.round(cur.windSpeed)} km/h\n`;

      const tripDays: DailyForecastItem[] = weatherData.tripForecast ?? [];
      const days = tripDays.length > 0 ? tripDays : weatherData.daily;
      if (days.length > 0) {
        reply += `\n**${tripDays.length > 0 ? 'Forecast for your trip dates' : 'Upcoming forecast'}**\n`;
        for (const d of days.slice(0, 7)) {
          const rain =
            typeof d.precipitationProbability === 'number'
              ? ` · 💧 ${d.precipitationProbability}%`
              : '';
          reply += `- **${d.date}**: ${d.condition}, ${Math.round(d.temperatureMax)}° / ${Math.round(d.temperatureMin)}°C${rain}\n`;
        }
      }
      if (trip && weatherData.forecastAvailableForDates === false) {
        reply += `\n_Forecast for your trip dates will become available closer to your trip._`;
      }
      return { reply, toolCalls, suggestedActions };
    }

    // 4. ITINERARY PLANNING (checked before generic place queries so "plan lunch" plans a day)
    const isPlanQuery = includesAny(text, [
      'plan',
      'itinerary',
      'tomorrow',
      'schedule',
      'what should i do',
      'recommend',
      'suggest',
    ]);

    if (isPlanQuery && params.tripId && trip) {
      const itineraryData = await AiTools.getItinerary(params.tripId, params.userId);
      toolCalls.push({
        tool: 'getItinerary',
        parameters: { tripId: params.tripId },
        result: itineraryData,
        sourceAttribution: 'TripSOS trip itinerary',
      });

      const targetDate = pickPlanDate(text, trip.startDate, trip.endDate);
      const existingItems = 'items' in itineraryData ? itineraryData.items : [];
      const dayItems = existingItems.filter((i) => i.date === targetDate);

      let weatherLine = '';
      let food: AiPlace[] = [];
      let cafes: AiPlace[] = [];

      if (hasCoords) {
        const [weatherData, foodData, cafeData] = await Promise.all([
          AiTools.getWeather(refLat!, refLon!, targetDate, targetDate),
          AiTools.getNearbyPlaces(refLat!, refLon!, 'food', 5000),
          AiTools.getNearbyPlaces(refLat!, refLon!, 'cafes', 5000),
        ]);
        toolCalls.push(
          {
            tool: 'getWeather',
            parameters: { latitude: refLat, longitude: refLon, date: targetDate },
            result: weatherData,
            sourceAttribution: 'source' in weatherData ? weatherData.source : 'Weather provider',
          },
          {
            tool: 'getNearbyPlaces',
            parameters: { latitude: refLat, longitude: refLon, category: 'food' },
            result: foodData,
            sourceAttribution: foodData.source ?? 'OpenStreetMap',
          },
          {
            tool: 'getNearbyPlaces',
            parameters: { latitude: refLat, longitude: refLon, category: 'cafes' },
            result: cafeData,
            sourceAttribution: cafeData.source ?? 'OpenStreetMap',
          },
        );

        if ('tripForecast' in weatherData && weatherData.tripForecast?.length) {
          const d = weatherData.tripForecast[0]!;
          weatherLine = `${d.condition}, ${Math.round(d.temperatureMax)}° / ${Math.round(d.temperatureMin)}°C`;
          if (typeof d.precipitationProbability === 'number' && d.precipitationProbability >= 50) {
            weatherLine += ` — high chance of rain, keep indoor options handy`;
          }
        }

        const planned = new Set(dayItems.map((i) => (i.location ?? '').toLowerCase()));
        food = foodData.places.filter((p) => !planned.has(p.name.toLowerCase()));
        cafes = cafeData.places.filter((p) => !planned.has(p.name.toLowerCase()));
      }

      let reply = `### 🗺️ Plan for ${targetDate} · ${trip.destinationName}\n\n`;
      reply += weatherLine
        ? `**Weather:** ${weatherLine}.\n\n`
        : `**Weather:** Forecast unavailable for this date.\n\n`;

      if (dayItems.length > 0) {
        reply += `**Already planned (${dayItems.length})**\n`;
        for (const i of dayItems) {
          reply += `- ${i.startTime ?? 'Anytime'} — ${i.title}${i.status === 'completed' ? ' ✓' : ''}\n`;
        }
        reply += `\n`;
      } else {
        reply += `Nothing is planned for this day yet.\n\n`;
      }

      const slots: Array<{
        place: AiPlace;
        start: string;
        end: string;
        label: string;
        cat: PlaceCategory;
      }> = [];
      if (cafes[0])
        slots.push({
          place: cafes[0],
          start: '09:00',
          end: '10:00',
          label: 'Breakfast',
          cat: 'cafes',
        });
      if (food[0])
        slots.push({ place: food[0], start: '13:00', end: '14:00', label: 'Lunch', cat: 'food' });
      if (cafes[1])
        slots.push({
          place: cafes[1],
          start: '16:30',
          end: '17:30',
          label: 'Coffee break',
          cat: 'cafes',
        });
      if (food[1])
        slots.push({ place: food[1], start: '20:00', end: '21:00', label: 'Dinner', cat: 'food' });

      if (slots.length > 0) {
        reply += `**Suggested stops (verified OpenStreetMap places)**\n`;
        slots.forEach((s, idx) => {
          const dist = formatDistance(s.place.distanceMeters);
          reply += `${idx + 1}. **${s.start} ${s.label}:** ${s.place.name}${dist ? ` (${dist})` : ''}${s.place.formattedAddress ? ` — ${s.place.formattedAddress}` : ''}\n`;
          suggestedActions.push({
            id: `plan_${idx}_${s.place.id}`,
            type: 'add_itinerary_item',
            title: `Add ${s.label}: ${s.place.name}`,
            description: `${targetDate} · ${s.start}–${s.end}`,
            data: {
              tripId: params.tripId!,
              title: `${s.label} at ${s.place.name}`,
              description: s.place.formattedAddress,
              date: targetDate,
              startTime: s.start,
              endTime: s.end,
              location: s.place.name,
              coordinates: s.place.coordinates,
              placeProviderId: s.place.id,
              category: toItineraryCategory(s.cat),
            },
          });
        });
        reply += `\n_Nothing is added until you approve a suggestion below._`;
      } else if (!hasCoords) {
        reply += `Add destination coordinates to this trip to get place-based suggestions.`;
      } else {
        reply += `No verified places were returned nearby right now. You can add custom stops from the itinerary page.`;
      }

      return { reply, toolCalls, suggestedActions };
    }

    // 5. PLACES DISCOVERY
    const category = detectPlaceCategory(text);
    if (category || includesAny(text, ['places', 'near me', 'nearby', 'saved'])) {
      if (!hasCoords) {
        return {
          reply: `To search verified places, open a trip with a destination or share your location.`,
          toolCalls,
          suggestedActions,
        };
      }
      const cat: PlaceCategory = category ?? 'all';
      const placesData = await AiTools.getNearbyPlaces(refLat!, refLon!, cat, 5000);
      toolCalls.push({
        tool: 'getNearbyPlaces',
        parameters: { latitude: refLat, longitude: refLon, category: cat },
        result: placesData,
        sourceAttribution: placesData.source ?? 'OpenStreetMap',
      });

      if (placesData.places.length === 0) {
        return {
          reply: `No verified ${PLACE_LABELS[cat].toLowerCase()} found near ${placeName}. Information unavailable from the provider right now.`,
          toolCalls,
          suggestedActions,
        };
      }

      let reply = `### 📍 ${PLACE_LABELS[cat]} near ${placeName}\n\n`;
      if (text.includes('vegetarian')) {
        reply += `_Dietary details aren't always listed by the provider — please confirm vegetarian options with the venue._\n\n`;
      }
      const planDate = trip ? pickPlanDate(text, trip.startDate, trip.endDate) : null;

      placesData.places.slice(0, 4).forEach((p, idx) => {
        const dist = formatDistance(p.distanceMeters);
        reply += `**${idx + 1}. ${p.name}**\n`;
        if (p.formattedAddress) reply += `- ${p.formattedAddress}\n`;
        if (dist) reply += `- Distance: ${dist}\n`;
        if (p.phone) reply += `- ☎ ${p.phone}\n`;
        reply += `\n`;

        if (params.tripId && planDate) {
          suggestedActions.push({
            id: `place_${idx}_${p.id}`,
            type: 'add_itinerary_item',
            title: `Add ${p.name} to itinerary`,
            description: `Schedule on ${planDate}`,
            data: {
              tripId: params.tripId,
              title: `Visit ${p.name}`,
              description: p.formattedAddress,
              date: planDate,
              location: p.name,
              coordinates: p.coordinates,
              placeProviderId: p.id,
              category: toItineraryCategory(cat),
            },
          });
        }
      });

      reply += `_Source: ${placesData.source ?? 'OpenStreetMap'}._`;
      return { reply, toolCalls, suggestedActions };
    }

    // 6. DEFAULT — capabilities overview
    let reply = `Hi! I'm the **TripSOS Travel Assistant**. I only answer with verified TripSOS data and provider results.\n\n`;
    if (trip) {
      reply += `I'm looking at **${trip.name}** — ${trip.destinationName} (${trip.startDate} → ${trip.endDate}).\n\n`;
    }
    reply += `Try asking:\n`;
    reply += `- 🌤️ "What's the weather tomorrow?"\n`;
    reply += `- 🍽️ "Find a vegetarian restaurant near me"\n`;
    reply += `- 📅 "Plan tomorrow for me"\n`;
    reply += `- 💰 "How much have we spent?"\n`;
    reply += `- 🚨 "Show hospitals nearby"\n`;

    return { reply, toolCalls, suggestedActions };
  }
}

export const aiAssistantService = new AiAssistantService();
