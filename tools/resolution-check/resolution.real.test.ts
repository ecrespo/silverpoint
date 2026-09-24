import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { buildApp, bundleTreeShakingCss, declaredOverrides, devCheck, type DevReport } from './check';

const repo = fileURLToPath(new URL('../..', import.meta.url));
const app = `${repo}examples/vite-react`;

describe('package resolution under Vite (DD-011)', () => {
  test('REQ-033 · the example app declares no optimizeDeps entry and no resolve override', async () => {
    // What the app's own config declares; the framework plugin's pre-bundling hints are not the consumer's.
    const config = await declaredOverrides(app);
    expect(config.include).toEqual([]);
    expect(config.exclude).toEqual([]);
    expect(config.aliases).toEqual([]);
  });

  test('REQ-034 · vite build keeps the stylesheet import: the ground variables and part rules ship', async () => {
    const build = await buildApp(app);
    expect(build.css).toMatch(/--sp-ink:\s*#5a5e65/i);
    expect(build.css).toMatch(/\[part=["']?sp-heighten["']?\]/);
    expect(build.css).toMatch(/@font-face/);
    expect(build.js).toMatch(/sp-line-chart/);
  }, 120_000);

  test('REQ-034 · a bundler that tree-shakes CSS by sideEffects, as webpack does, keeps the stylesheet', async () => {
    expect(await bundleTreeShakingCss(app)).toMatch(/--sp-ink:\s*#5a5e65/i);
  }, 120_000);

  test('REQ-034 · removing "*.css" from the sideEffects of grounds makes the check fail', async () => {
    const manifest = `${repo}packages/grounds/package.json`;
    const original = readFileSync(manifest, 'utf8');
    try {
      writeFileSync(manifest, original.replace(/"sideEffects":\s*\[\s*"\*\.css"\s*\]/, '"sideEffects": false'));
      expect(await bundleTreeShakingCss(app)).not.toMatch(/--sp-ink:\s*#5a5e65/i);
    } finally {
      writeFileSync(manifest, original);
    }
  }, 120_000);

  describe('vite dev', () => {
    let report: DevReport;
    beforeAll(async () => {
      report = await devCheck(app);
    }, 120_000);
    afterAll(() => undefined);

    test('REQ-033 · every subpath resolves in the dev server and the page renders both charts', () => {
      expect(report.errors).toEqual([]);
      expect(report.charts).toBe(2);
      expect(report.status).toBe('ready');
    });

    test('REQ-032 · with the typeface blocked, the development build reports SP013 and still renders', () => {
      expect(report.blockedFontWarnings.some((w) => w.includes('[SP013]'))).toBe(true);
      expect(report.blockedFontCharts).toBe(2);
    });
  });
});
