import { afterEach, describe, expect, test } from 'vitest';
import {
  __setDiagnosticSink,
  readout,
  areaChart,
  barChart,
  bubbleChart,
  candlestickChart,
  composedChart,
  funnelChart,
  kpiCard,
  rangeBandChart,
  scatterChart,
  sparklineRows,
  stackedBarChart,
  stepActive,
  stepChart,
  streamChart,
  waterfallChart,
  type ChartModel,
  type HitArea,
  type RecipeContext,
  type SpCode,
} from '../src';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const context: RecipeContext = { id: 'sp-p2', width: 320, locale: 'en', emptyState: { text: 'No data', rule: true }, domainPadding: 0.1 };
const bare = { chrome: 'bare', height: 150 } as const;
const texts = (model: ChartModel) => model.geometry.labels.map((l) => l.text);
const box = (hit: HitArea | undefined) => {
  if (!hit?.box) throw new Error('hit area without a box');
  return hit.box;
};
const close = (a: number, b: number, tolerance = 0.03) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tolerance);
const encoding = (model: ChartModel) => model.geometry.strokes.filter((s) => s.role === 'encoding');
/** Every coordinate pair of a path, in order. */
const vertices = (d: string) => [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(([, x, y]) => [Number(x), Number(y)] as const);
const hasVertex = (d: string, x: number, y: number) => vertices(d).some(([vx, vy]) => Math.abs(vx - x) < 0.02 && Math.abs(vy - y) < 0.02);
const bySeries = (model: ChartModel, key: string) => model.geometry.hitAreas.filter((h) => h.seriesKey === key);

describe('StepChart', () => {
  const data = [{ x: 'a', value: 1 }, { x: 'b', value: 3 }, { x: 'c', value: 2 }];
  const pathOf = (model: ChartModel) => encoding(model).find((s) => (s.paint ?? 'stroke') === 'stroke' && s.part === 'ink')!.d;

  test.each([
    ['after', (a: HitArea, b: HitArea) => [b.x, a.y]],
    ['before', (a: HitArea, b: HitArea) => [a.x, b.y]],
    ['middle', (a: HitArea, b: HitArea) => [(a.x + b.x) / 2, a.y]],
  ] as const)('REQ-061 · step %s turns at the exact corner', (step, corner) => {
    const model = stepChart.build({ ...bare, data, step }, context);
    const [a, b] = model.geometry.hitAreas;
    const [x, y] = corner(a!, b!);
    expect(hasVertex(pathOf(model), x!, y!), `${step}: (${x}, ${y}) in ${pathOf(model)}`).toBe(true);
  });
});

describe('SparklineRows', () => {
  const data = [{ name: 'CPU', readout: '42%', points: [1, 3, 2] }, { name: 'RAM', points: [{ value: 5 }, { value: 4 }] }];

  test('REQ-062 · REQ-124 · each row prints its name and its readout — given, or the last value', () => {
    const model = sparklineRows.build({ ...bare, data }, context);
    expect(texts(model)).toEqual(expect.arrayContaining(['CPU', '42%', 'RAM', '4']));
  });

  test('REQ-062 · each row draws its sparkline inside its own band', () => {
    const model = sparklineRows.build({ ...bare, data }, context);
    const lines = encoding(model).filter((s) => (s.paint ?? 'stroke') === 'stroke');
    expect(lines).toHaveLength(2);
    model.geometry.hitAreas.forEach((hit, i) => {
      const band = box(hit);
      for (const [, y] of vertices(lines[i]!.d)) expect(y >= band.y - 0.01 && y <= band.y + band.height + 0.01).toBe(true);
    });
  });

  test('REQ-062 · `rows` caps the rows shown', () => {
    expect(sparklineRows.build({ ...bare, data, rows: 1 }, context).geometry.hitAreas).toHaveLength(1);
  });
});

describe('KpiCard', () => {
  const data = [{ value: 5 }, { value: 7 }, { value: 6 }];

  test('REQ-063 · REQ-124 · the figure, the metric and the signed delta are printed', () => {
    const model = kpiCard.build({ data, metric: 'Orders', delta: 12 }, context);
    expect(texts(model)).toEqual(expect.arrayContaining(['6', 'Orders', '+12']));
    expect(texts(kpiCard.build({ data, delta: -3 }, context))).toContain('-3');
  });

  test('REQ-063 · a direction mark points up for a rise, down for a fall; deltaTone overrides the sign', () => {
    const apex = (model: ChartModel) => {
      const mark = encoding(model).find((s) => /^M[^LCAZ]+L[^LCAZ]+L[^LCAZ]+Z$/.test(s.d))!;
      const [first, second, third] = vertices(mark.d);
      return { apexUp: second![1] < first![1] && second![1] < third![1] };
    };
    expect(apex(kpiCard.build({ data, delta: 12 }, context)).apexUp).toBe(true);
    expect(apex(kpiCard.build({ data, delta: -3 }, context)).apexUp).toBe(false);
    expect(apex(kpiCard.build({ data, delta: 12, deltaTone: 'down' }, context)).apexUp).toBe(false);
  });

  test('REQ-063 · the series is an area sparkline: a closed, toned shape', () => {
    const area = encoding(kpiCard.build({ data }, context)).find((s) => s.d.endsWith('Z') && s.tone !== undefined);
    expect(area).toBeDefined();
  });
});

describe('BarChart', () => {
  const data = [{ x: 'a', value: 4, extra: 1 }, { x: 'b', value: 2, extra: 3 }, { x: 'c', value: -2, extra: 2 }];

  test('REQ-064 · columns grow from zero: height ∝ value, a negative one below the baseline', () => {
    const model = barChart.build({ ...bare, data }, context);
    const [a, b, c] = bySeries(model, 'value').map(box);
    close(a!.height, 2 * b!.height);
    close(c!.height, b!.height);
    close(c!.y, a!.y + a!.height);
  });

  test('REQ-064 · bars are pills: their ends are arcs', () => {
    expect(encoding(barChart.build({ ...bare, data }, context)).every((s) => s.d.includes('A'))).toBe(true);
  });

  test("REQ-064 · orientation 'rows' lays the bars horizontally, width ∝ value", () => {
    const [a, b] = bySeries(barChart.build({ ...bare, data: data.slice(0, 2), orientation: 'rows' }, context), 'value').map(box);
    close(a!.width, 2 * b!.width);
    close(a!.x, b!.x);
    expect(b!.y).toBeGreaterThan(a!.y);
  });

  test('REQ-064 · REQ-124 · a secondary series sits beside the first, dotted, and named in a legend', () => {
    const model = barChart.build({ ...bare, data, secondaryKey: 'extra' }, context);
    const [p] = bySeries(model, 'value').map(box);
    const [s] = bySeries(model, 'extra').map(box);
    expect(s!.x).toBeGreaterThan(p!.x);
    expect(encoding(model).some((st) => st.dash === 'dotted')).toBe(true);
    expect(texts(model)).toEqual(expect.arrayContaining(['value', 'extra']));
  });
});

describe('StackedBarChart', () => {
  const data = [{ x: 'a', p: 1, q: 3 }, { x: 'b', p: 2, q: 2 }];

  test('REQ-065 · each segment starts where the one below ends; the stack height is the sum', () => {
    const model = stackedBarChart.build({ ...bare, data, keys: ['p', 'q'] }, context);
    const [p0, p1] = bySeries(model, 'p').map(box);
    const [q0, q1] = bySeries(model, 'q').map(box);
    close(q0!.y + q0!.height, p0!.y);
    close(p0!.height + q0!.height, p1!.height + q1!.height);
  });

  test('REQ-065 · REQ-124 · keys have their own tone and their names in a legend, in stack order', () => {
    const model = stackedBarChart.build({ ...bare, data, keys: ['p', 'q'], names: ['Paid', 'Free'] }, context);
    expect(texts(model)).toEqual(expect.arrayContaining(['Paid', 'Free']));
    const tones = new Set(encoding(model).filter((s) => s.tone).map((s) => s.tone));
    expect(tones.size).toBeGreaterThanOrEqual(2);
  });

  test('REQ-065 · a negative segment is drawn at zero and warned', () => {
    const seen = capture();
    const model = stackedBarChart.build({ ...bare, data: [{ x: 'a', p: -1, q: 2 }], keys: ['p', 'q'] }, context);
    expect(box(bySeries(model, 'p')[0]).height).toBe(0);
    expect(seen).toContain('SP002');
  });
});

describe('ComposedChart', () => {
  const data = [{ x: 'a', bar: 3, line: 3 }, { x: 'b', bar: 5, line: 1 }];

  test('REQ-066 · columns and a line share one value scale', () => {
    const model = composedChart.build({ ...bare, data, barKey: 'bar', lineKey: 'line' }, context);
    const [bar] = bySeries(model, 'bar').map(box);
    const [point] = bySeries(model, 'line');
    close(point!.y, bar!.y);
  });

  test('REQ-066 · showLine: false omits the line', () => {
    const model = composedChart.build({ ...bare, data, barKey: 'bar', lineKey: 'line', showLine: false }, context);
    expect(bySeries(model, 'line')).toEqual([]);
  });
});

describe('WaterfallChart', () => {
  const data = [{ step: 'Start', base: 10 }, { step: 'Up', delta: 5 }, { step: 'Down', delta: -3 }, { step: 'End', base: 12 }];

  test('REQ-067 · totals rise from zero; deltas float from the running total', () => {
    const [start, up, down, end] = waterfallChart.build({ ...bare, data }, context).geometry.hitAreas.map(box);
    const unit = start!.height / 10;
    close(end!.y + end!.height, start!.y + start!.height);
    close(up!.height, 5 * unit);
    close(up!.y + up!.height, start!.y);
    close(down!.y, up!.y);
    close(down!.height, 3 * unit);
  });

  test('REQ-067 · REQ-124 · rises and falls are printed with their sign; totals plainly', () => {
    expect(texts(waterfallChart.build({ ...bare, data }, context))).toEqual(expect.arrayContaining(['10', '+5', '-3', '12']));
  });
});

describe('FunnelChart', () => {
  const data = [{ stage: 'Visit', value: 200 }, { stage: 'Cart', value: 80 }, { stage: 'Buy', value: 20 }];

  test('REQ-068 · stages are centred, width ∝ value, top to bottom', () => {
    const [a, b, c] = funnelChart.build({ ...bare, data }, context).geometry.hitAreas.map(box);
    close(a!.width, 2.5 * b!.width, 0.05);
    close(a!.x + a!.width / 2, c!.x + c!.width / 2);
    expect(c!.y).toBeGreaterThan(b!.y);
  });

  test('REQ-068 · REQ-124 · each stage prints its value and its share of the first', () => {
    expect(texts(funnelChart.build({ ...bare, data }, context))).toEqual(expect.arrayContaining(['Visit', '200', '100%', '80', '40%', '10%']));
  });
});

describe('CandlestickChart', () => {
  const data = [
    { time: 'd1', open: 10, high: 14, low: 8, close: 12 },
    { time: 'd2', open: 12, high: 13, low: 9, close: 10 },
  ];

  test('REQ-071 · a wick runs from low to high through the middle of the body', () => {
    const model = candlestickChart.build({ ...bare, data, bounds: [0, 20] }, context);
    const { plot } = model.geometry;
    const y = (v: number) => plot.y + plot.height - (v / 20) * plot.height;
    const [first] = model.geometry.hitAreas;
    const wick = encoding(model).find((s) => /^M[\d.]+,[\d.]+V[\d.]+$/.test(s.d) && hasVertex(s.d, first!.x, y(14)));
    expect(wick?.d).toBe(`M${first!.x},${Math.round(y(14) * 100) / 100}V${Math.round(y(8) * 100) / 100}`);
  });

  test('REQ-071 · REQ-124 · a rising candle is hollow and a falling one solid — fill, not hatch', () => {
    const bodies = encoding(candlestickChart.build({ ...bare, data }, context)).filter((s) => s.d.endsWith('Z'));
    expect(bodies[0]?.paint ?? 'stroke').toBe('stroke');
    expect(bodies.some((s) => s.paint === 'fill')).toBe(true);
  });

  test('REQ-071 · a row breaking low ≤ min(open, close) ≤ max(open, close) ≤ high is dropped and warned', () => {
    const seen = capture();
    const model = candlestickChart.build({ ...bare, data: [...data, { time: 'bad', open: 10, high: 11, low: 9, close: 12 }] }, context);
    expect(model.geometry.hitAreas).toHaveLength(2);
    expect(seen).toContain('SP002');
  });

  test('REQ-097 · `bounds` pins the price scale; otherwise it is derived from low and high', () => {
    const pinned = candlestickChart.build({ ...bare, data, bounds: [0, 20] }, context);
    const derived = candlestickChart.build({ ...bare, data }, context);
    expect(pinned.description).toMatch(/0 to 20/);
    expect(derived.description).toMatch(/8 to 14/);
  });

  test('REQ-097 · rows that all break the invariant, with no bounds, throw SP009 naming `bounds`', () => {
    capture();
    expect(() => candlestickChart.build({ ...bare, data: [{ time: 'x', open: 5, high: 1, low: 9, close: 5 }] }, context)).toThrow(/SP009.*bounds/);
    expect(() => candlestickChart.build({ ...bare, data: [{ time: 'x', open: 5, high: 1, low: 9, close: 5 }], bounds: [0, 10] }, context)).not.toThrow();
  });
});

describe('AreaChart', () => {
  const data = [{ x: 'a', value: 1 }, { x: 'b', value: 4 }, { x: 'c', value: 2 }];

  test('REQ-072 · a toned area closes on the zero baseline, under its own line', () => {
    const model = areaChart.build({ ...bare, data }, context);
    const area = encoding(model).find((s) => s.tone !== undefined)!;
    const line = encoding(model).find((s) => s.tone === undefined && (s.paint ?? 'stroke') === 'stroke' && s.part === 'ink')!;
    expect(area.d.endsWith('Z')).toBe(true);
    const bottom = Math.max(...vertices(area.d).map(([, y]) => y));
    close(bottom, model.geometry.plot.y + model.geometry.plot.height);
    for (const hit of model.geometry.hitAreas) expect(hasVertex(line.d, hit.x, hit.y)).toBe(true);
  });
});

describe('RangeBandChart', () => {
  test('REQ-073 · low and high share each x, and the band closes between them', () => {
    const model = rangeBandChart.build({ ...bare, data: [{ x: 'a', low: 1, high: 3 }, { x: 'b', low: 2, high: 5 }] }, context);
    const [l0] = bySeries(model, 'low');
    const [h0] = bySeries(model, 'high');
    expect(l0!.x).toBe(h0!.x);
    expect(l0!.y).toBeGreaterThan(h0!.y);
    expect(encoding(model).some((s) => s.d.endsWith('Z') && s.tone !== undefined)).toBe(true);
  });

  test('REQ-122 · on a grid, End goes to the end of the current row, Home to its start', () => {
    const model = rangeBandChart.build({ ...bare, data: [{ x: 'a', low: 1, high: 3 }, { x: 'b', low: 2, high: 5 }, { x: 'c', low: 1, high: 4 }] }, context);
    const first = stepActive(model.geometry, null, 'Home');
    expect(first).toMatchObject({ seriesKey: 'low', index: 0 });
    const end = stepActive(model.geometry, first ?? null, 'End');
    expect(end).toMatchObject({ seriesKey: 'low', index: 2 });
    const up = stepActive(model.geometry, end ?? null, 'ArrowDown');
    expect(up).toMatchObject({ seriesKey: 'high', index: 2 });
    expect(stepActive(model.geometry, up ?? null, 'Home')).toMatchObject({ seriesKey: 'high', index: 0 });
  });

  test('REQ-073 · a row with low > high is swapped and warned (Data Model §2.1)', () => {
    const seen = capture();
    const model = rangeBandChart.build({ ...bare, data: [{ x: 'a', low: 5, high: 1 }] }, context);
    expect(bySeries(model, 'low')[0]!.value).toBe(1);
    expect(seen).toContain('SP002');
  });
});

describe('StreamChart', () => {
  const data = [{ x: 'a', p: 1, q: 2 }, { x: 'b', p: 3, q: 1 }];

  test('REQ-074 · stacked, the second wave rides on the first', () => {
    const model = streamChart.build({ ...bare, data, keys: ['p', 'q'], stacked: true }, context);
    const overlaid = streamChart.build({ ...bare, data, keys: ['p', 'q'] }, context);
    const [p0] = bySeries(overlaid, 'p');
    const [q0] = bySeries(model, 'q');
    const [p0s] = bySeries(model, 'p');
    // In the stacked chart q's top is at p + q = 3, while p alone is at 1.
    expect(q0!.y).toBeLessThan(p0s!.y);
    expect(p0!.y).toBeGreaterThan(bySeries(overlaid, 'q')[0]!.y);
  });

  test('REQ-074 · REQ-124 · the waves differ by dash, not by tone alone, and are named', () => {
    const model = streamChart.build({ ...bare, data, keys: ['p', 'q'] }, context);
    expect(encoding(model).some((s) => s.dash === 'dotted')).toBe(true);
    expect(texts(model)).toEqual(expect.arrayContaining(['p', 'q']));
  });

  test('REQ-074 · a third key is ignored and warned: the stream has two waves', () => {
    const seen = capture();
    const model = streamChart.build({ ...bare, data: [{ x: 'a', p: 1, q: 2, r: 3 }], keys: ['p', 'q', 'r'] }, context);
    expect(bySeries(model, 'r')).toEqual([]);
    expect(seen).toContain('SP002');
  });
});

describe('ScatterChart', () => {
  const data = [{ x: 1, y: 2, size: 1 }, { x: 2, y: 4, size: 9 }, { x: 3, y: 1, size: 5 }];

  test('REQ-082 · points sit on two linear scales', () => {
    const [a, b, c] = scatterChart.build({ ...bare, data }, context).geometry.hitAreas;
    close(b!.x - a!.x, c!.x - b!.x);
    expect(b!.y).toBeLessThan(a!.y);
  });

  test('REQ-082 · sizeKey maps to marker area within sizeRange; without it every marker is alike', () => {
    const sized = scatterChart.build({ ...bare, data, sizeKey: 'size' }, context).geometry.hitAreas.map((h) => box(h).width / 2);
    const area = (r: number) => Math.PI * r * r;
    close(area(sized[0]!), 60, 1);
    close(area(sized[1]!), 240, 1);
    const plain = new Set(scatterChart.build({ ...bare, data }, context).geometry.hitAreas.map((h) => box(h).width));
    expect(plain.size).toBe(1);
  });
});

describe('BubbleChart', () => {
  const data = [{ x: 1, y: 2, size: 10 }, { x: 2, y: 4, size: 40 }, { x: 3, y: 1, size: 25 }];

  test('REQ-083 · circle area, not radius, grows linearly with size', () => {
    const r = bubbleChart.build({ ...bare, data }, context).geometry.hitAreas.map((h) => box(h).width / 2);
    const area = r.map((v) => Math.PI * v * v);
    close((area[1]! - area[0]!) / 30, (area[2]! - area[0]!) / 15, 0.05);
  });

  test('REQ-083 · the largest bubble is drawn first, so small ones stay on top', () => {
    const model = bubbleChart.build({ ...bare, data }, context);
    const radius = (d: string) => Number(/A([\d.]+),/.exec(d)?.[1]);
    const circles = encoding(model).filter((s) => s.d.includes('A'));
    expect(radius(circles[0]!.d)).toBeGreaterThan(radius(circles.at(-1)!.d));
  });
});

/** Final-review fix pass: the Important findings, each reproduced before it was fixed. */
describe('final-review findings', () => {
  test('I1 · REQ-097 · a candle outside pinned bounds is clamped to the plot and warned', () => {
    const seen = capture();
    const data = [
      { time: 'a', open: 104, high: 150, low: 102, close: 106 },
      { time: 'b', open: 106, high: 108, low: 60, close: 104 },
    ];
    const model = candlestickChart.build({ ...bare, data, bounds: [100, 110] }, context);
    const { plot } = model.geometry;
    const ys = encoding(model).flatMap((s) => [...s.d.matchAll(/[MLHV]?(-?[\d.]+),(-?[\d.]+)|V(-?[\d.]+)/g)].map((m) => Number(m[2] ?? m[3])));
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(plot.y - 0.01);
      expect(y).toBeLessThanOrEqual(plot.y + plot.height + 0.01);
    }
    expect(seen).toContain('SP002');
    expect(model.table.rows[0]).toContain('150');
  });

  test('I2 · REQ-074 · stacked, a wave with nothing below it breaks rather than falling to the floor', () => {
    const seen = capture();
    const data = [{ x: 'a', p: 5, q: 2 }, { x: 'b', p: null, q: 2 }, { x: 'c', p: 5, q: 2 }];
    const model = streamChart.build({ ...bare, data, keys: ['p', 'q'], stacked: true }, context);
    const q = model.geometry.hitAreas.filter((h) => h.seriesKey === 'q').map((h) => h.index);
    expect(q).toEqual([0, 2]);
    expect(seen.filter((c) => c === 'SP002').length).toBeGreaterThanOrEqual(2);
  });

  test('I3 · REQ-120 · the description says the delta as the card prints it', () => {
    const model = kpiCard.build({ ...bare, data: [{ value: 0.4 }, { value: 0.45 }], numberFormat: { style: 'percent' }, delta: 0.052 }, context);
    expect(texts(model)).toContain('+5%');
    expect(model.description).toContain('change +5%');
  });

  test('I4 · REQ-121 · REQ-122 · the display names reach the table, the readout and the announcement', () => {
    const data = [{ x: 'a', p: 1, q: 2 }];
    const model = stackedBarChart.build({ ...bare, data, keys: ['p', 'q'], names: ['Apples', 'Bananas'] }, context);
    expect(model.table.columns).toEqual(['x', 'Apples', 'Bananas']);
    const hit = model.geometry.hitAreas.find((h) => h.value === 2)!;
    expect(hit.seriesKey).toBe('Bananas');
    expect(readout(model, { seriesKey: hit.seriesKey, index: hit.index, datum: hit.datum, value: hit.value, point: { x: hit.x, y: hit.y } }).announcement).toContain('Bananas 2');
  });

  test.each([
    ['BarChart', barChart, { data: [{ x: 2020, value: 3 }, { x: 2021, value: 4 }] }],
    ['AreaChart', areaChart, { data: [{ x: 2020, value: 3 }, { x: 2021, value: 4 }] }],
    ['WaterfallChart', waterfallChart, { data: [{ step: 2020, base: 3 }, { step: 2021, base: 4 }] }],
    ['CandlestickChart', candlestickChart, { data: [{ time: 2020, open: 1, high: 3, low: 1, close: 2 }, { time: 2021, open: 2, high: 3, low: 1, close: 1 }] }],
    ['FunnelChart', funnelChart, { data: [{ stage: 2020, value: 3 }, { stage: 2021, value: 2 }] }],
  ] as const)('I5 · REQ-121 · %s: a numeric category reads as itself, never with a thousands separator', (_name, recipe, props) => {
    const model = (recipe as unknown as { build: (p: object, c: RecipeContext) => ChartModel }).build({ ...bare, ...props }, context);
    expect(texts(model)).toContain('2020');
    expect(model.table.rows[0]?.[0]).toBe('2020');
    expect(JSON.stringify(model)).not.toContain('2,020');
  });
});

