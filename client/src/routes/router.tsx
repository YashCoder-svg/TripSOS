import type { ReactNode } from 'react';
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { FoundationPage, LandingPage } from '../pages/FoundationPage';
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
const ProfilePage = lazy(() =>
  import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
);
const EmergencyPage = lazy(() =>
  import('../pages/EmergencyPage').then((module) => ({ default: module.EmergencyPage })),
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
      { path: '/trips', element: protect(<FoundationPage />) },
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
      { path: '/explore', element: <FoundationPage /> },
      {
        path: '/emergency',
        element: (
          <LazyRoute>
            <EmergencyPage />
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
