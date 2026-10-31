import { defineConfig } from 'tsup';

// ESM, as the core. `.` is pure (Node, browser, workers); `client` holds the DOM bindings (DD-052).
// Marpit stays external: it is a dependency, resolved by the consumer's bundler.
export default defineConfig({
  entry: { index: 'src/index.ts', client: 'src/client/index.ts', cli: 'src/cli/index.ts' },
  format: ['esm'],
  target: 'es2022',
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['@silverpoint/core', '@silverpoint/grounds', '@marp-team/marpit'],
});
