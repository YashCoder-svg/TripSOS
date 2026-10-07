import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { LazyMotion } from 'framer-motion';
import { router } from './routes/router';
import { AuthProvider } from './store/AuthProvider';
import { registerServiceWorker } from './services/serviceWorkerRegistration';
import './styles.css';

registerServiceWorker();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LazyMotion
        features={() => import('./animations/domFeatures').then((module) => module.default)}
      >
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </LazyMotion>
    </QueryClientProvider>
  </React.StrictMode>,
);
