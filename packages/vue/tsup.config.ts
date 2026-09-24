import { defineConfig } from 'tsup';
import Vue from 'unplugin-vue/esbuild';

// The SFC compile step is the only build cost the Vue adapter adds (DD-012). Types come
// from vue-tsc, which understands `.vue` files.
export default defineConfig({
  entry: { index: 'src/index.ts', 'line-chart': 'src/line-chart.ts' },
  format: ['esm'],
  target: 'es2022',
  dts: false,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['vue', '@silverpoint/core', '@silverpoint/grounds'],
  esbuildPlugins: [Vue()],
});
