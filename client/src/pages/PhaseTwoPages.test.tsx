import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage, RegisterPage } from './AuthPage';
import { DashboardPage } from './DashboardPage';
import { EmergencyPage } from './EmergencyPage';
import { ProtectedRoute } from '../routes/Guards';

const auth = vi.hoisted(() => ({
  status: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated',
  user: null as null | {
    id: string;
    name: string;
    email: string;
    profilePhoto: null;
    language: string;
    travelPreferences: {
      travelStyle: 'mixed';
      favoriteActivities: string[];
      budgetPreference: 'moderate';
      dietaryPreferences: string[];
    };
    createdAt: string;
  },
  sessionMessage: null as string | null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../store/AuthProvider', () => ({
  useAuth: () => auth,
  useOptionalAuth: () => auth,
}));

vi.mock('../services/tripService', () => ({
  useTrips: () => ({ data: [], isLoading: false, isError: false }),
}));

function renderAt(path: string, element: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/dashboard" element={element} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <p>Private profile</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Phase 2 account pages', () => {
  beforeEach(() => {
    auth.status = 'unauthenticated';
    auth.user = null;
    auth.sessionMessage = null;
    auth.login.mockReset();
    auth.register.mockReset();
    auth.logout.mockReset();
    auth.updateUser.mockReset();
  });

  it('renders the login form with labeled fields and a password visibility control', () => {
    renderAt('/login', <p>Dashboard</p>);
    expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });

  it('validates registration fields and matching passwords before sending', async () => {
    const user = userEvent.setup();
    renderAt('/register', <p>Dashboard</p>);
    await user.type(screen.getByLabelText('Name'), 'Taylor Traveler');
    await user.type(screen.getByLabelText('Email address'), 'taylor@example.com');
    await user.type(screen.getByLabelText('Password'), 'JourneySafe2026');
    await user.type(screen.getByLabelText('Confirm password'), 'JourneySafe2027');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('does not render a protected page while loading and redirects unauthenticated users to login', async () => {
    auth.status = 'loading';
    const view = renderAt('/profile', <p>Dashboard</p>);
    expect(screen.getByText(/checking your tripsos session/i)).toBeInTheDocument();
    expect(screen.queryByText('Private profile')).not.toBeInTheDocument();
    auth.status = 'unauthenticated';
    view.rerender(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/login" element={<p>Sign in to TripSOS</p>} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <p>Private profile</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Sign in to TripSOS')).toBeInTheDocument());
  });

  it('shows the authenticated dashboard without invented trips', () => {
    auth.status = 'authenticated';
    auth.user = {
      id: 'user-1',
      name: 'Taylor Traveler',
      email: 'taylor@example.com',
      profilePhoto: null,
      language: 'en',
      travelPreferences: {
        travelStyle: 'mixed',
        favoriteActivities: [],
        budgetPreference: 'moderate',
        dietaryPreferences: [],
      },
      createdAt: new Date().toISOString(),
    };
    renderAt('/dashboard', <DashboardPage />);
    expect(screen.getByRole('heading', { name: /taylor\./i })).toBeInTheDocument();
    expect(screen.getByText('Your next adventure starts here.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /emergency guidance/i })).toHaveAttribute(
      'href',
      '/emergency',
    );
  });

  it('keeps emergency guidance available without authentication', () => {
    renderAt('/emergency', <p>Dashboard</p>);
    expect(screen.getByRole('button', { name: /i'm in trouble/i })).toBeInTheDocument();
    expect(screen.getByText(/guest mode/i)).toBeInTheDocument();
    expect(screen.getByText(/tripSOS is not an emergency dispatch agency/i)).toBeInTheDocument();
  });
});
