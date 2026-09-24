import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const angularDist = fileURLToPath(new URL('./packages/angular/dist/fesm2022/', import.meta.url));

const source = { conditions: ['@silverpoint/source', 'module', 'browser', 'development|production'] };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: source,
        ssr: { resolve: { conditions: ['@silverpoint/source'], externalConditions: ['@silverpoint/source'] } },
        test: { name: 'core', root: 'packages/core', environment: 'node', include: ['src/**/*.test.ts', 'test/**/*.test.ts'] },
      },
      {
        resolve: source,
        ssr: { resolve: { conditions: ['@silverpoint/source'], externalConditions: ['@silverpoint/source'] } },
        test: { name: 'grounds', root: 'packages/grounds', environment: 'node', include: ['test/**/*.test.ts'] },
      },
      {
        resolve: source,
        ssr: { resolve: { conditions: ['@silverpoint/source'], externalConditions: ['@silverpoint/source'] } },
        test: { name: 'react', root: 'packages/react', environment: 'happy-dom', include: ['test/**/*.test.{ts,tsx}'] },
      },
      {
        plugins: [vue()],
        resolve: source,
        ssr: { resolve: { conditions: ['@silverpoint/source'], externalConditions: ['@silverpoint/source'] } },
        test: { name: 'vue', root: 'packages/vue', environment: 'happy-dom', include: ['test/**/*.test.ts'] },
      },
      {
        resolve: {
          ...source,
          alias: [
            // Every secondary entry point, `@silverpoint/angular/<slug>`, from its FESM bundle.
            { find: /^@silverpoint\/angular\/([a-z-]+)$/, replacement: `${angularDist}silverpoint-angular-$1.mjs` },
            { find: /^@silverpoint\/angular$/, replacement: `${angularDist}silverpoint-angular.mjs` },
          ],
        },
        ssr: { resolve: { conditions: ['@silverpoint/source'], externalConditions: ['@silverpoint/source'] } },
        test: {
          name: 'angular',
          root: 'packages/angular',
          environment: 'node',
          include: ['test/**/*.test.ts'],
          globalSetup: ['test/global-setup.ts'],
          setupFiles: ['test/setup.ts'],
          testTimeout: 30_000,
        },
      },
      {
        // The gates that need built artefacts — the Art. 3 string gate and the bundle budgets —
        // run against the published builds, resolved as a consumer would import them.
        test: {
          name: 'gates',
          root: 'tools',
          environment: 'node',
          include: ['**/*.real.test.ts'],
          exclude: ['**/node_modules/**'],
          globalSetup: ['visual-gate/gate-setup.ts'],
          setupFiles: ['visual-gate/gate-angular.ts'],
          testTimeout: 120_000,
        },
      },
      {
        test: { name: 'fonts', root: 'packages/fonts', environment: 'node', include: ['test/**/*.test.ts'] },
      },
      {
        resolve: source,
        ssr: { resolve: { conditions: ['@silverpoint/source'], externalConditions: ['@silverpoint/source'] } },
        test: { name: 'tools', root: 'tools', environment: 'node', include: ['**/*.test.{ts,mjs}'], exclude: ['**/node_modules/**', '**/fixtures/**', '**/*.real.test.ts'] },
      },
    ],
  },
});
