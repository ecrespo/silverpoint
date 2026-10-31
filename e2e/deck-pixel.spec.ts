import { existsSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { DECK_FIXTURES } from '../examples/harness/index.js';
import { APPS } from '../playwright.config';
import { compare, gate } from './pixel-compare';

/**
 * The deck pixel gate (T-279, REQ-624): every slide of every deck fixture —six decks, on silverpoint
 * and cyanotype, in ink and precision— at 1280×720 in the pinned Chromium. Each app's slide is held
 * to the canonical page's (`@silverpoint/marp`'s static HTML, no framework) and to the golden image,
 * under Art. 3's thresholds. Runs in the pinned image only (tools/visual-gate/pixel-docker.sh).
 */
const CANONICAL = `http://localhost:${APPS['vite-react'].port}/canonical.html`;
/** Every page reads the fixtures' images from the bench, so all four load the same files. */
const ASSETS = `http://localhost:${APPS['vite-react'].port}/deck-assets/`;

const SLIDES = DECK_FIXTURES.flatMap((fixture) => Array.from({ length: fixture.slides }, (_, i) => ({ fixture, slide: i + 1 })));

/** The slide's screenshot, once its fonts, its background images and its charts are ready. */
async function shootSlide(page: Page, url: string, slide: number): Promise<Buffer> {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(url);
  const viewport = page.locator(`.sp-deck-harness[data-gate] .sp-deck[data-sp-page="${slide}"] .sp-deck-viewport`);
  await viewport.waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Marpit draws a slide's images as CSS backgrounds: decode each before the shot.
    const urls = new Set<string>();
    for (const el of document.querySelectorAll('.sp-deck-slide[data-sp-current] *')) {
      for (const [, url] of getComputedStyle(el).backgroundImage.matchAll(/url\("([^"]+)"\)/g)) if (url) urls.add(url);
    }
    await Promise.all([...urls].map((url) => Object.assign(new Image(), { src: url }).decode().catch(() => undefined)));
  });
  await expect(page.locator('.sp-deck-slide[data-sp-current] .sp-root:not([data-status="ready"])')).toHaveCount(0);
  const box = await viewport.boundingBox();
  expect(box && [Math.round(box.width), Math.round(box.height)], 'the slide at the canvas size').toEqual([1280, 720]);
  return viewport.screenshot({ animations: 'disabled' });
}

test.describe('deck pixel gate', () => {
  test('REQ-624 · the gate has every slide of every deck fixture', () => {
    expect(DECK_FIXTURES).toHaveLength(24);
    expect(SLIDES).toHaveLength(92);
  });

  for (const { fixture, slide } of SLIDES) {
    test(`REQ-624 · ${fixture.id} slide ${slide} passes the three Art. 3 comparisons`, async ({ page }, info) => {
      const query = `?deck=${fixture.id}&slide=${slide}&assets=${encodeURIComponent(ASSETS)}`;
      const name = ['deck', `${fixture.id}--${slide}.png`];
      const canonical = await shootSlide(page, `${CANONICAL}${query}`, slide);
      expect(canonical).toMatchSnapshot(name, { threshold: 0.15, maxDiffPixelRatio: 0.005 });
      const goldenPath = info.snapshotPath(...name);
      const golden = existsSync(goldenPath) ? readFileSync(goldenPath) : undefined;
      const adapter = await shootSlide(page, `/${query}`, slide);
      expect(gate(adapter, canonical, golden)).toEqual([]);
    });
  }

  test('REQ-624 · a slide whose background image is missing fails the gate', async ({ page }) => {
    const fixture = DECK_FIXTURES.find((f) => f.id === 'deck--backgrounds--silverpoint--ink')!;
    const query = `?deck=${fixture.id}&slide=1`;
    const withImage = await shootSlide(page, `${CANONICAL}${query}&assets=${encodeURIComponent(ASSETS)}`, 1);
    const without = await shootSlide(page, `${CANONICAL}${query}&assets=${encodeURIComponent(`${ASSETS}missing/`)}`, 1);
    expect(gate(without, withImage, undefined).length).toBeGreaterThan(0);
    expect(compare(withImage, withImage, 0).pixels).toBe(0);
  });
});
