import { defineConfig } from 'tsup';

// ESM only: the SDK it serves through is ESM. `bin` is the stdio server `npx` runs; its shebang
// comes from `src/bin.ts`. Splitting keeps the catalog in one chunk both entries share.
export default defineConfig({
  entry: { index: 'src/index.ts', bin: 'src/bin.ts' },
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  dts: { entry: { index: 'src/index.ts' } },
  splitting: true,
  clean: true,
  treeshake: true,
  external: ['@silverpoint/core', '@silverpoint/grounds', '@modelcontextprotocol/sdk', 'zod'],
});
