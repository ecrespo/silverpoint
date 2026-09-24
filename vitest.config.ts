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
            { find: /^@silverpoint\/angular\/line-chart$/, replacement: `${angularDist}silverpoint-angular-line-chart.mjs` },
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
        // The Art. 3 string gate runs against the published builds of every adapter, resolved
        // without the source condition, exactly as a consumer would import them.
        test: {
          name: 'gates',
          root: 'tools/visual-gate',
          environment: 'node',
          include: ['*.real.test.ts'],
          globalSetup: ['gate-setup.ts'],
          setupFiles: ['gate-angular.ts'],
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
