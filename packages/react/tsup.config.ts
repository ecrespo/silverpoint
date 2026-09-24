import { defineConfig } from 'tsup';

const shared = {
  format: ['esm'] as const,
  target: 'es2022',
  dts: true,
  sourcemap: true,
  // Rollup's treeshake pass drops module-level directives; esbuild already tree-shakes.
  treeshake: false,
  external: ['react', 'react-dom', 'react/jsx-runtime', '@silverpoint/core', '@silverpoint/grounds'],
};

// Client entries carry the "use client" marker; server entries must not (REQ-104).
export default defineConfig([
  {
    ...shared,
    clean: true,
    entry: { index: 'src/index.ts', 'line-chart': 'src/line-chart.ts' },
    banner: { js: "'use client';" },
  },
  {
    ...shared,
    entry: { 'server/line-chart': 'src/server/line-chart.ts' },
  },
]);
