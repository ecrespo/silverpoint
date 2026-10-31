import { expect, test, type Page } from '@playwright/test';
import { APPS, type AppName } from '../playwright.config';

/**
 * The deck page in the four apps (T-277, REQ-612): Next.js, Vue (`@vue/server-renderer`, prerendered)
 * and Angular SSR send the deck in their HTML —the current slide, its static chart, the controls
 * without the fullscreen button— and hydrate it with no mismatch; then the client half runs: the
 * keyboard moves the deck and the fence chart is replaced by the framework's.
 */
const HYDRATION_ERROR = /hydrat|mismatch|did not match|NG05\d\d/i;
const appOf = (name: string) => APPS[name as AppName];

async function open(page: Page): Promise<string[]> {
  const messages: string[] = [];
  page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
  // Hydration adopts the server's deck: record whether any `.sp-deck` element is ever removed.
  await page.addInitScript(() => {
    new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.removedNodes)
          if (node instanceof Element && (node.matches('.sp-deck') || node.querySelector('.sp-deck'))) (window as { deckRemoved?: boolean }).deckRemoved = true;
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/deck');
  await page.locator('.sp-deck[data-sp-page]').waitFor();
  return messages;
}

test.describe('deck page', () => {
  test('REQ-612 · the server sends the deck: the current slide, its static chart, and the controls', async ({ request }, info) => {
    test.skip(!appOf(info.project.name).ssr, 'client-rendered app');
    const html = await (await request.get('/deck')).text();
    expect(html).toMatch(/class="sp-deck sp-ground-silverpoint"[^>]*role="region"/);
    expect(html).toMatch(/data-sp-slide="1" data-sp-current(="")?/);
    expect(html).toMatch(/data-sp-slot="s1-c1"[\s\S]*?<svg[^>]*class="sp-chart/);
    expect(html).toContain('aria-label="Next slide"');
    expect(html).not.toContain('aria-label="Full screen"');
    expect(html).toContain('Slide 1 of 3');
  });

  test('REQ-612 · REQ-593 · it hydrates with no mismatch, then the keys move it and the chart hydrates', async ({ page }, info) => {
    const messages = await open(page);
    const deck = page.locator('.sp-deck');
    await expect(page.locator('[data-sp-slot="s1-c1"][data-sp-hydrated]')).toHaveCount(1);
    await expect(page.locator('[data-sp-slot="s1-c1"] svg.sp-chart')).toHaveCount(1);
    await deck.focus();
    await page.keyboard.press('ArrowRight');
    await expect(deck).toHaveAttribute('data-sp-page', '2');
    await expect(page.locator('.sp-deck-status')).toHaveText('Slide 2 of 3');
    // The first list item is a fragment: shown by the next step, not before.
    const first = page.locator('[data-sp-slide="2"] [data-marpit-fragment="1"]');
    await expect(first).toHaveAttribute('data-sp-pending', '');
    await page.keyboard.press('ArrowRight');
    await expect(first).not.toHaveAttribute('data-sp-pending');
    await page.keyboard.press('Home');
    await expect(deck).toHaveAttribute('data-sp-page', '1');
    // The live chart survived the trip.
    await expect(page.locator('[data-sp-slot="s1-c1"][data-sp-hydrated] svg.sp-chart')).toHaveCount(1);
    expect(messages.filter((m) => HYDRATION_ERROR.test(m)), info.project.name).toEqual([]);
    if (appOf(info.project.name).ssr) expect(await page.evaluate(() => (window as { deckRemoved?: boolean }).deckRemoved ?? false), 'the server deck was replaced').toBe(false);
  });
});
