/**
 * T-168..T-171 · the distribution charts of wave 1 (REQ-400..REQ-405): histogram, ECDF, box plot,
 * violin, ridgeline, beeswarm. Each meets the second catalog's contract (support/), and then its
 * own: the statistic it derives, the derived table (REQ-431), its one heightened element
 * (REQ-442), its diagnostics, and the drawing grammar (REQ-441, REQ-450).
 */
import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, serializeGeometry, stepActive, type ChartModel, type SpCode, type Stroke } from '../src';
import { beeswarmChart } from '../src/charts/beeswarm-chart/beeswarm-chart';
import { boxPlotChart } from '../src/charts/box-plot-chart/box-plot-chart';
import { ecdfChart } from '../src/charts/ecdf-chart/ecdf-chart';
import { histogramChart } from '../src/charts/histogram-chart/histogram-chart';
import { ridgelineChart } from '../src/charts/ridgeline-chart/ridgeline-chart';
import { violinChart } from '../src/charts/violin-chart/violin-chart';
import { createPrng } from '../src/render/prng';
import { context, heightened, R, secondCatalogContract, type Case } from './support/second-catalog-contract';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}


const OBS = [3, 7, 7, 8, 9, 10, 12, 13, 15, 22].map((t, i) => ({ t, g: i % 2 === 0 ? 'a' : 'b', who: `p${i}` }));
const GROUPED = [
  ...[10, 12, 13, 14, 15, 16, 18, 30].map((t) => ({ t, g: 'north' })),
  ...[20, 21, 22, 22, 24, 25, 27].map((t) => ({ t, g: 'south' })),
];

const CASES: readonly Case[] = [
  { recipe: R(histogramChart), consumer: { data: OBS, valueKey: 't', bins: [0, 10, 20, 30] }, items: 3, hostile: [{ t: Number.NaN }, { t: 'x' }], labelOf: (d) => `${String(d.x0)}–${String(d.x1)}` },
  { recipe: R(ecdfChart), consumer: { data: OBS, valueKey: 't' }, items: 9, hostile: [{ t: Number.POSITIVE_INFINITY }], labelOf: (d) => String(d.value) },
  { recipe: R(boxPlotChart), consumer: { data: GROUPED, valueKey: 't', groupKey: 'g' }, items: 3, hostile: [{ t: null, g: 'north' }, { t: 4 }], labelOf: (d) => String(d.group) },
  { recipe: R(violinChart), consumer: { data: GROUPED, valueKey: 't', groupKey: 'g' }, items: 2, hostile: [{ t: Number.NaN, g: 'south' }], labelOf: (d) => String(d.group) },
  { recipe: R(ridgelineChart), consumer: { data: GROUPED, valueKey: 't', groupKey: 'g' }, items: 2, hostile: [{ t: 'n/a', g: 'north' }], labelOf: (d) => String(d.group) },
  { recipe: R(beeswarmChart), consumer: { data: OBS, valueKey: 't', labelKey: 'who' }, items: 10, hostile: [{ t: undefined, who: 'gone' }], labelOf: (d) => String(d.who), rawDatum: true, ordered: true },
];

secondCatalogContract(CASES);

const encodings = (model: ChartModel) => model.geometry.strokes.filter((s) => s.role === 'encoding' && s.part !== 'heighten');
/** The data marks, without the heightened mark's own ink outline. */
const marks = (model: ChartModel) => {
  const raised = new Set(heightened(model).map((s) => s.d));
  return encodings(model).filter((s) => !raised.has(s.d));
};
const rect = (d: string) => {
  const m = /^M([\d.-]+),([\d.-]+)H([\d.-]+)V([\d.-]+)H/.exec(d);
  return m ? { x0: Number(m[1]), y0: Number(m[2]), x1: Number(m[3]), y1: Number(m[4]) } : undefined;
};

describe('T-168 · HistogramChart (REQ-400)', () => {
  const thousand = (() => {
    const random = createPrng(400);
    return Array.from({ length: 1000 }, () => ({ v: Math.round(random() * random() * 1000) / 10 }));
  })();

  test('REQ-400 · 1 000 observations: the bins\' counts sum to 1 000', () => {
    const model = histogramChart.build({ data: thousand, valueKey: 'v' }, context);
    expect(model.geometry.hitAreas.reduce((s, h) => s + h.value, 0)).toBe(1000);
  });

  test('REQ-431 · the table shows each bin\'s range and count, not the rows', () => {
    const model = histogramChart.build({ data: thousand, valueKey: 'v' }, context);
    expect(model.table.columns).toEqual(['v', 'count']);
    expect(model.table.rows.length).toBe(model.geometry.hitAreas.length);
    expect(model.table.rows[0]?.[0]).toMatch(/^\d+(\.\d+)?–\d+(\.\d+)?$/);
    expect(model.description).toMatch(/Freedman–Diaconis/);
  });

  test('REQ-441 · bins abut: square-topped rectangles, toned 2, each ending where the next begins', () => {
    const bins = marks(histogramChart.build({ data: OBS, valueKey: 't', bins: [0, 10, 20, 30] }, context)).map((s) => ({ s, r: rect(s.d) }));
    expect(bins).toHaveLength(3);
    for (const { s, r } of bins) {
      expect(r).toBeDefined();
      expect(s.tone).toBe(2);
    }
    for (let i = 1; i < bins.length; i += 1) expect(bins[i]?.r?.x0).toBe(bins[i - 1]?.r?.x1);
  });

  test('REQ-442 · the modal bin is heightened, at its top', () => {
    const model = histogramChart.build({ data: OBS, valueKey: 't', bins: [0, 10, 20, 30] }, context);
    const modal = model.geometry.hitAreas.reduce((a, b) => (b.value > a.value ? b : a));
    expect(heightened(model)[0]?.d).toContain(`${modal.y}`);
  });

  test('REQ-400 · `cumulative` runs the counts up to n, tone 1 under an ink top line; the last bin is heightened', () => {
    const model = histogramChart.build({ data: OBS, valueKey: 't', bins: [0, 10, 20, 30], cumulative: true }, context);
    expect(model.geometry.hitAreas.map((h) => h.value)).toEqual([5, 9, 10]);
    expect(marks(model).filter((s) => s.tone === 1)).toHaveLength(3);
    expect(marks(model).some((s) => s.tone === undefined && s.part === 'ink' && !s.d.endsWith('Z'))).toBe(true);
    const last = model.geometry.hitAreas.at(-1)!;
    expect(heightened(model)[0]?.d).toContain(`,${last.y}A`);
  });

  test('REQ-433 · an invalid `bins` falls back to the default, SP021', () => {
    const seen = capture();
    const model = histogramChart.build({ data: OBS, valueKey: 't', bins: -2 }, context);
    expect(seen).toEqual(['SP021']);
    expect(model.geometry.hitAreas.length).toBeGreaterThan(0);
  });

  test('orientation rows runs the bins down the plot', () => {
    const model = histogramChart.build({ data: OBS, valueKey: 't', bins: [0, 10, 20, 30], orientation: 'rows' }, context);
    const ys = model.geometry.hitAreas.map((h) => h.y);
    expect(new Set(ys).size).toBe(3);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  test('REQ-443 · above 10 000 observations SP008, still drawn', () => {
    const seen = capture();
    histogramChart.build({ data: Array.from({ length: 10_001 }, (_, i) => ({ v: i % 97 })), valueKey: 'v' }, context);
    expect(seen).toContain('SP008');
  });
});

describe('T-168 · EcdfChart (REQ-401)', () => {
  test('REQ-401 · a step line per group ending at 100 %; the second group in dotted secondary ink', () => {
    const model = ecdfChart.build({ data: OBS, valueKey: 't', groupKey: 'g' }, context);
    const lines = encodings(model).filter((s) => !s.d.endsWith('Z'));
    expect(lines.map((s) => s.part)).toEqual(['ink', 'ink-secondary']);
    expect(lines[1]?.dash).toBe('dotted');
    expect(model.table.columns).toEqual(['t', 'a', 'b']);
    expect(model.table.rows.at(-1)).toEqual(['22', '100%', '100%']);
  });

  test('REQ-401 · past two groups, the rest are not drawn and SP002 says so', () => {
    const seen = capture();
    const model = ecdfChart.build({ data: OBS.map((r, i) => ({ ...r, g: ['a', 'b', 'c'][i % 3] })), valueKey: 't', groupKey: 'g' }, context);
    expect(model.table.columns).toEqual(['t', 'a', 'b']);
    expect(seen).toContain('SP002');
  });

  test('REQ-442 · the first group\'s median crossing is heightened, at 50 %', () => {
    const model = ecdfChart.build({ data: OBS, valueKey: 't' }, context);
    const p50 = model.geometry.hitAreas.find((h) => h.value === 0.5)!;
    expect(heightened(model)[0]?.d).toContain(`,${p50.y}A`);
  });

  test('REQ-401 · markers are quantile rules; one outside 0-1 is SP021', () => {
    const plain = ecdfChart.build({ data: OBS, valueKey: 't' }, context).geometry.strokes.filter((s) => s.part === 'rule').length;
    const marked = ecdfChart.build({ data: OBS, valueKey: 't', markers: [0.5, 0.9] }, context).geometry.strokes.filter((s) => s.part === 'rule').length;
    expect(marked).toBe(plain + 2);
    const seen = capture();
    ecdfChart.build({ data: OBS, valueKey: 't', markers: [1.5] }, context);
    expect(seen).toEqual(['SP021']);
  });
});

describe('T-169 · BoxPlotChart (REQ-402)', () => {
  test('REQ-431 · the table is the five-number summary per group', () => {
    const model = boxPlotChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g' }, context);
    expect(model.table.columns).toEqual(['g', 'n', 'min', 'q1', 'median', 'q3', 'max', 'outliers']);
    expect(model.table.rows[0]).toEqual(['north', '8', '10', '12.75', '14.5', '16.5', '18', '30']);
    expect(model.description).toMatch(/1\.5 IQR/);
  });

  test('REQ-402 · box, median, two whiskers with caps and an outlier per group: all exact encoding', () => {
    const model = boxPlotChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g' }, context);
    const drawn = marks(model);
    expect(drawn.filter((s) => s.tone === 1)).toHaveLength(2);
    expect(drawn.filter((s) => (s.weight ?? 1) > 1)).toHaveLength(2);
    expect(drawn.filter((s) => s.d.includes('A'))).toHaveLength(1);
  });

  test('REQ-402 · the outlier is a stop below its box, by Down', () => {
    const { geometry } = boxPlotChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g' }, context);
    const box = stepActive(geometry, null, 'Home')!;
    expect(box.seriesKey).toBe('median');
    expect(stepActive(geometry, box, 'ArrowDown')?.seriesKey).toBe('outliers');
    expect(stepActive(geometry, box, 'ArrowRight')?.datum).toMatchObject({ group: 'south' });
  });

  test('REQ-402 · `whisker` and `outliers`', () => {
    const wide = boxPlotChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g', whisker: 4 }, context);
    expect(wide.geometry.hitAreas.some((h) => h.seriesKey === 'outliers')).toBe(false);
    const hidden = boxPlotChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g', outliers: false }, context);
    expect(marks(hidden).filter((s) => s.d.includes('A'))).toHaveLength(0);
    const seen = capture();
    boxPlotChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g', whisker: -1 }, context);
    expect(seen).toEqual(['SP021']);
  });

  test('REQ-434 · a group of fewer than 5 is drawn as points, SP022, the others unchanged', () => {
    const seen = capture();
    const small = [...GROUPED, { t: 5, g: 'tiny' }, { t: 6, g: 'tiny' }];
    const model = boxPlotChart.build({ data: small, valueKey: 't', groupKey: 'g' }, context);
    expect(seen).toEqual(['SP022']);
    expect(model.geometry.hitAreas.filter((h) => h.seriesKey === 'median')).toHaveLength(3);
    expect(marks(model).filter((s) => s.tone === 1)).toHaveLength(2);
  });

  test('REQ-442 · the highest median is heightened', () => {
    const model = boxPlotChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g' }, context);
    const south = model.geometry.hitAreas.find((h) => h.seriesKey === 'median' && (h.datum as { group: string }).group === 'south')!;
    expect(heightened(model)[0]?.d).toContain(`,${south.y}A`);
  });
});

describe('T-169 · ViolinChart (REQ-403)', () => {
  test('REQ-403 · a closed, mirrored density per group, toned 1; quartiles as dotted secondary rules', () => {
    const model = violinChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g' }, context);
    const shapes = marks(model).filter((s) => s.tone === 1);
    expect(shapes).toHaveLength(2);
    for (const s of shapes) expect(s.d.endsWith('Z')).toBe(true);
    expect(encodings(model).filter((s) => s.part === 'ink-secondary' && s.dash === 'dotted')).toHaveLength(4);
    expect(model.description).toMatch(/Epanechnikov/);
  });

  test('REQ-403 · `quartiles: false` leaves the median only; `bandwidth` changes the shape', () => {
    const plain = violinChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g', quartiles: false }, context);
    expect(encodings(plain).filter((s) => s.part === 'ink-secondary')).toHaveLength(0);
    const narrow = violinChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g', bandwidth: 1 }, context);
    expect(serializeGeometry(narrow.geometry)).not.toBe(serializeGeometry(violinChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g' }, context).geometry));
  });

  test('REQ-433 · REQ-434 · a bad bandwidth is SP021; a single observation is a point, SP022', () => {
    const seen = capture();
    violinChart.build({ data: [...GROUPED, { t: 3, g: 'one' }], valueKey: 't', groupKey: 'g', bandwidth: 0 }, context);
    expect(seen.sort()).toEqual(['SP021', 'SP022']);
  });
});

describe('T-170 · RidgelineChart (REQ-404)', () => {
  test('REQ-404 · an open density line per group, untoned, on its own baseline rule', () => {
    const model = ridgelineChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g' }, context);
    const ridges = marks(model);
    expect(ridges).toHaveLength(2);
    for (const s of ridges) {
      expect(s.tone).toBeUndefined();
      expect(s.d.endsWith('Z')).toBe(false);
    }
    expect(model.geometry.labels.filter((l) => l.text === 'north' || l.text === 'south')).toHaveLength(2);
  });

  test('REQ-404 · `overlap` lets a ridge reach into the one behind; outside 0-1 is SP021', () => {
    const top = (overlap: number) => Math.min(...ridgelineChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g', overlap }, context).geometry.hitAreas.map((h) => h.y));
    expect(top(1)).not.toBe(top(0));
    const seen = capture();
    ridgelineChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g', overlap: 2 }, context);
    expect(seen).toEqual(['SP021']);
  });

  test('REQ-442 · the front ridge\'s peak is heightened', () => {
    const model = ridgelineChart.build({ data: GROUPED, valueKey: 't', groupKey: 'g' }, context);
    const front = model.geometry.hitAreas.at(-1)!;
    expect(heightened(model)[0]?.d).toContain(`,${front.y}A`);
  });
});

describe('T-171 · BeeswarmChart (REQ-405)', () => {
  const pointsOf = (model: ChartModel) =>
    encodings(model).map((s: Stroke) => {
      const m = /^M([\d.-]+),([\d.-]+)A([\d.]+)/.exec(s.d)!;
      return { x: Number(m[1]) + Number(m[3]), y: Number(m[2]), r: Number(m[3]) };
    });

  test('REQ-405 · I-28 · one point per observation, none overlapping (centres ≥ 2r − 0.01 apart)', () => {
    const model = beeswarmChart.build({}, context);
    const points = pointsOf(model);
    expect(points).toHaveLength(240);
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i]!;
        const b = points[j]!;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r - 0.01);
      }
    }
  });

  test('REQ-405 · the keyboard walks the points in value order; the maximum is heightened', () => {
    const model = beeswarmChart.build({ data: OBS, valueKey: 't', labelKey: 'who' }, context);
    const values = model.geometry.hitAreas.map((h) => h.value);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    const max = model.geometry.hitAreas.at(-1)!;
    expect(heightened(model)[0]?.d).toContain(`,${max.y}A`);
  });

  test('REQ-405 · groups get a swarm each; the radius prop applies', () => {
    const one = beeswarmChart.build({ data: OBS, valueKey: 't' }, context);
    const two = beeswarmChart.build({ data: OBS, valueKey: 't', groupKey: 'g' }, context);
    expect(new Set(two.geometry.hitAreas.map((h) => h.y)).size).toBeGreaterThan(new Set(one.geometry.hitAreas.map((h) => h.y)).size - 1);
    expect(pointsOf(beeswarmChart.build({ data: OBS, valueKey: 't', radius: 5 }, context))[0]?.r).toBe(5);
  });

  test('REQ-443 · above 500 points SP008, still drawn', () => {
    const seen = capture();
    beeswarmChart.build({ data: Array.from({ length: 501 }, (_, i) => ({ t: i % 50 })), valueKey: 't' }, context);
    expect(seen).toContain('SP008');
  });
});
