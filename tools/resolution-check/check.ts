/**
 * Package resolution under a bundler (REQ-033, REQ-034, DD-011): the example app is built and
 * served through Vite's own API, with an isolated cache so a stale pre-bundle cannot hide a
 * defect, and bundled once more the way webpack tree-shakes CSS.
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { rolldown } from 'rolldown';
import { build, createServer, loadConfigFromFile, type Rollup } from 'vite';

export interface DevReport {
  readonly errors: string[];
  readonly charts: number;
  readonly status: string | null;
  readonly blockedFontWarnings: string[];
  readonly blockedFontCharts: number;
}

/** The dependency-optimisation and alias settings the app's own config file declares. */
export async function declaredOverrides(root: string) {
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, join(root, 'vite.config.ts'), root, 'silent');
  const config = loaded?.config ?? {};
  const alias = config.resolve?.alias;
  const aliases = Array.isArray(alias) ? alias.map((a) => String(a.find)) : Object.keys(alias ?? {});
  return { include: config.optimizeDeps?.include ?? [], exclude: config.optimizeDeps?.exclude ?? [], aliases };
}

/**
 * The app bundled the way webpack treats CSS: the stylesheet is an ordinary module, so a package
 * that declares `sideEffects: false` lets the bundler drop an import whose result is unused —
 * the failure mode REQ-034 guards against. (Vite itself marks CSS as side-effectful, so it never
 * shows the defect.) Returns the CSS of the modules that survived tree-shaking.
 */
export async function bundleTreeShakingCss(root: string): Promise<string> {
  const bundle = await rolldown({
    input: join(root, 'src/main.tsx'),
    cwd: root,
    platform: 'browser',
    transform: { jsx: 'react-jsx' },
    logLevel: 'silent',
    plugins: [
      {
        name: 'css-as-module',
        load(id) {
          return id.endsWith('.css') ? { code: 'export {}', moduleType: 'js' } : undefined;
        },
      },
    ],
  });
  try {
    const { output } = await bundle.generate({ format: 'esm' });
    return output
      .flatMap((chunk) => (chunk.type === 'chunk' ? chunk.moduleIds : []))
      .filter((id) => id.endsWith('.css'))
      .map((id) => readFileSync(id, 'utf8'))
      .join('\n');
  } finally {
    await bundle.close();
  }
}

/** A production build of the app, kept in memory: its CSS and JavaScript. */
export async function buildApp(root: string): Promise<{ css: string; js: string }> {
  const cacheDir = mkdtempSync(join(tmpdir(), 'sp-vite-'));
  try {
    const result = (await build({
      root,
      configFile: join(root, 'vite.config.ts'),
      cacheDir,
      logLevel: 'silent',
      build: { write: false, emptyOutDir: false },
    })) as Rollup.RollupOutput | Rollup.RollupOutput[];
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output);
    const css = outputs
      .filter((o): o is Rollup.OutputAsset => o.type === 'asset' && o.fileName.endsWith('.css'))
      .map((o) => String(o.source))
      .join('\n');
    const js = outputs
      .filter((o): o is Rollup.OutputChunk => o.type === 'chunk')
      .map((o) => o.code)
      .join('\n');
    return { css, js };
  } finally {
    rmSync(cacheDir, { recursive: true, force: true });
  }
}

/** Serves the app with the Vite dev server and loads it in the pinned browser, twice. */
export async function devCheck(root: string): Promise<DevReport> {
  const cacheDir = mkdtempSync(join(tmpdir(), 'sp-vite-'));
  const server = await createServer({
    root,
    configFile: join(root, 'vite.config.ts'),
    cacheDir,
    logLevel: 'silent',
    server: { port: 0, strictPort: false },
    optimizeDeps: { force: true },
  });
  await server.listen();
  const url = server.resolvedUrls?.local[0] ?? '';
  const browser = await chromium.launch({ channel: 'chromium' });
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(url);
    await page.waitForSelector('.sp-harness .sp-root[data-status="ready"]', { timeout: 60_000 });
    const charts = await page.locator('svg.sp-chart').count();
    const status = await page.locator('.sp-harness .sp-root').getAttribute('data-status');

    const blocked = await browser.newPage();
    const warnings: string[] = [];
    blocked.on('console', (message) => warnings.push(message.text()));
    await blocked.route(/\.woff2(\?.*)?$/, (route) => route.abort());
    await blocked.goto(url);
    await blocked.waitForSelector('.sp-harness .sp-root[data-status="ready"]', { timeout: 60_000 });
    for (let i = 0; i < 50 && !warnings.some((w) => w.includes('[SP013]')); i += 1) await blocked.waitForTimeout(100);
    const blockedFontCharts = await blocked.locator('svg.sp-chart').count();

    return { errors, charts, status, blockedFontWarnings: warnings, blockedFontCharts };
  } finally {
    await browser.close();
    await server.close();
    rmSync(cacheDir, { recursive: true, force: true });
  }
}
