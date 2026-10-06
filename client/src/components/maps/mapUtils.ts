import type { PlaceCategory } from '../../types/place';

export const CATEGORY_METADATA: Record<
  PlaceCategory,
  { label: string; iconName: string; color: string; badgeBg: string }
> = {
  all: { label: 'All Places', iconName: 'Grid', color: '#315b48', badgeBg: '#edf1e9' },
  food: {
    label: 'Food & Dining',
    iconName: 'UtensilsCrossed',
    color: '#b45309',
    badgeBg: '#fef3c7',
  },
  hotels: { label: 'Hotels & Stay', iconName: 'Bed', color: '#1d4ed8', badgeBg: '#dbeafe' },
  hospitals: { label: 'Hospitals', iconName: 'Cross', color: '#b91c1c', badgeBg: '#fee2e2' },
  pharmacies: { label: 'Pharmacies', iconName: 'Pill', color: '#047857', badgeBg: '#d1fae5' },
  police: {
    label: 'Police Stations',
    iconName: 'ShieldAlert',
    color: '#4338ca',
    badgeBg: '#e0e7ff',
  },
  atms: { label: 'ATMs & Banks', iconName: 'Landmark', color: '#0f766e', badgeBg: '#ccfbf1' },
  fuel: { label: 'Fuel & EV', iconName: 'Fuel', color: '#c2410c', badgeBg: '#ffedd5' },
  groceries: { label: 'Groceries', iconName: 'ShoppingBag', color: '#15803d', badgeBg: '#dcfce7' },
  cafes: { label: 'Cafés', iconName: 'Coffee', color: '#78350f', badgeBg: '#fef3c7' },
  transport: { label: 'Transport', iconName: 'TrainFront', color: '#334155', badgeBg: '#f1f5f9' },
  repair: { label: 'Vehicle Repair', iconName: 'Wrench', color: '#475569', badgeBg: '#f1f5f9' },
};

export function formatDistance(distanceMeters?: number): string {
  if (distanceMeters === undefined || distanceMeters === null) return '';
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m away`;
  }
  const km = distanceMeters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
}

export function buildDirectionsUrl(latitude: number, longitude: number): string {
  // Safe Google Maps directions URL (opens natively in Apple Maps / Google Maps on mobile)
  const dest = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}
