import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { QUICKSTARTS } from '../docs/site/src/quickstart';
import { compareSvg } from '../tools/svg-normalizer/normalize';
import { CATALOG } from '../tools/visual-gate/catalog';

/**
 * The documentation site (PRD §5.1, Implementation Plan Phase 4): gallery, ground playground,
 * props reference, the quickstart, and one fixture rendered by all three adapters (REQ-100).
 */
const props = JSON.parse(readFileSync(new URL('../docs/site/generated/props.json', import.meta.url), 'utf8')) as {
  charts: { chart: string; own: { name: string; doc: string }[] }[];
};

const errorsOf = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
};

test.describe('documentation site', () => {
  test('PRD §4.2 · the home page gives the quickstart for React, Vue and Angular', async ({ page }) => {
    const errors = errorsOf(page);
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('silverpoint');
    for (const quickstart of QUICKSTARTS) {
      const section = page.locator(`section[data-framework="${quickstart.framework}"]`);
      await expect(section.locator('h3')).toHaveText(quickstart.framework);
      await expect(section).toContainText(quickstart.install);
      for (const file of quickstart.files) await expect(section).toContainText(file.path);
    }
    expect(errors).toEqual([]);
  });

  test('PRD §5.1 · the gallery draws every chart of the catalog', async ({ page }) => {
    const errors = errorsOf(page);
    await page.goto('/#/gallery');
    await expect(page.locator('.sp-root[data-status="ready"]')).toHaveCount(CATALOG.length);
    for (const { chart, slug } of CATALOG) await expect(page.locator(`a[href="#/chart/${slug}"]`), chart).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('PRD §5.1 · the ground playground changes substrate, mode, fill, size and seed', async ({ page }) => {
    const errors = errorsOf(page);
    await page.goto('/#/playground');
    const svg = page.locator('main svg.sp-chart');
    await page.getByLabel('Chart', { exact: true }).selectOption('DonutChart');
    await expect(svg.locator('title')).toContainText('Donut');
    await page.getByLabel('Substrate', { exact: true }).selectOption('ochre');
    await expect(svg).toHaveAttribute('data-substrate', 'ochre');
    await page.getByLabel('Mode', { exact: true }).selectOption('precision');
    await expect(svg).toHaveAttribute('data-mode', 'precision');
    await page.getByLabel('Mode', { exact: true }).selectOption('ink');
    await page.getByLabel('Hatch fill', { exact: true }).selectOption('per-shape');
    await expect(svg.locator('pattern')).toHaveCount(0);
    await page.getByLabel('Size', { exact: true }).selectOption('lg');
    expect(Math.round((await svg.boundingBox())?.width ?? 0)).toBe(640);
    const before = await svg.innerHTML();
    await page.getByLabel('Seed', { exact: true }).fill('7');
    await expect.poll(() => svg.innerHTML()).not.toBe(before);
    await expect(page.locator('main pre')).toContainText('<DonutChart');
    await expect(page.locator('main pre')).toContainText('substrate="ochre"');
    expect(errors).toEqual([]);
  });

  test('REQ-028 · the ground playground switches to cyanotype: Prussian blue, tone by weight, no hatching', async ({ page }) => {
    const errors = errorsOf(page);
    await page.goto('/#/playground');
    const svg = page.locator('main svg.sp-chart');
    await page.getByLabel('Chart', { exact: true }).selectOption('StackedBarChart');
    await page.getByLabel('Ground', { exact: true }).selectOption('cyanotype');
    await expect(svg).toHaveClass(/sp-ground-cyanotype/);
    await expect(svg).toHaveAttribute('data-substrate', 'prussian');
    await expect(page.getByLabel('Substrate', { exact: true }).locator('option')).toHaveText(['prussian']);
    await expect(page.getByLabel('Hatch fill', { exact: true })).toBeDisabled();
    await expect(svg.locator('pattern')).toHaveCount(0);
    await expect(svg.locator('path[data-weight]').first()).toBeVisible();
    // Painted by the ground's variables: the substrate is Prussian blue.
    expect(await svg.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(27, 63, 107)');
    await expect(page.locator('main pre')).toContainText('ground="cyanotype"');
    await page.getByLabel('Ground', { exact: true }).selectOption('silverpoint');
    await expect(svg).toHaveAttribute('data-substrate', 'cream');
    await expect(svg.locator('pattern').first()).toBeAttached();
    expect(errors).toEqual([]);
  });

  test('PRD §5.1 · a chart page draws the chart and lists its own props from the types', async ({ page }) => {
    await page.goto('/#/chart/donut-chart');
    await expect(page.locator('h2')).toHaveText('DonutChart');
    await expect(page.locator('main .sp-root[data-status="ready"]')).toHaveCount(1);
    const own = props.charts.find((c) => c.chart === 'DonutChart')!.own;
    const rows = page.locator('table.props tbody tr');
    await expect(rows).toHaveCount(own.length);
    await expect(rows.filter({ hasText: 'legend' })).toContainText(own.find((p) => p.name === 'legend')!.doc);
  });

  test('REQ-200 · the dashboard page draws a live dashboard, its code in every adapter and its reference from the types', async ({ page }) => {
    await page.goto('/#/dashboard');
    await expect(page.locator('section.sp-dashboard .sp-root[data-status="ready"]').first()).toBeVisible();
    for (const adapter of ['React', 'Vue', 'Angular']) await expect(page.getByRole('heading', { name: adapter })).toBeVisible();
    await expect(page.getByRole('table', { name: /Dashboard props/ })).toContainText('ssrWidth');
    await expect(page.getByRole('table', { name: /Breakpoints/ })).toContainText('1024');
    await expect(page.getByText(/row end/)).toBeVisible();
  });

  test('REQ-100 · the parity page shows one fixture rendered identically by React, Vue and Angular', async ({ page }) => {
    await page.goto('/#/adapters');
    const figures = page.locator('figure[data-adapter]');
    await expect(figures).toHaveCount(9);
    for (const fixture of await page.locator('section[data-fixture]').all()) {
      const id = (await fixture.getAttribute('data-fixture')) ?? '';
      // Each copy's ids carry its adapter as a prefix, so one page repeats none; the render is the same.
      const [react, vue, angular] = await Promise.all(
        ['react', 'vue', 'angular'].map(async (a) =>
          (await fixture.locator(`figure[data-adapter="${a}"] svg.sp-chart`).evaluate((el) => el.outerHTML)).split(`${a}-${id}`).join(id),
        ),
      );
      expect(compareSvg(vue!, react!)).toEqual({ equal: true });
      expect(compareSvg(angular!, react!)).toEqual({ equal: true });
      await expect(fixture).toContainText('identical');
      // Drawn with the ground's ink, as in every adapter: the root carries the ground and substrate.
      for (const figure of await fixture.locator('figure').all()) {
        await expect(figure.locator('.sp-root')).toHaveAttribute('data-substrate', (await figure.locator('svg.sp-chart').getAttribute('data-substrate')) ?? '');
        const stroke = await figure.locator('svg.sp-chart path[part="sp-ink"]').first().evaluate((el) => getComputedStyle(el).stroke);
        expect(stroke).not.toBe('none');
      }
    }
  });

  for (const route of ['/', '/#/gallery', '/#/playground', '/#/chart/sankey-chart', '/#/adapters', '/#/dashboard']) {
    test(`WCAG 1.4.10 · ${route} reflows at 320 CSS px without horizontal scrolling`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(route);
      await page.locator('.sp-root').first().waitFor();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    });
  }

  for (const route of ['/', '/#/gallery', '/#/playground', '/#/chart/sankey-chart', '/#/adapters', '/#/dashboard']) {
    test(`REQ-120 · WCAG 2.1 AA · axe finds no A or AA issue on ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      await page.locator('.sp-root').first().waitFor();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
});
