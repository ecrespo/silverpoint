import { afterEach, describe, expect, test } from 'vitest';
import {
  __setDiagnosticSink,
  barChart,
  bubbleChart,
  candlestickChart,
  chordRing,
  donutChart,
  funnelChart,
  radarChart,
  sankeyChart,
  sparklineRows,
  streamChart,
  volvelleChart,
  waterfallChart,
  windRose,
  type ChartModel,
  type RecipeContext,
  type SpCode,
} from '../src';
import { formatNumber } from '../src/charts/shared/format';

/**
 * T-090: the minors deferred by the Phase 2 and Phase 3 final reviews, each reproduced before its
 * fix. Ids name the ledger lines (`changes/phase-2-progress.md` M1-M8, `phase-3-progress.md` M-1..M-10).
 */
let restore: () => void = () => {};
afterEach(() => restore());
function capture(): { code: SpCode; message: string }[] {
  const seen: { code: SpCode; message: string }[] = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}
const codes = (seen: { code: SpCode }[]) => seen.map((d) => d.code);

const context: RecipeContext = { id: 'sp-t090', width: 320, locale: 'en', emptyState: { text: 'No data', rule: true }, domainPadding: 0.1 };
const bare = { chrome: 'bare', height: 150 } as const;
const texts = (model: ChartModel) => model.geometry.labels.map((l) => l.text);
const encoding = (model: ChartModel) => model.geometry.strokes.filter((s) => s.role === 'encoding');

describe('Phase 2 minors', () => {
  test('M1 · REQ-005 · a formatter is keyed by every option it reads, inherited ones included', () => {
    const percent = Object.create({ style: 'percent' }) as Intl.NumberFormatOptions;
    // Built first with the plain options, the cache must not hand the percent options the same formatter.
    expect(formatNumber(0.5, 'en', {})).toBe('0.5');
    expect(formatNumber(0.5, 'en', percent)).toBe('50%');
  });

  test('M2 · REQ-008 · an out-of-range `sizeRange` falls back to the default, and says so', () => {
    const seen = capture();
    bubbleChart.build({ ...bare, data: [{ x: 1, y: 2, size: 3 }], sizeRange: [50, 10] }, context);
    expect(seen.some((d) => d.code === 'SP002' && d.message.includes('sizeRange'))).toBe(true);
  });

  test('M3 · REQ-008 · a funnel with no stage above zero is empty, and says why', () => {
    const seen = capture();
    const model = funnelChart.build({ ...bare, data: [{ stage: 'Visit', value: 0 }, { stage: 'Buy', value: -2 }] }, context);
    expect(model.geometry.labels.some((l) => l.kind === 'empty')).toBe(true);
    expect(codes(seen)).toContain('SP002');
  });

  test('M4 · REQ-008 · a waterfall row with both a base and a delta warns that the delta is ignored', () => {
    const seen = capture();
    waterfallChart.build({ ...bare, data: [{ step: 'Start', base: 10, delta: 4 }, { step: 'Up', delta: 2 }] }, context);
    expect(seen.some((d) => d.code === 'SP002' && d.message.includes('delta'))).toBe(true);
  });

  test('M5 · REQ-097 · inverted `bounds` are warned, not dropped silently', () => {
    const seen = capture();
    candlestickChart.build({ ...bare, data: [{ time: 'Mon', open: 2, high: 4, low: 1, close: 3 }], bounds: [10, 0] }, context);
    expect(seen.some((d) => d.code === 'SP002' && d.message.includes('bounds'))).toBe(true);
  });

  test('M5 · REQ-097 · with no valid candle, SP009 says the rows are the cause, not only `bounds`', () => {
    capture();
    // SP009 is an error: it throws in development.
    expect(() => candlestickChart.build({ ...bare, data: [{ time: 'Mon', open: '2', high: '4', low: '1', close: '3' }] }, context)).toThrow(/finite numbers/);
  });

  test('M6 · REQ-010 · an all-zero bar chart shows no negative tick', () => {
    const model = barChart.build({ ...bare, data: [{ x: 'a', value: 0 }, { x: 'b', value: 0 }] }, context);
    expect(texts(model).filter((t) => /^[-−]/.test(t))).toEqual([]);
  });

  test('M6 · REQ-010 · an all-zero waterfall shows no negative tick', () => {
    const model = waterfallChart.build({ ...bare, data: [{ step: 'Start', base: 0 }, { step: 'Up', delta: 0 }] }, context);
    expect(texts(model).filter((t) => /^[-−]/.test(t))).toEqual([]);
  });

  test('M7 · REQ-074 · stacked, a smaller second wave still rides above the first (fails if overlaid)', () => {
    // q < p everywhere: overlaid, q's top sits below p's; stacked, at p + q, above it.
    const data = [{ x: 'a', p: 3, q: 1 }, { x: 'b', p: 4, q: 1 }];
    const top = (model: ChartModel, key: string) => model.geometry.hitAreas.find((h) => h.seriesKey === key && h.index === 0)!.y;
    const stacked = streamChart.build({ ...bare, data, keys: ['p', 'q'], stacked: true }, context);
    expect(top(stacked, 'q')).toBeLessThan(top(stacked, 'p'));
    const overlaid = streamChart.build({ ...bare, data, keys: ['p', 'q'] }, context);
    expect(top(overlaid, 'q')).toBeGreaterThan(top(overlaid, 'p'));
  });

  test('M8 · REQ-008 · a non-integer `rows` is warned', () => {
    const seen = capture();
    sparklineRows.build({ ...bare, rows: 1.5 }, context);
    expect(seen.some((d) => d.code === 'SP002' && d.message.includes('rows'))).toBe(true);
  });
});

describe('Phase 3 minors', () => {
  test('M-1 · REQ-091 · a real category named “Other” is not confused with the merge bucket', () => {
    const data = [
      { source: 'Other', target: 'A', value: 50 },
      { source: 'A', target: 'B', value: 40 },
      { source: 'B', target: 'C', value: 2 },
      { source: 'C', target: 'D', value: 1 },
    ];
    const model = chordRing.build({ ...bare, data, maxCategories: 3 }, context);
    const rim = texts(model).filter((t) => /^Other/.test(t));
    expect(new Set(rim).size).toBe(rim.length);
    expect(encoding(model).filter((s) => !s.d.includes('Q'))).toHaveLength(3);
  });

  test('M-2 · REQ-124 · drawn neighbours never share a tone, even with empty sectors between them', () => {
    const data = [5, 0, 0, 0, 5, 5].map((value, i) => ({ name: `s${i}`, value }));
    const tones = encoding(donutChart.build({ ...bare, data, legend: false }, context)).map((s) => s.tone);
    expect(tones).toHaveLength(3);
    tones.forEach((tone, k) => expect(tone, `sector ${k}`).not.toBe(tones[(k + 1) % tones.length]));
  });

  test('M-3 · REQ-076 · an all-zero radar without a domain is empty, and says why', () => {
    const seen = capture();
    const model = radarChart.build({ ...bare, data: ['a', 'b', 'c'].map((subject) => ({ subject, value: 0 })) }, context);
    expect(model.geometry.labels.some((l) => l.kind === 'empty')).toBe(true);
    expect(codes(seen)).toContain('SP002');
  });

  test('M-3 · REQ-076 · a radar of fewer than three subjects warns: it cannot close a polygon', () => {
    const seen = capture();
    radarChart.build({ ...bare, data: [{ subject: 'a', value: 1 }, { subject: 'b', value: 2 }] }, context);
    expect(seen.some((d) => d.code === 'SP002' && d.message.includes('three'))).toBe(true);
  });

  test('M-4 · REQ-089 · an all-calm wind rose names no prevailing direction', () => {
    const model = windRose.build({ ...bare, data: [{ bearing: 90, speed: 0 }, { bearing: 180, speed: 0 }] }, context);
    expect(model.description).not.toContain('most often');
    expect(model.description).toContain('calm');
  });

  test('M-5 · REQ-090 · `indexRing` counts the rings as given, before an invalid one is left out', () => {
    const data = [{ label: 'Bad' }, { label: 'A', segments: ['a0', 'a1'] }, { label: 'B', segments: ['b0', 'b1', 'b2', 'b3'] }];
    const model = volvelleChart.build({ ...bare, data, indexRing: 2, indexValue: 'b2' }, context);
    expect(texts(model)).toContain('A a1 · B b2');
  });

  // Superseded by delta-011 (T-102): the demo no longer keeps its own index, it turns.
  test('M-6 · REQ-098 · REQ-090 · `indexValue` without `data` turns the demo, and warns nothing', () => {
    const seen = capture();
    const model = volvelleChart.build({ ...bare, indexValue: 'Tue' }, context);
    expect(texts(model).join(' ')).toContain('Day Tue');
    expect(codes(seen)).toEqual([]);
  });

  test('M-8 · REQ-075 · a sector without a name is warned', () => {
    const seen = capture();
    donutChart.build({ ...bare, data: [{ value: 3 }, { name: 'B', value: 2 }] }, context);
    expect(seen.some((d) => d.code === 'SP002' && d.message.includes('name'))).toBe(true);
  });

  test('M-9 · REQ-096 · a volvelle ring of more than 60 segments warns SP008', () => {
    const seen = capture();
    volvelleChart.build({ ...bare, data: [{ label: 'Many', segments: Array.from({ length: 61 }, (_, i) => `s${i}`) }] }, context);
    expect(codes(seen)).toContain('SP008');
  });

  test('M-9 · REQ-091 · with hundreds of categories every arc keeps an extent', () => {
    capture();
    const data = Array.from({ length: 200 }, (_, i) => ({ source: `c${i}`, target: `c${(i + 1) % 200}`, value: 1 }));
    const model = chordRing.build({ ...bare, data, maxCategories: 200 }, context);
    expect(encoding(model).filter((s) => !s.d.includes('Q'))).toHaveLength(200);
  });
});

describe('found by the render benchmark (T-093)', () => {
  test('REQ-008 · a sankey whose layers have room warns nothing: a one-node layer has no gap to narrow', () => {
    const seen = capture();
    sankeyChart.build({ ...bare, data: [{ source: 'A', target: 'B', value: 5 }, { source: 'A', target: 'C', value: 3 }] }, context);
    expect(codes(seen)).toEqual([]);
  });
});

