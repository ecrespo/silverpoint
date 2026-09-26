import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { DASHBOARD_WIDTHS, REFERENCE_DASHBOARD } from '../examples/harness/index.js';
import { APPS, type AppName } from '../playwright.config';

/**
 * T-118: the `/dashboard` page of every example app — the `ops` reference dashboard (REQ-221) —
 * end to end: server HTML and hydration, measured re-render, keyboard order, axe.
 */
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const appOf = (name: string) => APPS[name as AppName];
/** The chart titles in the layout's reading order. */
const READING_ORDER = REFERENCE_DASHBOARD.props.layout!.cells!.map((cell) => REFERENCE_DASHBOARD.children.find((child) => child.cell === cell.id)!.props.title);

async function ready(page: Page): Promise<void> {
  const cells = page.locator('section.sp-dashboard article');
  await expect(cells).toHaveCount(REFERENCE_DASHBOARD.children.length);
  await expect(page.locator('section.sp-dashboard .sp-root[data-status="ready"]')).toHaveCount(REFERENCE_DASHBOARD.children.length);
}

test.describe('the reference dashboard page', () => {
  test('REQ-221 · REQ-200 · /dashboard shows ops: a named section, twelve cards, no error', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText(appOf(info.project.name).framework);
    await ready(page);
    await expect(page.getByRole('region', { name: 'Operations' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('REQ-221 · REQ-207 · REQ-103 · REQ-109 · a server-rendered dashboard ships its charts and hydrates with no mismatch, then fits its cells', async ({ page, request }, info) => {
    test.skip(!appOf(info.project.name).ssr, 'client-rendered app');
    const html = await (await request.get('/dashboard')).text();
    expect(html).toMatch(/<section[^>]*class="sp-dashboard/);
    expect(html.match(/<svg[^>]*class="sp-chart/g)).toHaveLength(REFERENCE_DASHBOARD.children.length);
    // At the default ssrWidth, 1200 (lg, 4 columns, gap 16), a one-column card is 288 wide.
    expect(html).toMatch(/viewBox="0 0 288 240"/);
    const messages: string[] = [];
    page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
    page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
    await page.goto('/dashboard');
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await ready(page);
    expect(messages.filter((m) => /hydrat|mismatch|did not match/i.test(m))).toEqual([]);
    // Then measured: at 800 px the dashboard is md, two columns; every chart is as wide as its card.
    await expect
      .poll(() =>
        page.locator('section.sp-dashboard article').evaluateAll((cells) =>
          cells.every((cell) => {
            const svg = cell.querySelector('svg.sp-chart');
            const width = Number(svg?.getAttribute('viewBox')?.split(' ')[2]);
            return Math.abs(width - cell.getBoundingClientRect().width) < 1;
          }),
        ),
      )
      .toBe(true);
  });

  for (const width of DASHBOARD_WIDTHS) {
    test(`REQ-215 · REQ-203 · at ${width} px, Tab visits the cards in reading order, and leaves`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dashboard');
      await ready(page);
      const visited: string[] = [];
      for (let i = 0; i < READING_ORDER.length; i += 1) {
        await page.keyboard.press('Tab');
        visited.push(await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName ?? ''));
      }
      expect(visited).toEqual(READING_ORDER);
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.closest('section.sp-dashboard') === null)).toBe(true);
    });
  }

  test('REQ-221 · REQ-214 · axe-core reports no A or AA issue on the dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await ready(page);
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
});
