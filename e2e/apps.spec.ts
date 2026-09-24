import { expect, test } from '@playwright/test';
import { DEMO_PROPS } from '../examples/harness/index.js';
import { lineChart } from '../packages/core/dist/index.js';
import { renderChart, toSVGString } from '../packages/grounds/dist/index.js';
import { compareSvg } from '../tools/svg-normalizer/normalize';
import { APPS, type AppName } from '../playwright.config';

/** The canonical render of the demo chart every home page shows. */
const demoCanonical = toSVGString(renderChart(lineChart, DEMO_PROPS, { id: 'unused' }));

const appOf = (name: string) => APPS[name as AppName];

test.describe('example apps', () => {
  test('REQ-093 · the app boots and shows the demo line chart', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('h1')).toContainText(appOf(info.project.name).framework);
    const chart = page.locator('.sp-harness .sp-root');
    await expect(chart).toHaveAttribute('data-status', 'ready');
    await expect(chart.locator('svg.sp-chart path[part="sp-heighten"]')).toHaveCount(1);
    await expect(chart.locator('svg.sp-chart')).toHaveAttribute('data-substrate', 'cream');
    expect(errors).toEqual([]);
  });

  test('REQ-182 · a fixture page renders exactly that fixture in the gate container', async ({ page }) => {
    await page.goto('/?fixture=line-chart--silverpoint--ochre--precision--md');
    const harness = page.locator('.sp-harness[data-gate]');
    await expect(harness).toHaveAttribute('data-size', 'md');
    await expect(harness.locator('svg.sp-chart')).toHaveAttribute('data-substrate', 'ochre');
    await expect(harness.locator('svg.sp-chart')).toHaveAttribute('data-mode', 'precision');
    await expect(harness.locator('svg.sp-chart title')).toHaveAttribute('id', 'line-chart--silverpoint--ochre--precision--md-title');
  });

  test('REQ-103 · REQ-109 · server-rendered apps ship the chart in the HTML and hydrate with no mismatch', async ({ page, request }, info) => {
    test.skip(!appOf(info.project.name).ssr, 'client-rendered app');
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/<svg[^>]*class="sp-chart/);
    const messages: string[] = [];
    page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
    page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
    expect(compareSvg(html, demoCanonical), 'server HTML').toEqual({ equal: true });
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    const hydrated = await page.locator('.sp-harness svg.sp-chart').evaluate((el) => el.outerHTML);
    expect(compareSvg(hydrated, demoCanonical), 'after hydration').toEqual({ equal: true });
    expect(messages.filter((m) => /hydrat|mismatch|did not match/i.test(m))).toEqual([]);
  });

  test('REQ-042 · overriding --sp-ink in a consumer stylesheet recolours without re-rendering', async ({ page }) => {
    await page.goto('/');
    const line = page.locator('.sp-harness svg.sp-chart path[data-role="encoding"][part="sp-ink"]').first();
    const before = await line.evaluate((el) => getComputedStyle(el).stroke);
    await line.evaluate((el) => {
      (window as unknown as { __marker: Element }).__marker = el;
    });
    await page.addStyleTag({ content: '.sp-root { --sp-ink: #8b0000; }' });
    const after = await line.evaluate((el) => getComputedStyle(el).stroke);
    expect(before).toBe('rgb(90, 94, 101)');
    expect(after).toBe('rgb(139, 0, 0)');
    expect(await line.evaluate((el) => (window as unknown as { __marker: Element }).__marker === el)).toBe(true);
  });

  // SP013 itself is a development warning, stripped from production builds (API Spec §11);
  // its emission is verified against the Vite dev server in e2e/dev.spec.ts.
  test('REQ-032 · with the typeface blocked the chart still renders', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route(/\.woff2(\?.*)?$/, (route) => route.abort());
    await page.goto('/');
    await expect(page.locator('.sp-harness .sp-root')).toHaveAttribute('data-status', 'ready');
    await expect(page.locator('.sp-harness svg.sp-chart')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
