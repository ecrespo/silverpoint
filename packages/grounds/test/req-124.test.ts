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
  // Phase 3 (T-088): the polar charts. Written after the recipes; each was mutation-checked.

  test('DonutChart · every sector is named with its share, and its sweep is its share of the turn', () => {
    const data = [{ name: 'A', value: 50 }, { name: 'B', value: 30 }, { name: 'C', value: 20 }];
    const model = render('DonutChart', { data });
    expect(texts(model)).toEqual(expect.arrayContaining(['A', '50%', 'B', '30%', 'C', '20%']));
    const sweeps = sectorSweeps(model);
    expect(near(sweeps[0]! / sweeps[1]!, 50 / 30)).toBe(true);
  });

  test('RadarChart · a value is its distance along its spoke', () => {
    const model = render('RadarChart', { data: [{ subject: 'A', value: 10 }, { subject: 'B', value: 5 }, { subject: 'C', value: 2.5 }], domain: [0, 10] });
    const [a, b, c] = model.geometry.hitAreas.map((h) => distanceFromCentre(model, h));
    expect(near(b! / a!, 0.5)).toBe(true);
    expect(near(c! / a!, 0.25)).toBe(true);
  });

  test('PolarBarChart · a bar’s length out from the hole is proportional to its value, and every bar is named', () => {
    const model = render('PolarBarChart', { data: [{ name: 'A', value: 40 }, { name: 'B', value: 20 }, { name: 'C', value: 10 }] });
    const [a, b, c] = model.geometry.hitAreas.map((h) => distanceFromCentre(model, h));
    expect(near((a! - b!) / (b! - c!), 20 / 10)).toBe(true);
    expect(texts(model)).toEqual(expect.arrayContaining(['A', 'B', 'C']));
  });

  test('RadialArcGroup · RadialRings · every track is named with its value beside it', () => {
    expect(texts(render('RadialArcGroup', { data: [{ name: 'A', value: 80 }, { name: 'B', value: 40 }] }))).toEqual(expect.arrayContaining(['A', '80', 'B', '40']));
    expect(texts(render('RadialRings', { data: [{ name: 'A', value: 80 }, { name: 'B', value: 40 }] }))).toEqual(expect.arrayContaining(['A', '80%', 'B', '40%']));
  });

  test('GaugeArc · MeterChart · the percent is printed', () => {
    expect(texts(render('GaugeArc', { percent: 37 }))).toContain('37%');
    expect(texts(render('MeterChart', { percent: 64 }))).toContain('64%');
  });

  test('CoxcombChart · every sector is named, and its radius is the square root of its value', () => {
    const model = render('CoxcombChart', { data: [{ name: 'A', value: 100 }, { name: 'B', value: 25 }] });
    expect(texts(model)).toEqual(expect.arrayContaining(['A', 'B']));
    const radii = encodings(model).map((s) => Number(/A([\d.]+),/.exec(s.d)?.[1]));
    expect(near(radii[1]! / radii[0]!, 0.5)).toBe(true);
  });

  test('WindRose · every speed bin is named with its share, calmest first, and the calms are printed', () => {
    const model = render('WindRose', { bins: [5, 10] });
    const printed = texts(model);
    expect(printed).toEqual(expect.arrayContaining(['< 5', '5–10', '≥ 10']));
    expect(printed.indexOf('< 5')).toBeLessThan(printed.indexOf('≥ 10'));
    expect(printed.some((t) => /^calm \d+%$/.test(t))).toBe(true);
  });

  test('VolvelleChart · what the index shows is printed, not only toned', () => {
    const model = render('VolvelleChart', { data: [{ label: 'Day', segments: ['Mon', 'Tue'] }, { label: 'Shift', segments: ['Early', 'Late'] }], indexValue: 'Tue' });
    expect(texts(model)).toContain('Day Tue · Shift Late');
  });

  test('ChordRing · every category is named at its arc, and a ribbon’s ends span angles proportional to its flow', () => {
    const model = render('ChordRing', { data: [{ source: 'A', target: 'B', value: 30 }, { source: 'A', target: 'C', value: 10 }] });
    expect(texts(model)).toEqual(expect.arrayContaining(['A', 'B', 'C']));
    const ribbons = encodings(model).filter((s) => s.d.includes('Q'));
    const spans = ribbons.map((r) => ribbonSpan(r.d));
    expect(near(spans[0]! / spans[1]!, 3)).toBe(true);
  });

  test('OrbitChart · a marker’s area is its value; every orbit is named', () => {
    const model = render('OrbitChart', { data: [{ label: 'In', markers: [{ period: 0, value: 4 }, { period: 0.5, value: 1 }] }, { label: 'Out', markers: [] }] });
    const [big, small] = model.geometry.hitAreas;
    expect(near((box(big!).width / box(small!).width) ** 2, 4)).toBe(true);
    expect(texts(model)).toEqual(expect.arrayContaining(['In', 'Out']));
  });
});

/** Distance of a hit from its chart's centre: the plot's centre on the charts drawn without a legend. */
function distanceFromCentre(model: Rendered, hit: HitArea): number {
  const { plot } = model.geometry;
  return Math.hypot(hit.x - (plot.x + plot.width / 2), hit.y - (plot.y + plot.height / 2));
}

/** Sweeps of the donut's sectors, read from the angle between each outer arc's two ends. */
function sectorSweeps(model: Rendered): number[] {
  return encodings(model).map((s) => {
    const points = [...s.d.matchAll(/(-?[\d.]+),(-?[\d.]+)(?=[MLAZ])/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
    const inner = [...s.d.matchAll(/A([\d.]+),/g)].map((m) => Number(m[1]));
    const [p0, p1] = points;
    const chord = Math.hypot(p1!.x - p0!.x, p1!.y - p0!.y);
    const r = Math.max(...inner);
    const large = /A[\d.]+,[\d.]+,0,1,/.test(s.d);
    const a = 2 * Math.asin(Math.min(chord / (2 * r), 1));
    return large ? 2 * Math.PI - a : a;
  });
}

/** Angle spanned by a ribbon's first end: the chord between its first two points on the ring. */
function ribbonSpan(d: string): number {
  const points = [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)(?=[MLAQZ])/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
  const r = Number(/A([\d.]+),/.exec(d)?.[1]);
  const [p0, p1] = points;
  return 2 * Math.asin(Math.min(Math.hypot(p1!.x - p0!.x, p1!.y - p0!.y) / (2 * r), 1));
}


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
