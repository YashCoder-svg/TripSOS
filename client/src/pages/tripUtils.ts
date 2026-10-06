import type { TripCurrency } from '../types/trip';

export function formatTripDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' }).format(
    new Date(Date.UTC(year!, month! - 1, day!)),
  );
}

export function formatDateRange(start: string, end: string): string {
  const [startYear] = start.split('-');
  const [endYear] = end.split('-');
  if (startYear !== endYear)
    return `${formatTripDate(start, { day: 'numeric', month: 'short', year: 'numeric' })} – ${formatTripDate(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return `${formatTripDate(start)} – ${formatTripDate(end, { day: 'numeric', month: 'short', year: undefined })}`;
}

export function tripDuration(start: string, end: string): number {
  const startParts = start.split('-').map(Number);
  const endParts = end.split('-').map(Number);
  return (
    Math.round(
      (Date.UTC(endParts[0]!, endParts[1]! - 1, endParts[2]!) -
        Date.UTC(startParts[0]!, startParts[1]! - 1, startParts[2]!)) /
        86_400_000,
    ) + 1
  );
}

export function formatBudget(amount: number, currency: TripCurrency): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
