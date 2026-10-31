import { defineConfig } from '@playwright/test';

/**
 * The integration bench (T-022) and the pixel gate (T-023). One pinned browser, device scale 1,
 * fixed viewport, reduced motion — the declared conditions of determinism of Art. 3.
 */
export const APPS = {
  'vite-react': { port: 4101, framework: 'React', ssr: false },
  'vite-vue': { port: 4102, framework: 'Vue', ssr: true },
  nextjs: { port: 4103, framework: 'React', ssr: true },
  angular: { port: 4104, framework: 'Angular', ssr: true },
} as const;

export type AppName = keyof typeof APPS;

/** The documentation site: its own spec, not the apps' (T-097). */
export const DOCS = { port: 4105 } as const;
/** `SP_DECK_ENGINES=1`: the `browser-deck` job's run, the deck spec in Chromium, Firefox and WebKit (T-280). */
const deckEngines = !!process.env.SP_DECK_ENGINES;
const ENGINES = ['chromium', 'firefox', 'webkit'] as const;
const withDocs = !deckEngines && (!process.env.E2E_APPS || process.env.E2E_APPS.split(',').includes('docs'));

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
  // Each project names its browser: Chromium's `channel` would reach Firefox and WebKit too.
  use: {
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  },
  expect: { toHaveScreenshot: { animations: 'disabled' } },
  // One golden image per fixture, shared by every adapter: the canonical render's screenshot.
  snapshotPathTemplate: '{testDir}/__golden__/{arg}{ext}',
  projects: deckEngines
    ? // The deck in three engines (T-280, REQ-625): its own spec, every app in each engine.
      selected.flatMap(([name, app]) =>
        ENGINES.map((engine) => ({
          name: `${name}·${engine}`,
          testMatch: 'deck-engines.spec.ts',
          use: { baseURL: `http://localhost:${app.port}`, browserName: engine, ...(engine === 'chromium' ? { channel: 'chromium' } : {}) },
          metadata: { app: name, ...app },
        })),
      )
    : [
        ...selected.map(([name, app]) => ({
          name,
          testIgnore: ['docs.spec.ts', 'deck-engines.spec.ts'],
          use: { baseURL: `http://localhost:${app.port}`, channel: 'chromium' },
          metadata: { app: name, ...app },
        })),
        ...(withDocs ? [{ name: 'docs', testMatch: 'docs.spec.ts', use: { baseURL: `http://localhost:${DOCS.port}`, channel: 'chromium' } }] : []),
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
