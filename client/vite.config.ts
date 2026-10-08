import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '..',
  server: { port: 5173 },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const path = id.replaceAll('\\', '/');
          if (/\/node_modules\/maplibre-gl\//.test(path)) return 'maplibre-vendor';
          if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(path))
            return 'motion-vendor';
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(path)) return 'react-vendor';
          if (/\/node_modules\/react-router/.test(path)) return 'router-vendor';
          if (/\/node_modules\/@tanstack\//.test(path)) return 'query-vendor';
          if (/\/node_modules\/lucide-react\//.test(path)) return 'icons-vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    testTimeout: 15000,
  },
});
