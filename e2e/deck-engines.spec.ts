import { expect, test, type Page } from '@playwright/test';

/**
 * The deck in three engines (T-280, REQ-617, REQ-618, REQ-625): the `/deck` page of the four apps in
 * Chromium, Firefox and WebKit — scaling, hydration, clicks, keyboard, fragments, the hash, re-render,
 * unmount, print and the focus ring. Run by the `browser-deck` CI job (`SP_DECK_ENGINES=1`), locally
 * through tools/visual-gate/deck-engines-docker.sh, in the pinned image that carries the three.
 */
const HYDRATION_ERROR = /hydrat|mismatch|did not match|NG05\d\d/i;

/** Opens the deck page and waits for the client half: the viewport scaled, the chart hydrated. */
async function open(page: Page, url = '/deck'): Promise<string[]> {
  const messages: string[] = [];
  page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
  await page.goto(url);
  await page.locator('.sp-deck .sp-deck-viewport[data-sp-scaled]').waitFor();
  // A heading set in a fallback face sits elsewhere once EB Garamond arrives.
  await page.evaluate(() => document.fonts.ready.then(() => new Promise((resolve) => requestAnimationFrame(resolve))));
  return messages;
}

/** The slides of `DECK_DEMO`, which the `/deck` page draws (REQ-626). */
const TOTAL = 6;

const deck = (page: Page) => page.locator('.sp-deck');
const status = (page: Page) => page.locator('.sp-deck-status');
const chart = (page: Page) => page.locator('[data-sp-slot="s1-c1"][data-sp-hydrated] .sp-root');

/** The current slide's box and its first heading's, in CSS pixels. */
async function geometry(page: Page) {
  return page.locator('.sp-deck-slide[data-sp-current]').evaluate((slide) => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    return { viewport: box(slide.closest('.sp-deck-viewport')!), slide: box(slide), drawn: box(slide.querySelector(':scope > svg')!), heading: box(slide.querySelector('h1, h2')!) };
  });
}

test.describe('deck in three engines', () => {
  test('REQ-617 · a slide scales to its container, its aspect ratio and its layout kept exactly', async ({ page }) => {
    const seen: { left: number; top: number; height: number }[] = [];
    for (const width of [560, 1100]) {
      await page.setViewportSize({ width, height: 900 });
      await open(page);
      const { viewport, slide, drawn, heading } = await geometry(page);
      expect(Math.abs(slide.width - viewport.width), `width ${width}`).toBeLessThanOrEqual(1);
      expect(Math.abs(slide.height - (slide.width * 720) / 1280), `height ${width}`).toBeLessThanOrEqual(1);
      // The slide's drawing fills its box exactly: scaled, not clipped or shrunk.
      expect([drawn.x - slide.x, drawn.y - slide.y, drawn.width - slide.width, drawn.height - slide.height].map((d) => Math.abs(d) <= 1), `drawn ${width}`).toEqual([true, true, true, true]);
      seen.push({ left: (heading.x - slide.x) / slide.width, top: (heading.y - slide.y) / slide.height, height: heading.height / slide.height });
    }
    // The heading sits at the same place of the 1280×720 canvas at both widths (within 2 canvas px).
    const [narrow, wide] = seen as [(typeof seen)[0], (typeof seen)[0]];
    expect(Math.abs(narrow.left - wide.left) * 1280).toBeLessThanOrEqual(2);
    expect(Math.abs(narrow.top - wide.top) * 720).toBeLessThanOrEqual(2);
    expect(Math.abs(narrow.height - wide.height) * 720).toBeLessThanOrEqual(2);
  });

  test('REQ-612 · REQ-625 · the deck hydrates with no mismatch and its chart is the framework’s', async ({ page }, info) => {
    const messages = await open(page);
    await expect(chart(page)).toHaveAttribute('data-status', 'ready');
    expect(messages.filter((m) => HYDRATION_ERROR.test(m) || m.startsWith('pageerror')), info.project.name).toEqual([]);
  });

  test('REQ-618 · a hydrated chart in a scaled slide takes the pointer where it is drawn, and the keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 900 });
    await open(page);
    const root = chart(page);
    await expect(root).toHaveAttribute('data-status', 'ready');
    // A screen point inside each of two drawn sectors, found by geometry in the sector's own
    // coordinates (not by hit-testing, which is what is under test): scaled, the chart must take
    // the pointer there for that sector.
    const points = await root.locator('svg.sp-chart').evaluate((svg) => {
      const sectors = [...svg.querySelectorAll<SVGPathElement>('path[data-role="encoding"]')];
      return [0, 2].map((index) => {
        const sector = sectors[index]!;
        const toUser = sector.getScreenCTM()!.inverse();
        const r = sector.getBoundingClientRect();
        for (let fy = 0.1; fy < 1; fy += 0.05)
          for (let fx = 0.1; fx < 1; fx += 0.05) {
            const [x, y] = [r.x + r.width * fx, r.y + r.height * fy];
            if (sector.isPointInFill(new DOMPoint(x, y).matrixTransform(toUser))) return { x, y };
          }
        return null;
      });
    });
    expect(points.every(Boolean)).toBe(true);
    const readout = root.locator('.sp-readout');
    await page.mouse.move(points[0]!.x, points[0]!.y);
    await expect(readout).toBeVisible();
    const first = await readout.innerText();
    await page.mouse.move(points[1]!.x, points[1]!.y);
    await expect(readout).not.toHaveText(first);
    // The readout is drawn over the chart, not where the unscaled slide would put it.
    const [readoutBox, chartBox] = [await readout.boundingBox(), await root.boundingBox()];
    expect(readoutBox!.x + readoutBox!.width).toBeGreaterThan(chartBox!.x);
    expect(readoutBox!.x).toBeLessThan(chartBox!.x + chartBox!.width);
    expect(readoutBox!.y).toBeLessThan(chartBox!.y + chartBox!.height);
    // The chart's keyboard model wins while it has focus: the deck stays on its page.
    await page.mouse.move(0, 0);
    await root.focus();
    const live = root.locator('.sp-live');
    const before = await live.innerText();
    await page.keyboard.press('ArrowRight');
    await expect(live).not.toHaveText(before);
    // A key the chart leaves alone is not the deck's either while the chart has focus.
    await page.keyboard.press('PageDown');
    await expect(root).toBeFocused();
    await expect(deck(page)).toHaveAttribute('data-sp-page', '1');
  });

  test('REQ-613 · REQ-596 · the controls move the deck, a step at a time through the fragments', async ({ page }) => {
    await open(page);
    const next = page.getByRole('button', { name: 'Next slide' });
    await next.click();
    await expect(deck(page)).toHaveAttribute('data-sp-page', '2');
    await expect(status(page)).toHaveText(`Slide 2 of ${TOTAL}`);
    const first = page.locator('[data-sp-slide="2"] [data-marpit-fragment="1"]');
    await expect(first).toHaveAttribute('data-sp-pending', '');
    await next.click();
    await expect(first).not.toHaveAttribute('data-sp-pending');
    await page.getByRole('button', { name: 'Previous slide' }).click();
    await expect(first).toHaveAttribute('data-sp-pending', '');
    await expect(deck(page)).toHaveAttribute('data-sp-page', '2');
  });

  test('REQ-600 · REQ-596 · the keys move the deck and reveal its fragments', async ({ page }) => {
    await open(page);
    await deck(page).focus();
    await page.keyboard.press('ArrowRight');
    await expect(deck(page)).toHaveAttribute('data-sp-page', '2');
    const fragments = page.locator('[data-sp-slide="2"] [data-marpit-fragment]');
    await expect(fragments.and(page.locator('[data-sp-pending]'))).toHaveCount(3);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(fragments.and(page.locator('[data-sp-pending]'))).toHaveCount(1);
    await page.keyboard.press('ArrowLeft');
    await expect(fragments.and(page.locator('[data-sp-pending]'))).toHaveCount(2);
    await page.keyboard.press('End');
    await expect(deck(page)).toHaveAttribute('data-sp-page', String(TOTAL));
    await page.keyboard.press('Home');
    await expect(deck(page)).toHaveAttribute('data-sp-page', '1');
  });

  test('REQ-602 · the hash opens the deck on its page and follows it; another hash is left alone', async ({ page }) => {
    await open(page, '/deck#3');
    await expect(deck(page)).toHaveAttribute('data-sp-page', '3');
    await deck(page).focus();
    await page.keyboard.press('Home');
    await expect(page).toHaveURL(/\/deck#1$/);
    await open(page, '/deck#intro');
    await expect(deck(page)).toHaveAttribute('data-sp-page', '1');
    await deck(page).focus();
    await page.keyboard.press('ArrowRight');
    await expect(deck(page)).toHaveAttribute('data-sp-page', '2');
    expect(new URL(page.url()).hash).toBe('#intro');
  });

  test('REQ-610 · a new Markdown re-renders the deck: page clamped, the old chart gone, the keys still bound', async ({ page }) => {
    const messages = await open(page);
    await deck(page).focus();
    await page.keyboard.press('End');
    await expect(deck(page)).toHaveAttribute('data-sp-page', String(TOTAL));
    await page.getByRole('button', { name: 'Change the deck' }).click();
    await expect(status(page)).toHaveText('Slide 2 of 2');
    await expect(deck(page)).toHaveAttribute('data-sp-page', '2');
    await expect(page.locator('svg.sp-chart')).toHaveCount(0);
    await expect(page.locator('[data-sp-slide="1"] h1')).toHaveText('A shorter deck');
    await deck(page).focus();
    await page.keyboard.press('Home');
    await expect(deck(page)).toHaveAttribute('data-sp-page', '1');
    expect(messages.filter((m) => m.startsWith('pageerror'))).toEqual([]);
  });

  test('REQ-610 · removed, the deck leaves nothing bound: no key, no hash, no error', async ({ page }) => {
    const messages = await open(page);
    await deck(page).focus();
    await page.keyboard.press('End');
    await expect(page).toHaveURL(new RegExp(`#${TOTAL}$`));
    await page.getByRole('button', { name: 'Remove the deck' }).click();
    await expect(deck(page)).toHaveCount(0);
    await expect(page.locator('svg.sp-chart')).toHaveCount(0);
    await page.evaluate(() => history.replaceState(null, '', '#keep'));
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowLeft');
    expect(new URL(page.url()).hash).toBe('#keep');
    expect(messages.filter((m) => m.startsWith('pageerror'))).toEqual([]);
  });

  test('REQ-605 · printed, every slide is a page at the slide size, fragments shown, controls hidden', async ({ page }) => {
    await open(page);
    await page.emulateMedia({ media: 'print' });
    const slides = await page.locator('.sp-deck-slide').evaluateAll((all) =>
      all.map((slide) => {
        const r = slide.getBoundingClientRect();
        return [Math.round(r.width), Math.round(r.height)];
      }),
    );
    expect(slides).toEqual(Array.from({ length: TOTAL }, () => [1280, 720]));
    const hidden = await page.locator('[data-sp-slide="2"] [data-marpit-fragment]').evaluateAll((all) => all.filter((el) => getComputedStyle(el).visibility === 'hidden' || getComputedStyle(el).opacity === '0').length);
    expect(hidden).toBe(0);
    await expect(page.locator('.sp-deck-controls')).toBeHidden();
    await expect(status(page)).toBeHidden();
  });

  test('REQ-613 · Art. 5 · a control reached by Tab shows its focus ring', async ({ page }) => {
    await open(page);
    const next = page.getByRole('button', { name: 'Next slide' });
    await deck(page).focus();
    for (let i = 0; i < 12 && !(await next.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(next).toBeFocused();
    const ring = await next.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outline: s.outlineStyle, width: parseFloat(s.outlineWidth), shadow: s.boxShadow };
    });
    expect(ring.outline !== 'none' && ring.width >= 1 ? 'outline' : ring.shadow !== 'none' ? 'shadow' : 'none').not.toBe('none');
  });
});
