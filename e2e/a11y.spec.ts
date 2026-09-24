import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { FIXTURES, fixtureProps } from '../examples/harness/index.js';
import { readout, stepActive, type ActiveItem } from '../packages/core/dist/index.js';
import { renderChart } from '../packages/grounds/dist/index.js';
import { catalogEntry } from '../tools/visual-gate/catalog';

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('line chart accessibility', () => {
  for (const [page_, url] of [
    ['home', '/'],
    ['fixture', '/?fixture=line-chart--silverpoint--blue--ink--md'],
  ] as const) {
    test(`REQ-120 · REQ-121 · axe-core reports no A or AA issue on the ${page_} page`, async ({ page }) => {
      await page.goto(url);
      await page.locator('.sp-harness .sp-root[data-status="ready"]').waitFor();
      const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }

  test('REQ-120 · the chart is an image named by its title and its series summary', async ({ page }) => {
    await page.goto('/');
    const svg = page.locator('.sp-harness svg.sp-chart');
    await expect(svg).toHaveAttribute('role', 'img');
    // API Spec §10.3: aria-labelledby points at the title and the description, the pattern with
    // the widest screen-reader support for SVG.
    await expect(svg).toHaveAccessibleName(/^Throughput per hour .*hits ranges from 11 to 88/);
  });

  test('REQ-121 · the tabular alternative is reachable by assistive technology', async ({ page }) => {
    await page.goto('/');
    const table = page.locator('.sp-harness').getByRole('table', { name: 'Throughput per hour' });
    await expect(table).toHaveCount(1);
    await expect(table.getByRole('row')).toHaveCount(13);
  });

  test('REQ-122 · Tab reaches the chart and arrows traverse its points, announcing each', async ({ page }) => {
    await page.goto('/');
    await page.locator('.sp-harness .sp-root[data-status="ready"]').waitFor();
    await page.keyboard.press('Tab');
    const root = page.locator('.sp-harness .sp-root');
    await expect(root).toBeFocused();
    const live = root.locator('.sp-live');
    await expect(live).toHaveText('hour 00, hits 18');
    await page.keyboard.press('ArrowRight');
    await expect(live).toHaveText('hour 02, hits 14');
    await page.keyboard.press('End');
    await expect(live).toHaveText('hour 22, hits 41');
  });

  test('REQ-123 · prefers-contrast: more switches the chart to precision', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' });
    await page.goto('/');
    await expect(page.locator('.sp-harness svg.sp-chart')).toHaveAttribute('data-mode', 'precision');
  });

  test('REQ-123 · forced-colors: active switches the chart to precision', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/');
    await expect(page.locator('.sp-harness svg.sp-chart')).toHaveAttribute('data-mode', 'precision');
  });

  test('REQ-125 · prefers-reduced-motion: reduce omits the entry animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const svg = page.locator('.sp-harness svg.sp-chart');
    expect(await svg.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(await svg.evaluate((el) => getComputedStyle(el).animationName)).toBe('sp-enter');
  });

  test('REQ-124 · with hatching disabled every series stays legible by line and dash, not by hatch', async ({ page }) => {
    await page.goto('/?fixture=line-chart--silverpoint--cream--precision--md');
    const svg = page.locator('.sp-harness svg.sp-chart');
    await expect(svg.locator('[data-role="hatch"]')).toHaveCount(0);
    await expect(svg.locator('path[data-role="encoding"][part="sp-ink"][data-paint="stroke"]').first()).toBeVisible();
    await expect(svg.locator('path[data-role="encoding"][part="sp-ink-secondary"][data-dash="dotted"]')).toHaveCount(1);
  });
});

/** The model a fixture draws, from the core itself: what the table and the live region must say. */
function modelOf(fixture: (typeof FIXTURES)[number]) {
  return renderChart(catalogEntry(fixture.chart).recipe, fixtureProps(fixture), { id: fixture.id });
}

test.describe('Phase 1 accessibility', () => {
  test('REQ-120 · REQ-121 · axe-core reports no A or AA issue on a gallery of all seven charts', async ({ page }) => {
    await page.goto('/?gallery');
    await expect(page.locator('.sp-gallery .sp-root[data-status="ready"]')).toHaveCount(7);
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  for (const fixture of FIXTURES.filter((f) => f.chart !== 'LineChart' && f.substrate === 'cream' && f.mode === 'ink')) {
    test(`REQ-121 · ${fixture.chart}: the tabular alternative is reachable, one row per item`, async ({ page }) => {
      const model = modelOf(fixture);
      await page.goto(`/?fixture=${fixture.id}`);
      const table = page.locator('.sp-harness').getByRole('table', { name: model.name });
      await expect(table).toHaveCount(1);
      await expect(table.getByRole('row')).toHaveCount(model.table.rows.length + 1);
    });

    test(`REQ-122 · ${fixture.chart}: Tab reaches the chart and arrows traverse its items, announcing each`, async ({ page }) => {
      const model = modelOf(fixture);
      const say = (key: string, from: ActiveItem | null) => {
        const next = stepActive(model.geometry, from, key) ?? null;
        return { next, text: next ? readout(model, next).announcement : '' };
      };
      await page.goto(`/?fixture=${fixture.id}`);
      await page.locator('.sp-harness .sp-root[data-status="ready"]').waitFor();
      await page.keyboard.press('Tab');
      const root = page.locator('.sp-harness .sp-root');
      await expect(root).toBeFocused();
      const live = root.locator('.sp-live');
      const first = say('Home', null);
      await expect(live).toHaveText(first.text);
      await page.keyboard.press('ArrowRight');
      await expect(live).toHaveText(say('ArrowRight', first.next).text);
      await page.keyboard.press('End');
      await expect(live).toHaveText(say('End', first.next).text);
    });
  }
});
