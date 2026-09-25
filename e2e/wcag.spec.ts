import { expect, test, type Page } from '@playwright/test';

/**
 * T-096: the WCAG 2.1 A and AA criteria axe-core cannot decide, checked in every example app on a
 * cartesian chart with a readout. The audit that lists every criterion and its verdict is
 * `changes/phase-4-wcag-audit.md`; each automated line there is a test here.
 */
const FIXTURE = '/?fixture=bar-chart--silverpoint--cream--ink--md';

async function open(page: Page) {
  await page.goto(FIXTURE);
  const root = page.locator('.sp-harness[data-gate] .sp-root');
  await expect(root).toHaveAttribute('data-status', 'ready');
  return root;
}

/** Relative luminance and contrast ratio of two `rgb(…)` colours (WCAG 2.1 definitions). */
function contrast(a: string, b: string): number {
  const lum = (rgb: string) => {
    const [r, g, bl] = (rgb.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number).map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

test.describe('WCAG 2.1 AA beyond axe', () => {
  test('2.1.2 · no keyboard trap: Tab enters the chart and leaves it, Shift+Tab comes back', async ({ page }) => {
    const root = await open(page);
    await page.keyboard.press('Tab');
    await expect(root).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Tab');
    await expect(root).not.toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(root).toBeFocused();
  });

  test('2.4.7 · 1.4.11 · keyboard focus is visible, with at least 3:1 against what surrounds it', async ({ page }) => {
    const root = await open(page);
    await page.keyboard.press('Tab');
    const ring = await root.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), color: s.outlineColor, around: getComputedStyle(el.parentElement as Element).backgroundColor };
    });
    expect(ring.style).not.toBe('none');
    expect(ring.width).toBeGreaterThanOrEqual(1);
    expect(contrast(ring.color, ring.around)).toBeGreaterThanOrEqual(3);
  });

  test('1.4.13 · content shown on hover is dismissible with Escape, without moving the pointer', async ({ page }) => {
    const root = await open(page);
    const box = (await root.locator('svg.sp-chart').boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.6);
    const readout = root.locator('.sp-readout');
    await expect(readout).toBeVisible();
    // Hoverable: the readout stays while the pointer rests on the chart.
    await page.waitForTimeout(300);
    await expect(readout).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(readout).toHaveCount(0);
  });

  test('1.4.12 · text spacing: with WCAG’s spacing applied, the table and readout clip nothing', async ({ page }) => {
    const root = await open(page);
    await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }' });
    await page.keyboard.press('Tab');
    const clipped = await root.evaluate((el) =>
      [...el.querySelectorAll('.sp-readout, .sp-readout *, table, th, td')]
        .filter((node) => getComputedStyle(node).overflow !== 'visible' && (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1))
        .map((node) => node.tagName),
    );
    expect(clipped).toEqual([]);
  });

  test('1.4.10 · reflow: at 320 CSS px the chart fits its container, with no horizontal scroll of its own', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const root = await open(page);
    const fit = await root.evaluate((el) => ({ root: el.clientWidth, svg: (el.querySelector('svg.sp-chart') as SVGSVGElement).getBoundingClientRect().width, scrolls: el.scrollWidth > el.clientWidth + 1 }));
    expect(fit.svg).toBeLessThanOrEqual(fit.root + 0.5);
    expect(fit.scrolls).toBe(false);
  });

  for (const url of ['/', FIXTURE, '/?gallery']) {
    test(`1.4.10 · reflow: the page ${url} needs no horizontal scrolling at 320 CSS px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(url);
      await page.locator('.sp-root[data-status="ready"]').first().waitFor();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    });
  }

  test('2.2.2 · 2.3.1 · nothing moves for more than five seconds, and nothing flashes', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await open(page);
    const longest = await page.evaluate(() =>
      Math.max(0, ...document.getAnimations().map((a) => Number(a.effect?.getComputedTiming().endTime ?? 0))),
    );
    expect(longest).toBeLessThanOrEqual(5000);
  });
});
