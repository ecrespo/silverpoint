import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// No `optimizeDeps`, no `resolve` overrides: packages resolve as published (REQ-033, DD-011).
export default defineConfig({
  plugins: [vue()],
  // The bench wants every hydration mismatch reported, attributes included, even in a
  // production build (REQ-109).
  define: { __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' },
});
