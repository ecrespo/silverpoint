import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Deliberately no `optimizeDeps` and no `resolve` overrides: every @silverpoint subpath must
// resolve as published, in dev and in build (REQ-033, DD-011).
export default defineConfig({
  plugins: [react()],
});
