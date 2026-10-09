import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '../layouts/AppLayout';
import { LandingPage } from './FoundationPage';

function renderLanding() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  const router = createMemoryRouter(
    [{ element: <AppLayout />, children: [{ path: '/', element: <LandingPage /> }] }],
    { initialEntries: ['/'] },
  );

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('TripSOS landing page', () => {
  it('renders the main product story and live ecosystem links', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1, name: /travel prepared/i })).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: /the complete ecosystem when you’re somewhere new/i }),
    ).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /plan/i }).length).toBeGreaterThan(0);
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

  it('switches emergency scenario playbooks interactively', () => {
    renderLanding();
    const lostButton = screen.getByRole('button', { name: 'Lost or stranded' });
    fireEvent.click(lostButton);
    expect(lostButton.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Lock high-precision GPS coordinates')).toBeTruthy();
  });
});
