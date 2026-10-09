import { expect, test, type Browser, type Page } from '@playwright/test';
import { APPS } from '../playwright.config';
import { CATALOG } from '../tools/visual-gate/catalog';
import { coreSvgFor, loadFixtures } from '../tools/visual-gate/fixtures';

/**
 * Cross-engine determinism (TD delta §6, REQ-435, REQ-103, I-27): the core's output for every chart
 * of the second catalog — statistics, densities, packing, inking — serialised in Node and in
 * Chromium, Firefox and WebKit, byte for byte. The browser string comes from the canonical page,
 * which runs the core pipeline with no framework; Node's from the same fixture here.
 */
const CANONICAL = `http://localhost:${APPS['vite-react'].port}/canonical.html`;
const SECOND = CATALOG.filter((c) => Number(c.req.slice(4)) >= 400);
const FIXTURES = loadFixtures('pr').filter((f) => SECOND.some((c) => c.chart === f.chart) && f.substrate === 'cream' && f.ground === 'silverpoint');

async function inBrowser(page: Page, id: string): Promise<string | undefined> {
  await page.goto(`${CANONICAL}?fixture=${id}`);
  await page.waitForFunction(() => typeof (window as { spCanonical?: string }).spCanonical === 'string');
  return page.evaluate(() => (window as { spCanonical?: string }).spCanonical);
}

test.describe('cross-engine determinism of the second catalog (T-178)', () => {
  const ONCE = 'once, against the framework-free canonical page';

  test('REQ-435 · every chart of the second catalog has a fixture in ink and in precision', ({}, info) => {
    test.skip(info.project.name !== 'vite-react', ONCE);
    expect(SECOND.length).toBeGreaterThanOrEqual(14);
    expect(new Set(FIXTURES.map((f) => `${f.chart}/${f.mode}`)).size).toBe(SECOND.length * 2);
  });

  test('REQ-435 · REQ-103 · Node, Chromium, Firefox and WebKit draw every fixture byte for byte alike', async ({ page, playwright }, info) => {
    test.skip(info.project.name !== 'vite-react', ONCE);
    test.setTimeout(180_000);
    const node = new Map(FIXTURES.map((f) => [f.id, coreSvgFor(f)]));
    const engines: [string, Page, Browser | undefined][] = [['chromium', page, undefined]];
    for (const type of [playwright.firefox, playwright.webkit]) {
      // The project's `chromium` channel is Chromium's alone: the other engines launch without one.
      const browser = await type.launch({ channel: undefined });
      engines.push([type.name(), await browser.newPage({ reducedMotion: 'reduce' }), browser]);
    }
    try {
      const differing: string[] = [];
      for (const [engine, tab] of engines) {
        for (const f of FIXTURES) if ((await inBrowser(tab, f.id)) !== node.get(f.id)) differing.push(`${engine}: ${f.id}`);
      }
      expect(differing).toEqual([]);
    } finally {
      for (const [, , browser] of engines) await browser?.close();
    }
  });
});
