import { expect, test } from '@playwright/test';
import { FIXTURES, fixtureProps } from '../examples/harness/index.js';
import { readout, stepActive, type ActiveItem } from '../packages/core/dist/index.js';
import { renderChart } from '../packages/grounds/dist/index.js';
import { catalogEntry } from '../tools/visual-gate/catalog';

/**
 * T-189 · the tree keyboard of the three hierarchy charts, in every app (REQ-438, REQ-122): Right
 * descends to the first child, Left climbs to the parent, Down and Up walk the pre-order, and the
 * live region says each node's path, value and share of its parent — the words a screen reader
 * reads. The drilled-root fixtures walk from the node they are drawn from (REQ-439).
 */
const HIERARCHY = ['SquarifiedTreemap', 'SunburstChart', 'TreeChart'];
const PAGES = FIXTURES.filter((f) => HIERARCHY.includes(f.chart) && f.substrate === 'cream' && f.mode === 'ink');

function modelOf(fixture: (typeof FIXTURES)[number]) {
  return renderChart(catalogEntry(fixture.chart).recipe, fixtureProps(fixture), { id: fixture.id });
}

test.describe('the tree keyboard (T-189)', () => {
  test('REQ-438 · each hierarchy chart has a page here, and the drilled roots too', () => {
    expect(PAGES.map((f) => `${f.chart}${f.state ? `/${f.state}` : ''}`).sort()).toEqual(['SquarifiedTreemap', 'SquarifiedTreemap/root', 'SunburstChart', 'SunburstChart/root', 'TreeChart']);
  });

  for (const fixture of PAGES) {
    test(`REQ-438 · REQ-122 · ${fixture.id}: Right, Right, Left, Down, Up walk the tree and announce path, value and share`, async ({ page }) => {
      const model = modelOf(fixture);
      let at: ActiveItem | null = stepActive(model.geometry, null, 'Home') ?? null;
      const said = (item: ActiveItem | null) => (item ? readout(model, item).announcement : '');
      await page.goto(`/?fixture=${fixture.id}`);
      await page.locator('.sp-harness .sp-root[data-status="ready"]').waitFor();
      await page.keyboard.press('Tab');
      const live = page.locator('.sp-harness .sp-root .sp-live');
      await expect(live).toHaveText(said(at));
      const nodeOf = (item: ActiveItem | null) => model.geometry.hitAreas.find((h) => h.index === item?.index)?.node;
      const hasChild = (id: string | undefined) => model.geometry.hitAreas.some((h) => h.node?.parent === id);
      const heard: string[] = [];
      for (const key of ['ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']) {
        const from = nodeOf(at);
        at = stepActive(model.geometry, at, key) ?? at;
        await page.keyboard.press(key);
        await expect(live, key).toHaveText(said(at));
        heard.push(said(at));
        const to = nodeOf(at);
        // Right descends to the first child (a leaf stays), Left climbs to the parent (the root
        // stays), Down and Up walk the pre-order.
        if (key === 'ArrowRight') expect(hasChild(from?.id) ? to?.parent : to?.id, key).toBe(from?.id);
        if (key === 'ArrowLeft') expect(to?.id, key).toBe(from?.parent ?? from?.id);
        if (key === 'ArrowDown') expect(to?.order, key).toBe((from?.order ?? 0) + 1);
        if (key === 'ArrowUp') expect(to?.order, key).toBe((from?.order ?? 0) - 1);
      }
      // Below the drawn root — the first Right's node — the words carry the path from the data root
      // and the share of the parent.
      expect(heard[0]).toMatch(/ › .*% of /);
    });
  }
});
