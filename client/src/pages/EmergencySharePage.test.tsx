import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { SharedLocationPublicData } from '../types/emergency';
import { EmergencySharePage } from './EmergencySharePage';

// Mock MapLibreMap to avoid GL context in jsdom
vi.mock('../components/maps/MapLibreMap', () => ({
  MapLibreMap: () => <div data-testid="maplibre-map">Map Placeholder</div>,
}));

let mockSharedData: SharedLocationPublicData | null = null;
let mockIsLoading = false;
let mockError: Error | null = null;

vi.mock('../services/emergencyService', () => ({
  useSharedLocation: () => ({
    data: mockSharedData,
    isLoading: mockIsLoading,
    error: mockError,
  }),
}));

function renderSharePage(token = 'valid-token-123') {
  return render(
    <MemoryRouter initialEntries={[`/emergency/share/${token}`]}>
      <Routes>
        <Route path="/emergency/share/:token" element={<EmergencySharePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EmergencySharePage', () => {
  it('renders active shared emergency location with coordinates, countdown, and directions', () => {
    mockIsLoading = false;
    mockError = null;
    mockSharedData = {
      location: {
        latitude: 32.2396,
        longitude: 77.1887,
        accuracyMeters: 15,
        address: 'Mall Road, Manali',
      },
      note: 'Stranded in snowstorm, need help',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      durationMinutes: 60,
    };

    renderSharePage();

    expect(screen.getByText(/Emergency Location Received/i)).toBeInTheDocument();
    expect(screen.getByText(/32.239600, 77.188700/i)).toBeInTheDocument();
    expect(screen.getByText(/Mall Road, Manali/i)).toBeInTheDocument();
    expect(screen.getByText(/"Stranded in snowstorm, need help"/i)).toBeInTheDocument();
    expect(screen.getByText(/GPS Accuracy: ±15 meters/i)).toBeInTheDocument();
    expect(screen.getByTestId('maplibre-map')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open in google maps/i })).toHaveAttribute(
      'href',
      expect.stringContaining('32.2396,77.1887'),
    );
    expect(screen.getByRole('link', { name: /dial 112/i })).toBeInTheDocument();
  });

  it('renders revoked notice when link was revoked by the sender', () => {
    mockIsLoading = false;
    mockSharedData = null;
    mockError = new Error('This emergency location share link has been revoked by the sender.');

    renderSharePage();

    expect(screen.getByText(/Location Share Revoked/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This emergency location share link has been revoked by the sender./i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /call 112/i })).toBeInTheDocument();
  });

  it('renders expired notice when link has passed expiration time', () => {
    mockIsLoading = false;
    mockSharedData = null;
    mockError = new Error('This emergency location share link has expired.');

    renderSharePage();

    expect(screen.getByText(/Location Share Expired/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This temporary emergency location link has reached its expiration time./i),
    ).toBeInTheDocument();
  });
});
