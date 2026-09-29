import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { UI_PAGE } from '../examples/harness/index.js';
import { APPS, type AppName } from '../playwright.config';

/**
 * Phase 6 of feature-002: the `/ui` page of every example app —the 17 components in three
 * panels— end to end. T-157 (server HTML, hydration), T-158 (keyboard, forms, focus, target size,
 * motion, rtl, the other engines) and T-159 (axe).
 */
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const appOf = (name: string) => APPS[name as AppName];
const SLUGS = [...new Set(UI_PAGE.panels[0]!.sections.flatMap((s) => s.items.map((i) => i.component)))];

async function open(page: Page): Promise<Locator> {
  await page.goto('/ui');
  if (appOf(test.info().project.name).ssr) await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  const panel = page.locator('[data-panel="silverpoint"]');
  await expect(panel.locator('.sp-ui.sp-tabs')).toHaveCount(1);
  return panel;
}

/** WCAG relative luminance contrast of two `rgb(…)` colours. */
function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => Number(v) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

test.describe('the UI page (T-157)', () => {
  test('REQ-329 · REQ-331 · /ui shows three panels, each with all 17 components, and no error', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    page.on('pageerror', (error) => errors.push(error.message));
    await open(page);
    await expect(page.locator('h1')).toContainText(appOf(info.project.name).framework === 'Vue' ? 'Vue' : appOf(info.project.name).framework === 'Angular' ? 'Angular' : 'React');
    expect(SLUGS).toHaveLength(17);
    for (const panel of UI_PAGE.panels) {
      const root = page.locator(`[data-panel="${panel.key}"]`);
      await expect(root.getByRole('heading', { level: 2 })).toHaveText(panel.title);
      for (const slug of SLUGS) expect(await root.locator(`.sp-ui.sp-${slug}`).count(), `${panel.key} ${slug}`).toBeGreaterThan(0);
      await expect(root.locator(`.sp-ui[data-mode="${panel.mode}"]`).first()).toBeVisible();
    }
    // C-5: the Card holds a chart.
    await expect(page.locator('[data-panel="silverpoint"] .sp-card svg.sp-chart')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('REQ-329 · a server-rendered UI page ships every component and hydrates with no mismatch', async ({ page, request }, info) => {
    test.skip(!appOf(info.project.name).ssr, 'client-rendered app');
    const html = await (await request.get('/ui')).text();
    for (const slug of SLUGS) expect(html, slug).toContain(`sp-ui sp-${slug} `);
    const messages: string[] = [];
    page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
    page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
    await open(page);
    expect(messages.filter((m) => /hydrat|mismatch|did not match|NG05\d\d/i.test(m))).toEqual([]);
  });
});

test.describe('keyboard, forms, focus and motion (T-158)', () => {
  test('REQ-315 · REQ-326 · Tabs: arrows select through the core, skip the disabled tab and wrap; the panel follows', async ({ page }) => {
    const panel = await open(page);
    const tabs = panel.locator('.sp-tabs [role="tab"]');
    await expect(tabs).toHaveText(['Overview', 'Traffic', 'Errors', 'Settings']);
    await panel.locator('.sp-tabs [aria-selected="true"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(2)).toBeFocused();
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(0)).toBeFocused();
    await expect(panel.locator('.sp-tabs [role="tabpanel"]:not([hidden])')).toHaveText('Overview: the charts of this view.');
    await page.keyboard.press('End');
    await expect(tabs.nth(2)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tabs.nth(0)).toBeFocused();
  });

  test('REQ-315 · RadioGroup, Segmented and Rate: arrows move and select, one tab stop each', async ({ page }) => {
    const panel = await open(page);
    await panel.locator('.sp-radio-group input:checked').focus();
    await page.keyboard.press('ArrowDown');
    await expect(panel.locator('.sp-radio-group input:checked')).toHaveValue('cyanotype');
    await panel.locator('.sp-segmented input:checked').focus();
    await page.keyboard.press('ArrowRight');
    await expect(panel.locator('.sp-segmented input:checked')).toHaveValue('month');
    await expect(panel.locator('.sp-segmented [data-key="month"] [part~="sp-heighten"]')).toHaveCount(1);
    await panel.locator('.sp-rate input:checked').focus();
    await page.keyboard.press('ArrowRight');
    await expect(panel.locator('.sp-rate input:checked')).toHaveValue('4');
    await expect(panel.locator('.sp-rate [data-filled="true"]')).toHaveCount(4);
    // One tab stop: Tab leaves the segmented control for the next widget.
    await panel.locator('.sp-segmented input:checked').focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.closest('.sp-segmented') === null)).toBe(true);
  });

  test('REQ-321 · under dir="rtl" the horizontal arrows are mirrored', async ({ page }) => {
    const panel = await open(page);
    await panel.locator('.sp-segmented').evaluate((el) => el.setAttribute('dir', 'rtl'));
    await panel.locator('.sp-segmented input:checked').focus();
    await page.keyboard.press('ArrowRight');
    await expect(panel.locator('.sp-segmented input:checked')).toHaveValue('day');
  });

  test('REQ-323 · a native form submits every value of the panel', async ({ page }) => {
    const panel = await open(page);
    const data = await panel.evaluate((form) => Object.fromEntries(new FormData(form as HTMLFormElement)));
    expect(data).toEqual({ q: '', city: 'Caracas', baseline: 'on', precision: 'on', ground: 'silverpoint', quality: '3', volume: '30', period: 'week' });
  });

  test('REQ-316 · the focus ring is an exact outline of at least 2 px, 3:1 against the substrate', async ({ page }) => {
    const panel = await open(page);
    await panel.locator('.sp-button').first().focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const ring = await panel.locator('.sp-button').first().evaluate((el) => {
      const style = getComputedStyle(el);
      return { width: parseFloat(style.outlineWidth), style: style.outlineStyle, color: style.outlineColor, ground: getComputedStyle(el.closest('.sp-ui-page-panel')!).backgroundColor };
    });
    expect(ring.style).toBe('solid');
    expect(ring.width).toBeGreaterThanOrEqual(2);
    expect(contrast(ring.color, ring.ground)).toBeGreaterThanOrEqual(3);
  });

  test('REQ-317 · I-20 · every interactive target measures at least 24 × 24 px', async ({ page }) => {
    await open(page);
    const small = await page.evaluate(() => {
      const targets = document.querySelectorAll('.sp-ui-page :is(button.sp-ui, .sp-ui-tab, .sp-ui-close, label.sp-checkbox, label.sp-switch, .sp-ui-item, .sp-input .sp-ui-box, .sp-slider .sp-ui-rail)');
      return [...targets]
        .map((el) => ({ el, box: el.getBoundingClientRect() }))
        .filter(({ box }) => box.width < 24 || box.height < 24)
        .map(({ el, box }) => `${el.className} ${box.width}×${box.height}`);
    });
    expect(small).toEqual([]);
  });

  test('REQ-320 · with reduced motion nothing moves; without it, the indeterminate progress does', async ({ page }) => {
    const panel = await open(page);
    const fill = panel.locator('.sp-progress[data-indeterminate="true"] [part="sp-fill"]').first();
    const moving = () => fill.evaluate((el) => getComputedStyle(el).animationName);
    expect(await moving()).toBe('none');
    const transitions = await page.evaluate(() => [...document.querySelectorAll('.sp-ui-page *')].filter((el) => getComputedStyle(el).transitionDuration.split(',').some((d) => parseFloat(d) > 0)).length);
    expect(transitions).toBe(0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(await moving()).toBe('sp-ui-sweep');
  });

  test('REQ-314 · REQ-315 · Firefox and WebKit render the page and run the same keyboard', async ({ playwright }, info) => {
    test.skip(info.project.name !== 'vite-react', 'once, against one app');
    for (const type of [playwright.firefox, playwright.webkit]) {
      // The project's `chromium` channel is Chromium's alone: the other engines launch without one.
      const browser = await type.launch({ channel: undefined });
      try {
        const page = await browser.newPage({ baseURL: `http://localhost:${APPS['vite-react'].port}`, reducedMotion: 'reduce' });
        const panel = await open(page);
        for (const slug of SLUGS) expect(await panel.locator(`.sp-ui.sp-${slug}`).count(), `${type.name()} ${slug}`).toBeGreaterThan(0);
        await panel.locator('.sp-tabs [aria-selected="true"]').focus();
        await page.keyboard.press('ArrowRight');
        await expect(panel.locator('.sp-tabs [role="tab"]').nth(2)).toHaveAttribute('aria-selected', 'true');
      } finally {
        await browser.close();
      }
    }
  });
});

test.describe('accessibility audit (T-159)', () => {
  test('REQ-313 · REQ-314 · REQ-318 · REQ-331 · axe-core reports no A or AA issue on the UI page', async ({ page }) => {
    await open(page);
    // A frame is an ink line drawn as `background: var(--sp-ink)` under a CSS mask; axe reads that
    // as a solid backdrop for the text above it (1.5:1 on ink) though the text sits on the
    // substrate. Frames and tone tiles carry no text: hide them for the reading, and leave their
    // own contrast to the 11 UI pairs of the palette test (REQ-313).
    await page.addStyleTag({ content: ".sp-ui [part='sp-frame'], .sp-ui [part='sp-tone'] { display: none !important; }" });
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test('REQ-318 · roles: progressbar with its value, the current step, alert and status, a busy skeleton', async ({ page }) => {
    const panel = await open(page);
    await expect(panel.getByRole('progressbar', { name: 'Upload' })).toHaveAttribute('aria-valuenow', '40');
    await expect(panel.locator('.sp-steps [aria-current="step"]')).toContainText('Configure');
    await expect(panel.getByRole('alert')).toHaveCount(2);
    await expect(panel.getByRole('status')).toHaveCount(2);
    await expect(panel.locator('.sp-skeleton[aria-busy="true"]')).toHaveCount(1);
    await expect(panel.getByRole('separator')).toHaveCount(1);
  });
});
