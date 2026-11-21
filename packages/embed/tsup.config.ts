import { defineConfig, type Options } from 'tsup';

/** Inlined by the standalone builds; the warnings the core strips in production stay stripped. */
const standalone = (entry: string, file: string, format: 'iife' | 'esm'): Options => ({
  entry: { [file]: entry },
  format: [format],
  outExtension: () => ({ js: format === 'iife' ? '.js' : '.mjs' }),
  globalName: format === 'iife' ? 'Silverpoint' : undefined,
  platform: 'browser',
  target: 'es2020',
  minify: true,
  sourcemap: false,
  dts: false,
  clean: false,
  splitting: false,
  treeshake: true,
  noExternal: [/.*/],
  define: { 'process.env.NODE_ENV': '"production"' },
  esbuildOptions(options) {
    options.legalComments = 'none';
  },
});

// ESM entries, as the core: `.`, `hosts` and `conformance` are DOM-free; `client` holds the DOM
// bindings. Then the four standalone files (DD-062): IIFE and ESM, with and without the faces.
export default defineConfig([
  {
    entry: { index: 'src/index.ts', client: 'src/client/index.ts', hosts: 'src/hosts/index.ts', conformance: 'src/conformance/index.ts' },
    format: ['esm'],
    target: 'es2022',
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    external: ['@silverpoint/core', '@silverpoint/grounds'],
  },
  standalone('src/standalone/index.ts', 'silverpoint-embed', 'iife'),
  standalone('src/standalone/module.ts', 'silverpoint-embed', 'esm'),
  standalone('src/standalone/full.ts', 'silverpoint-embed.full', 'iife'),
  standalone('src/standalone/full-module.ts', 'silverpoint-embed.full', 'esm'),
]);
