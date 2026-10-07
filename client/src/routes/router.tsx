import type { ReactNode } from 'react';
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { LandingPage } from '../pages/FoundationPage';
import { ProtectedRoute, PublicOnlyRoute } from './Guards';

const LoginPage = lazy(() =>
  import('../pages/AuthPage').then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('../pages/AuthPage').then((module) => ({ default: module.RegisterPage })),
);
const DashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const TripsPage = lazy(() =>
  import('../pages/TripsPage').then((module) => ({ default: module.TripsPage })),
);
const TripDetailPage = lazy(() =>
  import('../pages/TripDetailPage').then((module) => ({ default: module.TripDetailPage })),
);
const TripMapPage = lazy(() =>
  import('../pages/TripMapPage').then((module) => ({ default: module.TripMapPage })),
);
const TripItineraryPage = lazy(() =>
  import('../pages/TripItineraryPage').then((module) => ({ default: module.TripItineraryPage })),
);
const TripExpensesPage = lazy(() =>
  import('../pages/TripExpensesPage').then((module) => ({ default: module.TripExpensesPage })),
);
const TripGroupPage = lazy(() =>
  import('../pages/TripGroupPage').then((module) => ({ default: module.TripGroupPage })),
);
const ExplorePage = lazy(() =>
  import('../pages/ExplorePage').then((module) => ({ default: module.ExplorePage })),
);
const TripCreatePage = lazy(() =>
  import('../pages/TripFormPage').then((module) => ({ default: module.TripFormPage })),
);
const TripEditPage = lazy(() =>
  import('../pages/TripFormPage').then((module) => ({
    default: () => <module.TripFormPage editing />,
  })),
);
const ProfilePage = lazy(() =>
  import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
);
const EmergencyPage = lazy(() =>
  import('../pages/EmergencyPage').then((module) => ({ default: module.EmergencyPage })),
);
const EmergencySharePage = lazy(() =>
  import('../pages/EmergencySharePage').then((module) => ({ default: module.EmergencySharePage })),
);
const AuthPageNotFound = lazy(() =>
  import('../pages/AuthPageNotFound').then((module) => ({ default: module.AuthPageNotFound })),
);

function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="auth-loading" aria-live="polite">
          <span className="auth-spinner" aria-hidden="true" />
          <span>Opening your TripSOS space…</span>
        </main>
      }
    >
      {children}
    </Suspense>
  );
}

function protect(element: ReactNode) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        path: '/login',
        element: (
          <PublicOnlyRoute>
            <LazyRoute>
              <LoginPage />
            </LazyRoute>
          </PublicOnlyRoute>
        ),
      },
      {
        path: '/register',
        element: (
          <PublicOnlyRoute>
            <LazyRoute>
              <RegisterPage />
            </LazyRoute>
          </PublicOnlyRoute>
        ),
      },
      {
        path: '/dashboard',
        element: protect(
          <LazyRoute>
            <DashboardPage />
          </LazyRoute>,
        ),
      },
      {
        path: '/trips',
        element: protect(
          <LazyRoute>
            <TripsPage />
          </LazyRoute>,
        ),
      },
      {
        path: '/trips/new',
        element: protect(
          <LazyRoute>
            <TripCreatePage />
          </LazyRoute>,
        ),
      },
      {
        path: '/trips/:tripId/edit',
        element: protect(
          <LazyRoute>
            <TripEditPage />
          </LazyRoute>,
        ),
      },
      {
        path: '/trips/:tripId',
        element: protect(
          <LazyRoute>
            <TripDetailPage />
          </LazyRoute>,
        ),
      },
      {
        path: '/trips/:tripId/map',
        element: protect(
          <LazyRoute>
            <TripMapPage />
          </LazyRoute>,
        ),
      },
      {
        path: '/trips/:tripId/itinerary',
        element: protect(
          <LazyRoute>
            <TripItineraryPage />
          </LazyRoute>,
        ),
      },
      {
        path: '/trips/:tripId/expenses',
        element: protect(
          <LazyRoute>
            <TripExpensesPage />
          </LazyRoute>,
        ),
      },
      {
        path: '/trips/:tripId/group',
        element: protect(
          <LazyRoute>
            <TripGroupPage />
          </LazyRoute>,
        ),
      },
      {
        path: '/profile',
        element: protect(
          <LazyRoute>
            <ProfilePage />
          </LazyRoute>,
        ),
      },
      {
        path: '/settings',
        element: protect(
          <LazyRoute>
            <ProfilePage />
          </LazyRoute>,
        ),
      },
      {
        path: '/explore',
        element: (
          <LazyRoute>
            <ExplorePage />
          </LazyRoute>
        ),
      },
      {
        path: '/emergency',
        element: (
          <LazyRoute>
            <EmergencyPage />
          </LazyRoute>
        ),
      },
      {
        path: '/emergency/share/:token',
        element: (
          <LazyRoute>
            <EmergencySharePage />
          </LazyRoute>
        ),
      },
      {
        path: '*',
        element: (
          <LazyRoute>
            <AuthPageNotFound />
          </LazyRoute>
        ),
      },
    ],
  },
]);
