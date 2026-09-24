import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, coxcombChart, donutChart, gaugeArc, meterChart, polarBarChart, radarChart, radialArcGroup, radialRings, windRose, type ChartModel, type HitArea, type RecipeContext, type SpCode } from '../src';

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

/** Estimated box of a 9.5 px label: 5.2 px per character, 7 px of cap height above the baseline. */
function textBox(l: { x: number; y: number; text: string; anchor?: string }) {
  const width = l.text.length * 5.2;
  const x = l.anchor === 'end' ? l.x - width : l.anchor === 'middle' ? l.x - width / 2 : l.x;
  return { x, y: l.y - 7, width, height: 7 };
}
const overlap = (a: ReturnType<typeof textBox>, b: ReturnType<typeof textBox>) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test.each([
  ['RadarChart', radarChart, /^\d+$/],
  ['WindRose', windRose, /^\d+%$/],
] as const)('REQ-076 · REQ-089 · %s: no ring value overprints a rim name (seen in the previews)', (_name, recipe, tick) => {
  const model = (recipe as unknown as { build: (p: object, c: RecipeContext) => ChartModel }).build({ ...bare }, context);
  const names = model.geometry.labels.filter((l) => /^[A-Z][A-Za-z]*$/.test(l.text));
  const ticks = model.geometry.labels.filter((l) => tick.test(l.text));
  expect(names.length).toBeGreaterThan(0);
  expect(ticks.length).toBeGreaterThan(0);
  for (const t of ticks) for (const n of names) expect(overlap(textBox(t), textBox(n)), `${t.text} over ${n.text}`).toBe(false);
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

/** The points of a path, in order. */
const pointsOf = (d: string) => [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)(?=[MLAZ]|$)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
/** The guide tracks: ornament arcs on the grid part. */
const tracks = (model: ChartModel) => model.geometry.strokes.filter((s) => s.role === 'ornament' && s.part === 'grid' && s.d.includes('A'));
const radiusOfArc = (d: string) => Number(/A([\d.]+),/.exec(d)?.[1]);

describe('RadialArcGroup', () => {
  const data = [{ name: 'A', value: 100 }, { name: 'B', value: 50 }, { name: 'C', value: 25 }];

  test('REQ-078 · concentric 180° tracks from 9 to 3 o’clock, outermost first; each value sweeps its share of the half turn', () => {
    const model = radialArcGroup.build({ ...bare, data }, context);
    expect(encoding(model)).toHaveLength(3);
    const guides = tracks(model);
    expect(guides).toHaveLength(3);
    const radii = guides.map((t) => radiusOfArc(t.d));
    expect(radii[0]).toBeGreaterThan(radii[1]!);
    expect(radii[1]).toBeGreaterThan(radii[2]!);
    // A track runs from (cx - r, cy) over the top to (cx + r, cy).
    const outer = pointsOf(guides[0]!.d);
    const cx = (outer[0]!.x + outer.at(-1)!.x) / 2;
    const cy = outer[0]!.y;
    close(outer[0]!.y, outer.at(-1)!.y, 0.01);
    // The hit sits where the value ends: A (the largest) at 3 o'clock, B at 12, C half-way to 12.
    const [a, b, c] = model.geometry.hitAreas;
    close(angleOf(a!, cx, cy), Math.PI / 2, 0.01);
    close(angleOf(b!, cx, cy), 0, 0.01);
    close(angleOf(c!, cx, cy), 2 * Math.PI - Math.PI / 4, 0.01);
  });

  test('REQ-078 · REQ-124 · every track is named with its value, outermost first', () => {
    const printed = texts(radialArcGroup.build({ ...bare, data }, context));
    expect(printed).toEqual(expect.arrayContaining(['A', '100', 'B', '50', 'C', '25']));
    expect(printed.indexOf('A')).toBeLessThan(printed.indexOf('B'));
  });
});

describe('RadialRings', () => {
  test('REQ-079 · one full ring per item; a value sweeps its percent of the turn from 12 o’clock', () => {
    const model = radialRings.build({ ...bare, data: [{ name: 'A', value: 50 }, { name: 'B', value: 75 }] }, context);
    expect(encoding(model)).toHaveLength(2);
    const guides = tracks(model);
    expect(guides).toHaveLength(2);
    // A full ring starts at 12 o'clock, (cx, cy - r), and its first half ends at 6, (cx, cy + r).
    const ring = pointsOf(guides[0]!.d);
    const cx = ring[0]!.x;
    const cy = (ring[0]!.y + ring[1]!.y) / 2;
    const [a, b] = model.geometry.hitAreas;
    close(angleOf(a!, cx, cy), Math.PI, 0.01);
    close(angleOf(b!, cx, cy), 1.5 * Math.PI, 0.01);
  });

  test('REQ-079 · a full ring at 100 is drawn as two half arcs, and a value above 100 saturates with SP002', () => {
    const seen = capture();
    const model = radialRings.build({ ...bare, data: [{ name: 'A', value: 130 }] }, context);
    expect(model.geometry.hitAreas[0]!.value).toBe(130);
    expect(encoding(model)[0]!.d.match(/A/g)!.length).toBe(4);
    expect(seen).toContain('SP002');
  });

  test('REQ-079 · REQ-124 · every ring is named with its percent', () => {
    expect(texts(radialRings.build({ ...bare, data: [{ name: 'A', value: 50 }] }, context))).toEqual(expect.arrayContaining(['A', '50%']));
  });
});

describe('GaugeArc and MeterChart', () => {
  test('REQ-080 · the gauge track spans 240°, symmetric about 12 o’clock; the value sweeps its percent of it', () => {
    const at = (percent: number) => {
      const model = gaugeArc.build({ ...bare, percent }, context);
      const guide = pointsOf(tracks(model)[0]!.d);
      const r = radiusOfArc(tracks(model)[0]!.d);
      // The track runs from -120° to +120°: its ends are level, each r·cos 60° below the centre.
      close(guide[0]!.y, guide.at(-1)!.y, 0.01);
      const cx = (guide[0]!.x + guide.at(-1)!.x) / 2;
      const cy = guide[0]!.y - r / 2;
      close(guide.at(-1)!.x - guide[0]!.x, 2 * r * Math.sin((2 * Math.PI) / 3), 0.05);
      return angleOf(model.geometry.hitAreas[0]!, cx, cy);
    };
    close(at(50), 0, 0.01);
    close(at(25), 2 * Math.PI - Math.PI / 3, 0.01);
    close(at(100), (2 * Math.PI) / 3, 0.01);
  });

  test('REQ-081 · the readout sits clear below the pivot: the needle never crosses it (seen in the first preview)', () => {
    const model = meterChart.build({ ...bare, percent: 72, caption: 'Load' }, context);
    const needle = encoding(model).find((s) => !s.d.includes('A'))!;
    const pivot = pointsOf(needle.d)[0]!;
    const readout = model.geometry.labels.find((l) => l.kind === 'value')!;
    // A 30 px readout stands up to 22 px above its baseline (the % sign); keep 6 px of air.
    expect(readout.y - 22).toBeGreaterThanOrEqual(pivot.y + 6);
    const caption = model.geometry.labels.find((l) => l.text === 'Load')!;
    expect(caption.y).toBeGreaterThan(readout.y + 6);
    expect(caption.y).toBeLessThanOrEqual(model.geometry.plot.y + model.geometry.plot.height);
  });

  test('REQ-081 · the meter spans 180° and points a needle at the value', () => {
    const at0 = meterChart.build({ ...bare, percent: 0 }, context).geometry.hitAreas[0]!;
    const at50 = meterChart.build({ ...bare, percent: 50 }, context).geometry.hitAreas[0]!;
    const at100 = meterChart.build({ ...bare, percent: 100 }, context).geometry.hitAreas[0]!;
    close(at0.y, at100.y, 0.01);
    close(at50.x, (at0.x + at100.x) / 2, 0.01);
    expect(at50.y).toBeLessThan(at0.y);
    const needle = encoding(meterChart.build({ ...bare, percent: 50 }, context)).find((s) => !s.d.includes('A') && !s.d.endsWith('Z'));
    expect(needle).toBeDefined();
  });
});

describe('WindRose', () => {
  const obs = (pairs: [number, number][]) => pairs.map(([bearing, speed]) => ({ bearing, speed }));

  test('REQ-089 · a bearing falls in the compass sector centred nearest it, north wrapping round', () => {
    const model = windRose.build({ ...bare, data: obs([[11, 5], [12, 5], [349, 5], [360, 5], [180, 5]]), sectors: 16 }, context);
    const share = (dir: string) => model.table.rows.find((r) => r[0] === dir)?.[1];
    expect(share('N')).toBe('60%');
    expect(share('NNE')).toBe('20%');
    expect(share('S')).toBe('20%');
    expect(model.table.rows).toHaveLength(16);
  });

  test('REQ-089 · a sector’s length is proportional to its share of the observations', () => {
    const model = windRose.build({ ...bare, data: obs([[0, 5], [0, 5], [90, 5], [180, 5]]), sectors: 4 }, context);
    // West has no observation: its tip is the centre.
    const [nHit, eHit, sHit, wHit] = model.geometry.hitAreas;
    const [n, e, s] = [nHit, eHit, sHit].map((h) => radiusOf(h!, wHit!.x, wHit!.y));
    close(n! / e!, 2, 0.02);
    close(s!, e!, 0.01);
    close(angleOf(nHit!, wHit!.x, wHit!.y), 0, 0.01);
    close(angleOf(eHit!, wHit!.x, wHit!.y), Math.PI / 2, 0.01);
  });

  test('REQ-089 · a sector is stacked by speed bin, the calmest bin innermost', () => {
    const model = windRose.build({ ...bare, data: obs([[0, 2], [0, 12], [0, 12]]), sectors: 4, bins: [5, 10] }, context);
    const bands = encoding(model);
    expect(bands).toHaveLength(2);
    const outerOf = (d: string) => Math.max(...[...d.matchAll(/A([\d.]+),/g)].map((m) => Number(m[1])));
    const [inner, outer] = bands;
    // One observation under 5, two at 10 or more: the second band reaches three times as far.
    close(outerOf(outer!.d) / outerOf(inner!.d), 3, 0.02);
    expect(inner!.tone).not.toBe(outer!.tone);
  });

  test('REQ-089 · calms have no direction: they are counted apart and printed in the centre', () => {
    const model = windRose.build({ ...bare, data: obs([[0, 0], [90, 5], [180, 5], [270, 5], [0, 5]]), sectors: 4 }, context);
    expect(texts(model)).toContain('calm 20%');
    expect(model.table.rows.map((r) => r[1])).toEqual(['20%', '20%', '20%', '20%']);
  });

  test('REQ-089 · the bearings are labelled by compass point; an unsupported sector count falls back to 16 with SP002', () => {
    expect(texts(windRose.build({ ...bare, sectors: 8 }, context))).toEqual(expect.arrayContaining(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']));
    const seen = capture();
    expect(windRose.build({ ...bare, sectors: 7 }, context).table.rows).toHaveLength(16);
    expect(seen).toContain('SP002');
  });

  test('REQ-089 · REQ-124 · the legend names every speed bin, calmest first', () => {
    const printed = texts(windRose.build({ ...bare, bins: [5, 10, 20] }, context));
    expect(printed).toEqual(expect.arrayContaining(['< 5', '5–10', '10–20', '≥ 20']));
    expect(printed.indexOf('< 5')).toBeLessThan(printed.indexOf('≥ 20'));
  });

  test('REQ-089 · the demo is the real record: 742 hourly reports, described with its prevailing direction', () => {
    const model = windRose.build({ ...bare }, context);
    expect(model.description).toMatch(/742 observations/);
    expect(model.description).toMatch(/most often from [NSEW]{1,3}/);
  });
});
