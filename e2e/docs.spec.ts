import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { QUICKSTARTS } from '../docs/site/src/quickstart';
import { compareSvg } from '../tools/svg-normalizer/normalize';
import { UI_COMPONENTS } from '../packages/core/src/ui/catalog';
import { UI_DEMOS } from '../packages/core/src/ui/demo';
import { PALETTE_NAMES } from '../packages/core/src/palettes';
import { CATALOG } from '../tools/visual-gate/catalog';

/** The three families of the UI layer, each with its own gallery and its groups in order (REQ-332, REQ-521). */
const FAMILIES = [
  { family: 'ui', route: '/ui', title: 'UI components', groups: ['Actions', 'Data entry', 'Navigation', 'Data display', 'Feedback'] },
  { family: 'composed', route: '/composed', title: 'Composed components', groups: ['Data entry', 'Navigation', 'Data display', 'Building blocks', 'Disclosure'] },
  { family: 'overlay', route: '/overlays', title: 'Overlays', groups: ['Overlays'] },
] as const;
/** An overlay hangs closed behind its trigger; a toast is shown in place. */
const CLOSED = new Set(['modal', 'drawer', 'popover', 'tooltip', 'select', 'dropdown-menu']);

/**
 * The documentation site (PRD §5.1, Implementation Plan Phase 4): gallery, ground playground,
 * props reference, the quickstart, and one fixture rendered by all three adapters (REQ-100).
 */
const props = JSON.parse(readFileSync(new URL('../docs/site/generated/props.json', import.meta.url), 'utf8')) as {
  charts: { chart: string; own: { name: string; doc: string }[] }[];
  ui: { common: { name: string }[]; components: { slug: string; name: string; own: { name: string; doc: string }[] }[] };
  palette: { name: string; doc: string }[];
  timeline: { name: string; doc: string }[];
};

const errorsOf = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
};

/** Every kind of page the site has: the reflow and axe checks run on each. */
/** What a route draws once it is ready: a chart or a component, or, on a page that draws none, its last section. */
const readyOf = (route: string) => (route === '/#/ai' ? '#agent-tools' : '.sp-root, .sp-ui');

const ROUTES = ['/', '/#/gallery', '/#/playground', '/#/chart/sankey-chart', '/#/chart/histogram-chart', '/#/adapters', '/#/dashboard', '/#/ui', '/#/ui/tabs', '/#/composed', '/#/ui/table', '/#/overlays', '/#/ui/modal', '/#/palettes', '/#/timeline', '/#/ai'];

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
    await expect(page.locator('main > h2')).toHaveText('DonutChart');
    await expect(page.locator('main .sp-root[data-status="ready"]')).toHaveCount(1);
    const own = props.charts.find((c) => c.chart === 'DonutChart')!.own;
    const rows = page.locator('table.props tbody tr');
    await expect(rows).toHaveCount(own.length);
    await expect(rows.filter({ hasText: 'legend' })).toContainText(own.find((p) => p.name === 'legend')!.doc);
  });

  test('REQ-449 · a second-catalog chart page states how each derived value is computed', async ({ page }) => {
    await page.goto('/#/chart/histogram-chart');
    await expect(page.locator('main > h2')).toHaveText('HistogramChart');
    await expect(page.locator('main .sp-root[data-status="ready"]')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'How it is computed' })).toBeVisible();
    await expect(page.locator('dl.method dt')).toHaveText(['bins', 'count']);
    await expect(page.locator('dl.method dd').first()).toContainText('Freedman–Diaconis');
    await page.goto('/#/chart/donut-chart');
    await expect(page.locator('dl.method')).toHaveCount(0);
  });

  test('REQ-200 · the dashboard page draws a live dashboard, its code in every adapter and its reference from the types', async ({ page }) => {
    await page.goto('/#/dashboard');
    await expect(page.locator('section.sp-dashboard .sp-root[data-status="ready"]').first()).toBeVisible();
    for (const adapter of ['React', 'Vue', 'Angular']) await expect(page.getByRole('heading', { name: adapter })).toBeVisible();
    await expect(page.getByRole('table', { name: /Dashboard props/ })).toContainText('ssrWidth');
    await expect(page.getByRole('table', { name: /Breakpoints/ })).toContainText('1024');
    await expect(page.getByText(/row end/)).toBeVisible();
  });

  for (const { family, route, title, groups } of FAMILIES) {
    const rows = UI_COMPONENTS.filter((c) => c.family === family);
    test(`REQ-332 · REQ-521 · the ${title} gallery lists its ${rows.length} components by group, each linking to its page`, async ({ page }) => {
      const errors = errorsOf(page);
      await page.goto(`/#${route}`);
      await expect(page.locator('main > h2')).toHaveText(title);
      await expect(page.locator('main li[data-component]')).toHaveCount(rows.length);
      for (const { name, slug, states } of rows) {
        const item = page.locator(`li[data-component="${slug}"]`);
        await expect(item, name).toHaveCount(1);
        await expect(item.locator(`a[href="#/ui/${slug}"]`)).toContainText(name);
        // An overlay is drawn closed: its trigger shows, the overlay itself is in the page.
        if (CLOSED.has(slug)) await expect(item.locator(`.sp-ui.sp-${slug}`).first()).toBeAttached();
        else await expect(item.locator(`.sp-ui.sp-${slug}`).first()).toBeVisible();
        expect(states.length).toBeGreaterThan(0);
      }
      // The site's group headings, not the components' own.
      await expect(page.locator('main > section > h3')).toHaveText([...groups]);
      await expect(page.locator(`nav a[href="#${route}"]`)).toHaveAttribute('aria-current', 'page');
      expect(errors).toEqual([]);
    });
  }

  for (const { slug, name, states } of UI_COMPONENTS) {
    test(`REQ-332 · ${name}: a live example per state and a props reference read from the types`, async ({ page }) => {
      const errors = errorsOf(page);
      await page.goto(`/#/ui/${slug}`);
      await expect(page.locator('main > h2')).toHaveText(name);
      await expect(page.locator('main > section[data-state]')).toHaveCount(states.length);
      for (const state of states) {
        const example = page.locator(`main > section[data-state="${state}"]`);
        if (CLOSED.has(slug)) {
          await expect(example.locator(`.sp-ui.sp-${slug}`).first(), state).toBeAttached();
          await expect(example.getByRole(slug === 'select' ? 'combobox' : 'button').first(), state).toBeVisible();
        } else await expect(example.locator(`.sp-ui.sp-${slug}`).first(), state).toBeVisible();
        expect(Object.keys(UI_DEMOS[slug]!)).toContain(state);
        await expect(example.locator('pre')).toContainText(`<Sp${name}`);
        // What a demo opens starts open, uncontrolled: a Collapse's items (REQ-521).
        const items = (UI_DEMOS[slug]![state] as { items?: { open?: boolean }[] }).items;
        if (slug === 'collapse') await expect(example.locator('details[open]')).toHaveCount(items!.filter((i) => i.open).length);
      }
      const own = props.ui.components.find((c) => c.slug === slug)!.own;
      const rows = page.locator('table.props tbody tr');
      await expect(rows).toHaveCount(own.length);
      for (const prop of own) await expect(rows.filter({ has: page.locator('th', { hasText: new RegExp(`^${prop.name}\\??$`) }) })).toContainText(prop.doc);
      await expect(page.locator('table.props-common tbody tr')).toHaveCount(props.ui.common.length);
      expect(errors).toEqual([]);
    });
  }

  test('REQ-521 · an overlay page opens its dialog from the trigger, and the nav marks its family', async ({ page }) => {
    const errors = errorsOf(page);
    await page.goto('/#/ui/modal');
    await expect(page.locator('dialog.sp-modal[open]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Edit order' }).click();
    await expect(page.locator('dialog.sp-modal[open]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog.sp-modal[open]')).toHaveCount(0);
    await expect(page.locator('nav a[href="#/overlays"]')).toHaveAttribute('aria-current', 'page');
    await page.goto('/#/ui/table');
    await expect(page.locator('nav a[href="#/composed"]')).toHaveAttribute('aria-current', 'page');
    expect(errors).toEqual([]);
  });

  test('REQ-521 · WCAG 2.2.1 · a docs toast stays until it is dismissed: a reader is not timed', async ({ page }) => {
    await page.clock.install();
    await page.goto('/#/ui/toast');
    const toast = page.locator('main .sp-toast').first();
    await expect(toast).toBeVisible();
    await page.clock.fastForward(60_000);
    await expect(toast).toBeVisible();
    await toast.getByRole('button', { name: 'Dismiss' }).click();
    await expect(toast).toBeHidden();
  });

  test('REQ-521 · the palettes page draws each preset over a chart, a Card holding a Progress and a Table, with the Palette reference', async ({ page }) => {
    const errors = errorsOf(page);
    await page.goto('/#/palettes');
    await expect(page.locator('main > h2')).toHaveText('Palettes');
    await expect(page.locator('main [data-preset]')).toHaveCount(PALETTE_NAMES.length);
    const styles: string[] = [];
    for (const key of PALETTE_NAMES) {
      const section = page.locator(`main [data-preset="${key}"]`);
      await expect(section.locator('svg.sp-chart')).toHaveCount(1);
      await expect(section.locator('.sp-card .sp-progress')).toHaveCount(1);
      await expect(section.locator('.sp-ui.sp-table')).toHaveCount(1);
      await expect(section.locator('pre')).toContainText(key);
      styles.push((await section.locator('.sp-ui.sp-table').getAttribute('style')) ?? '');
    }
    expect(new Set(styles).size).toBe(PALETTE_NAMES.length);
    await expect(page.locator('main pre').first()).toContainText("from '@silverpoint/core/palettes'");
    const rows = page.locator('table.props tbody tr');
    await expect(rows).toHaveCount(props.palette.length);
    for (const field of props.palette) await expect(rows.filter({ has: page.locator('th', { hasText: new RegExp(`^${field.name}\\??$`) }) })).toContainText(field.doc);
    expect(errors).toEqual([]);
  });

  test('REQ-521 · the timeline page builds TimelineJS in the ground\'s hand, says how to install it and lists its props', async ({ page }) => {
    const errors = errorsOf(page);
    await page.goto('/#/timeline');
    await expect(page.locator('main > h2')).toHaveText('Timeline');
    const timeline = page.locator('main section.sp-timeline');
    await expect(timeline.locator('.sp-kl-mount .tl-storyslider')).toHaveCount(1);
    await expect(timeline).toHaveAttribute('data-kl-inked', 'true');
    await expect(page.locator('main pre', { hasText: /^npm install @knight-lab\/timelinejs$/ })).toHaveCount(1);
    await expect(page.locator('main pre', { hasText: "from '@silverpoint/react/timeline'" })).toHaveCount(1);
    const rows = page.locator('table.props tbody tr');
    await expect(rows).toHaveCount(props.timeline.length);
    for (const prop of props.timeline) await expect(rows.filter({ has: page.locator('th', { hasText: new RegExp(`^${prop.name}\\??$`) }) })).toContainText(prop.doc);
    expect(errors).toEqual([]);
  });

  test('REQ-332 · an unknown component page says so', async ({ page }) => {
    await page.goto('/#/ui/nothing');
    await expect(page.locator('main > h2')).toHaveText('No such component');
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

  for (const route of ROUTES) {
    test(`WCAG 1.4.10 · ${route} reflows at 320 CSS px without horizontal scrolling`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(route);
      await page.locator(readyOf(route)).first().waitFor({ state: 'attached' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    });
  }

  for (const route of ROUTES) {
    test(`REQ-120 · WCAG 2.1 AA · axe finds no A or AA issue on ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      await page.locator(readyOf(route)).first().waitFor({ state: 'attached' });
      // A UI frame is an ink line drawn as a masked background; axe reads it as a solid backdrop under the
      // text. Frames and tone tiles carry no text: hidden for the reading (see a11y-audit.md), and their
      // contrast is held by the palette's UI pairs.
      await page.addStyleTag({ content: ".sp-ui [part='sp-frame'], .sp-ui [part='sp-tone'] { display: none !important; }" });
      // TimelineJS's own DOM is the library's, outside the ground's contract (REQ-513); its surface is audited.
      if (route === '/#/timeline') await page.locator('.sp-kl-mount .tl-storyslider').waitFor();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('.sp-kl-mount').analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
});
