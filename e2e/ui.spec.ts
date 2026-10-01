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
    if (!/^rgba?\(/.test(c)) throw new Error(`not an rgb() colour: ${c}`);
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
    // Production React reports a mismatch only as a minified error (#418, #423): no error at all.
    expect(messages.filter((m) => /hydrat|mismatch|did not match|NG05\d\d/i.test(m) || /^(error|pageerror):/.test(m))).toEqual([]);
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

  test('REQ-315 · RadioGroup, Segmented and Rate: arrows move and select, Home and End, wrap', async ({ page }) => {
    const panel = await open(page);
    const checked = (slug: string) => panel.locator(`.sp-${slug} input:checked`);
    await checked('radio-group').focus();
    await page.keyboard.press('ArrowDown');
    await expect(checked('radio-group')).toHaveValue('cyanotype');
    await page.keyboard.press('ArrowDown');
    await expect(checked('radio-group')).toHaveValue('silverpoint');
    await page.keyboard.press('End');
    await expect(checked('radio-group')).toHaveValue('cyanotype');
    await expect(checked('radio-group')).toBeFocused();
    await checked('segmented').focus();
    await page.keyboard.press('ArrowRight');
    await expect(checked('segmented')).toHaveValue('month');
    await expect(panel.locator('.sp-segmented [data-key="month"] [part~="sp-heighten"]')).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await expect(checked('segmented')).toHaveValue('year');
    await page.keyboard.press('ArrowRight');
    await expect(checked('segmented')).toHaveValue('day');
    await page.keyboard.press('End');
    await expect(checked('segmented')).toHaveValue('year');
    await page.keyboard.press('Home');
    await expect(checked('segmented')).toHaveValue('day');
    await expect(checked('segmented')).toBeFocused();
    await checked('rate').focus();
    await page.keyboard.press('ArrowRight');
    await expect(checked('rate')).toHaveValue('4');
    await expect(panel.locator('.sp-rate [data-filled="true"]')).toHaveCount(4);
    await page.keyboard.press('End');
    await expect(checked('rate')).toHaveValue('5');
    await page.keyboard.press('Home');
    await expect(checked('rate')).toHaveValue('1');
    await expect(panel.locator('.sp-rate [data-filled="true"]')).toHaveCount(1);
  });

  test('REQ-315 · a composite is one tab stop: Tab leaves Tabs, RadioGroup, Segmented and Rate', async ({ page }) => {
    const panel = await open(page);
    // The group Tab leaves: for Tabs the tablist, whose next stop is its own panel (APG).
    for (const [group, current] of [['.sp-tabs [role="tablist"]', '[aria-selected="true"]'], ['.sp-radio-group', 'input:checked'], ['.sp-segmented', 'input:checked'], ['.sp-rate', 'input:checked']]) {
      await panel.locator(`${group} ${current}`).focus();
      await page.keyboard.press('Tab');
      expect(await page.evaluate((g) => document.activeElement?.closest(g) === null, group), group).toBe(true);
    }
  });

  test('REQ-321 · under an ancestor\'s dir="rtl" the horizontal arrows are mirrored, native or not', async ({ page }) => {
    const panel = await open(page);
    await panel.evaluate((el) => el.setAttribute('dir', 'rtl'));
    await panel.locator('.sp-segmented input:checked').focus();
    await page.keyboard.press('ArrowRight');
    await expect(panel.locator('.sp-segmented input:checked')).toHaveValue('day');
    // Tabs are buttons, not radios: the browser mirrors nothing, the core does.
    const tabs = panel.locator('.sp-tabs [role="tab"]');
    await panel.locator('.sp-tabs [aria-selected="true"]').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(tabs.nth(2)).toBeFocused();
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
  });

  test('REQ-323 · a native form submits every value of the panel, after a keyboard change too', async ({ page }) => {
    const panel = await open(page);
    // Entries, not an object: a duplicate name would show.
    const entries = () => panel.evaluate((form) => [...new FormData(form as HTMLFormElement)].map(([k, v]) => [k, String(v)]));
    expect(await entries()).toEqual(
      Object.entries({ q: '', city: 'Caracas', baseline: 'on', precision: 'on', ground: 'silverpoint', quality: '3', volume: '30', period: 'week' }),
    );
    await panel.locator('.sp-segmented input:checked').focus();
    await page.keyboard.press('ArrowRight');
    await panel.locator('.sp-ui-range').focus();
    await page.keyboard.press('ArrowRight');
    await panel.locator('.sp-checkbox input:checked').first().press('Space');
    const after = Object.fromEntries(await entries());
    expect(after).toMatchObject({ period: 'month', volume: '31' });
    expect(after).not.toHaveProperty('baseline');
  });

  test('REQ-316 · the focus ring is an exact outline of at least 2 px, 3:1 against the substrate, on every panel', async ({ page }) => {
    await open(page);
    const kinds = ['.sp-button', '.sp-input input', '.sp-checkbox input', '.sp-switch input', '.sp-radio-group input:checked', '.sp-segmented input:checked', '.sp-tabs [aria-selected="true"]', '.sp-ui-range', '.sp-rate input:checked', '.sp-tag .sp-ui-close'];
    for (const { key } of UI_PAGE.panels) {
      for (const kind of kinds) {
        const target = page.locator(`[data-panel="${key}"] ${kind}`).first();
        await target.focus();
        // A keyboard focus: the ring is :focus-visible's.
        await page.keyboard.press('Shift');
        const ring = await target.evaluate((el) => {
          // The ring sits on the focused element or on the frame that wraps a native control.
          const holder = [el, el.closest('.sp-ui-box'), el.closest('.sp-ui-item'), el.closest('.sp-ui')].find((h) => h && getComputedStyle(h).outlineStyle !== 'none') as Element | undefined;
          const style = holder ? getComputedStyle(holder) : getComputedStyle(el);
          const thumb = el.closest('.sp-slider')?.querySelector("[part~='sp-thumb']");
          const ts = thumb ? getComputedStyle(thumb) : null;
          const s = ts && ts.outlineStyle !== 'none' ? ts : style;
          return { width: parseFloat(s.outlineWidth), style: s.outlineStyle, color: s.outlineColor, ground: getComputedStyle(el.closest('.sp-ui-page-panel')!).backgroundColor };
        });
        expect(ring.style, `${key} ${kind}`).toBe('solid');
        expect(ring.width, `${key} ${kind}`).toBeGreaterThanOrEqual(2);
        expect(contrast(ring.color, ring.ground), `${key} ${kind}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test('REQ-317 · I-20 · every interactive target measures at least 24 × 24 px', async ({ page }) => {
    await open(page);
    const kinds = ['button.sp-ui', '.sp-ui-tab', '.sp-ui-close', 'label.sp-checkbox', 'label.sp-switch', '.sp-ui-item', '.sp-input .sp-ui-box', '.sp-slider .sp-ui-range'];
    const measured = await page.evaluate((selectors) => {
      const panels = document.querySelectorAll('.sp-ui-page-panel').length;
      return selectors.map((selector) => {
        const targets = [...document.querySelectorAll(`.sp-ui-page ${selector}`)];
        const small = targets
          .map((el) => ({ el, box: el.getBoundingClientRect() }))
          .filter(({ box }) => box.width < 24 || box.height < 24)
          .map(({ el, box }) => `${el.className} ${box.width}×${box.height}`);
        return { selector, perPanel: targets.length / panels, small };
      });
    }, kinds);
    for (const { selector, perPanel, small } of measured) {
      // A renamed class would measure nothing: every kind is on every panel.
      expect(perPanel, selector).toBeGreaterThanOrEqual(1);
      expect(small, selector).toEqual([]);
    }
  });

  test('REQ-320 · with reduced motion nothing moves; without it, the indeterminate progress does', async ({ page }) => {
    const panel = await open(page);
    const fill = panel.locator('.sp-progress[data-indeterminate="true"] [part="sp-fill"]').first();
    const moving = () => fill.evaluate((el) => getComputedStyle(el).animationName);
    expect(await moving()).toBe('none');
    const animated = await page.evaluate(() => [...document.querySelectorAll('.sp-ui-page *')].filter((el) => getComputedStyle(el).animationName !== 'none').length);
    expect(animated).toBe(0);
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
    // Every rule but contrast, on the page as drawn: nothing hidden.
    const drawn = await new AxeBuilder({ page }).withTags(WCAG_AA).disableRules(['color-contrast']).analyze();
    expect(drawn.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    // Contrast alone. A frame is an ink line drawn as `background: var(--sp-ink)` under a CSS
    // mask; axe reads that as a solid backdrop for the text above it (1.5:1 on ink) though the
    // text sits on the substrate. Frames and tone tiles carry no text: make them transparent for
    // this reading only —layout untouched— and leave their own contrast to the 11 UI pairs of the
    // palette test (REQ-313).
    await page.addStyleTag({ content: ".sp-ui [part='sp-frame'], .sp-ui [part='sp-tone'] { background: transparent !important; }" });
    const text = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    expect(text.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test('REQ-318 · roles: progressbar with its value, the current step, alert and status, a busy skeleton', async ({ page }) => {
    const panel = await open(page);
    const upload = panel.getByRole('progressbar', { name: 'Upload' });
    await expect(upload).toHaveAttribute('aria-valuenow', '40');
    await expect(upload).toHaveAttribute('aria-valuemin', '0');
    await expect(upload).toHaveAttribute('aria-valuemax', '100');
    // An indeterminate progress states no value.
    await expect(panel.locator('.sp-progress[data-indeterminate="true"] [role="progressbar"], .sp-progress[data-indeterminate="true"][role="progressbar"]').first()).not.toHaveAttribute('aria-valuenow', /.*/);
    await expect(panel.locator('ol.sp-steps, .sp-steps ol')).toHaveCount(1);
    await expect(panel.locator('.sp-steps [aria-current="step"]')).toContainText('Configure');
    await expect(panel.getByRole('alert')).toHaveCount(2);
    await expect(panel.getByRole('status')).toHaveCount(2);
    await expect(panel.locator('.sp-skeleton[aria-busy="true"]')).toHaveCount(1);
    await expect(panel.getByRole('separator')).toHaveCount(1);
  });
});
