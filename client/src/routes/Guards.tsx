import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  // Authentication is intentionally not implemented in Phase 0.
  const isAuthenticated = false;
  const location = useLocation();
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location }} />;
}
