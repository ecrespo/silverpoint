import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', 'dashboard-demos': 'src/dashboard-demos.ts', 'ui-demos': 'src/ui-demos.ts', ui: 'src/ui/index.ts' },
  format: ['esm'],
  target: 'es2022',
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
