import type { HitArea, TextLabel } from '@silverpoint/core';
import { describe, expect, test } from 'vitest';
import { catalogEntry } from '../../../tools/visual-gate/catalog';
import { renderChart } from '../src';

/**
 * REQ-124: no chart encodes information solely by hatch style. `precision` mode draws no hatching
 * at all (REQ-021), so each Phase 1 chart is rendered in it, and every item's data must still be
 * readable from a channel that is not hatch: a printed label, a length, or a size.
 */
type Rendered = ReturnType<typeof renderChart>;

const render = (chart: string, props: Record<string, unknown>) =>
  renderChart(catalogEntry(chart).recipe, { width: 320, height: 150, mode: 'precision', ...props }, { id: `sp-124-${chart}` });

const texts = (model: Rendered) => model.geometry.labels.map((l: TextLabel) => l.text);
const box = (hit: HitArea) => {
  if (!hit.box) throw new Error(`${hit.seriesKey}#${hit.index} has no box`);
  return hit.box;
};
const near = (a: number, b: number, tolerance = 0.03) => Math.abs(a - b) <= tolerance * Math.max(Math.abs(a), Math.abs(b), 1);

describe('REQ-124 · the data survives precision mode through a non-hatch channel', () => {
  test('precision mode draws no hatching for any Phase 1 chart', () => {
    for (const chart of ['BulletChart', 'PyramidChart', 'HeatmapChart', 'TreemapChart', 'SankeyChart', 'ActivityGrid']) {
      const model = render(chart, {});
      expect(model.geometry.strokes.filter((s) => s.role === 'hatch'), chart).toEqual([]);
      expect(model.geometry.defs, chart).toEqual([]);
    }
  });

  test('BulletChart · each actual is printed, and the bar length is proportional to it', () => {
    const model = render('BulletChart', {});
    const [first, ...rest] = model.geometry.hitAreas;
    for (const hit of model.geometry.hitAreas) expect(texts(model)).toContain(String(hit.value));
    for (const hit of rest) expect(near(box(hit).width / hit.value, box(first!).width / first!.value)).toBe(true);
  });

  test('PyramidChart · each width is printed and drawn as length; a consumer tone is printed', () => {
    const data = [{ label: 'A', width: 30, tone: 1 }, { label: 'B', width: 60, tone: 4 }];
    const model = render('PyramidChart', { data, toneKey: 'tone' });
    const [a, b] = model.geometry.hitAreas;
    expect(texts(model)).toEqual(expect.arrayContaining(['30', '60', 'tone 1', 'tone 4']));
    expect(near(box(b!).width, 2 * box(a!).width)).toBe(true);
  });

  test('HeatmapChart · every cell prints its own value at its centre', () => {
    const model = render('HeatmapChart', {});
    for (const hit of model.geometry.hitAreas) {
      const cell = box(hit);
      const inside = model.geometry.labels.filter(
        (l) => l.x >= cell.x && l.x <= cell.x + cell.width && l.y >= cell.y && l.y <= cell.y + cell.height,
      );
      expect(inside.map((l) => l.text), `${hit.seriesKey}#${hit.index}`).toEqual([String(hit.value)]);
    }
  });

  test('TreemapChart · every tile prints its share inside itself; a consumer tone is printed', () => {
    const data = [{ label: 'A', share: 60, cols: 3, rows: 2, tone: 2 }, { label: 'B', share: 40, cols: 3, rows: 2 }];
    const model = render('TreemapChart', { data, columns: 6, rows: 2 });
    for (const hit of model.geometry.hitAreas) {
      const tile = box(hit);
      const inside = model.geometry.labels.filter((l) => l.x >= tile.x && l.x <= tile.x + tile.width && l.y >= tile.y && l.y <= tile.y + tile.height);
      expect(inside.map((l) => l.text)).toContain(`${hit.value}%`);
    }
    expect(texts(model)).toContain('tone 2');
  });

  test('SankeyChart · band thickness is proportional to the flow, and node throughput is printed', () => {
    const model = render('SankeyChart', {});
    const bands = model.geometry.strokes.filter((s) => s.role === 'encoding' && s.d.includes('C'));
    const thickness = (d: string) => Number(/V([\d.]+)/.exec(d)?.[1]) - Number(/C[\d.]+,[\d.]+,[\d.]+,[\d.]+,[\d.]+,([\d.]+)/.exec(d)?.[1]);
    const ratios = bands.map((band, i) => thickness(band.d) / (model.geometry.hitAreas[i]?.value ?? Number.NaN));
    for (const ratio of ratios) expect(near(ratio, ratios[0]!)).toBe(true);
    expect(texts(model).some((t) => /^Visit \d/.test(t))).toBe(true);
  });

  test('ActivityGrid · the level is carried by the cell size: a higher level is a larger cell', () => {
    const model = render('ActivityGrid', {});
    const sizeOf = new Map<number, number>();
    for (const hit of model.geometry.hitAreas) sizeOf.set(Number(hit.datum.level), box(hit).width);
    const levels = [...sizeOf.keys()].sort();
    expect(levels).toEqual([0, 1, 2, 3, 4]);
    for (let i = 1; i < levels.length; i += 1) expect(sizeOf.get(levels[i]!)!).toBeGreaterThan(sizeOf.get(levels[i - 1]!)!);
  });
});
