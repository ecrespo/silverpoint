import { defineConfig } from 'tsup';
import Vue from 'unplugin-vue/esbuild';

// The SFC compile step is the only build cost the Vue adapter adds (DD-012). Types come
// from vue-tsc, which understands `.vue` files.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'line-chart': 'src/line-chart.ts',
    'bullet-chart': 'src/bullet-chart.ts',
    'pyramid-chart': 'src/pyramid-chart.ts',
    'heatmap-chart': 'src/heatmap-chart.ts',
    'treemap-chart': 'src/treemap-chart.ts',
    'sankey-chart': 'src/sankey-chart.ts',
    'activity-grid': 'src/activity-grid.ts',
  },
  format: ['esm'],
  target: 'es2022',
  dts: false,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['vue', '@silverpoint/core', '@silverpoint/grounds'],
  esbuildPlugins: [Vue()],
});
