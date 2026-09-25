import vue from '@vitejs/plugin-vue';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const angularDist = fileURLToPath(new URL('./packages/angular/dist/fesm2022/', import.meta.url));

/** React 18 and its react-dom, installed as a pair by the private `tools/react-18` package. */
const REACT_18 = {
  react: realpathSync(fileURLToPath(new URL('./tools/react-18/node_modules/react', import.meta.url))),
  dom: realpathSync(fileURLToPath(new URL('./tools/react-18/node_modules/react-dom', import.meta.url))),
};

const source = { conditions: ['@silverpoint/source', 'module', 'browser', 'development|production'] };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: source,
        ssr: { resolve: { conditions: ['@silverpoint/source'], externalConditions: ['@silverpoint/source'] } },
        test: {
          name: 'core',
          root: 'packages/core',
          environment: 'node',
          include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
          benchmark: { include: ['bench/**/*.bench.ts'] },
        },
      },
      {
        resolve: source,
        ssr: { resolve: { conditions: ['@silverpoint/source'], externalConditions: ['@silverpoint/source'] } },
        test: { name: 'grounds', root: 'packages/grounds', environment: 'node', include: ['test/**/*.test.ts'], benchmark: { include: ['bench/**/*.bench.ts'] } },
      },
      {
        resolve: source,
        ssr: { resolve: { conditions: ['@silverpoint/source'], externalConditions: ['@silverpoint/source'] } },
        test: { name: 'react', root: 'packages/react', environment: 'happy-dom', include: ['test/**/*.test.{ts,tsx}'] },
      },
      {
        // PRD §6 "React 18.2+ and 19": the same suite against React 18, aliased in (T-090).
        resolve: {
          ...source,
          // From tools/react-18, whose react-dom resolves its own React 18, never the workspace's 19.
          alias: [
            { find: /^react$/, replacement: REACT_18.react },
            { find: /^react\/(.*)$/, replacement: `${REACT_18.react}/$1` },
            { find: /^react-dom$/, replacement: REACT_18.dom },
            { find: /^react-dom\/(.*)$/, replacement: `${REACT_18.dom}/$1` },
          ],
        },
        ssr: { resolve: { conditions: ['@silverpoint/source'], externalConditions: ['@silverpoint/source'] } },
        test: {
          name: 'react-18',
          root: 'packages/react',
          environment: 'happy-dom',
          include: ['test/**/*.test.{ts,tsx}'],
          // Inlined, so the alias reaches every import of React, not only the tests' own.
          server: { deps: { inline: [/@silverpoint\//] } },
        },
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
          // After the unit projects, never beside them: one gate rewrites a real manifest to prove
          // the stylesheet check, which a parallel manifest test would read mid-change.
          sequence: { groupOrder: 1 },
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
