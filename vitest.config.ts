import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

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
        test: { name: 'fonts', root: 'packages/fonts', environment: 'node', include: ['test/**/*.test.ts'] },
      },
      {
        resolve: source,
        ssr: { resolve: { conditions: ['@silverpoint/source'], externalConditions: ['@silverpoint/source'] } },
        test: { name: 'tools', root: 'tools', environment: 'node', include: ['**/*.test.{ts,mjs}'], exclude: ['**/node_modules/**', '**/fixtures/**'] },
      },
    ],
  },
});
