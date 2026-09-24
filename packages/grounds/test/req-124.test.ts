import type { HitArea, TextLabel } from '@silverpoint/core';
import { describe, expect, test } from 'vitest';
import { AFTER_LINE_CHART, catalogEntry } from '../../../tools/visual-gate/catalog';
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
  test('precision mode draws no hatching for any chart', () => {
    for (const { chart } of AFTER_LINE_CHART) {
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

  // Phase 2 (T-069): the cartesian charts. Written after the recipes; each was mutation-checked.

  test('StepChart · every value is a height on a linear scale', () => {
    expect(linearInValue(render('StepChart', {}).geometry.hitAreas)).toBe(true);
  });

  test('SparklineRows · every row prints its readout, the last value when none is given', () => {
    const model = render('SparklineRows', {});
    expect(texts(model)).toEqual(expect.arrayContaining(['API', '99.9%', 'Queue', '17']));
  });

  test('KpiCard · the delta is printed with its sign, and the series is a height', () => {
    const model = render('KpiCard', {});
    expect(texts(model)).toContain('+8.2');
    expect(linearInValue(model.geometry.hitAreas)).toBe(true);
  });

  test('BarChart · the secondary series is dotted and named; bar length is proportional to the value', () => {
    const model = render('BarChart', {});
    const secondary = encodings(model).filter((s) => s.part === 'ink-secondary');
    expect(secondary.length).toBeGreaterThan(0);
    for (const stroke of secondary) expect(stroke.dash).toBe('dotted');
    expect(texts(model)).toEqual(expect.arrayContaining(['value', 'previous']));
    proportional(model.geometry.hitAreas, (hit) => box(hit).height);
  });

  test('StackedBarChart · the keys are named in stack order, and each segment height is its value', () => {
    const model = render('StackedBarChart', {});
    expect(texts(model).slice(0, 3)).toEqual(['free', 'pro', 'team']);
    proportional(model.geometry.hitAreas, (hit) => box(hit).height);
    const first = model.geometry.hitAreas.filter((h) => h.index === 0);
    expect(first.map((h) => h.seriesKey)).toEqual(['free', 'pro', 'team']);
    for (let k = 1; k < first.length; k += 1) expect(box(first[k]!).y).toBeLessThan(box(first[k - 1]!).y);
  });

  test('ComposedChart · bars and line differ in shape, and each is named', () => {
    const model = render('ComposedChart', {});
    const bars = encodings(model).filter((s) => s.part === 'ink');
    const line = encodings(model).filter((s) => s.part === 'ink-secondary');
    expect(bars.every((s) => s.d.endsWith('Z'))).toBe(true);
    expect(line.length).toBe(1);
    expect(line[0]!.d.endsWith('Z')).toBe(false);
    expect(texts(model)).toEqual(expect.arrayContaining(['revenue', 'margin']));
  });

  test('WaterfallChart · rises and falls print their sign; totals print unsigned', () => {
    const model = render('WaterfallChart', {});
    const printed = texts(model);
    for (const hit of model.geometry.hitAreas) {
      const text = hit.seriesKey === 'delta' ? `${hit.value > 0 ? '+' : '-'}${Math.abs(hit.value)}` : String(hit.value);
      expect(printed, `${hit.seriesKey}#${hit.index}`).toContain(text);
    }
  });

  test('FunnelChart · each stage prints its value and share, and its width is proportional to the value', () => {
    const model = render('FunnelChart', {});
    expect(texts(model)).toEqual(expect.arrayContaining(['12,400', '100%', '980', '8%']));
    proportional(model.geometry.hitAreas, (hit) => box(hit).width);
  });

  test('CandlestickChart · a falling candle is solid and a rising one hollow: fill, not hatch', () => {
    const data = [
      { time: 'a', open: 10, high: 14, low: 9, close: 13 },
      { time: 'b', open: 13, high: 13.5, low: 8, close: 9 },
    ];
    const model = render('CandlestickChart', { data });
    const bodies = encodings(model).filter((s) => s.d.endsWith('Z'));
    expect(bodies.map((s) => s.paint ?? 'outline')).toEqual(['outline', 'fill']);
  });

  test('AreaChart · the exact line on top carries every value as a height', () => {
    const model = render('AreaChart', {});
    expect(encodings(model).some((s) => s.part === 'ink' && s.tone === undefined && s.paint === undefined)).toBe(true);
    expect(linearInValue(model.geometry.hitAreas)).toBe(true);
  });

  test('RangeBandChart · the low edge is dotted, the high edge solid; both are heights', () => {
    const model = render('RangeBandChart', {});
    const edges = encodings(model).filter((s) => s.part === 'ink' && s.paint === undefined);
    expect(edges.map((s) => s.dash ?? 'solid').sort()).toEqual(['dotted', 'solid']);
    expect(linearInValue(model.geometry.hitAreas)).toBe(true);
  });

  test('StreamChart · the second wave is dotted and named', () => {
    const model = render('StreamChart', {});
    const lines = encodings(model).filter((s) => s.paint === undefined);
    expect(lines.map((s) => `${s.part}:${s.dash ?? 'solid'}`)).toEqual(['ink:solid', 'ink-secondary:dotted']);
    expect(texts(model)).toEqual(expect.arrayContaining(['organic', 'paid']));
  });

  test('ScatterChart · every point sits at its value on a linear scale', () => {
    expect(linearInValue(render('ScatterChart', {}).geometry.hitAreas)).toBe(true);
  });

  test('BubbleChart · every bubble has one tone, and its area grows with its size', () => {
    const model = render('BubbleChart', {});
    expect(new Set(encodings(model).map((s) => s.tone))).toEqual(new Set([1]));
    const bySize = [...model.geometry.hitAreas].sort((a, b) => Number(a.datum.size) - Number(b.datum.size));
    for (let i = 1; i < bySize.length; i += 1) expect(box(bySize[i]!).width).toBeGreaterThan(box(bySize[i - 1]!).width);
  });
});

const encodings = (model: Rendered) => model.geometry.strokes.filter((s) => s.role === 'encoding' && s.part !== 'heighten');

/** Every hit's `y` is the same affine function of its value: the value is a position. */
function linearInValue(hits: readonly HitArea[]): boolean {
  const [first] = hits;
  if (!first) return false;
  const far = hits.reduce((a, b) => (Math.abs(b.value - first.value) > Math.abs(a.value - first.value) ? b : a), first);
  if (far.value === first.value) return false;
  const slope = (far.y - first.y) / (far.value - first.value);
  return hits.every((hit) => Math.abs(hit.y - (first.y + slope * (hit.value - first.value))) <= 0.02);
}

/** A dimension of every hit is proportional to the magnitude of its value. */
function proportional(hits: readonly HitArea[], size: (hit: HitArea) => number): void {
  const [first] = hits;
  if (!first) throw new Error('no hits');
  for (const hit of hits) expect(near(size(hit) / Math.abs(hit.value), size(first) / Math.abs(first.value)), `${hit.seriesKey}#${hit.index}`).toBe(true);
}

/**
 * Final-review finding C1: the dash that tells a series apart must be *visible*. A toned area
 * painted with its own outline drew a solid line over the dotted edge it shares, so the dots never
 * showed. No painted outline may run along a dotted encoding line, in either mode.
 */
describe('REQ-124 · a dotted series is not drawn over by a solid outline', () => {
  const vertices = (d: string) => (d.match(/-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?/g) ?? []).map((v) => v.replace(/^M|^L/, ''));
  test.each([
    ['StreamChart', 'ink'],
    ['StreamChart', 'precision'],
    ['RangeBandChart', 'ink'],
    ['RangeBandChart', 'precision'],
  ] as const)('%s, %s', (chart, mode) => {
    const model = render(chart, { mode });
    const dotted = model.geometry.strokes.filter((s) => s.role === 'encoding' && s.dash === 'dotted');
    expect(dotted.length).toBeGreaterThan(0);
    const outlines = model.geometry.strokes.filter((s) => s.role === 'encoding' && !s.dash && (s.paint ?? 'stroke') === 'stroke');
    for (const line of dotted) {
      const own = vertices(line.d);
      for (const outline of outlines) {
        const theirs = new Set(vertices(outline.d));
        expect(own.filter((v) => theirs.has(v)).length, `${outline.part} outline over the dotted ${line.part} line`).toBeLessThan(own.length / 2);
      }
    }
  });
});
