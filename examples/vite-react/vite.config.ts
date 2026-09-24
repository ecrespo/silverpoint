import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Deliberately no `optimizeDeps` and no `resolve` overrides: every @silverpoint subpath must
// resolve as published, in dev and in build (REQ-033, DD-011).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // The canonical page of the pixel gate ships with the bench app.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        canonical: fileURLToPath(new URL('./canonical.html', import.meta.url)),
      },
    },
  },
});
