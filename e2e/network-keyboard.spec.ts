import { expect, test } from '@playwright/test';
import { FIXTURES, fixtureProps } from '../examples/harness/index.js';
import { readout, stepActive, type ActiveItem } from '../packages/core/dist/index.js';
import { renderChart } from '../packages/grounds/dist/index.js';
import { catalogEntry } from '../tools/visual-gate/catalog';

/**
 * T-198 · the network's keyboard, in every app (REQ-426, REQ-122): Right walks the nodes, Down the
 * links a node starts, Up back towards it, and the live region says each node's degree and each
 * link's ends and value — the words a screen reader reads. The placed state walks the same way
 * (REQ-436).
 */
const PAGES = FIXTURES.filter((f) => f.chart === 'NetworkChart' && f.substrate === 'cream' && f.mode === 'ink');

function modelOf(fixture: (typeof FIXTURES)[number]) {
  return renderChart(catalogEntry(fixture.chart).recipe, fixtureProps(fixture), { id: fixture.id });
}

test.describe('the network keyboard (T-198)', () => {
  test('REQ-426 · the network has a page here, and its placed state too', () => {
    expect(PAGES.map((f) => `${f.chart}${f.state ? `/${f.state}` : ''}`).sort()).toEqual(['NetworkChart', 'NetworkChart/placed']);
  });

  for (const fixture of PAGES) {
    test(`REQ-426 · REQ-122 · ${fixture.id}: Down walks a node's links, Up returns to it, Right moves on`, async ({ page }) => {
      const model = modelOf(fixture);
      let at: ActiveItem | null = stepActive(model.geometry, null, 'Home') ?? null;
      const said = (item: ActiveItem | null) => (item ? readout(model, item).announcement : '');
      await page.goto(`/?fixture=${fixture.id}`);
      await page.locator('.sp-harness .sp-root[data-status="ready"]').waitFor();
      await page.keyboard.press('Tab');
      const live = page.locator('.sp-harness .sp-root .sp-live');
      await expect(live).toHaveText(said(at));
      const kinds: string[] = [];
      for (const key of ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowDown']) {
        at = stepActive(model.geometry, at, key) ?? at;
        await page.keyboard.press(key);
        await expect(live, key).toHaveText(said(at));
        kinds.push(at?.seriesKey === 'degree' ? 'node' : 'link');
      }
      // The first node starts a link in both fixtures, and so does the second.
      expect(kinds).toEqual(['link', 'node', 'node', 'link']);
      expect(said(at)).toMatch(/ – /);
    });
  }
});
