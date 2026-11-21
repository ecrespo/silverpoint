import { existsSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { ALL_FIXTURES, FIXTURES, fixtureSpec } from '../examples/harness/index.js';
import { APPS } from '../playwright.config';
import { compareSvg } from '../tools/svg-normalizer/normalize';
import { matrixScope } from '../tools/visual-gate/matrix';
import { gate } from './pixel-compare';

/**
 * The embed as the fourth comparison against the canonical render (DD-065; REQ-664, T-322, T-323):
 * each fixture as a JSON spec, mounted by `@silverpoint/embed/client` on the vite-react bench's
 * `embed.html`, in the pinned Chromium. Its tree is compared with the canonical page's SVG, and its
 * screenshot passes the pixel gate's three Art. 3 comparisons, as an adapter column. The PR matrix
 * on every PR; the full one when the nightly run sets `SP_MATRIX=full`.
 */
const FULL = matrixScope() === 'full';
const MATRIX = FULL ? ALL_FIXTURES : FIXTURES;
const hasGolden = (fixture: (typeof ALL_FIXTURES)[number]) => fixture.hatchFill === 'tile' && fixture.size.width === 320;
const BENCH = `http://localhost:${APPS['vite-react'].port}`;

/** A fixture whose props hold a function has no JSON form: skipped by rule, and counted (DD-065). */
const holdsFunction = (value: unknown): boolean =>
  typeof value === 'function' || (typeof value === 'object' && value !== null && Object.values(value).some(holdsFunction));
const SKIPPED = MATRIX.filter((fixture) => holdsFunction(fixture.props)).map((fixture) => fixture.id);
const GATED = MATRIX.filter((fixture) => !SKIPPED.includes(fixture.id));

async function ready(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.locator('.sp-harness[data-gate] .sp-root[data-status="ready"]').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

const shot = (page: Page) => page.locator('.sp-harness[data-gate]').screenshot({ animations: 'disabled' });

test.describe('embed gate', () => {
  // The bench app serves both pages; the other apps' projects have nothing to add here.
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'vite-react', 'the embed column runs on the vite-react bench'));

  test('REQ-664 · the gate has the whole matrix, and reports the fixtures it skips', () => {
    expect(GATED.length + SKIPPED.length).toBe(MATRIX.length);
    // Today every fixture is JSON (Data Model §5); a function in a fixture's props shows up here.
    expect(SKIPPED).toEqual([]);
  });

  for (const fixture of GATED) {
    test(`REQ-664 · ${fixture.id} mounted from its spec equals the canonical tree and pixels`, async ({ page }, info) => {
      await ready(page, `${BENCH}/canonical.html?fixture=${fixture.id}`);
      const expected = await page.evaluate(() => (window as { spCanonical?: string }).spCanonical ?? '');
      const canonical = await shot(page);

      await ready(page, `${BENCH}/embed.html?fixture=${fixture.id}`);
      const drawn = await page.locator('.sp-harness[data-gate] svg.sp-chart').evaluate((svg) => svg.outerHTML);
      expect(compareSvg(drawn, expected), 'tree').toEqual({ equal: true });

      const embed = await shot(page);
      const goldenPath = info.snapshotPath(`${fixture.id}.png`);
      const golden = hasGolden(fixture) && existsSync(goldenPath) ? readFileSync(goldenPath) : undefined;
      expect(gate(embed, canonical, golden), 'pixels').toEqual([]);
    });
  }

  test('REQ-664 · the spec the page mounts is the fixture\'s own', async ({ page }) => {
    const fixture = FIXTURES[0]!;
    await ready(page, `${BENCH}/embed.html?fixture=${fixture.id}`);
    await expect(page.locator('.sp-harness[data-gate] svg.sp-chart title')).toHaveAttribute('id', `${fixture.id}-title`);
    expect(fixtureSpec(fixture).id).toBe(fixture.id);
  });
});
