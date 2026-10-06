import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { LandingPage } from './FoundationPage';

function renderLanding() {
  const router = createMemoryRouter(
    [{ element: <AppLayout />, children: [{ path: '/', element: <LandingPage /> }] }],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
}

describe('TripSOS landing page', () => {
  it('renders the main product story and demo labels', () => {
    renderLanding();
    expect(screen.getByRole('heading', { name: /travel prepared/i })).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: /everything you need when you’re somewhere new/i }),
    ).toBeTruthy();
    expect(screen.getByText(/demonstration content only/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /plan my trip/i }).getAttribute('href')).toBe('/trips');
  });

  it('opens and closes the accessible mobile navigation with Escape', () => {
    renderLanding();
    const toggle = screen.getByRole('button', { name: /open navigation menu/i });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('updates the emergency preview without accessing a location', () => {
    renderLanding();
    const lostButton = screen.getByRole('button', { name: 'I’m lost' });
    fireEvent.click(lostButton);
    expect(lostButton.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Find your current location')).toBeTruthy();
    expect(screen.getByText(/location isn’t accessed in this preview/i)).toBeTruthy();
  });
});
