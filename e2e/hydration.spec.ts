import { expect, test, type Page } from '@playwright/test';
import { compareSvg } from '../tools/svg-normalizer/normalize';
import { CATALOG } from '../tools/visual-gate/catalog';
import { coreSvgFor, loadFixtures } from '../tools/visual-gate/fixtures';
import { fixtureLabel } from '../examples/harness/index.js';
import { APPS, type AppName } from '../playwright.config';

/**
 * Server rendering and hydration of the second catalog (T-179, REQ-103, REQ-109, REQ-435): every
 * server-rendered app ships each new chart in its HTML, identical to the canonical render, and
 * hydrates it with no mismatch. The beeswarm and the violin — a packing and a density, the two
 * whose arithmetic a browser could round differently — hydrate in Firefox and WebKit too.
 */
const SECOND = CATALOG.filter((c) => Number(c.req.slice(4)) >= 400);
const FIXTURES = loadFixtures('pr').filter((f) => SECOND.some((c) => c.chart === f.chart) && f.substrate === 'cream' && f.mode === 'ink');
const OTHER_ENGINES = ['BeeswarmChart', 'ViolinChart'];
const HYDRATION_ERROR = /hydrat|mismatch|did not match|NG05\d\d/i;

const appOf = (name: string) => APPS[name as AppName];
/** The server-rendered page of a fixture: the Vue app prerenders it at `/ssr/<id>` (prerender.mjs). */
const pathOf = (project: string, id: string) => (project === 'vite-vue' ? `/ssr/${id}` : `/?fixture=${id}`);

/** Opens a fixture page, waits for hydration, and returns the drawn chart and the console's complaints. */
async function hydrate(page: Page, path: string): Promise<{ svg: string; messages: string[] }> {
  const messages: string[] = [];
  page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
  await page.goto(path);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  const svg = await page.locator('.sp-harness svg.sp-chart').evaluate((el) => el.outerHTML);
  return { svg, messages: messages.filter((m) => HYDRATION_ERROR.test(m)) };
}

test.describe('second catalog: server rendering and hydration', () => {
  test('REQ-435 · every chart of the second catalog has a fixture here', () => {
    expect(new Set(FIXTURES.map((f) => f.chart)).size).toBe(SECOND.length);
  });

  for (const fixture of FIXTURES) {
    test(`REQ-103 · REQ-109 · ${fixtureLabel(fixture)}: the server HTML is the canonical render, and it hydrates with no mismatch`, async ({ page, request }, info) => {
      test.skip(!appOf(info.project.name).ssr, 'client-rendered app');
      const canonical = coreSvgFor(fixture);
      const html = await (await request.get(pathOf(info.project.name, fixture.id))).text();
      expect(compareSvg(html, canonical), 'server HTML').toEqual({ equal: true });
      const { svg, messages } = await hydrate(page, pathOf(info.project.name, fixture.id));
      expect(compareSvg(svg, canonical), 'after hydration').toEqual({ equal: true });
      expect(messages).toEqual([]);
    });
  }

  for (const fixture of FIXTURES.filter((f) => OTHER_ENGINES.includes(f.chart))) {
    test(`REQ-435 · REQ-103 · ${fixtureLabel(fixture)}: Firefox and WebKit hydrate the server HTML with no mismatch`, async ({ playwright }, info) => {
      test.skip(!appOf(info.project.name).ssr, 'client-rendered app');
      const canonical = coreSvgFor(fixture);
      for (const type of [playwright.firefox, playwright.webkit]) {
        // The project's `chromium` channel is Chromium's alone: the other engines launch without one.
        const browser = await type.launch({ channel: undefined });
        try {
          const page = await browser.newPage({ baseURL: `http://localhost:${appOf(info.project.name).port}`, reducedMotion: 'reduce' });
          const { svg, messages } = await hydrate(page, pathOf(info.project.name, fixture.id));
          expect(compareSvg(svg, canonical), `${type.name()} after hydration`).toEqual({ equal: true });
          expect(messages, type.name()).toEqual([]);
        } finally {
          await browser.close();
        }
      }
    });
  }
});
