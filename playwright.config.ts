import { defineConfig } from '@playwright/test';

/**
 * The integration bench (T-023) and the pixel gate (T-022). One pinned browser, device scale 1,
 * fixed viewport, reduced motion — the declared conditions of determinism of Art. 3.
 */
export const APPS = {
  'vite-react': { port: 4101, framework: 'React', ssr: false },
  'vite-vue': { port: 4102, framework: 'Vue', ssr: true },
  nextjs: { port: 4103, framework: 'React', ssr: true },
  angular: { port: 4104, framework: 'Angular', ssr: false },
} as const;

export type AppName = keyof typeof APPS;

/** The documentation site: its own spec, not the apps' (T-097). */
export const DOCS = { port: 4105 } as const;
const withDocs = !process.env.E2E_APPS || process.env.E2E_APPS.split(',').includes('docs');

/** `E2E_APPS=vite-react,nextjs` limits the run (and the servers started) to those apps. */
const selected = Object.entries(APPS).filter(
  ([name]) => !process.env.E2E_APPS || process.env.E2E_APPS.split(',').includes(name),
);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    channel: 'chromium',
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  },
  expect: { toHaveScreenshot: { animations: 'disabled' } },
  // One golden image per fixture, shared by every adapter: the canonical render's screenshot.
  snapshotPathTemplate: '{testDir}/__golden__/{arg}{ext}',
  projects: [
    ...selected.map(([name, app]) => ({
      name,
      testIgnore: 'docs.spec.ts',
      use: { baseURL: `http://localhost:${app.port}` },
      metadata: { app: name, ...app },
    })),
    ...(withDocs ? [{ name: 'docs', testMatch: 'docs.spec.ts', use: { baseURL: `http://localhost:${DOCS.port}` } }] : []),
  ],
  webServer: [
    ...selected.map(([name, app]) => ({
      command: `pnpm --filter @silverpoint/example-${name} run serve --port ${app.port}`,
      url: `http://localhost:${app.port}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      stdout: 'ignore' as const,
    })),
    ...(withDocs
      ? [{ command: `pnpm --filter @silverpoint/docs run serve --port ${DOCS.port}`, url: `http://localhost:${DOCS.port}/`, reuseExistingServer: !process.env.CI, timeout: 240_000, stdout: 'ignore' as const }]
      : []),
  ],
});
