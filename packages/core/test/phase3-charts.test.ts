import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, chordRing, coxcombChart, donutChart, gaugeArc, meterChart, orbitChart, polarBarChart, radarChart, radialArcGroup, radialRings, readout, stepActive, volvelleChart, windRose, type ActiveItem, type ChartModel, type HitArea, type RecipeContext, type SpCode } from '../src';
import { VOLVELLE_CHART_DEMO } from '../src/charts/volvelle-chart/demo';

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
const pointsOf = (d: string) => [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)(?=[MLAQZ]|$)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
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

describe('ChordRing', () => {
  const flows = [
    { source: 'A', target: 'B', value: 30 },
    { source: 'B', target: 'A', value: 10 },
    { source: 'A', target: 'C', value: 20 },
    { source: 'C', target: 'B', value: 5 },
  ];
  const ribbons = (model: ChartModel) => encoding(model).filter((s) => s.d.includes('Q'));
  const groups = (model: ChartModel) => encoding(model).filter((s) => !s.d.includes('Q'));
  /** Centre of the ring: every ribbon curves through it. */
  const centreFrom = (model: ChartModel) => {
    const q = /Q(-?[\d.]+),(-?[\d.]+)/.exec(ribbons(model)[0]!.d)!;
    return { cx: Number(q[1]), cy: Number(q[2]) };
  };
  const at = (p: { x: number; y: number }, c: { cx: number; cy: number }) => {
    const a = Math.atan2(p.x - c.cx, c.cy - p.y);
    return a < 0 ? a + 2 * Math.PI : a;
  };

  test('REQ-091 · one ribbon per flow and one arc per category, in order of first appearance', () => {
    const model = chordRing.build({ ...bare, data: flows }, context);
    expect(ribbons(model)).toHaveLength(4);
    expect(groups(model)).toHaveLength(3);
    const printed = texts(model);
    expect(printed.indexOf('A')).toBeLessThan(printed.indexOf('B'));
    expect(printed.indexOf('B')).toBeLessThan(printed.indexOf('C'));
  });

  test('REQ-091 · a ribbon’s end spans an angle proportional to its flow', () => {
    const model = chordRing.build({ ...bare, data: flows }, context);
    const c = centreFrom(model);
    const span = (d: string) => {
      const [p0, p1] = pointsOf(d);
      let s = at(p1!, c) - at(p0!, c);
      if (s < 0) s += 2 * Math.PI;
      return s;
    };
    const spans = ribbons(model).map((r) => span(r.d));
    close(spans[0]! / spans[2]!, 30 / 20, 0.02);
    close(spans[1]! / spans[3]!, 10 / 5, 0.02);
  });

  test('REQ-091 · a category’s arc spans its throughput — what it sends plus what it receives', () => {
    const model = chordRing.build({ ...bare, data: flows }, context);
    const c = centreFrom(model);
    const sweep = (d: string) => {
      const [p0, p1] = pointsOf(d);
      let s = at(p1!, c) - at(p0!, c);
      if (s < 0) s += 2 * Math.PI;
      return s;
    };
    // A: 30 + 20 out, 10 in = 60; B: 10 out, 30 + 5 in = 45; C: 5 out, 20 in = 25.
    const [a, b, cc] = groups(model).map((g) => sweep(g.d));
    close(a! / b!, 60 / 45, 0.02);
    close(a! / cc!, 60 / 25, 0.02);
  });

  test('REQ-091 · above 12 categories SP010 is warned; past `maxCategories` the smallest merge into “Other”', () => {
    const seen = capture();
    const wide = Array.from({ length: 13 }, (_, i) => ({ source: `c${i}`, target: `c${(i + 1) % 13}`, value: 13 - i }));
    chordRing.build({ ...bare, data: wide, maxCategories: 20 }, context);
    expect(seen).toContain('SP010');
    const few = capture();
    const model = chordRing.build({ ...bare, data: flows, maxCategories: 2 }, context);
    expect(few).toContain('SP010');
    expect(groups(model)).toHaveLength(2);
    expect(texts(model)).toEqual(expect.arrayContaining(['A', 'Other']));
    // The table lists the ribbons drawn: A → B and A → C merge into A → Other.
    expect(model.table.rows).toEqual([['A → Other', '50'], ['Other → A', '10'], ['Other → Other', '5']]);
  });

  test('REQ-091 · 12 categories draw without SP010', () => {
    const seen = capture();
    chordRing.build({ ...bare, data: Array.from({ length: 12 }, (_, i) => ({ source: `c${i}`, target: `c${(i + 1) % 12}`, value: 1 })) }, context);
    expect(seen).not.toContain('SP010');
  });

  test('REQ-121 · the table lists every ribbon by both its ends, as the sankey names a flow', () => {
    const model = chordRing.build({ ...bare, data: flows }, context);
    expect(model.table.columns).toEqual(['flow', 'value']);
    expect(model.table.rows[0]).toEqual(['A → B', '30']);
  });
});

describe('OrbitChart', () => {
  const data = [
    { label: 'Inner', markers: [{ period: 0, value: 4 }, { period: 0.25, value: 1 }] },
    { label: 'Middle', markers: [{ period: 0.5, value: 4 }] },
    { label: 'Outer', markers: [{ period: 0.75, value: 4 }] },
  ];
  /** The orbits: ornament ellipses, two arcs each. */
  const orbits = (model: ChartModel) => model.geometry.strokes.filter((s) => s.role === 'ornament' && /A[\d.]+,[\d.]+,0,1,1/.test(s.d));
  const semi = (d: string) => {
    const m = /A([\d.]+),([\d.]+),/.exec(d)!;
    return { a: Number(m[1]), b: Number(m[2]) };
  };

  test('REQ-092 · nested elliptical orbits, from the inside out in data order', () => {
    const model = orbitChart.build({ ...bare, data }, context);
    const axes = orbits(model).map((o) => semi(o.d));
    expect(axes).toHaveLength(3);
    expect(axes[0]!.a).toBeLessThan(axes[1]!.a);
    expect(axes[1]!.a).toBeLessThan(axes[2]!.a);
    for (const e of axes) expect(e.b).toBeLessThan(e.a);
  });

  test('REQ-092 · a marker sits on its orbit, at its period of the cycle, clockwise from 12 o’clock', () => {
    const model = orbitChart.build({ ...bare, data }, context);
    const [inner, , outer] = orbits(model).map((o) => ({ ...semi(o.d), top: pointsOf(o.d)[0]! }));
    const cx = inner!.top.x;
    const cy = inner!.top.y + inner!.b;
    const [m0, m1, , m3] = model.geometry.hitAreas;
    // Inner, period 0: the top of the ellipse; period 0.25: its right end.
    close(m0!.x, cx, 0.01);
    close(m0!.y, cy - inner!.b, 0.01);
    close(m1!.x, cx + inner!.a, 0.01);
    close(m1!.y, cy, 0.01);
    // Outer, period 0.75: its left end.
    close(m3!.x, cx - outer!.a, 0.01);
    close(m3!.y, cy, 0.01);
    // Every marker lies on its ellipse.
    for (const [hit, e] of [[m0, inner], [m3, outer]] as const) close(((hit!.x - cx) / e!.a) ** 2 + ((hit!.y - cy) / e!.b) ** 2, 1, 0.01);
  });

  test('REQ-092 · REQ-124 · a marker’s area is proportional to its value', () => {
    const model = orbitChart.build({ ...bare, data }, context);
    const [big, small] = model.geometry.hitAreas;
    close((big!.box!.width / small!.box!.width) ** 2, 4, 0.05);
  });

  test('REQ-092 · every orbit is named', () => {
    expect(texts(orbitChart.build({ ...bare, data }, context))).toEqual(expect.arrayContaining(['Inner', 'Middle', 'Outer']));
  });

  test('REQ-092 · `orbits` caps the orbits shown, from the inside out', () => {
    const model = orbitChart.build({ ...bare, data, orbits: 2 }, context);
    expect(orbits(model)).toHaveLength(2);
    expect(texts(model)).not.toContain('Outer');
  });

  test('REQ-008 · a period outside 0-1 or a negative value is warned SP002 and dropped', () => {
    const seen = capture();
    const model = orbitChart.build({ ...bare, data: [{ label: 'X', markers: [{ period: 1.2, value: 1 }, { period: 0.5, value: -2 }, { period: 0.5, value: 2 }] }] }, context);
    expect(model.geometry.hitAreas).toHaveLength(1);
    expect(seen.filter((c) => c === 'SP002')).toHaveLength(2);
  });

  test('REQ-121 · the table lists every marker: orbit, period, value', () => {
    const model = orbitChart.build({ ...bare, data }, context);
    expect(model.table.columns).toEqual(['orbit', 'period', 'value']);
    expect(model.table.rows[1]).toEqual(['Inner', '0.25', '1']);
  });
});

describe('VolvelleChart', () => {
  // Day: four segments of 90°; Shift: three of 120°. Tue spans 90°-180°: its middle is 135°,
  // which falls in Shift's second segment (120°-240°), Late.
  const data = [
    { label: 'Day', segments: ['Mon', 'Tue', 'Wed', 'Thu'] },
    { label: 'Shift', segments: ['Early', 'Late', 'Night'] },
  ];
  const segmentsOf = (model: ChartModel, ring: number) => model.geometry.hitAreas.filter((h) => h.cell?.row === ring);

  test('REQ-090 · concentric rings from the inside out, each in equal segments', () => {
    const model = volvelleChart.build({ ...bare, data }, context);
    expect(segmentsOf(model, 0)).toHaveLength(4);
    expect(segmentsOf(model, 1)).toHaveLength(3);
    expect(model.table.rows).toHaveLength(7);
  });

  test('REQ-090 · the index faces 12 o’clock, at the middle of `indexValue` on `indexRing`', () => {
    const model = volvelleChart.build({ ...bare, data, indexRing: 0, indexValue: 'Tue' }, context);
    const tue = segmentsOf(model, 0)[1]!;
    const { cx } = centreOf(model);
    close(tue.x, cx, 0.01);
    expect(tue.y).toBeLessThan(centreOf(model).cy);
  });

  test('REQ-090 · the combined readout lists what every ring shows under the index', () => {
    const model = volvelleChart.build({ ...bare, data, indexRing: 0, indexValue: 'Tue' }, context);
    expect(texts(model)).toContain('Day Tue · Shift Late');
    expect(model.description).toContain('Day Tue · Shift Late');
  });

  test('REQ-090 · REQ-124 · the aligned segments are marked by a tone, and named in the readout', () => {
    const model = volvelleChart.build({ ...bare, data, indexRing: 1, indexValue: 'Night' }, context);
    const toned = encoding(model).filter((s) => s.tone !== undefined);
    expect(toned).toHaveLength(2);
    // Night spans 240°-360°: its middle, 300°, falls in Day's fourth segment (270°-360°), Thu.
    expect(texts(model)).toContain('Day Thu · Shift Night');
  });

  test('REQ-090 · a printed segment name stays inside its ring (seen in the preview)', () => {
    // Large enough that some names fit inside their rings, so the check is never vacuous.
    const model = volvelleChart.build({ chrome: 'bare', height: 320 }, { ...context, width: 640 });
    const { cx, cy } = centreOf(model);
    const segments = encoding(model);
    expect(segments).toHaveLength(model.geometry.hitAreas.length);
    let checked = 0;
    model.geometry.hitAreas.forEach((hit, i) => {
      const label = model.geometry.labels.find((l) => l.text === hit.datum.segment && Math.abs(l.x - hit.x) < 0.5);
      if (!label) return;
      const radii = [...segments[i]!.d.matchAll(/A([\d.]+),/g)].map((m) => Number(m[1]));
      const [inner, outer] = [Math.min(...radii), Math.max(...radii)];
      const box = textBox(label);
      for (const [x, y] of [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]] as const) {
        const r = Math.hypot(x - cx, y - cy);
        expect(r >= inner - 1 && r <= outer + 1, `${label.text}: corner at r ${r.toFixed(1)} outside ${inner}-${outer}`).toBe(true);
      }
      checked += 1;
    });
    expect(checked).toBeGreaterThan(0);
  });

  test('REQ-090 · the outermost ring is named around the rim; the index’s segment is named in the readout', () => {
    const model = volvelleChart.build({ ...bare }, context);
    const printed = texts(model);
    for (const team of ['Borealis', 'Cygnus', 'Draco', 'Eridanus']) expect(printed, team).toContain(team);
    expect(printed.join(' ')).toContain('Team Atlas');
  });

  test('REQ-090 · an unknown `indexValue` or `indexRing` falls back to the first segment of the first ring, with SP002', () => {
    const seen = capture();
    const model = volvelleChart.build({ ...bare, data, indexRing: 5, indexValue: 'Sun' }, context);
    expect(texts(model)).toContain('Day Mon · Shift Early');
    expect(seen.filter((c) => c === 'SP002').length).toBeGreaterThanOrEqual(1);
  });

  describe('under the demo (delta-011)', () => {
    /** Every diagnostic of one build, with its message. */
    function messagesOf(props: Parameters<typeof volvelleChart.build>[0]): string[] {
      const seen: string[] = [];
      restore = __setDiagnosticSink((code, message) => seen.push(`${code} ${message}`));
      volvelleChart.build(props, context);
      return seen;
    }

    test('REQ-098 · REQ-090 · `indexRing` and `indexValue` turn the demo as they turn consumer rings', () => {
      capture();
      const model = volvelleChart.build({ ...bare, indexRing: 1, indexValue: 'Night' }, context);
      // Night is the third of three: its middle, 5/6 of the turn, falls in Day's sixth of seven
      // (Sat) and Team's fifth of five (Eridanus).
      expect(texts(model)).toContain('Day Sat · Shift Night · Team Eridanus');
      expect(model.description).toContain('Day Sat · Shift Night · Team Eridanus');
      const night = segmentsOf(model, 1)[2]!;
      close(night.x, centreOf(model).cx, 0.01);
    });

    test('REQ-098 · an out-of-range ring or an absent value warns SP002 as with consumer data, and falls back', () => {
      const demoRing = messagesOf({ ...bare, indexRing: 9 });
      const ownRing = messagesOf({ ...bare, data: VOLVELLE_CHART_DEMO.map((r) => ({ ...r })), indexRing: 9 });
      expect(demoRing).toEqual(ownRing);
      expect(demoRing.some((m) => m.startsWith('SP002'))).toBe(true);

      const demoValue = messagesOf({ ...bare, indexRing: 1, indexValue: 'Nope' });
      const ownValue = messagesOf({ ...bare, data: VOLVELLE_CHART_DEMO.map((r) => ({ ...r })), indexRing: 1, indexValue: 'Nope' });
      expect(demoValue).toEqual(ownValue);
      expect(demoValue.some((m) => m.startsWith('SP002') && m.includes('Nope'))).toBe(true);

      capture();
      expect(texts(volvelleChart.build({ ...bare, indexRing: 9 }, context))).toContain('Day Mon · Shift Early · Team Atlas');
      // An absent value on an existing ring reads that ring's first segment, exactly as with consumer rings.
      const demoFallback = volvelleChart.build({ ...bare, indexRing: 1, indexValue: 'Nope' }, context);
      expect(texts(demoFallback)).toContain('Day Tue · Shift Early · Team Atlas');
      expect(demoFallback.geometry).toEqual(volvelleChart.build({ ...bare, data: VOLVELLE_CHART_DEMO.map((r) => ({ ...r })), indexRing: 1, indexValue: 'Nope' }, context).geometry);
    });

    test('REQ-005 · with no index the demo is unchanged: it reads the default index, first segment of the first ring', () => {
      capture();
      const bareDemo = volvelleChart.build({ ...bare }, context);
      expect(bareDemo).toEqual(volvelleChart.build({ ...bare, indexRing: 0, indexValue: 'Mon' }, context));
      expect(texts(bareDemo)).toContain('Day Mon · Shift Early · Team Atlas');
    });
  });
});

/** Phase 3 final review: each finding reproduced before its fix. */
describe('final-review findings', () => {
  /** Every arc command of a path, with the point it starts from and the point it ends at. */
  function arcs(d: string): { from: string; to: string }[] {
    const out: { from: string; to: string }[] = [];
    let here = '';
    for (const [, cmd, args] of d.matchAll(/([MLAQZ])([^MLAQZ]*)/g)) {
      const n = args!.split(',');
      if (cmd === 'A') out.push({ from: here, to: `${n[5]},${n[6]}` });
      if (cmd !== 'Z') here = `${n.at(-2)},${n.at(-1)}`;
    }
    return out;
  }
  /** Every item the keyboard reaches from Home, following every arrow from every reached item. */
  function reachable(model: ChartModel): Set<string> {
    const key = (a: ActiveItem) => `${a.seriesKey}#${a.index}`;
    const start = stepActive(model.geometry, null, 'Home')!;
    const seen = new Map([[key(start), start]]);
    const queue = [start];
    while (queue.length > 0) {
      const item = queue.shift()!;
      for (const k of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
        const next = stepActive(model.geometry, item, k);
        if (next && !seen.has(key(next))) {
          seen.set(key(next), next);
          queue.push(next);
        }
      }
    }
    return new Set(seen.keys());
  }

  test('I-1 · REQ-075 · REQ-079 · a sector of almost the whole turn is still drawn: no arc ends where it starts', () => {
    for (const model of [
      donutChart.build({ ...bare, data: [{ name: 'big', value: 1e6 }, { name: 'tiny', value: 1 }] }, context),
      donutChart.build({ ...bare, data: [{ name: 'big', value: 99999 }, { name: 'tiny', value: 1 }] }, context),
      radialRings.build({ ...bare, data: [{ name: 'Done', value: 99.9999 }] }, context),
    ]) {
      // The big sector, drawn first; the tiny one is legitimately too small to draw.
      const big = encoding(model)[0]!;
      expect(arcs(big.d).length).toBeGreaterThan(0);
      for (const a of arcs(big.d)) expect(a.to, `${model.chart}: ${big.d}`).not.toBe(a.from);
    }
  });

  test('I-2 · REQ-122 · a chord ribbon is announced by its source and its target', () => {
    const model = chordRing.build({ ...bare, data: [{ source: 'Home', target: 'Shop', value: 42 }, { source: 'Home', target: 'Blog', value: 28 }] }, context);
    const said = model.geometry.hitAreas.map((h) => readout(model, { seriesKey: h.seriesKey, index: h.index, datum: h.datum, value: h.value, point: { x: h.x, y: h.y } }).announcement);
    expect(said[0]).toContain('Shop');
    expect(said[1]).toContain('Blog');
  });

  test('I-3 · REQ-091 · REQ-122 · rows repeating a pair are one ribbon, warned, reachable, and read as their sum', () => {
    const seen = capture();
    const model = chordRing.build({ ...bare, data: [{ source: 'A', target: 'B', value: 1 }, { source: 'A', target: 'B', value: 9 }, { source: 'B', target: 'A', value: 2 }] }, context);
    expect(seen).toContain('SP002');
    const hits = model.geometry.hitAreas;
    expect(hits).toHaveLength(2);
    expect(reachable(model).size).toBe(2);
    for (const h of hits) {
      const r = readout(model, { seriesKey: h.seriesKey, index: h.index, datum: h.datum, value: h.value, point: { x: h.x, y: h.y } });
      expect(r.text).toContain(String(h.value));
    }
    expect(hits.map((h) => h.value)).toEqual([10, 2]);
  });

  test('I-4 · REQ-090 · the index reads a boundary exactly: [start, end) in whole segments, never by floating point', () => {
    // Six segments of 60°; the fourth (index 3) spans 180°-240°, its middle 210°. A ring of twelve
    // has 210° as the start of its eighth segment (index 7): 210°-240°.
    const six = ['s0', 's1', 's2', 's3', 's4', 's5'];
    const twelve = Array.from({ length: 12 }, (_, i) => `t${i}`);
    const model = volvelleChart.build({ ...bare, data: [{ label: 'Six', segments: six }, { label: 'Twelve', segments: twelve }], indexRing: 0, indexValue: 's3' }, context);
    expect(texts(model)).toContain('Six s3 · Twelve t7');
    // Brute force: every pair of ring sizes, every index segment, against exact integer arithmetic.
    for (let n = 1; n <= 12; n++) {
      for (let m = 1; m <= 24; m++) {
        const a = Array.from({ length: n }, (_, i) => `a${i}`);
        const b = Array.from({ length: m }, (_, i) => `b${i}`);
        for (let j = 0; j < n; j++) {
          const built = volvelleChart.build({ ...bare, data: [{ label: 'A', segments: a }, { label: 'B', segments: b }], indexValue: `a${j}` }, context);
          expect(built.description, `n ${n}, m ${m}, j ${j}`).toContain(`A a${j} · B b${Math.floor(((2 * j + 1) * m) / (2 * n))}`);
        }
      }
    }
  });

  test('I-5 · REQ-122 · every orbit marker is reachable by keyboard, even after dropped markers', () => {
    const seen = capture();
    const model = orbitChart.build({
      ...bare,
      data: [
        { label: 'A', markers: [{ period: 0.1, value: 1 }, { period: 0.2, value: 1 }] },
        { label: 'B', markers: [{ period: 2, value: 1 }, { period: -1, value: 1 }, { period: 0.5, value: 1 }] },
      ],
    }, context);
    expect(seen).toContain('SP002');
    expect(model.geometry.hitAreas).toHaveLength(3);
    expect(reachable(model).size).toBe(3);
  });
});
