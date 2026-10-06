import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { FoundationPage, LandingPage } from '../pages/FoundationPage';
import { ProtectedRoute } from './Guards';

const protectedPaths = ['/dashboard', '/trips', '/profile', '/settings'];
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <FoundationPage /> },
      { path: '/register', element: <FoundationPage /> },
      ...protectedPaths.map((path) => ({
        path,
        element: (
          <ProtectedRoute>
            <FoundationPage />
          </ProtectedRoute>
        ),
      })),
      { path: '/explore', element: <FoundationPage /> },
      { path: '/emergency', element: <FoundationPage /> },
      { path: '*', element: <FoundationPage /> },
    ],
  },
]);
