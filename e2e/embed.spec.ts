/**
 * The standalone file end to end (REQ-665, T-324; DD-062's carried rows): examples/embed-html in
 * Chromium, Firefox and WebKit — keyboard and pointer, resize, update and destroy, the element,
 * the boxes mounted on load, a page under `script-src 'self'; style-src 'self'`, the same page in a
 * `sandbox="allow-scripts"` frame (OQ-H2), a request log holding only the page's own files, and axe.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Records every request and every console error of the page and its frames. */
function watch(page: Page) {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  return { requests, errors };
}

const own = (base: string) => (url: string) => url.startsWith(base) || url.startsWith('data:');

test.describe('embed', () => {
  test('REQ-645 · REQ-646 · the element and the box are drawn, each one chart root', async ({ page, baseURL }) => {
    const seen = watch(page);
    await page.goto('/');
    await expect(page.locator('#element .sp-root svg.sp-chart')).toHaveCount(1);
    await expect(page.locator('#box .sp-root svg.sp-chart')).toHaveCount(1);
    await expect(page.locator('#api .sp-root svg.sp-chart')).toHaveCount(1);
    expect(seen.errors).toEqual([]);
    expect(seen.requests.filter((u) => !own(baseURL!)(u))).toEqual([]);
  });

  test('REQ-638 · keyboard: focus announces, arrows move, Enter selects', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('#api .sp-root');
    await root.focus();
    const live = page.locator('#api .sp-live');
    await expect(live).not.toHaveText('');
    const first = await live.textContent();
    await page.keyboard.press('ArrowRight');
    await expect(live).not.toHaveText(first ?? '');
    await page.keyboard.press('Enter');
    await expect(page.locator('#log')).toContainText('select');
    await expect(page.locator('#log')).toContainText('event sp-select');
  });

  test('REQ-638 · pointer: hovering the drawing shows the readout; Escape dismisses it', async ({ page }) => {
    await page.goto('/');
    const svg = page.locator('#api svg.sp-chart');
    await svg.scrollIntoViewIfNeeded();
    const box = (await svg.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
    await expect(page.locator('#api .sp-readout')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#api .sp-readout')).toHaveCount(0);
  });

  test('REQ-640 · a chart without width follows its container', async ({ page }) => {
    await page.goto('/');
    const width = () => page.locator('#api svg.sp-chart').getAttribute('width');
    const before = await width();
    await page.setViewportSize({ width: 520, height: 700 });
    await expect.poll(width).not.toBe(before);
  });

  test('REQ-642 · update redraws in place; destroy removes the chart', async ({ page }) => {
    await page.goto('/');
    const root = await page.locator('#api .sp-root').elementHandle();
    await page.click('#update');
    await expect(page.locator('#api svg.sp-chart')).toHaveAttribute('data-mode', 'precision');
    expect(await root!.evaluate((node) => node.isConnected)).toBe(true);
    await page.click('#destroy');
    await expect(page.locator('#api .sp-root')).toHaveCount(0);
  });

  test("REQ-643 · REQ-665 · under script-src 'self'; style-src 'self': drawn, no violation, own requests only", async ({ page, baseURL }) => {
    const seen = watch(page);
    await page.goto('/csp.html');
    await expect(page.locator('.sp-root svg.sp-chart')).toHaveCount(2);
    expect(seen.errors).toEqual([]);
    expect(seen.requests.filter((u) => !own(baseURL!)(u))).toEqual([]);
  });

  test('OQ-H2 · REQ-665 · the strict page in a sandbox="allow-scripts" frame: drawn and styled', async ({ page }) => {
    const seen = watch(page);
    await page.goto('/frame.html');
    const frame = page.frameLocator('iframe');
    await expect(frame.locator('.sp-root svg.sp-chart')).toHaveCount(2);
    const styled = await frame.locator('svg.sp-chart').first().evaluate((svg) => getComputedStyle(svg.querySelector('[part]')!).getPropertyValue('stroke') !== '');
    expect(styled).toBe(true);
    expect(seen.errors).toEqual([]);
  });

  test('REQ-665 · Art. 5 · axe finds no violation on the page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#element .sp-root')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).include('main').analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});
