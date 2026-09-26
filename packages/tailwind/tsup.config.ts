import { defineConfig } from 'tsup';

// ESM and CommonJS: Tailwind 3 configs often `require` their presets. With a single default export,
// tsup writes `module.exports = preset`, so `require('@silverpoint/tailwind')` is the preset itself
// (`cjsInterop` would append a second assignment that undoes it).
export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  target: 'es2022',
  dts: true,
  splitting: false,
  clean: true,
  treeshake: true,
});
