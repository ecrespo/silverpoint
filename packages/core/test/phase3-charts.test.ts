import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, coxcombChart, donutChart, polarBarChart, radarChart, type ChartModel, type HitArea, type RecipeContext, type SpCode } from '../src';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const context: RecipeContext = { id: 'sp-p3', width: 320, locale: 'en', emptyState: { text: 'No data', rule: true }, domainPadding: 0.1 };
const bare = { chrome: 'bare', height: 150 } as const;
const texts = (model: ChartModel) => model.geometry.labels.map((l) => l.text);
const encoding = (model: ChartModel) => model.geometry.strokes.filter((s) => s.role === 'encoding');
const close = (a: number, b: number, tolerance = 0.02) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tolerance);

/** Angle of a hit's centre, clockwise from 12 o'clock, in [0, 2π). */
function angleOf(hit: HitArea, cx: number, cy: number): number {
  const a = Math.atan2(hit.x - cx, cy - hit.y);
  return a < 0 ? a + 2 * Math.PI : a;
}

describe('DonutChart', () => {
  const data = [{ name: 'Rent', value: 50 }, { name: 'Food', value: 30 }, { name: 'Fun', value: 20 }];

  test('REQ-075 · sectors run clockwise from 12 o’clock, each sweeping its share of the turn', () => {
    const model = donutChart.build({ ...bare, data }, context);
    const { plot } = model.geometry;
    const cx = plot.x + plot.height / 2;
    const cy = plot.y + plot.height / 2;
    const [rent, food, fun] = model.geometry.hitAreas;
    // A hit sits at its sector's middle angle: Rent spans 0-π, Food π-1.6π, Fun 1.6π-2π.
    close(angleOf(rent!, cx, cy), 0.5 * Math.PI, 0.01);
    close(angleOf(food!, cx, cy), 1.3 * Math.PI, 0.01);
    close(angleOf(fun!, cx, cy), 1.8 * Math.PI, 0.01);
    expect(encoding(model).filter((s) => s.d.includes('A'))).toHaveLength(3);
  });

  test('REQ-075 · the centre prints the total, or `centerValue` and `centerLabel` when given', () => {
    expect(texts(donutChart.build({ ...bare, data }, context))).toContain('100');
    const custom = donutChart.build({ ...bare, data, centerValue: '72%', centerLabel: 'spent' }, context);
    expect(texts(custom)).toEqual(expect.arrayContaining(['72%', 'spent']));
    expect(texts(custom)).not.toContain('100');
  });

  test('REQ-075 · REQ-124 · the legend names every sector with its share, in clockwise order', () => {
    const model = donutChart.build({ ...bare, data }, context);
    const printed = texts(model);
    expect(printed).toEqual(expect.arrayContaining(['Rent', '50%', 'Food', '30%', 'Fun', '20%']));
    expect(printed.indexOf('Rent')).toBeLessThan(printed.indexOf('Food'));
    expect(printed.indexOf('Food')).toBeLessThan(printed.indexOf('Fun'));
  });

  test('REQ-075 · `legend: false` draws no legend and centres the ring', () => {
    const model = donutChart.build({ ...bare, data, legend: false }, context);
    expect(texts(model)).not.toContain('Rent');
  });

  test.each([2, 3, 4, 5, 6, 7, 8, 9])('REQ-124 · %i sectors: neighbours never share a tone, across 12 o’clock too', (count) => {
    const model = donutChart.build({ ...bare, data: Array.from({ length: count }, (_, i) => ({ name: `s${i}`, value: i + 1 })) }, context);
    const tones = encoding(model).map((s) => s.tone);
    expect(tones).toHaveLength(count);
    for (let i = 0; i < tones.length; i += 1) expect(tones[i], `sector ${i}`).not.toBe(tones[(i + 1) % tones.length]);
  });

  test('REQ-008 · all-zero values draw the empty state and warn SP002', () => {
    const seen = capture();
    const model = donutChart.build({ ...bare, data: [{ name: 'a', value: 0 }, { name: 'b', value: 0 }] }, context);
    expect(model.geometry.labels.some((l) => l.kind === 'empty')).toBe(true);
    expect(seen).toContain('SP002');
  });

  test('REQ-075 · a legend that cannot fit every sector ends in “+N more” and stays inside the plot', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ name: `s${i}`, value: 1 }));
    const model = donutChart.build({ ...bare, data: many }, context);
    const { plot } = model.geometry;
    const more = model.geometry.labels.find((l) => /^\+\d+ more$/.test(l.text));
    expect(more).toBeDefined();
    const shown = model.geometry.labels.filter((l) => /^s\d+$/.test(l.text)).length;
    expect(more!.text).toBe(`+${30 - shown} more`);
    for (const l of model.geometry.labels) expect(l.y, l.text).toBeLessThanOrEqual(plot.y + plot.height);
  });

  test('REQ-121 · the table lists name, value and share', () => {
    const model = donutChart.build({ ...bare, data }, context);
    expect(model.table.columns).toEqual(['name', 'value', 'share']);
    expect(model.table.rows[0]).toEqual(['Rent', '50', '50%']);
  });
});

/** Distance of a hit from a centre. */
const radiusOf = (hit: HitArea, cx: number, cy: number) => Math.hypot(hit.x - cx, hit.y - cy);
/** The centre of a polar chart without a legend: the middle of its plot. */
const centreOf = (model: ChartModel) => ({ cx: model.geometry.plot.x + model.geometry.plot.width / 2, cy: model.geometry.plot.y + model.geometry.plot.height / 2 });

describe('RadarChart', () => {
  const data = [{ subject: 'A', value: 10 }, { subject: 'B', value: 5 }, { subject: 'C', value: 0 }, { subject: 'D', value: 2.5 }];

  test('REQ-076 · one spoke per subject, clockwise from 12; a value is its distance along the spoke', () => {
    const model = radarChart.build({ ...bare, data, domain: [0, 10] }, context);
    const { cx, cy } = centreOf(model);
    const [a, b, c, d] = model.geometry.hitAreas;
    close(angleOf(a!, cx, cy), 0, 0.01);
    close(angleOf(b!, cx, cy), Math.PI / 2, 0.01);
    close(angleOf(d!, cx, cy), 1.5 * Math.PI, 0.01);
    close(radiusOf(b!, cx, cy), radiusOf(a!, cx, cy) / 2, 0.03);
    close(radiusOf(d!, cx, cy), radiusOf(a!, cx, cy) / 4, 0.03);
    close(radiusOf(c!, cx, cy), 0, 0.03);
  });

  test('REQ-076 · the polygon is one closed encoding path through every value', () => {
    const model = radarChart.build({ ...bare, data, domain: [0, 10] }, context);
    const polygons = encoding(model);
    expect(polygons).toHaveLength(1);
    expect(polygons[0]!.d.endsWith('Z')).toBe(true);
    expect(polygons[0]!.d.match(/[ML]/g)).toHaveLength(4);
  });

  test('REQ-076 · every subject is named at the end of its spoke', () => {
    expect(texts(radarChart.build({ ...bare, data }, context))).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D']));
  });

  test('REQ-076 · a value outside `domain` is held at its edge and warned SP002', () => {
    const seen = capture();
    const model = radarChart.build({ ...bare, data: [{ subject: 'A', value: 20 }, { subject: 'B', value: 5 }, { subject: 'C', value: 5 }], domain: [0, 10] }, context);
    const { cx, cy } = centreOf(model);
    const [a, b] = model.geometry.hitAreas;
    close(radiusOf(a!, cx, cy), 2 * radiusOf(b!, cx, cy), 0.03);
    expect(seen).toContain('SP002');
  });
});

describe('PolarBarChart', () => {
  const data = [{ name: 'A', value: 40 }, { name: 'B', value: 20 }, { name: 'C', value: 10 }, { name: 'D', value: 30 }];

  test('REQ-077 · equal slots around the full turn, clockwise from 12', () => {
    const model = polarBarChart.build({ ...bare, data }, context);
    const { cx, cy } = centreOf(model);
    const angles = model.geometry.hitAreas.map((h) => angleOf(h, cx, cy));
    angles.forEach((a, i) => close(a, (i + 0.5) * (Math.PI / 2), 0.01));
  });

  test('REQ-077 · bar length out from the hole is proportional to the value (the hit sits at the tip)', () => {
    const model = polarBarChart.build({ ...bare, data }, context);
    expect(encoding(model)).toHaveLength(4);
    const { cx, cy } = centreOf(model);
    const [a, b, c, d] = model.geometry.hitAreas.map((h) => radiusOf(h, cx, cy));
    close((a! - c!) / (40 - 10), (d! - b!) / (30 - 20), 0.01);
    expect(a! - c!).toBeGreaterThan(10);
  });

  test('REQ-077 · every bar is named', () => {
    expect(texts(polarBarChart.build({ ...bare, data }, context))).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D']));
  });
});

describe('CoxcombChart', () => {
  const data = [{ name: 'A', value: 100 }, { name: 'B', value: 25 }, { name: 'C', value: 0 }, { name: 'D', value: 64 }];

  test('REQ-088 · equal angles; the AREA of a sector is proportional to its value (radius ∝ √value)', () => {
    const model = coxcombChart.build({ ...bare, data }, context);
    const radii = encoding(model).map((s) => Number(/A([\d.]+),/.exec(s.d)?.[1]));
    // C (0) draws nothing; A, B, D do.
    expect(radii).toHaveLength(3);
    close(radii[1]! / radii[0]!, Math.sqrt(25 / 100), 0.01);
    close(radii[2]! / radii[0]!, Math.sqrt(64 / 100), 0.01);
  });

  test('REQ-088 · `startAngle`, in degrees, turns the first sector away from 12 o’clock', () => {
    const at0 = coxcombChart.build({ ...bare, data }, context);
    const at90 = coxcombChart.build({ ...bare, data, startAngle: 90 }, context);
    const { cx, cy } = centreOf(at0);
    close(angleOf(at0.geometry.hitAreas[0]!, cx, cy), Math.PI / 4, 0.01);
    close(angleOf(at90.geometry.hitAreas[0]!, cx, cy), Math.PI / 2 + Math.PI / 4, 0.01);
  });

  test('REQ-088 · REQ-124 · every sector is named, and neighbours never share a tone', () => {
    const model = coxcombChart.build({ ...bare, data }, context);
    expect(texts(model)).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D']));
    const tones = encoding(model).map((s) => s.tone);
    for (let i = 0; i < tones.length - 1; i += 1) expect(tones[i]).not.toBe(tones[i + 1]);
  });
});
