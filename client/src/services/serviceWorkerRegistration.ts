/**
 * Registers the TripSOS service worker for offline shell caching and PWA installation.
 */
export function registerServiceWorker(): void {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV !== 'test'
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Log or handle updates cleanly
          if (reg.installing) {
            // New worker installing
          }
        })
        .catch((err) => {
          console.warn('TripSOS ServiceWorker registration note:', err);
        });
    });
  }
}
