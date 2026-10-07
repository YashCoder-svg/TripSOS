import mongoose from 'mongoose';
import { Trip } from '../../models/Trip.js';
import { TripMember } from '../../models/TripMember.js';
import { ItineraryItem } from '../../models/ItineraryItem.js';
import { Expense } from '../../models/Expense.js';
import { locationService } from '../location/locationService.js';
import { weatherService } from '../weather/weatherService.js';
import { lookupEmergencyNumbers } from '../emergency/authoritativeNumbers.js';
import {
  calculateTripSettlement,
  type ParticipantUser,
  type SettlementExpenseItem,
} from '../expense/settlementService.js';
import type { PlaceCategory, PlaceSummary } from '../location/types.js';

export interface ToolExecutionResult {
  tool: string;
  parameters: Record<string, unknown>;
  result: unknown;
  sourceAttribution?: string;
}

export interface AiPlace {
  id: string;
  name: string;
  category?: PlaceCategory;
  formattedAddress?: string;
  distanceMeters?: number;
  coordinates: { latitude: number; longitude: number };
  phone?: string;
  provider: string;
}

/** Normalizes provider place summaries into a compact, verified shape for the assistant. */
function toAiPlace(p: PlaceSummary): AiPlace {
  return {
    id: p.providerId,
    name: p.name,
    category: p.category,
    formattedAddress: p.address,
    distanceMeters: p.distanceMeters,
    coordinates: { latitude: p.latitude, longitude: p.longitude },
    phone: p.phone,
    provider: p.provider,
  };
}

export class AiTools {
  /**
   * Controlled tool 1: getTrip
   */
  static async getTrip(tripId: string, userId?: string) {
    // Trip data is private: anonymous callers never receive trip context.
    if (!userId) {
      return { error: 'Sign in to use trip context.' };
    }
    if (!mongoose.isValidObjectId(tripId)) {
      return { error: 'Invalid trip ID format.' };
    }
    const trip = await Trip.findById(tripId).lean();
    if (!trip) {
      return { error: 'Trip not found.' };
    }
    if (trip.owner.toString() !== userId) {
      const isMember = await TripMember.findOne({
        trip: trip._id,
        user: userId,
        status: 'active',
      }).lean();
      if (!isMember) {
        return { error: 'Access to this trip is unauthorized.' };
      }
    }
    return {
      _id: trip._id.toString(),
      name: trip.name,
      destinationName: trip.destinationName,
      destinationCountry: trip.destinationCountry,
      destinationCoordinates: trip.destinationCoordinates,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelerCount: trip.travelerCount,
      budget: trip.budget,
      currency: trip.currency,
      travelStyle: trip.travelStyle,
      interests: trip.interests,
      status: trip.status,
    };
  }

  /**
   * Controlled tool 2: getWeather
   */
  static async getWeather(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string,
  ) {
    try {
      const weather = await weatherService.getWeather(latitude, longitude, startDate, endDate);
      return {
        location: weather.location,
        current: weather.current,
        daily: weather.daily.slice(0, 7), // next 7 days forecast
        tripForecast: weather.tripForecast,
        forecastAvailableForDates: weather.forecastAvailableForDates,
        source: weather.provider,
      };
    } catch {
      return {
        message: 'Weather information currently unavailable for these coordinates.',
      };
    }
  }

  /**
   * Controlled tool 3: searchPlaces
   */
  static async searchPlaces(
    query: string,
    latitude?: number,
    longitude?: number,
  ): Promise<{ places: AiPlace[]; source?: string; message?: string }> {
    // A search center is required — never default to fabricated coordinates.
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return { places: [], message: 'A destination or location is required to search places.' };
    }
    try {
      const result = await locationService.searchPlaces({ query, latitude, longitude, limit: 5 });
      return { places: result.results.map(toAiPlace), source: result.source };
    } catch {
      return { places: [], message: 'Place search returned no verified matches.' };
    }
  }

  /**
   * Controlled tool 4: getNearbyPlaces
   */
  static async getNearbyPlaces(
    latitude: number,
    longitude: number,
    category: PlaceCategory = 'all',
    radiusMeters = 5000,
  ): Promise<{ places: AiPlace[]; source?: string; message?: string }> {
    try {
      const result = await locationService.getNearbyPlaces(
        latitude,
        longitude,
        category,
        radiusMeters,
      );
      return { places: result.results.slice(0, 6).map(toAiPlace), source: result.source };
    } catch {
      return { places: [], message: 'No verified nearby places found.' };
    }
  }

  /**
   * Controlled tool 5: getItinerary
   */
  static async getItinerary(tripId: string, userId?: string) {
    if (!mongoose.isValidObjectId(tripId)) {
      return { error: 'Invalid trip ID format.' };
    }
    // Verify access
    const tripCheck = await this.getTrip(tripId, userId);
    if ('error' in tripCheck) return tripCheck;

    const items = await ItineraryItem.find({ trip: tripId })
      .sort({ date: 1, startTime: 1, order: 1 })
      .lean();

    return {
      count: items.length,
      items: items.map((i) => ({
        id: i._id.toString(),
        title: i.title,
        date: i.date,
        startTime: i.startTime,
        endTime: i.endTime,
        category: i.category,
        status: i.status,
        location: i.location,
        coordinates: i.coordinates,
        notes: i.notes,
      })),
    };
  }

  /**
   * Controlled tool 6: getExpenses
   */
  static async getExpenses(tripId: string, userId?: string) {
    const tripCheck = await this.getTrip(tripId, userId);
    if ('error' in tripCheck) return { error: String(tripCheck.error) };
    const trip = await Trip.findById(tripId).lean();
    if (!trip) return { error: 'Trip not found.' };

    const expenses = await Expense.find({ trip: tripId })
      .populate('paidBy', 'name email')
      .populate('participants.user', 'name email')
      .lean();

    const members = await TripMember.find({ trip: tripId, status: 'active' })
      .populate('user', 'name email')
      .lean();

    const memberMap = new Map<string, ParticipantUser>();
    for (const m of members) {
      if (m.user && typeof m.user === 'object' && 'name' in m.user) {
        const u = m.user as unknown as {
          _id: mongoose.Types.ObjectId;
          name: string;
          email?: string;
        };
        memberMap.set(u._id.toString(), {
          _id: u._id.toString(),
          name: u.name,
          email: u.email,
        });
      }
    }

    const participantList = Array.from(memberMap.values());
    const settlementItems: SettlementExpenseItem[] = expenses.map((e) => ({
      amount: e.amount,
      currency: e.currency,
      exchangeRate: e.exchangeRate,
      convertedAmount: e.convertedAmount,
      paidBy:
        typeof e.paidBy === 'object' && e.paidBy !== null && '_id' in e.paidBy
          ? ((e.paidBy as { _id: unknown })._id?.toString() ?? String(e.paidBy))
          : String(e.paidBy),
      splitMethod: e.splitMethod,
      participants: e.participants.map((p) => ({
        user:
          typeof p.user === 'object' && p.user !== null && '_id' in p.user
            ? ((p.user as { _id: unknown })._id?.toString() ?? String(p.user))
            : String(p.user),
        shareAmount: p.shareAmount,
      })),
    }));

    const settlement = calculateTripSettlement(settlementItems, participantList, trip.currency);

    return {
      totalExpense: settlement.totalExpense,
      currency: trip.currency,
      expenseCount: expenses.length,
      memberBalances: settlement.memberBalances,
      settlements: settlement.settlements,
      source: 'TripSOS deterministic settlement algorithm',
    };
  }

  /**
   * Controlled tool 7: getGroupMembers
   */
  static async getGroupMembers(tripId: string, userId?: string) {
    if (!mongoose.isValidObjectId(tripId)) {
      return { error: 'Invalid trip ID format.' };
    }
    const tripCheck = await this.getTrip(tripId, userId);
    if ('error' in tripCheck) return tripCheck;

    const members = await TripMember.find({ trip: tripId }).populate('user', 'name email').lean();

    return {
      members: members.map((m) => ({
        id: m._id.toString(),
        role: m.role,
        status: m.status,
        user: m.user,
        invitedEmail: m.invitedEmail,
      })),
    };
  }

  /**
   * Controlled tool 8: getEmergencyServices
   */
  static async getEmergencyServices(latitude?: number, longitude?: number, country?: string) {
    const authoritativeNumbers = lookupEmergencyNumbers(country);
    let nearbyHospitals: unknown[] = [];

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      try {
        const result = await locationService.getNearbyPlaces(
          latitude,
          longitude,
          'hospitals',
          10000,
        );
        nearbyHospitals = result.results.slice(0, 3).map((p) => ({
          name: p.name,
          address: p.address,
          distanceMeters: p.distanceMeters,
          phone: p.phone,
          latitude: p.latitude,
          longitude: p.longitude,
        }));
      } catch {
        nearbyHospitals = [];
      }
    }

    return {
      authoritativeNumbers,
      nearbyHospitals,
      emergencyNotice:
        'If in immediate physical or medical danger, contact local emergency dispatch immediately.',
    };
  }
}
