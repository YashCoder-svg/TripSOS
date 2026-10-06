import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthProvider';

function AuthLoading() {
  return (
    <main className="auth-loading" aria-live="polite" aria-busy="true">
      <span className="auth-spinner" aria-hidden="true" />
      <span>Checking your TripSOS session…</span>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { status, sessionMessage } = useAuth();
  if (status === 'loading') return <AuthLoading />;
  return status === 'authenticated' ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location, sessionMessage }} />
  );
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') return <AuthLoading />;
  return status === 'authenticated' ? <Navigate to="/dashboard" replace /> : children;
}
