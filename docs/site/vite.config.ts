import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The site consumes the packages as published, like any Vite + React app (REQ-033): no aliases.
export default defineConfig({ plugins: [react()], base: './' });
