import { diagnose } from '../../diagnostics/diagnose';
import type { Accessor, Datum, NetworkNode } from '../../types';
import { finite, warnValue } from './cells';
import { parseIsoDate } from './dates';
import { accessorName, read } from './format';

/**
 * The input contracts of the second catalog (Data Model §2.15..§2.24): one reader per shape. Each
 * reads through the chart's accessors, drops, swaps or corrects what its contract row says, and
 * warns once per render and property, naming the first offending row (T-164).
 */

/**
 * Counts the rows a reader rejected or corrected, and warns once per render (SP002), naming the
 * property and row of the first of them.
 */
class Rejections {
  private first: { property: string; index: number; why: string } | undefined;
  private count = 0;

  constructor(
    private readonly chart: string,
    private readonly total: number,
  ) {}

  add(property: string, index: number, why: string): void {
    this.count += 1;
    this.first ??= { property, index, why };
  }

  report(): void {
    if (!this.first) return;
    const { property, index, why } = this.first;
    warnValue(this.chart, property, `${this.count} of ${this.total} rows break the data contract; the first is row ${index}, which ${why}.`);
  }
}

/** A text field: a string, or a number printed as given; anything else is missing. */
function text(raw: unknown): string | undefined {
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return undefined;
}

/** First-appearance order of a list of keys. */
function ordered<T>(keys: Iterable<T>): T[] {
  return [...new Set(keys)];
}

// --- §2.15 Observations ----------------------------------------------------------------------

export interface Observation {
  readonly value: number;
  /** `''` when the chart has no group accessor. */
  readonly group: string;
  readonly label?: string;
  readonly index: number;
  readonly datum: Datum;
}

export function readObservations(
  chart: string,
  data: readonly Datum[],
  keys: { value: Accessor<unknown>; group?: Accessor<unknown>; label?: Accessor<unknown> },
): { observations: Observation[]; groups: string[] } {
  const rejected = new Rejections(chart, data.length);
  const valueName = accessorName(keys.value, 'value');
  const groupName = keys.group === undefined ? 'group' : accessorName(keys.group, 'group');
  const observations: Observation[] = [];
  data.forEach((datum, index) => {
    const value = finite(read(keys.value, datum, index));
    if (value === undefined) return rejected.add(valueName, index, 'has no finite value');
    const group = keys.group === undefined ? '' : text(read(keys.group, datum, index));
    if (group === undefined) return rejected.add(groupName, index, 'has no group');
    const label = keys.label === undefined ? undefined : text(read(keys.label, datum, index));
    observations.push(label === undefined ? { value, group, index, datum } : { value, group, label, index, datum });
  });
  rejected.report();
  return { observations, groups: keys.group === undefined ? [''] : ordered(observations.map((o) => o.group)) };
}

// --- §2.16 Paired ----------------------------------------------------------------------------

export interface PairedRow {
  readonly label: string;
  readonly start: number;
  readonly end: number;
  readonly index: number;
  readonly datum: Datum;
}

export function readPaired(
  chart: string,
  data: readonly Datum[],
  keys: { label: Accessor<unknown>; start: Accessor<unknown>; end: Accessor<unknown> },
): PairedRow[] {
  const rejected = new Rejections(chart, data.length);
  const seen = new Set<string>();
  const rows: PairedRow[] = [];
  data.forEach((datum, index) => {
    const label = text(read(keys.label, datum, index));
    if (label === undefined || seen.has(label)) return rejected.add(accessorName(keys.label, 'label'), index, 'repeats a label or has none');
    const start = finite(read(keys.start, datum, index));
    const end = finite(read(keys.end, datum, index));
    if (start === undefined) return rejected.add(accessorName(keys.start, 'start'), index, 'has no finite value');
    if (end === undefined) return rejected.add(accessorName(keys.end, 'end'), index, 'has no finite value');
    seen.add(label);
    rows.push({ label, start, end, index, datum });
  });
  rejected.report();
  return rows;
}

// --- §2.17 Ranked ----------------------------------------------------------------------------

export interface RankedRow {
  readonly x: string | number;
  readonly series: string;
  readonly value: number;
  readonly index: number;
  readonly datum: Datum;
}

export function readRanked(
  chart: string,
  data: readonly Datum[],
  keys: { x: Accessor<unknown>; series: Accessor<unknown>; value: Accessor<unknown> },
): { rows: RankedRow[]; xs: (string | number)[]; series: string[] } {
  const rejected = new Rejections(chart, data.length);
  const pairs = new Set<string>();
  const rows: RankedRow[] = [];
  data.forEach((datum, index) => {
    const rawX = read(keys.x, datum, index);
    const x = typeof rawX === 'number' && Number.isFinite(rawX) ? rawX : text(rawX);
    const series = text(read(keys.series, datum, index));
    if (x === undefined) return rejected.add(accessorName(keys.x, 'x'), index, 'has no x');
    if (series === undefined) return rejected.add(accessorName(keys.series, 'series'), index, 'has no series');
    const value = finite(read(keys.value, datum, index));
    if (value === undefined) return rejected.add(accessorName(keys.value, 'value'), index, 'has no finite value');
    const pair = `${typeof x}:${x}\u0000${series}`;
    if (pairs.has(pair)) return rejected.add(accessorName(keys.series, 'series'), index, 'repeats an (x, series) pair');
    pairs.add(pair);
    rows.push({ x, series, value, index, datum });
  });
  rejected.report();
  return { rows, xs: ordered(rows.map((r) => r.x)), series: ordered(rows.map((r) => r.series)) };
}

// --- §2.18 Estimates -------------------------------------------------------------------------

export interface EstimateRow {
  readonly label: string;
  readonly estimate: number;
  readonly low: number;
  readonly high: number;
  /** The estimate falls outside its own interval: drawn, and warned. */
  readonly outside: boolean;
  readonly index: number;
  readonly datum: Datum;
}

export function readEstimates(
  chart: string,
  data: readonly Datum[],
  keys: { label: Accessor<unknown>; estimate: Accessor<unknown>; low: Accessor<unknown>; high: Accessor<unknown> },
): EstimateRow[] {
  const rejected = new Rejections(chart, data.length);
  const rows: EstimateRow[] = [];
  data.forEach((datum, index) => {
    const label = text(read(keys.label, datum, index)) ?? '';
    const estimate = finite(read(keys.estimate, datum, index));
    let low = finite(read(keys.low, datum, index));
    let high = finite(read(keys.high, datum, index));
    if (estimate === undefined || low === undefined || high === undefined) {
      return rejected.add(accessorName(keys.estimate, 'estimate'), index, 'has no finite estimate and interval');
    }
    if (low > high) {
      rejected.add(accessorName(keys.low, 'low'), index, 'has `low` above `high`, swapped');
      [low, high] = [high, low];
    }
    const outside = estimate < low || estimate > high;
    if (outside) rejected.add(accessorName(keys.estimate, 'estimate'), index, 'has an estimate outside its interval, drawn as given');
    rows.push({ label, estimate, low, high, outside, index, datum });
  });
  rejected.report();
  return rows;
}

// --- §2.19 Intervals -------------------------------------------------------------------------

export interface IntervalRow {
  readonly lane: string;
  /** A number, or whole UTC days since 1970-01-01 on a date axis. */
  readonly start: number;
  readonly end: number;
  readonly label?: string;
  readonly index: number;
  readonly datum: Datum;
}

export function readIntervals(
  chart: string,
  data: readonly Datum[],
  keys: { lane: Accessor<unknown>; start: Accessor<unknown>; end: Accessor<unknown>; label?: Accessor<unknown> },
  axis: 'number' | 'date',
): { rows: IntervalRow[]; lanes: string[] } {
  const rejected = new Rejections(chart, data.length);
  const parse = (raw: unknown) => {
    if (axis === 'date') return typeof raw === 'string' ? finite(parseIsoDate(raw)) : undefined;
    return finite(raw);
  };
  const rows: IntervalRow[] = [];
  data.forEach((datum, index) => {
    const lane = text(read(keys.lane, datum, index));
    if (lane === undefined) return rejected.add(accessorName(keys.lane, 'lane'), index, 'has no lane');
    let start = parse(read(keys.start, datum, index));
    let end = parse(read(keys.end, datum, index));
    if (start === undefined || end === undefined) {
      return rejected.add(accessorName(keys.start, 'start'), index, axis === 'date' ? 'has no ISO start and end' : 'has no finite start and end');
    }
    if (start > end) {
      rejected.add(accessorName(keys.start, 'start'), index, 'starts after it ends, swapped');
      [start, end] = [end, start];
    }
    const label = keys.label === undefined ? undefined : text(read(keys.label, datum, index));
    rows.push(label === undefined ? { lane, start, end, index, datum } : { lane, start, end, label, index, datum });
  });
  rejected.report();
  return { rows, lanes: ordered(rows.map((r) => r.lane)) };
}

// --- §2.20 Likert, WideRows ------------------------------------------------------------------

export interface LikertRow {
  readonly label: string;
  /** One count per level, in level order; a negative or missing count is 0. */
  readonly values: readonly number[];
  /** The values normalised to 100 with `percent`, else the values. */
  readonly shares: readonly number[];
  readonly total: number;
  readonly index: number;
  readonly datum: Datum;
}

export function readLikert(
  chart: string,
  data: readonly Datum[],
  label: Accessor<unknown>,
  levels: readonly string[],
  percent: boolean,
): LikertRow[] {
  const rejected = new Rejections(chart, data.length);
  return withReport(rejected, () =>
    data.map((datum, index) => {
      const values = levels.map((level) => {
        const raw = finite(datum[level]);
        if (raw === undefined || raw < 0) {
          rejected.add(level, index, 'has a negative or missing count, taken as 0');
          return 0;
        }
        return raw;
      });
      const total = values.reduce((sum, v) => sum + v, 0);
      const shares = percent ? values.map((v) => (total > 0 ? (v / total) * 100 : 0)) : values;
      return { label: text(read(label, datum, index)) ?? '', values, shares, total, index, datum };
    }),
  );
}

export interface WideRow {
  readonly label?: string;
  /** One value per dimension, in dimension order. */
  readonly values: readonly number[];
  readonly index: number;
  readonly datum: Datum;
}

export function readWideRows(
  chart: string,
  data: readonly Datum[],
  label: Accessor<unknown> | undefined,
  dimensions: readonly string[],
): WideRow[] {
  const rejected = new Rejections(chart, data.length);
  const rows: WideRow[] = [];
  data.forEach((datum, index) => {
    const values = dimensions.map((dimension) => finite(datum[dimension]));
    const missing = values.findIndex((v) => v === undefined);
    if (missing >= 0) return rejected.add(dimensions[missing] as string, index, 'has no finite value for a dimension');
    const name = label === undefined ? undefined : text(read(label, datum, index));
    rows.push(name === undefined ? { values: values as number[], index, datum } : { label: name, values: values as number[], index, datum });
  });
  rejected.report();
  return rows;
}

// --- §2.21 PathPoints, PolarPoints -----------------------------------------------------------

export interface PathPoint {
  readonly x: number;
  readonly y: number;
  readonly label?: string;
  readonly index: number;
  readonly datum: Datum;
}

/** Points in data order, which is the path's order. */
export function readPathPoints(
  chart: string,
  data: readonly Datum[],
  keys: { x: Accessor<unknown>; y: Accessor<unknown>; label?: Accessor<unknown> },
): PathPoint[] {
  const rejected = new Rejections(chart, data.length);
  const points: PathPoint[] = [];
  data.forEach((datum, index) => {
    const x = finite(read(keys.x, datum, index));
    const y = finite(read(keys.y, datum, index));
    if (x === undefined) return rejected.add(accessorName(keys.x, 'x'), index, 'has no finite x');
    if (y === undefined) return rejected.add(accessorName(keys.y, 'y'), index, 'has no finite y');
    const label = keys.label === undefined ? undefined : text(read(keys.label, datum, index));
    points.push(label === undefined ? { x, y, index, datum } : { x, y, label, index, datum });
  });
  rejected.report();
  return points;
}

/** §2.24's point cloud has the path points' contract, without the order. */
export const readPointCloud = readPathPoints;

export interface PolarPoint {
  /** In `[0, period)`. */
  readonly angle: number;
  readonly value: number;
  readonly size?: number;
  readonly index: number;
  readonly datum: Datum;
}

export function readPolarPoints(
  chart: string,
  data: readonly Datum[],
  keys: { angle: Accessor<unknown>; value: Accessor<unknown>; size?: Accessor<unknown> },
  period: number,
): PolarPoint[] {
  const rejected = new Rejections(chart, data.length);
  const points: PolarPoint[] = [];
  data.forEach((datum, index) => {
    const raw = finite(read(keys.angle, datum, index));
    const value = finite(read(keys.value, datum, index));
    if (raw === undefined) return rejected.add(accessorName(keys.angle, 'angle'), index, 'has no finite angle');
    if (value === undefined || value < 0) return rejected.add(accessorName(keys.value, 'value'), index, 'has no radius at or above 0');
    const angle = ((raw % period) + period) % period;
    const size = keys.size === undefined ? undefined : finite(read(keys.size, datum, index));
    points.push(size === undefined ? { angle, value, index, datum } : { angle, value, size, index, datum });
  });
  rejected.report();
  return points;
}

// --- §2.22 Mosaic ----------------------------------------------------------------------------

export interface Mosaic {
  readonly columns: readonly string[];
  readonly segments: readonly string[];
  /** `values[column][segment]`; a missing pair is 0. */
  readonly values: readonly (readonly number[])[];
  /** The row behind each pair, when there is one. */
  readonly rows: readonly (readonly ({ readonly index: number; readonly datum: Datum } | undefined)[])[];
}

export function readMosaic(
  chart: string,
  data: readonly Datum[],
  keys: { column: Accessor<unknown>; segment: Accessor<unknown>; value: Accessor<unknown> },
): Mosaic {
  const rejected = new Rejections(chart, data.length);
  const cells = new Map<string, { column: string; segment: string; value: number; index: number; datum: Datum }>();
  data.forEach((datum, index) => {
    const column = text(read(keys.column, datum, index));
    const segment = text(read(keys.segment, datum, index));
    if (column === undefined || segment === undefined) return rejected.add(accessorName(keys.column, 'column'), index, 'has no column and segment');
    const value = finite(read(keys.value, datum, index));
    if (value === undefined || value < 0) return rejected.add(accessorName(keys.value, 'value'), index, 'has no value at or above 0');
    const key = `${column}\u0000${segment}`;
    if (cells.has(key)) return rejected.add(accessorName(keys.segment, 'segment'), index, 'repeats a (column, segment) pair');
    cells.set(key, { column, segment, value, index, datum });
  });
  rejected.report();
  const kept = [...cells.values()];
  const columns = ordered(kept.map((c) => c.column));
  const segments = ordered(kept.map((c) => c.segment));
  const cell = (column: string, segment: string) => cells.get(`${column}\u0000${segment}`);
  return {
    columns,
    segments,
    values: columns.map((c) => segments.map((s) => cell(c, s)?.value ?? 0)),
    rows: columns.map((c) => segments.map((s) => {
      const found = cell(c, s);
      return found ? { index: found.index, datum: found.datum } : undefined;
    })),
  };
}

// --- §2.23 Hierarchy -------------------------------------------------------------------------

/** Id of the root added when the data has several (Data Model §2.23). */
export const SYNTHETIC_ROOT = '∅';

export interface HierarchyRow {
  readonly id: string;
  readonly parent: string | null;
  /** A leaf's own value; 0 on internal nodes, whose value is the sum of their children. */
  readonly value: number;
  readonly label: string;
  /** `-1` for the synthetic root. */
  readonly index: number;
  readonly datum: Datum;
}

/**
 * Validates flat `{ id, parent }` rows (REQ-437): duplicate or empty ids, missing parents and
 * cycles are dropped with their descendants, several roots get a synthetic one. `SP020` is raised
 * once, naming the first offending id. Rows keep their input order, the synthetic root first.
 */
export function readHierarchy(
  chart: string,
  data: readonly Datum[],
  keys: { id: Accessor<unknown>; parent: Accessor<unknown>; value?: Accessor<unknown>; label?: Accessor<unknown> },
  rootLabel: string,
): { rows: HierarchyRow[]; root: string | undefined } {
  let offender: { id: string; why: string } | undefined;
  const offend = (id: string, why: string) => {
    offender ??= { id, why };
  };
  const byId = new Map<string, { parent: string | null; index: number; datum: Datum }>();
  data.forEach((datum, index) => {
    const id = text(read(keys.id, datum, index));
    if (id === undefined || id === '') return offend(id ?? '', 'has an empty id');
    if (byId.has(id)) return offend(id, 'repeats an id');
    const rawParent = read(keys.parent, datum, index);
    const parent = rawParent === null || rawParent === undefined ? null : (text(rawParent) ?? null);
    byId.set(id, { parent, index, datum });
  });

  // A row is kept when its chain of parents reaches a root; a missing parent or a cycle never does.
  const reaches = new Map<string, boolean>();
  const resolve = (start: string): boolean => {
    const chain: string[] = [];
    const onChain = new Set<string>();
    let id: string | null = start;
    let verdict = false;
    while (id !== null) {
      const known = reaches.get(id);
      if (known !== undefined) {
        verdict = known;
        break;
      }
      const row = byId.get(id);
      if (!row || onChain.has(id)) break;
      chain.push(id);
      onChain.add(id);
      if (row.parent === null) {
        verdict = true;
        break;
      }
      id = row.parent;
    }
    for (const link of chain) reaches.set(link, verdict);
    return verdict;
  };
  for (const [id, row] of byId) {
    if (resolve(id)) continue;
    const parent = row.parent;
    offend(id, parent !== null && !byId.has(parent) ? `names a parent, "${parent}", that does not exist` : 'is in a cycle or under a dropped row');
  }

  const kept = [...byId].filter(([id]) => reaches.get(id));
  const roots = kept.filter(([, row]) => row.parent === null).map(([id]) => id);
  if (roots.length > 1) offend(roots[1] as string, 'is a second root; a synthetic root holds them all');
  const synthetic = roots.length > 1;
  const children = new Set(kept.map(([, row]) => row.parent).filter((p): p is string => p !== null));

  const valueName = keys.value === undefined ? 'value' : accessorName(keys.value, 'value');
  let badLeaf: { index: number; count: number } | undefined;
  const rows: HierarchyRow[] = kept.map(([id, row]) => {
    let value = 0;
    if (!children.has(id) && keys.value !== undefined) {
      const raw = finite(read(keys.value, row.datum, row.index));
      if (raw === undefined || raw < 0) {
        badLeaf = badLeaf ? { index: badLeaf.index, count: badLeaf.count + 1 } : { index: row.index, count: 1 };
      } else {
        value = raw;
      }
    }
    const label = (keys.label === undefined ? undefined : text(read(keys.label, row.datum, row.index))) ?? id;
    return { id, parent: synthetic && row.parent === null ? SYNTHETIC_ROOT : row.parent, value, label, index: row.index, datum: row.datum };
  });
  if (synthetic) {
    rows.unshift({ id: SYNTHETIC_ROOT, parent: null, value: 0, label: rootLabel, index: -1, datum: Object.freeze({}) });
  }

  if (offender && process.env.NODE_ENV !== 'production') {
    diagnose('SP020', chart, { property: accessorName(keys.id, 'id'), message: `The row "${offender.id}" ${offender.why}.` });
  }
  if (badLeaf) warnValue(chart, valueName, `${badLeaf.count} leaves have no value at or above 0, taken as 0; the first is row ${badLeaf.index}.`);
  return { rows, root: synthetic ? SYNTHETIC_ROOT : roots[0] };
}

// --- §2.24 GridField, VectorField, Network ---------------------------------------------------

export interface Grid<T> {
  /** The distinct x values, ascending. */
  readonly xs: readonly number[];
  /** The distinct y values, ascending. */
  readonly ys: readonly number[];
  /** Row-major, `cells[j * xs.length + i]` at `(xs[i], ys[j])`; `undefined` is a hole. */
  readonly cells: readonly (T | undefined)[];
}

function readCells<T>(
  chart: string,
  data: readonly Datum[],
  keys: { x: Accessor<unknown>; y: Accessor<unknown> },
  cell: (datum: Datum, index: number) => T | undefined,
  property: string,
): Grid<T> {
  const rejected = new Rejections(chart, data.length);
  const found: { x: number; y: number; cell: T }[] = [];
  data.forEach((datum, index) => {
    const x = finite(read(keys.x, datum, index));
    const y = finite(read(keys.y, datum, index));
    if (x === undefined || y === undefined) return rejected.add(accessorName(keys.x, 'x'), index, 'has no finite position');
    const value = cell(datum, index);
    if (value === undefined) return rejected.add(property, index, 'has no finite value, left as a hole');
    found.push({ x, y, cell: value });
  });
  const xs = [...new Set(found.map((f) => f.x))].sort((a, b) => a - b);
  const ys = [...new Set(found.map((f) => f.y))].sort((a, b) => a - b);
  const column = new Map(xs.map((x, i) => [x, i]));
  const row = new Map(ys.map((y, j) => [y, j]));
  const cells: (T | undefined)[] = Array.from({ length: xs.length * ys.length }, () => undefined);
  found.forEach((f, k) => {
    const at = (row.get(f.y) as number) * xs.length + (column.get(f.x) as number);
    if (cells[at] !== undefined) return rejected.add(accessorName(keys.y, 'y'), k, 'repeats a grid cell; the first is kept');
    cells[at] = f.cell;
  });
  rejected.report();
  return { xs, ys, cells };
}

export function readGrid(
  chart: string,
  data: readonly Datum[],
  keys: { x: Accessor<unknown>; y: Accessor<unknown>; value: Accessor<unknown> },
): Grid<number> & { readonly values: readonly (number | undefined)[] } {
  const grid = readCells(chart, data, keys, (datum, index) => finite(read(keys.value, datum, index)), accessorName(keys.value, 'value'));
  return { ...grid, values: grid.cells };
}

export interface Vector {
  readonly u: number;
  readonly v: number;
}

export function readVectorField(
  chart: string,
  data: readonly Datum[],
  keys: { x: Accessor<unknown>; y: Accessor<unknown>; u: Accessor<unknown>; v: Accessor<unknown> },
): Grid<Vector> & { readonly vectors: readonly (Vector | undefined)[] } {
  const grid = readCells(
    chart,
    data,
    keys,
    (datum, index) => {
      const u = finite(read(keys.u, datum, index));
      const v = finite(read(keys.v, datum, index));
      return u === undefined || v === undefined ? undefined : { u, v };
    },
    accessorName(keys.u, 'u'),
  );
  return { ...grid, vectors: grid.cells };
}

export interface NetworkLink {
  readonly source: string;
  readonly target: string;
  readonly value: number;
  readonly index: number;
  readonly datum: Datum;
}

export function readNetwork(
  chart: string,
  data: readonly Datum[],
  keys: { source: Accessor<unknown>; target: Accessor<unknown>; value?: Accessor<unknown> },
  nodes: readonly NetworkNode[] | undefined,
): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const rejected = new Rejections(chart, data.length);
  const given = new Map<string, NetworkNode>();
  let repeated: string | undefined;
  for (const node of nodes ?? []) {
    if (given.has(node.id)) repeated ??= node.id;
    else given.set(node.id, node);
  }
  if (repeated !== undefined) warnValue(chart, 'nodes', `The node "${repeated}" is repeated; the first is kept.`);
  const links: NetworkLink[] = [];
  data.forEach((datum, index) => {
    const source = text(read(keys.source, datum, index));
    const target = text(read(keys.target, datum, index));
    if (source === undefined || target === undefined) return rejected.add(accessorName(keys.source, 'source'), index, 'has no source and target');
    if (nodes !== undefined && (!given.has(source) || !given.has(target))) {
      return rejected.add(accessorName(keys.target, 'target'), index, 'links a node not in `nodes`');
    }
    let value = 1;
    if (keys.value !== undefined) {
      const raw = read(keys.value, datum, index);
      if (raw !== undefined && raw !== null) {
        const parsed = finite(raw);
        if (parsed === undefined || parsed <= 0) return rejected.add(accessorName(keys.value, 'value'), index, 'has no value above 0');
        value = parsed;
      }
    }
    links.push({ source, target, value, index, datum });
  });
  rejected.report();
  const drawn = nodes === undefined ? ordered(links.flatMap((l) => [l.source, l.target])).map((id) => ({ id })) : [...given.values()];
  return { nodes: drawn, links };
}

// --- Statistic parameters (REQ-433, SP021) and small groups (REQ-434, SP022) -----------------

function invalid(chart: string, property: string, raw: unknown): undefined {
  if (process.env.NODE_ENV !== 'production') {
    diagnose('SP021', chart, { property, message: `${JSON.stringify(raw)} is not valid.` });
  }
  return undefined;
}

const increasing = (values: readonly number[]) =>
  values.every((v, i) => Number.isFinite(v) && (i === 0 || v > (values[i - 1] as number)));

/** A bin count `≥ 1`, or at least two increasing thresholds; `undefined` asks for the default. */
export function checkBins(chart: string, bins: number | readonly number[] | undefined): number | readonly number[] | undefined {
  if (bins === undefined) return undefined;
  if (typeof bins === 'number') return Number.isFinite(bins) && bins >= 1 ? Math.floor(bins) : invalid(chart, 'bins', bins);
  return bins.length >= 2 && increasing(bins) ? bins : invalid(chart, 'bins', bins);
}

/** A finite bandwidth above 0, in data units. */
export function checkBandwidth(chart: string, bandwidth: number | undefined): number | undefined {
  if (bandwidth === undefined) return undefined;
  return Number.isFinite(bandwidth) && bandwidth > 0 ? bandwidth : invalid(chart, 'bandwidth', bandwidth);
}

/** A finite whisker multiple at or above 0. */
export function checkWhisker(chart: string, whisker: number | undefined): number | undefined {
  if (whisker === undefined) return undefined;
  return Number.isFinite(whisker) && whisker >= 0 ? whisker : invalid(chart, 'whisker', whisker);
}

/** An overlap in 0-1. */
export function checkOverlap(chart: string, overlap: number | undefined): number | undefined {
  if (overlap === undefined) return undefined;
  return Number.isFinite(overlap) && overlap >= 0 && overlap <= 1 ? overlap : invalid(chart, 'overlap', overlap);
}

/** A whole number of iterations at or above 0. */
export function checkIterations(chart: string, iterations: number | undefined): number | undefined {
  if (iterations === undefined) return undefined;
  return Number.isInteger(iterations) && iterations >= 0 ? iterations : invalid(chart, 'iterations', iterations);
}

/** A level count `≥ 1`, or increasing thresholds. */
export function checkLevels(chart: string, levels: number | readonly number[] | undefined): number | readonly number[] | undefined {
  if (levels === undefined) return undefined;
  if (typeof levels === 'number') return Number.isInteger(levels) && levels >= 1 ? levels : invalid(chart, 'levels', levels);
  return levels.length >= 1 && increasing(levels) ? levels : invalid(chart, 'levels', levels);
}

/** Quantiles, each in 0-1, to mark on an ECDF. */
export function checkQuantiles(chart: string, markers: readonly number[] | undefined): readonly number[] | undefined {
  if (markers === undefined) return undefined;
  return markers.every((m) => Number.isFinite(m) && m >= 0 && m <= 1) ? markers : invalid(chart, 'markers', markers);
}

/** A finite point radius above 0, in px. */
export function checkRadius(chart: string, radius: number | undefined): number | undefined {
  if (radius === undefined) return undefined;
  return Number.isFinite(radius) && radius > 0 ? radius : invalid(chart, 'radius', radius);
}

/** A group below its statistic's minimum is drawn as points (REQ-434). */
export function warnTooSmall(chart: string, group: string, count: number, need: number): void {
  if (process.env.NODE_ENV !== 'production') {
    diagnose('SP022', chart, { property: 'group', message: `The group "${group}" has ${count} observations; its statistic needs ${need}.` });
  }
}

// --- Volume (REQ-443, SP008) -----------------------------------------------------------------

/** The second catalog's volume ceilings (API Spec §12). */
export const CEILINGS = /* @__PURE__ */ Object.freeze({
  /** Observations of a binned or density chart. */
  observations: 10_000,
  /** Drawn points: beeswarm, polar scatter, connected scatter, Delaunay. */
  points: 500,
  intervals: 200,
  /** Hierarchy nodes. */
  nodes: 500,
  networkNodes: 150,
  links: 600,
  /** Field grid cells, 60 × 60. */
  gridCells: 3_600,
});

/** Warns SP008 above the family's ceiling; the chart is still drawn in full (REQ-443). */
export function checkCeiling(chart: string, property: string, family: keyof typeof CEILINGS, count: number): void {
  if (process.env.NODE_ENV === 'production' || count <= CEILINGS[family]) return;
  diagnose('SP008', chart, { property, message: `${count} ${family}; the ceiling is ${CEILINGS[family]}.` });
}

function withReport<T>(rejected: Rejections, build: () => T): T {
  const result = build();
  rejected.report();
  return result;
}
