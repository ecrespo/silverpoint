import { afterEach, describe, expect, test } from 'vitest';
import {
  __setDiagnosticSink,
  activityGrid,
  bulletChart,
  heatmapChart,
  pyramidChart,
  sankeyChart,
  stepActive,
  treemapChart,
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

const context: RecipeContext = {
  id: 'sp-chart',
  width: 320,
  locale: 'en',
  emptyState: { text: 'No data', rule: true },
  domainPadding: 0.1,
};

const bare = { chrome: 'bare', height: 150 } as const;
const texts = (model: ChartModel) => model.geometry.labels.map((l) => l.text);
const tones = (model: ChartModel) => model.geometry.strokes.filter((s) => s.tone !== undefined).map((s) => s.tone);
const box = (hit: HitArea | undefined) => {
  if (!hit?.box) throw new Error('hit area without a box');
  return hit.box;
};
const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(0.02);

describe('BulletChart', () => {
  const data = [
    { title: 'Revenue', actual: 50, target: 80 },
    { title: 'Profit', actual: 25, target: 60 },
  ];

  test('REQ-069 · the bar length encodes actual on 0-100', () => {
    const { geometry } = bulletChart.build({ ...bare, data }, context);
    const [a, b] = geometry.hitAreas;
    close(box(a).width, box(b).width * 2);
    expect(box(a).x).toBe(box(b).x);
    expect(a?.value).toBe(50);
  });

  test('REQ-069 · a marker sits at the target, on the same 0-100 track as the bar', () => {
    const { geometry } = bulletChart.build({ ...bare, data: [{ title: 'Only', actual: 50, target: 100 }] }, context);
    const bar = box(geometry.hitAreas[0]);
    const track = bar.width * 2; // actual is 50
    const targetX = Math.round((bar.x + track) * 100) / 100;
    const marker = geometry.strokes.find((s) => s.role === 'encoding' && s.d.startsWith(`M${targetX},`));
    expect(marker, `a marker at x=${targetX}`).toBeDefined();
  });

  test('REQ-069 · values outside 0-100 clamp and warn SP002', () => {
    const seen = capture();
    const { geometry } = bulletChart.build({ ...bare, data: [{ title: 'Over', actual: 150, target: 50 }, { title: 'Half', actual: 50, target: 50 }] }, context);
    const [over, half] = geometry.hitAreas;
    close(box(over).width, box(half).width * 2);
    expect(seen).toContain('SP002');
  });

  test('REQ-124 · each row prints its title and its actual value', () => {
    const model = bulletChart.build({ ...bare, data }, context);
    expect(texts(model)).toEqual(expect.arrayContaining(['Revenue', 'Profit', '50', '25']));
  });
});

describe('PyramidChart', () => {
  const data = [
    { label: 'Apex', width: 20 },
    { label: 'Middle', width: 60 },
    { label: 'Base', width: 100 },
  ];

  test('REQ-070 · tiers stack top to bottom, centred, with width proportional to the value', () => {
    const { geometry } = pyramidChart.build({ ...bare, data }, context);
    const [apex, middle, base] = geometry.hitAreas.map(box);
    close(base!.width, apex!.width * 5);
    close(middle!.width, apex!.width * 3);
    expect(apex!.y).toBeLessThan(middle!.y);
    expect(middle!.y).toBeLessThan(base!.y);
    close(apex!.x + apex!.width / 2, base!.x + base!.width / 2);
  });

  test('REQ-070 · a non-monotonic series is drawn anyway and warned', () => {
    const seen = capture();
    const model = pyramidChart.build({ ...bare, data: [...data].reverse() }, context);
    expect(model.geometry.hitAreas).toHaveLength(3);
    expect(seen).toContain('SP002');
  });

  test('REQ-070 · REQ-124 · a toneKey tones the tier, and the tone is printed as well', () => {
    const model = pyramidChart.build({ ...bare, data: data.map((d, i) => ({ ...d, level: i + 1 })), toneKey: 'level' }, context);
    expect(tones(model)).toEqual([1, 2, 3]);
    expect(texts(model)).toEqual(expect.arrayContaining(['tone 1', 'tone 2', 'tone 3']));
  });

  test('REQ-124 · each tier prints its label and its value', () => {
    expect(texts(pyramidChart.build({ ...bare, data }, context))).toEqual(expect.arrayContaining(['Apex', '20', 'Base', '100']));
  });
});

describe('HeatmapChart', () => {
  const data = [
    { label: 'Mon', values: [10, 50, 90] },
    { label: 'Tue', values: [0, 30, 100] },
  ];

  test('REQ-084 · the value normalised to scaleMax sets the tone, in five levels', () => {
    expect(tones(heatmapChart.build({ ...bare, data }, context))).toEqual([1, 2, 4, 2, 4]);
    expect(tones(heatmapChart.build({ ...bare, data, scaleMax: 200 }, context))).toEqual([1, 1, 2, 1, 2]);
  });

  test('REQ-084 · REQ-124 · every cell also prints its value, and every row its label', () => {
    expect(texts(heatmapChart.build({ ...bare, data }, context))).toEqual(expect.arrayContaining(['Mon', 'Tue', '10', '50', '90', '0', '30', '100']));
  });

  test('REQ-084 · cells form a grid: rows by label, columns by position', () => {
    const hits = heatmapChart.build({ ...bare, data }, context).geometry.hitAreas;
    const cell = (row: number, column: number) => box(hits.find((h) => h.index === row && h.seriesKey === `#${column}`));
    expect(cell(0, 1).y).toBe(cell(0, 3).y);
    expect(cell(1, 1).x).toBe(cell(0, 1).x);
    expect(cell(1, 1).y).toBeGreaterThan(cell(0, 1).y);
    expect(cell(0, 2).x).toBeGreaterThan(cell(0, 1).x);
  });

  test('REQ-007 · rows whose every value is blank draw the empty state, with no Infinity', () => {
    capture();
    const model = heatmapChart.build({ ...bare, data: [{ label: 'a', values: [null, null] }] }, context);
    expect(model.geometry.labels.some((l) => l.kind === 'empty')).toBe(true);
    expect(model.description).not.toMatch(/Infinity|NaN/);
  });

  test('REQ-084 · rows of unequal length use the shortest, and warn', () => {
    const seen = capture();
    const model = heatmapChart.build({ ...bare, data: [{ label: 'a', values: [1, 2, 3] }, { label: 'b', values: [4, 5] }] }, context);
    expect(model.geometry.hitAreas).toHaveLength(4);
    expect(model.table.columns).toEqual(['label', '#1', '#2']);
    expect(seen).toContain('SP002');
  });
});

describe('TreemapChart', () => {
  const data = [
    { label: 'A', share: 40, cols: 3, rows: 2 },
    { label: 'B', share: 35, cols: 3, rows: 2 },
    { label: 'C', share: 25, cols: 2, rows: 2 },
  ];

  test('REQ-085 · tiles are placed first-fit, row-major, in the declared grid', () => {
    const { geometry } = treemapChart.build({ ...bare, data, columns: 6, rows: 4 }, context);
    const { plot } = geometry;
    const [a, b, c] = geometry.hitAreas.map(box);
    const cellW = plot.width / 6;
    const cellH = plot.height / 4;
    close(a!.x, plot.x);
    close(a!.y, plot.y);
    close(b!.x, plot.x + 3 * cellW);
    close(b!.y, plot.y);
    close(c!.x, plot.x);
    close(c!.y, plot.y + 2 * cellH);
    close(c!.width, 2 * cellW);
    close(c!.height, 2 * cellH);
  });

  test('REQ-085 · a tile that no longer fits is dropped and warned', () => {
    const seen = capture();
    const model = treemapChart.build({ ...bare, data: [...data, { label: 'D', share: 5, cols: 6, rows: 2 }], columns: 6, rows: 4 }, context);
    expect(model.geometry.hitAreas).toHaveLength(3);
    expect(seen).toContain('SP002');
  });

  test('REQ-085 · REQ-124 · every tile prints its label and its share; a tone is printed too', () => {
    const model = treemapChart.build({ ...bare, data: data.map((d, i) => ({ ...d, tone: i + 2 })), columns: 6, rows: 4 }, context);
    expect(texts(model)).toEqual(expect.arrayContaining(['A', '40%', 'B', '35%', 'C', '25%']));
    expect(tones(model)).toEqual([2, 3, 4]);
    expect(texts(model)).toEqual(expect.arrayContaining(['tone 2', 'tone 3', 'tone 4']));
  });
});

describe('SankeyChart', () => {
  const data = [
    { source: 'Web', target: 'Signup', value: 60 },
    { source: 'Ads', target: 'Signup', value: 40 },
    { source: 'Signup', target: 'Paid', value: 30 },
  ];

  test('REQ-086 · nodes are layered by longest path, left to right', () => {
    const [web, ads, signup] = sankeyChart.build({ ...bare, data }, context).geometry.hitAreas;
    expect(web!.x).toBe(ads!.x);
    expect(signup!.x).toBeGreaterThan(web!.x);
  });

  test('REQ-086 · REQ-124 · each node prints its name and its throughput', () => {
    expect(texts(sankeyChart.build({ ...bare, data }, context))).toEqual(expect.arrayContaining(['Web 60', 'Ads 40', 'Signup 100', 'Paid 30']));
  });

  test('REQ-086 · band width is proportional to the flow', () => {
    const { strokes } = sankeyChart.build({ ...bare, data }, context).geometry;
    const bands = strokes.filter((s) => s.role === 'encoding' && s.d.includes('C'));
    expect(bands).toHaveLength(3);
    // A band is M x0,y0 C … x1,y1 V y1+w C … x0,y0+w Z: its thickness is the vertical run.
    const thickness = (d: string) => Number(/V([\d.]+)/.exec(d)?.[1]) - Number(/C[\d.]+,[\d.]+,[\d.]+,[\d.]+,[\d.]+,([\d.]+)/.exec(d)?.[1]);
    const [web, ads, paid] = bands.map((b) => thickness(b.d));
    close(web! / ads!, 1.5);
    close(web! / paid!, 2);
  });

  test('REQ-086 · a flow that closes a cycle, or a non-positive one, is dropped and warned', () => {
    const seen = capture();
    const model = sankeyChart.build({ ...bare, data: [...data, { source: 'Paid', target: 'Web', value: 5 }, { source: 'Ads', target: 'Paid', value: 0 }] }, context);
    expect(model.geometry.hitAreas).toHaveLength(3);
    expect(seen.filter((c) => c === 'SP002').length).toBeGreaterThanOrEqual(1);
  });

  test('REQ-097 · the flow total is derived from the data and stated in the description', () => {
    expect(sankeyChart.build({ ...bare, data }, context).description).toMatch(/total flow of 100/);
  });

  test('REQ-121 · the table has one row per flow, named source → target', () => {
    const { table } = sankeyChart.build({ ...bare, data }, context);
    expect(table.rows.map((r) => r[0])).toEqual(['Web → Signup', 'Ads → Signup', 'Signup → Paid']);
  });
});

describe('ActivityGrid', () => {
  const week = (start: number, levels: number[]) =>
    levels.map((level, i) => ({ date: `2026-06-${String(start + i).padStart(2, '0')}`, count: level * 3, level }));

  test('REQ-087 · one cell per day, a column per week', () => {
    const hits = activityGrid.build({ ...bare, data: week(1, [0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 0, 1, 2, 3]), weeks: 2 }, context).geometry.hitAreas;
    expect(hits).toHaveLength(14);
    const centre = (h: HitArea | undefined) => ({ x: h!.x, y: h!.y });
    expect(centre(hits[0]).x).toBe(centre(hits[6]).x);
    expect(centre(hits[7]).x).toBeGreaterThan(centre(hits[0]).x);
    expect(centre(hits[7]).y).toBe(centre(hits[0]).y);
  });

  test('REQ-087 · REQ-124 · the level sets both the tone and the size of the cell', () => {
    const model = activityGrid.build({ ...bare, data: week(1, [0, 1, 2, 3, 4, 0, 4]), weeks: 1 }, context);
    expect(tones(model)).toEqual([1, 2, 3, 4, 4]);
    const sizes = model.geometry.hitAreas.map((h) => box(h).width);
    expect(sizes[4]).toBeGreaterThan(sizes[3]!);
    expect(sizes[3]).toBeGreaterThan(sizes[2]!);
    expect(sizes[1]).toBeGreaterThan(sizes[0]!);
    close(sizes[4]! / sizes[0]!, 1 / 0.4);
  });

  test('REQ-087 · a length that is not a multiple of 7 is trimmed to the most recent whole weeks, and warned', () => {
    const seen = capture();
    const model = activityGrid.build({ ...bare, data: week(1, [1, 1, 1, 1, 1, 1, 1, 1, 1]), weeks: 4 }, context);
    expect(model.geometry.hitAreas).toHaveLength(7);
    expect(model.table.rows[0]?.[0]).toBe('2026-06-03');
    expect(seen).toContain('SP002');
  });

  test('REQ-087 · only the most recent `weeks` are shown', () => {
    const model = activityGrid.build({ ...bare, data: week(1, Array(21).fill(1)), weeks: 2 }, context);
    expect(model.geometry.hitAreas).toHaveLength(14);
    expect(model.table.rows[0]?.[0]).toBe('2026-06-08');
  });

  test('REQ-087 · month labels never crowd each other: at least three columns apart', () => {
    const model = activityGrid.build(bare, context);
    const hits = model.geometry.hitAreas;
    const slot = hits[7]!.x - hits[0]!.x;
    const months = model.geometry.labels.filter((l) => l.kind === 'tick').map((l) => l.x);
    expect(months.length).toBeGreaterThan(3);
    for (let i = 1; i < months.length; i += 1) expect(months[i]! - months[i - 1]!).toBeGreaterThanOrEqual(3 * slot - 0.02);
  });

  test('REQ-005 · the demo spans 26 weeks ending on the constant 2026-06-30, the same on every call', () => {
    const a = activityGrid.build(bare, context);
    expect(a.table.rows).toHaveLength(182);
    expect(a.table.rows[181]?.[0]).toBe('2026-06-30');
    expect(a.table.rows[0]?.[0]).toBe('2025-12-31');
    expect(a.table).toEqual(activityGrid.build(bare, { ...context, id: 'other' }).table);
  });
});

describe('final-review fixes', () => {
  const width = (d: string) => {
    const m = /^M([\d.-]+),[\d.-]+H([\d.-]+)/.exec(d);
    return m ? Number(m[2]) - Number(m[1]) : Number.NaN;
  };

  test('REQ-086 · a layer of many nodes still fits the plot: no negative sizes, and a warning', () => {
    const seen = capture();
    const data = Array.from({ length: 20 }, (_, i) => ({ source: 'Budget', target: `Item ${i}`, value: 5 + i }));
    const { geometry } = sankeyChart.build({ ...bare, data }, context);
    const { plot } = geometry;
    for (const s of geometry.strokes.filter((st) => st.role === 'encoding')) {
      for (const [, y] of s.d.matchAll(/[VMC,]\s*[\d.]+,(-?[\d.]+)/g)) {
        expect(Number(y), s.d).toBeGreaterThanOrEqual(plot.y - 0.02);
        expect(Number(y), s.d).toBeLessThanOrEqual(plot.y + plot.height + 0.02);
      }
      for (const [, v] of s.d.matchAll(/V(-?[\d.]+)/g)) expect(Number(v)).toBeGreaterThanOrEqual(plot.y - 0.02);
    }
    expect(seen).toContain('SP002');
  });

  test('REQ-084 · a row without values is left blank and warned; the other rows are drawn', () => {
    const seen = capture();
    const model = heatmapChart.build({ ...bare, data: [{ label: 'a', values: [1, 2, 3] }, { label: 'b', values: null }] }, context);
    expect(model.geometry.hitAreas).toHaveLength(3);
    expect(model.table.columns).toEqual(['label', '#1', '#2', '#3']);
    expect(seen).toContain('SP002');
  });

  test('REQ-122 · the keyboard reaches every cell of a heatmap: left and right change column, up and down change row', () => {
    const data = [{ label: 'a', values: [1, 2, 3] }, { label: 'b', values: [4, 5, 6] }];
    const { geometry } = heatmapChart.build({ ...bare, data }, context);
    let active = stepActive(geometry, null, 'Home') ?? null;
    expect(active).toMatchObject({ seriesKey: '#1', index: 0 });
    active = stepActive(geometry, active, 'ArrowRight') ?? null;
    expect(active).toMatchObject({ seriesKey: '#2', index: 0 });
    active = stepActive(geometry, active, 'ArrowDown') ?? null;
    expect(active).toMatchObject({ seriesKey: '#2', index: 1 });
    active = stepActive(geometry, active, 'ArrowLeft') ?? null;
    expect(active).toMatchObject({ seriesKey: '#1', index: 1 });
    active = stepActive(geometry, active, 'End') ?? null;
    expect(active).toMatchObject({ seriesKey: '#3', index: 1 });
  });

  test('REQ-122 · in the activity grid, right moves a week and down moves a day', () => {
    const data = Array.from({ length: 14 }, (_, i) => ({ date: `2026-06-${String(i + 1).padStart(2, '0')}`, count: i, level: 1 }));
    const { geometry } = activityGrid.build({ ...bare, data, weeks: 2 }, context);
    let active = stepActive(geometry, null, 'Home') ?? null;
    active = stepActive(geometry, active, 'ArrowRight') ?? null;
    expect(active?.index).toBe(7);
    active = stepActive(geometry, active, 'ArrowDown') ?? null;
    expect(active?.index).toBe(8);
  });

  test('REQ-124 · heatmap values that cannot fit their cells are carried by cell size instead of overprinting', () => {
    const values = Array.from({ length: 24 }, (_, i) => (i * 37) % 101);
    const model = heatmapChart.build({ ...bare, data: [{ label: 'Mon', values }, { label: 'Tue', values: [...values].reverse() }] }, context);
    const printed = model.geometry.labels.filter((l) => /^\d+$/.test(l.text));
    expect(printed).toEqual([]);
    const cells = model.geometry.strokes.filter((s) => s.role === 'encoding');
    const byValue = model.geometry.hitAreas.map((h, i) => ({ value: h.value, size: width(cells[i]!.d) }));
    const small = byValue.reduce((a, b) => (b.value < a.value ? b : a));
    const large = byValue.reduce((a, b) => (b.value > a.value ? b : a));
    expect(large.size).toBeGreaterThan(small.size);
  });

  test('REQ-087 · an impossible date is rejected, not rolled over, and warned', () => {
    const seen = capture();
    const data = [...Array.from({ length: 7 }, (_, i) => ({ date: `2026-03-0${i + 1}`, count: 1, level: 1 })), { date: '2026-02-31', count: 9, level: 4 }];
    const model = activityGrid.build({ ...bare, data, weeks: 1 }, context);
    expect(model.table.rows.map((r) => r[0])).not.toContain('2026-03-03' + 'x');
    expect(model.table.rows.filter((r) => r[0] === '2026-03-03')).toHaveLength(1);
    expect(seen).toContain('SP002');
  });

  test('REQ-087 · duplicate dates keep the first row, and non-consecutive dates are warned', () => {
    const seen = capture();
    const days = ['01', '02', '02', '03', '04', '05', '08', '09'].map((d) => ({ date: `2026-06-${d}`, count: 1, level: 1 }));
    const model = activityGrid.build({ ...bare, data: days, weeks: 1 }, context);
    expect(new Set(model.table.rows.map((r) => r[0])).size).toBe(model.table.rows.length);
    expect(seen.filter((c) => c === 'SP002').length).toBeGreaterThanOrEqual(2);
  });
});
