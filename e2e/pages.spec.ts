import { expect, test, type Page } from '@playwright/test';
import { COMPOSED_PAGE, PALETTES_PAGE, TIMELINE_PAGE } from '../examples/harness/index.js';
import { APPS, type AppName } from '../playwright.config';

/**
 * The feature-004 pages of every example app (T-222, REQ-520): `/composed` (the 21 new rows),
 * `/palettes` (the six presets) and `/timeline` (TimelineJS in the ground's hand). Each renders; a
 * server-rendered app ships its markup and hydrates it with no mismatch. Keyboard patterns and axe
 * are T-223's.
 */
const appOf = (name: string) => APPS[name as AppName];
const frameworkOf = (name: string) => appOf(name).framework;

/** The root class of each new row's component: its slug, but for the Avatar group. */
const ROOTS = [...new Set(COMPOSED_PAGE.panels[0]!.sections.flatMap((s) => s.items.map((i) => (i.state === 'group' ? 'avatar-group' : i.component))))];

/** Console errors, page errors and hydration complaints, from the moment the listener is set. */
function watch(page: Page): string[] {
  const messages: string[] = [];
  page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
  return messages;
}
// Production React reports a mismatch only as a minified error (#418, #423): no error at all.
const problems = (messages: string[]) => messages.filter((m) => /hydrat|mismatch|did not match|NG05\d\d/i.test(m) || /^(error|pageerror):/.test(m));

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  if (appOf(test.info().project.name).ssr) await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
}

test.describe('the composed page (T-222)', () => {
  test('REQ-520 · /composed shows three panels, each with every new row, its overlays closed behind their triggers', async ({ page }, info) => {
    const messages = watch(page);
    await open(page, '/composed');
    await expect(page.locator('h1')).toContainText(`${COMPOSED_PAGE.title} · `);
    await expect(page.locator('h1')).toContainText(frameworkOf(info.project.name));
    expect(ROOTS).toHaveLength(22);
    for (const panel of COMPOSED_PAGE.panels) {
      const root = page.locator(`[data-panel="${panel.key}"]`);
      await expect(root.getByRole('heading', { level: 2 })).toHaveText(panel.title);
      for (const slug of ROOTS) expect(await root.locator(`.sp-ui.sp-${slug}`).count(), `${panel.key} ${slug}`).toBeGreaterThan(0);
      await expect(root.locator(`.sp-ui[data-mode="${panel.mode}"]`).first()).toBeVisible();
      // Closed: no open dialog, no open popover; the toasts are shown in place.
      await expect(root.locator('dialog[open]')).toHaveCount(0);
      await expect(root.locator(':popover-open')).toHaveCount(0);
      await expect(root.locator('.sp-toast').first()).toBeVisible();
    }
    // A trigger opens its dialog.
    const panel = page.locator('[data-panel="silverpoint"]');
    await panel.getByRole('button', { name: 'Edit order' }).click();
    await expect(panel.locator('dialog.sp-modal[open]')).toHaveCount(1);
    expect(problems(messages)).toEqual([]);
  });

  test('REQ-520 · a server-rendered composed page ships every new row and hydrates with no mismatch', async ({ page, request }, info) => {
    test.skip(!appOf(info.project.name).ssr, 'client-rendered app');
    const html = await (await request.get('/composed')).text();
    // A root's classes: `sp-ui`, then its kind (an InputNumber's and a Textarea's after `sp-input`).
    for (const slug of ROOTS) expect(html, slug).toMatch(new RegExp(`class="sp-ui (sp-input )?sp-${slug} `));
    const messages = watch(page);
    await open(page, '/composed');
    expect(problems(messages)).toEqual([]);
  });
});

test.describe('the palettes page (T-222)', () => {
  test('REQ-520 · REQ-468 · /palettes shows the six presets, each over a LineChart, a Card holding a Progress, and a Table', async ({ page }, info) => {
    const messages = watch(page);
    await open(page, '/palettes');
    await expect(page.locator('h1')).toContainText(PALETTES_PAGE.title);
    await expect(page.locator('h1')).toContainText(frameworkOf(info.project.name));
    const styles: string[] = [];
    for (const preset of PALETTES_PAGE.presets) {
      const section = page.locator(`[data-preset="${preset.key}"]`);
      await expect(section.getByRole('heading', { level: 2 })).toHaveText(preset.title);
      await expect(section.locator('svg.sp-chart')).toHaveCount(1);
      await expect(section.locator('.sp-card .sp-progress')).toHaveCount(1);
      await expect(section.locator('.sp-ui.sp-table')).toHaveCount(1);
      styles.push((await section.locator('.sp-ui.sp-table').getAttribute('style')) ?? '');
    }
    // Each preset writes its own custom properties on the root (I-33).
    expect(new Set(styles).size).toBe(6);
    expect(problems(messages)).toEqual([]);
  });

  test('REQ-520 · a server-rendered palettes page hydrates with no mismatch', async ({ page }, info) => {
    test.skip(!appOf(info.project.name).ssr, 'client-rendered app');
    const messages = watch(page);
    await open(page, '/palettes');
    await expect(page.locator('[data-preset]')).toHaveCount(6);
    expect(problems(messages)).toEqual([]);
  });
});

test.describe('the timeline page (T-222)', () => {
  test('REQ-520 · REQ-512 · REQ-513 · /timeline builds TimelineJS in the mount, inked by the ground', async ({ page, request }, info) => {
    if (appOf(info.project.name).ssr) {
      // The server ships the surface, its probes and an empty mount; never TimelineJS's DOM.
      const html = await (await request.get('/timeline')).text();
      expect(html).toContain('sp-ui sp-timeline ');
      expect(html).toContain('sp-kl-mount');
      expect(html).not.toContain('tl-timeline');
    }
    const messages = watch(page);
    await open(page, '/timeline');
    await expect(page.locator('h1')).toContainText(TIMELINE_PAGE.title);
    const timeline = page.locator(`section.sp-timeline#${TIMELINE_PAGE.timeline.id}`);
    await expect(timeline).toHaveAttribute('aria-label', TIMELINE_PAGE.timeline.data.title!.text!.headline!);
    await expect(timeline.locator('.sp-kl-mount > .tl-timeline .tl-storyslider')).toHaveCount(1);
    await expect(timeline).toHaveAttribute('data-kl-inked', 'true');
    await expect(timeline.getByText(TIMELINE_PAGE.fallback)).toHaveCount(0);
    expect(problems(messages)).toEqual([]);
  });
});
