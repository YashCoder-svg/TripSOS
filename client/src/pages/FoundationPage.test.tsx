import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { LandingPage } from './FoundationPage';

describe('landing foundation', () => {
  it('renders the TripSOS travel message', () => {
    const router = createMemoryRouter(
      [{ element: <AppLayout />, children: [{ path: '/', element: <LandingPage /> }] }],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('heading', { name: /travel prepared/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /start planning/i }).getAttribute('href')).toBe(
      '/trips',
    );
  });
});
