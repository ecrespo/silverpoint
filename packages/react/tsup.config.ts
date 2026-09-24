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
    entry: {
      index: 'src/index.ts',
      'line-chart': 'src/line-chart-entry.ts',
      'bullet-chart': 'src/bullet-chart.tsx',
      'pyramid-chart': 'src/pyramid-chart.tsx',
      'heatmap-chart': 'src/heatmap-chart.tsx',
      'treemap-chart': 'src/treemap-chart.tsx',
      'sankey-chart': 'src/sankey-chart.tsx',
      'activity-grid': 'src/activity-grid.tsx',
    },
    banner: { js: "'use client';" },
  },
  {
    ...shared,
    entry: {
      'server/line-chart': 'src/server/line-chart.tsx',
      'server/bullet-chart': 'src/server/bullet-chart.tsx',
      'server/pyramid-chart': 'src/server/pyramid-chart.tsx',
      'server/heatmap-chart': 'src/server/heatmap-chart.tsx',
      'server/treemap-chart': 'src/server/treemap-chart.tsx',
      'server/sankey-chart': 'src/server/sankey-chart.tsx',
      'server/activity-grid': 'src/server/activity-grid.tsx',
    },
  },
]);
