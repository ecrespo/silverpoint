import { existsSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { ALL_FIXTURES, FIXTURES } from '../examples/harness/index.js';
import { APPS } from '../playwright.config';
import { CATALOG } from '../tools/visual-gate/catalog';
import { matrixScope } from '../tools/visual-gate/matrix';

/** The PR matrix on every PR; the full 1,584 cells when the nightly run sets `SP_MATRIX=full`. */
const FULL = matrixScope() === 'full';
const MATRIX = FULL ? ALL_FIXTURES : FIXTURES;
/** Golden images are committed for the PR cells: the `md` + `tile` slice. */
const hasGolden = (fixture: (typeof ALL_FIXTURES)[number]) => fixture.hatchFill === 'tile' && fixture.size.width === 320;

/** The canonical render is served by the vite-react bench (`canonical.html`), framework-free. */
const CANONICAL = `http://localhost:${APPS['vite-react'].port}/canonical.html`;

/** Screenshot of the gate container, once fonts are ready and the chart is drawn (Art. 3). */
async function shoot(page: Page, url: string): Promise<Buffer> {
  await page.goto(url);
  await page.locator('.sp-harness[data-gate] .sp-root[data-status="ready"]').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  return page.locator('.sp-harness[data-gate]').screenshot({ animations: 'disabled' });
}

/** Pixels differing beyond `threshold` (pixelmatch's YIQ distance, as Playwright uses it). */
function compare(actual: Buffer, expected: Buffer, threshold: number): { pixels: number; ratio: number } {
  const a = PNG.sync.read(actual);
  const b = PNG.sync.read(expected);
  if (a.width !== b.width || a.height !== b.height) return { pixels: Number.POSITIVE_INFINITY, ratio: 1 };
  const pixels = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold });
  return { pixels, ratio: pixels / (a.width * a.height) };
}

/** The three comparisons of Constitution Art. 3; returns the ones that fail. */
function gate(adapter: Buffer, canonical: Buffer, golden: Buffer | undefined): string[] {
  const failures: string[] = [];
  const same = compare(adapter, canonical, 0.1);
  if (same.ratio > 0.001) failures.push(`vs canonical: ${same.pixels} px (${same.ratio}) beyond 0.10`);
  if (compare(adapter, canonical, 0.5).pixels > 0) failures.push('vs canonical: a pixel beyond 0.50');
  if (golden) {
    const stored = compare(adapter, golden, 0.15);
    if (stored.ratio > 0.005) failures.push(`vs golden: ${stored.pixels} px (${stored.ratio}) beyond 0.15`);
    if (compare(adapter, golden, 0.5).pixels > 0) failures.push('vs golden: a pixel beyond 0.50');
  }
  return failures;
}

test.describe('pixel gate', () => {
  // An empty fixture list would create no comparison and pass (T-090): the PR matrix is every
  // catalog chart × 2 modes × 4 substrates at `md`; the full one adds 2 fills × 3 sizes (Data Model §5).
  test('REQ-181 · REQ-182 · the gate has the whole matrix to compare', () => {
    expect(MATRIX.length).toBe(CATALOG.length * (FULL ? 48 : 8));
  });

  for (const fixture of MATRIX) {
    test(`REQ-181 · ${fixture.id} passes the three Art. 3 comparisons`, async ({ page }, info) => {
      const canonical = await shoot(page, `${CANONICAL}?fixture=${fixture.id}`);
      // The golden image is the canonical render's screenshot, stored once per PR cell; the other
      // nightly cells compare each adapter with the canonical page of the same run (T-092 ruling).
      if (hasGolden(fixture)) expect(canonical).toMatchSnapshot(`${fixture.id}.png`, { threshold: 0.15, maxDiffPixelRatio: 0.005 });
      const goldenPath = info.snapshotPath(`${fixture.id}.png`);
      const golden = hasGolden(fixture) && existsSync(goldenPath) ? readFileSync(goldenPath) : undefined;
      const adapter = await shoot(page, `/?fixture=${fixture.id}`);
      expect(gate(adapter, canonical, golden)).toEqual([]);
    });
  }

  test('REQ-181 · moving a vertex by 2 px fails the gate', async ({ page }) => {
    // A line-chart fixture: it has the heightened point this test moves.
    const fixture = FIXTURES.find((f) => f.chart === 'LineChart');
    test.skip(!fixture);
    const url = `${CANONICAL}?fixture=${fixture?.id}`;
    const canonical = await shoot(page, url);
    await page.locator('svg.sp-chart path[part="sp-heighten"]').evaluate((path) => {
      path.setAttribute('transform', 'translate(2 0)');
    });
    for (const outline of await page.locator('svg.sp-chart path[part="sp-ink"][data-paint="stroke"]').all()) {
      const heighten = await page.locator('svg.sp-chart path[part="sp-heighten"]').getAttribute('d');
      if ((await outline.getAttribute('d')) === heighten) await outline.evaluate((p) => p.setAttribute('transform', 'translate(2 0)'));
    }
    const moved = await page.locator('.sp-harness[data-gate]').screenshot({ animations: 'disabled' });
    expect(gate(moved, canonical, undefined).length).toBeGreaterThan(0);
  });

  test('REQ-181 · two consecutive runs do not differ', async ({ page }) => {
    const fixture = FIXTURES.find((f) => f.chart === 'LineChart');
    test.skip(!fixture);
    const first = await shoot(page, `/?fixture=${fixture?.id}`);
    const second = await shoot(page, `/?fixture=${fixture?.id}`);
    expect(compare(first, second, 0).pixels).toBe(0);
  });
});
