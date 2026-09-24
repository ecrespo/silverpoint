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
    ],
  },
});
