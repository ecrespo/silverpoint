/**
 * T-172..T-176 · the comparison, change, ranking, uncertainty, interval, survey and relationship
 * charts of wave 1 (REQ-406..REQ-413). Each meets the second catalog's contract (support/), then
 * its own: the encoding marks of DD-035, the derived table (REQ-431), its one heightened element
 * (REQ-442), direction never by shape alone (REQ-440) and its diagnostics.
 */
import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, stepActive, type ChartModel, type SpCode } from '../src';
import { bumpChart } from '../src/charts/bump-chart/bump-chart';
import { connectedScatterChart } from '../src/charts/connected-scatter-chart/connected-scatter-chart';
import { divergingBarChart } from '../src/charts/diverging-bar-chart/diverging-bar-chart';
import { dumbbellChart } from '../src/charts/dumbbell-chart/dumbbell-chart';
import { errorBarChart } from '../src/charts/error-bar-chart/error-bar-chart';
import { intervalChart } from '../src/charts/interval-chart/interval-chart';
import { lollipopChart } from '../src/charts/lollipop-chart/lollipop-chart';
import { slopeChart } from '../src/charts/slope-chart/slope-chart';
import { context, heightened, R, secondCatalogContract, type Case } from './support/second-catalog-contract';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const encodings = (model: ChartModel) => model.geometry.strokes.filter((s) => s.role === 'encoding' && s.part !== 'heighten');
const marks = (model: ChartModel) => {
  const raised = new Set(heightened(model).map((s) => s.d));
  return encodings(model).filter((s) => !raised.has(s.d));
};

const LOLLI = [{ k: 'Ash', n: 12 }, { k: 'Birch', n: 30 }, { k: 'Cedar', n: -6 }, { k: 'Dogwood', n: 18 }];
const PAIRS = [{ who: 'Ash', y1: 10, y2: 14 }, { who: 'Birch', y1: 20, y2: 12 }, { who: 'Cedar', y1: 5, y2: 9 }];
const RANKED = [
  { yr: 2020, team: 'A', pts: 10 }, { yr: 2020, team: 'B', pts: 20 }, { yr: 2020, team: 'C', pts: 15 },
  { yr: 2021, team: 'A', pts: 30 }, { yr: 2021, team: 'B', pts: 25 }, { yr: 2021, team: 'C', pts: 25 },
];
const ESTIMATES = [{ arm: 'A', e: 0.4, lo: -0.2, hi: 1.1 }, { arm: 'B', e: -1.2, lo: -2, hi: -0.5 }, { arm: 'C', e: 2, lo: 1.5, hi: 3.4 }];
const JOBS = [
  { lane: 'North', from: 1, to: 5, job: 'Dig' },
  { lane: 'North', from: 4, to: 9, job: 'Pour' },
  { lane: 'South', from: 2, to: 12, job: 'Pave' },
];
const LEVELS = ['No', 'Unsure', 'Yes'];
const SURVEY = [{ q: 'Q1', No: 10, Unsure: 20, Yes: 70 }, { q: 'Q2', No: 50, Unsure: 10, Yes: 40 }];
const PATH = [{ yr: 2001, a: 1, b: 2 }, { yr: 2002, a: 3, b: 3 }, { yr: 2003, a: 2, b: 5 }, { yr: 2004, a: 4, b: 4 }];

const CASES: readonly Case[] = [
  { recipe: R(lollipopChart), consumer: { data: LOLLI, xKey: 'k', valueKey: 'n' }, items: 4, hostile: [{ k: 'Bad', n: Number.NaN }], labelOf: (d) => String(d.k), rawDatum: true, ordered: true },
  { recipe: R(dumbbellChart), consumer: { data: PAIRS, labelKey: 'who', startKey: 'y1', endKey: 'y2' }, items: 6, hostile: [{ who: 'Bad', y1: 1 }], labelOf: (d) => String(d.label), ordered: true },
  { recipe: R(slopeChart), consumer: { data: PAIRS, labelKey: 'who', startKey: 'y1', endKey: 'y2' }, items: 6, hostile: [{ who: 'Ash', y1: 1, y2: 2 }], labelOf: (d) => String(d.label), ordered: true },
  { recipe: R(bumpChart), consumer: { data: RANKED, xKey: 'yr', seriesKey: 'team', valueKey: 'pts' }, items: 6, hostile: [{ yr: 2020, team: 'A', pts: 'x' }], labelOf: (d) => String(d.x), ordered: true },
  { recipe: R(errorBarChart), consumer: { data: ESTIMATES, labelKey: 'arm', estimateKey: 'e', lowKey: 'lo', highKey: 'hi' }, items: 3, hostile: [{ arm: 'Bad', e: 1 }], labelOf: (d) => String(d.label), ordered: true },
  { recipe: R(intervalChart), consumer: { data: JOBS, laneKey: 'lane', startKey: 'from', endKey: 'to', labelKey: 'job' }, items: 3, hostile: [{ lane: 'North', from: 'soon', to: 3 }], labelOf: (d) => String(d.label), ordered: true },
  { recipe: R(divergingBarChart), consumer: { data: SURVEY, labelKey: 'q', levels: LEVELS }, items: 6, hostile: [{ q: 'Q0', No: -5, Unsure: 'x', Yes: null }], labelOf: (d) => String(d.label), ordered: true },
  { recipe: R(connectedScatterChart), consumer: { data: PATH, xKey: 'a', yKey: 'b', labelKey: 'yr' }, items: 4, hostile: [{ yr: 1999, a: Number.NaN, b: 1 }], labelOf: (d) => String(d.yr), rawDatum: true, ordered: true },
];

secondCatalogContract(CASES);

describe('T-172 · LollipopChart (REQ-406)', () => {
  test('REQ-406 · a stem from the baseline and a toned head per category; negatives hang below', () => {
    const model = lollipopChart.build({ data: LOLLI, xKey: 'k', valueKey: 'n' }, context);
    const heads = encodings(model).filter((s) => s.d.includes('A'));
    const stems = marks(model).filter((s) => !s.d.includes('A'));
    expect(heads).toHaveLength(4);
    expect(heads.every((s) => s.tone === 2)).toBe(true);
    expect(stems).toHaveLength(4);
    const cedar = model.geometry.hitAreas.find((h) => h.value === -6)!;
    const ash = model.geometry.hitAreas.find((h) => h.value === 12)!;
    expect(cedar.y).toBeGreaterThan(ash.y);
  });

  test('REQ-406 · `sort` orders the categories; the table keeps data order', () => {
    const model = lollipopChart.build({ data: LOLLI, xKey: 'k', valueKey: 'n', sort: 'descending' }, context);
    const byX = [...model.geometry.hitAreas].sort((a, b) => a.x - b.x).map((h) => h.value);
    expect(byX).toEqual([30, 18, 12, -6]);
    expect(model.table.rows.map((r) => r[0])).toEqual(['Ash', 'Birch', 'Cedar', 'Dogwood']);
  });

  test('REQ-442 · the largest head is heightened, the head itself', () => {
    const model = lollipopChart.build({ data: LOLLI, xKey: 'k', valueKey: 'n' }, context);
    const birch = model.geometry.hitAreas.find((h) => h.value === 30)!;
    expect(heightened(model)[0]?.d).toContain(`,${birch.y}A`);
  });
});

describe('T-172 · DumbbellChart (REQ-407)', () => {
  test('REQ-407 · start dotted secondary, end toned ink, joined by an ink segment', () => {
    const model = dumbbellChart.build({ data: PAIRS, labelKey: 'who', startKey: 'y1', endKey: 'y2' }, context);
    const drawn = marks(model);
    expect(drawn.filter((s) => s.part === 'ink-secondary' && s.dash === 'dotted' && s.d.includes('A'))).toHaveLength(3);
    expect(drawn.filter((s) => s.part === 'ink' && s.tone === 2)).toHaveLength(2);
    expect(drawn.filter((s) => s.part === 'ink' && s.tone === undefined && !s.d.includes('A'))).toHaveLength(3);
  });

  test('REQ-407 · REQ-440 · `endMarker: arrow` draws an exact arrowhead; the direction is also in the table', () => {
    const model = dumbbellChart.build({ data: PAIRS, labelKey: 'who', startKey: 'y1', endKey: 'y2', endMarker: 'arrow', names: ['2024', '2025'] }, context);
    expect(model.table.columns).toEqual(['who', '2024', '2025', 'change']);
    expect(model.table.rows[1]).toEqual(['Birch', '20', '12', '−8']);
    expect(model.table.rows[0]?.[3]).toBe('+4');
    const heads = marks(model).filter((s) => s.tone === 2 || (s.part === 'ink' && s.d.endsWith('Z') && !s.d.includes('A')));
    for (const h of heads) expect(h.d).not.toContain('A');
  });

  test('REQ-442 · the end mark of the largest change is heightened', () => {
    const model = dumbbellChart.build({ data: PAIRS, labelKey: 'who', startKey: 'y1', endKey: 'y2' }, context);
    const end = model.geometry.hitAreas.find((h) => h.seriesKey === 'end' && h.value === 12)!;
    expect(heightened(model)[0]?.d).toContain(`,${end.y}A`);
  });

  test('REQ-122 · two stops per category: start then end, category by category', () => {
    const { geometry } = dumbbellChart.build({ data: PAIRS, labelKey: 'who', startKey: 'y1', endKey: 'y2' }, context);
    const first = stepActive(geometry, null, 'Home')!;
    expect(first.seriesKey).toBe('start');
    expect(stepActive(geometry, first, 'ArrowRight')?.seriesKey).toBe('end');
    expect(stepActive(geometry, first, 'ArrowDown')?.index).toBe(1);
  });
});

describe('T-172 · SlopeChart (REQ-408)', () => {
  test('REQ-408 · one segment per category between two period axes; a decrease is dotted secondary', () => {
    const model = slopeChart.build({ data: PAIRS, labelKey: 'who', startKey: 'y1', endKey: 'y2' }, context);
    const segments = marks(model).filter((s) => !s.d.includes('A'));
    expect(segments).toHaveLength(3);
    expect(segments.filter((s) => s.part === 'ink-secondary' && s.dash === 'dotted')).toHaveLength(1);
    expect(model.geometry.strokes.filter((s) => s.part === 'axis')).toHaveLength(2);
  });

  test('REQ-408 · labelled with name and value at both ends, no legend', () => {
    const labels = slopeChart.build({ data: PAIRS, labelKey: 'who', startKey: 'y1', endKey: 'y2' }, context).geometry.labels.map((l) => l.text);
    expect(labels).toEqual(expect.arrayContaining(['Ash 10', '14 Ash', 'Birch 20', '12 Birch']));
  });

  test('REQ-442 · the largest change is heightened at its end', () => {
    const model = slopeChart.build({ data: PAIRS, labelKey: 'who', startKey: 'y1', endKey: 'y2' }, context);
    const birch = model.geometry.hitAreas.find((h) => h.seriesKey === 'end' && h.value === 12)!;
    expect(heightened(model)[0]?.d).toContain(`,${birch.y}A`);
  });
});

describe('T-173 · BumpChart (REQ-409)', () => {
  test('REQ-409 · REQ-432 · ranks computed in the core: competition ranking, ties shared, shown in the table', () => {
    const model = bumpChart.build({ data: RANKED, xKey: 'yr', seriesKey: 'team', valueKey: 'pts' }, context);
    expect(model.table.columns).toEqual(['yr', 'A', 'B', 'C']);
    expect(model.table.rows).toEqual([['2020', '3', '1', '2'], ['2021', '1', '2=', '2=']]);
  });

  test('REQ-409 · ties are slotted by series order, stably; `order: ascending` reverses ranks', () => {
    const model = bumpChart.build({ data: RANKED, xKey: 'yr', seriesKey: 'team', valueKey: 'pts' }, context);
    const at = (team: string, i: number) => model.geometry.hitAreas.find((h) => h.seriesKey === team && h.index === i)!;
    expect(at('B', 1).y).toBeLessThan(at('C', 1).y);
    const asc = bumpChart.build({ data: RANKED, xKey: 'yr', seriesKey: 'team', valueKey: 'pts', order: 'ascending' }, context);
    expect(asc.table.rows[0]).toEqual(['2020', '1', '3', '2']);
  });

  test('REQ-409 · one exact line per series with rank dots; names at both ends; `series` caps the lines', () => {
    const model = bumpChart.build({ data: RANKED, xKey: 'yr', seriesKey: 'team', valueKey: 'pts' }, context);
    expect(marks(model).filter((s) => !s.d.includes('A'))).toHaveLength(3);
    expect(model.geometry.labels.filter((l) => ['A', 'B', 'C'].includes(l.text))).toHaveLength(6);
    const capped = bumpChart.build({ data: RANKED, xKey: 'yr', seriesKey: 'team', valueKey: 'pts', series: 2 }, context);
    expect(new Set(capped.geometry.hitAreas.map((h) => h.seriesKey))).toEqual(new Set(['A', 'B']));
  });

  test('REQ-442 · the last point of the rank-1 series is heightened', () => {
    const model = bumpChart.build({ data: RANKED, xKey: 'yr', seriesKey: 'team', valueKey: 'pts' }, context);
    const a = model.geometry.hitAreas.find((h) => h.seriesKey === 'A' && h.index === 1)!;
    expect(heightened(model)[0]?.d).toContain(`,${a.y}A`);
  });

  test('REQ-008 · a series missing at an x breaks its line there', () => {
    const gappy = [...RANKED, { yr: 2022, team: 'A', pts: 1 }, { yr: 2022, team: 'B', pts: 2 }, { yr: 2023, team: 'A', pts: 3 }, { yr: 2023, team: 'B', pts: 1 }, { yr: 2023, team: 'C', pts: 2 }];
    const c = marks(bumpChart.build({ data: gappy, xKey: 'yr', seriesKey: 'team', valueKey: 'pts' }, context)).filter((s) => !s.d.includes('A'))[2]!;
    expect(c.d.match(/M/g)).toHaveLength(2);
  });
});

describe('T-174 · ErrorBarChart (REQ-410)', () => {
  test('REQ-410 · an interval with caps and a toned estimate per row; the reference a dotted rule', () => {
    const model = errorBarChart.build({ data: ESTIMATES, labelKey: 'arm', estimateKey: 'e', lowKey: 'lo', highKey: 'hi', reference: 0 }, context);
    expect(marks(model).filter((s) => s.d.includes('A') && s.tone === 2)).toHaveLength(2);
    expect(marks(model).filter((s) => !s.d.includes('A'))).toHaveLength(3);
    expect(model.geometry.strokes.filter((s) => s.part === 'rule' && s.dash === 'dotted')).toHaveLength(1);
    expect(model.table.columns).toEqual(['arm', 'e', 'lo', 'hi']);
  });

  test('REQ-442 · the estimate furthest from the reference is heightened; without one, the largest', () => {
    const model = errorBarChart.build({ data: ESTIMATES, labelKey: 'arm', estimateKey: 'e', lowKey: 'lo', highKey: 'hi', reference: 0 }, context);
    const c = model.geometry.hitAreas.find((h) => h.value === 2)!;
    expect(heightened(model)[0]?.d).toContain(`${c.y}A`);
    const far = errorBarChart.build({ data: ESTIMATES, labelKey: 'arm', estimateKey: 'e', lowKey: 'lo', highKey: 'hi', reference: 3 }, context);
    const b = far.geometry.hitAreas.find((h) => h.value === -1.2)!;
    expect(heightened(far)[0]?.d).toContain(`${b.y}A`);
  });
});

describe('T-174 · IntervalChart (REQ-411)', () => {
  test('REQ-411 · floating pills on lanes, toned 2; overlapping ones in a lane take separate tracks', () => {
    const model = intervalChart.build({ data: JOBS, laneKey: 'lane', startKey: 'from', endKey: 'to', labelKey: 'job' }, context);
    const [dig, pour] = model.geometry.hitAreas;
    expect(dig?.box && pour?.box && dig.box.y !== pour.box.y).toBe(true);
    expect(marks(model).every((s) => s.tone === 2)).toBe(true);
  });

  test('REQ-411 · ISO dates are UTC days, whatever the host zone: the same model in any TZ', () => {
    const dated = [{ lane: 'A', from: '2026-03-28', to: '2026-03-30' }, { lane: 'A', from: '2026-01-01', to: '2026-01-10' }];
    const props = { data: dated, laneKey: 'lane', startKey: 'from', endKey: 'to', axis: 'date' as const };
    const before = JSON.stringify(intervalChart.build(props, context));
    const zone = process.env.TZ;
    process.env.TZ = 'Pacific/Kiritimati';
    try {
      expect(JSON.stringify(intervalChart.build(props, context))).toBe(before);
    } finally {
      process.env.TZ = zone;
    }
    expect(intervalChart.build(props, context).table.rows[0]).toEqual(['A', '2026-03-28', '2026-03-30', '2']);
  });

  test('REQ-442 · the longest interval is heightened; REQ-443 · past 200 intervals SP008', () => {
    const model = intervalChart.build({ data: JOBS, laneKey: 'lane', startKey: 'from', endKey: 'to' }, context);
    const pave = model.geometry.hitAreas.find((h) => h.value === 10)!;
    expect(heightened(model)[0]?.d).toContain(`${pave.box?.y}`);
    const seen = capture();
    intervalChart.build({ data: Array.from({ length: 201 }, (_, i) => ({ lane: 'L', from: i, to: i + 1 })), laneKey: 'lane', startKey: 'from', endKey: 'to' }, context);
    expect(seen).toContain('SP008');
  });
});

describe('T-175 · DivergingBarChart (REQ-412)', () => {
  test('REQ-412 · REQ-440 · segments abut across a centre rule; the side carries the sign, tone the distance from neutral', () => {
    const model = divergingBarChart.build({ data: SURVEY, labelKey: 'q', levels: LEVELS }, context);
    const q1 = model.geometry.hitAreas.filter((h) => h.index === 0);
    const at = (level: string) => q1.find((h) => h.seriesKey === level)!;
    expect(at('No').box!.x + at('No').box!.width).toBeLessThanOrEqual(at('Yes').box!.x + 0.01);
    const tones = marks(model).map((s) => s.tone);
    expect(tones.filter((t) => t === 0)).toHaveLength(4);
    // No and Yes are one step from neutral; the heightened Yes of Q1 is counted apart.
    expect(tones.filter((t) => t === 1)).toHaveLength(3);
    expect(model.geometry.labels.filter((l) => LEVELS.includes(l.text))).toHaveLength(3);
  });

  test('REQ-412 · percent normalises each row (the default); `percent: false` keeps counts', () => {
    const shares = divergingBarChart.build({ data: [{ q: 'Q', No: 1, Unsure: 1, Yes: 2 }], labelKey: 'q', levels: LEVELS }, context);
    expect(shares.table.rows[0]).toEqual(['Q', '25%', '25%', '50%']);
    const counts = divergingBarChart.build({ data: [{ q: 'Q', No: 1, Unsure: 1, Yes: 2 }], labelKey: 'q', levels: LEVELS, percent: false }, context);
    expect(counts.table.rows[0]).toEqual(['Q', '1', '1', '2']);
  });

  test('REQ-412 · `neutral: null` splits nothing; the neutral index is clamped to the levels', () => {
    const model = divergingBarChart.build({ data: SURVEY, labelKey: 'q', levels: LEVELS, neutral: null }, context);
    expect(marks(model).every((s) => (s.tone ?? 0) > 0)).toBe(true);
  });

  test('REQ-442 · the largest positive share is heightened', () => {
    const model = divergingBarChart.build({ data: SURVEY, labelKey: 'q', levels: LEVELS }, context);
    const yes = model.geometry.hitAreas.find((h) => h.seriesKey === 'Yes' && h.index === 0)!;
    expect(heightened(model)[0]?.d).toContain(`${yes.box!.x}`);
  });
});

describe('T-176 · ConnectedScatterChart (REQ-413)', () => {
  test('REQ-413 · an exact ordered path with direction chevrons; `arrows: false` drops them', () => {
    const model = connectedScatterChart.build({ data: PATH, xKey: 'a', yKey: 'b' }, context);
    const lines = marks(model).filter((s) => !s.d.includes('A'));
    expect(lines.length).toBe(1 + 3);
    const plain = connectedScatterChart.build({ data: PATH, xKey: 'a', yKey: 'b', arrows: false }, context);
    expect(marks(plain).filter((s) => !s.d.includes('A'))).toHaveLength(1);
  });

  test('REQ-413 · the ends are labelled; the last point is heightened; keys walk the path', () => {
    const model = connectedScatterChart.build({ data: PATH, xKey: 'a', yKey: 'b', labelKey: 'yr' }, context);
    const texts = model.geometry.labels.map((l) => l.text);
    expect(texts).toEqual(expect.arrayContaining(['2001', '2004']));
    const last = model.geometry.hitAreas.at(-1)!;
    expect(heightened(model)[0]?.d).toContain(`,${last.y}A`);
    expect(model.geometry.hitAreas.map((h) => h.index)).toEqual([0, 1, 2, 3]);
  });

  test('REQ-443 · above 500 points SP008', () => {
    const seen = capture();
    connectedScatterChart.build({ data: Array.from({ length: 501 }, (_, i) => ({ a: i, b: i % 7 })), xKey: 'a', yKey: 'b' }, context);
    expect(seen).toContain('SP008');
  });
});
