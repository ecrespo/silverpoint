/**
 * Writes the demo modules of the second catalog (T-167, REQ-446): one
 * `packages/core/src/charts/<slug>/demo.ts` per chart, the datasets printed as frozen literals.
 * Run once and commit the output; `demo-gen.test.ts` proves a rerun reproduces it byte for byte.
 *
 *   pnpm --filter @silverpoint/demo-gen generate
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as gen from './generators';
import type { Row } from './generators';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

type KeyValue = string | number | readonly string[];

/** A dataset printed in this file. */
interface Literal {
  readonly kind: 'literal';
  readonly name: string;
  readonly doc: string;
  readonly rows: readonly Row[];
  readonly type?: 'Datum' | 'NetworkNode';
  /**
   * A regular grid of `{ x, y, value }`, `x` the column and `y` the row, row by row: printed as its
   * values alone, the positions implied, so a 1 200-cell field weighs a fifth as much (REQ-164).
   */
  readonly columns?: number;
}
/** A dataset another chart's demo already holds, re-exported under this chart's name. */
interface Reexport {
  readonly kind: 'reexport';
  readonly name: string;
  readonly doc: string;
  readonly from: string;
  readonly source: string;
}
/** The accessor keys a recipe reads the demo with (REQ-098). */
interface Keys {
  readonly kind: 'keys';
  readonly name: string;
  readonly keys: Readonly<Record<string, KeyValue>>;
}
export interface DemoFile {
  readonly slug: string;
  readonly exports: readonly (Literal | Reexport | Keys)[];
}

const constant = (slug: string) => slug.toUpperCase().replace(/-/g, '_');

const readingTimes = gen.readingTimes();
const serviceTimes = gen.serviceTimes();
const clinicWaits = gen.clinicWaits();
const cityBudget = gen.cityBudget();
const twoClusters = gen.twoClusters();
const network = gen.network();

const literal = (slug: string, doc: string, rows: readonly Row[], type?: Literal['type']): Literal => ({ kind: 'literal', name: `${constant(slug)}_DEMO`, doc, rows, ...(type ? { type } : {}) });
const reexport = (slug: string, doc: string, from: string): Reexport => ({ kind: 'reexport', name: `${constant(slug)}_DEMO`, doc, from, source: `${constant(from)}_DEMO` });
const keys = (slug: string, values: Keys['keys'], suffix = 'DEMO_KEYS'): Keys => ({ kind: 'keys', name: `${constant(slug)}_${suffix}`, keys: values });

const HIERARCHY_KEYS = { idKey: 'id', parentKey: 'parent', labelKey: 'name', valueKey: 'amount' } as const;
const BUDGET = 'a fictional city budget: a root, 5 departments, 16 programmes and 16 budget lines, values on the 24 leaves';
const SERVICES = 'response times in ms of five services, 24 to 60 each: one bimodal, one with outliers';

export const DEMO_FILES: readonly DemoFile[] = [
  { slug: 'histogram-chart', exports: [literal('histogram-chart', '`HistogramChart` (REQ-400): 240 right-skewed reading times in minutes, rounded to half minutes so values tie', readingTimes), keys('histogram-chart', { valueKey: 'minutes' })] },
  { slug: 'ecdf-chart', exports: [reexport('ecdf-chart', '`EcdfChart` (REQ-401): the histogram\'s reading times, by device', 'histogram-chart'), keys('ecdf-chart', { valueKey: 'minutes', groupKey: 'device' })] },
  { slug: 'beeswarm-chart', exports: [reexport('beeswarm-chart', '`BeeswarmChart` (REQ-405): the histogram\'s reading times, one point per reader', 'histogram-chart'), keys('beeswarm-chart', { valueKey: 'minutes', labelKey: 'reader' })] },
  { slug: 'box-plot-chart', exports: [literal('box-plot-chart', `\`BoxPlotChart\` (REQ-402): ${SERVICES}`, serviceTimes), keys('box-plot-chart', { valueKey: 'ms', groupKey: 'service' })] },
  { slug: 'violin-chart', exports: [reexport('violin-chart', '`ViolinChart` (REQ-403): the box plot\'s service response times', 'box-plot-chart'), keys('violin-chart', { valueKey: 'ms', groupKey: 'service' })] },
  { slug: 'ridgeline-chart', exports: [reexport('ridgeline-chart', '`RidgelineChart` (REQ-404): the box plot\'s service response times', 'box-plot-chart'), keys('ridgeline-chart', { valueKey: 'ms', groupKey: 'service' })] },
  { slug: 'lollipop-chart', exports: [literal('lollipop-chart', '`LollipopChart` (REQ-406): loans at 12 library branches, unsorted, some names long', gen.branchLoans()), keys('lollipop-chart', { xKey: 'branch', valueKey: 'loans' })] },
  { slug: 'dumbbell-chart', exports: [literal('dumbbell-chart', '`DumbbellChart` (REQ-407): average wait in minutes at 10 clinics, 2024 and 2025; two of them improve', clinicWaits), keys('dumbbell-chart', { labelKey: 'clinic', startKey: 'y2024', endKey: 'y2025', names: ['2024', '2025'] })] },
  { slug: 'slope-chart', exports: [reexport('slope-chart', '`SlopeChart` (REQ-408): the dumbbell\'s clinic waits', 'dumbbell-chart'), keys('slope-chart', { labelKey: 'clinic', startKey: 'y2024', endKey: 'y2025', names: ['2024', '2025'] })] },
  { slug: 'bump-chart', exports: [literal('bump-chart', '`BumpChart` (REQ-409): six teams\' points over eight seasons, with one tie', gen.seasonPoints()), keys('bump-chart', { xKey: 'season', seriesKey: 'team', valueKey: 'points' })] },
  { slug: 'error-bar-chart', exports: [literal('error-bar-chart', '`ErrorBarChart` (REQ-410): eight effect estimates with asymmetric intervals, read against 0', gen.effects()), keys('error-bar-chart', { labelKey: 'arm', estimateKey: 'effect', lowKey: 'low', highKey: 'high' })] },
  { slug: 'interval-chart', exports: [literal('interval-chart', '`IntervalChart` (REQ-411): four crews\' jobs over the first quarter of 2026, ISO dates in UTC, some overlapping', gen.crewJobs()), keys('interval-chart', { laneKey: 'crew', startKey: 'from', endKey: 'to', labelKey: 'task', axis: 'date' })] },
  { slug: 'diverging-bar-chart', exports: [literal('diverging-bar-chart', '`DivergingBarChart` (REQ-412): 200 answers to each of six questions on a five-level scale', gen.survey()), keys('diverging-bar-chart', { labelKey: 'question', levels: [...gen.LIKERT_LEVELS] })] },
  { slug: 'connected-scatter-chart', exports: [literal('connected-scatter-chart', '`ConnectedScatterChart` (REQ-413): fare and riders over 14 years, the path crossing itself once', gen.fareRiders()), keys('connected-scatter-chart', { xKey: 'fare', yKey: 'riders', labelKey: 'year' })] },
  { slug: 'waffle-chart', exports: [literal('waffle-chart', '`WaffleChart` (REQ-414): 1 000 kWh of household energy in five uses', gen.energyUse()), keys('waffle-chart', { nameKey: 'use', valueKey: 'kwh' })] },
  { slug: 'marimekko-chart', exports: [literal('marimekko-chart', '`MarimekkoChart` (REQ-415): sales by region and channel, columns of unequal totals', gen.regionSales()), keys('marimekko-chart', { columnKey: 'region', segmentKey: 'channel', valueKey: 'sales' })] },
  { slug: 'squarified-treemap', exports: [literal('squarified-treemap', `\`SquarifiedTreemap\` (REQ-416): ${BUDGET}`, cityBudget), keys('squarified-treemap', HIERARCHY_KEYS)] },
  { slug: 'sunburst-chart', exports: [reexport('sunburst-chart', '`SunburstChart` (REQ-417): the treemap\'s city budget', 'squarified-treemap'), keys('sunburst-chart', HIERARCHY_KEYS)] },
  { slug: 'tree-chart', exports: [reexport('tree-chart', '`TreeChart` (REQ-418): the treemap\'s city budget', 'squarified-treemap'), keys('tree-chart', HIERARCHY_KEYS)] },
  { slug: 'parallel-coordinates-chart', exports: [literal('parallel-coordinates-chart', '`ParallelCoordinatesChart` (REQ-419): 30 bicycles on five dimensions of very different scales', gen.bicycles()), keys('parallel-coordinates-chart', { labelKey: 'model', dimensions: [...gen.BIKE_DIMENSIONS] })] },
  { slug: 'polar-line-chart', exports: [literal('polar-line-chart', '`PolarLineChart` (REQ-420): rainfall in mm by month, 0 to 11, closed over `period: 12`', gen.monthlyRain()), keys('polar-line-chart', { angleKey: 'month', valueKey: 'rain', period: 12 })] },
  { slug: 'polar-scatter-chart', exports: [literal('polar-scatter-chart', '`PolarScatterChart` (REQ-421): 150 sightings by bearing in degrees and distance in km, one cluster across north', gen.sightings()), keys('polar-scatter-chart', { angleKey: 'bearing', radiusKey: 'distance' })] },
  { slug: 'density-bin-chart', exports: [literal('density-bin-chart', '`DensityBinChart` (REQ-422): 1 200 points from two overlapping clusters', twoClusters), keys('density-bin-chart', { xKey: 'x', yKey: 'y' })] },
  {
    slug: 'contour-chart',
    exports: [
      reexport('contour-chart', '`ContourChart` (REQ-423), `source: \'points\'`: the density bins\' two clusters', 'density-bin-chart'),
      keys('contour-chart', { xKey: 'x', yKey: 'y' }),
      { ...literal('contour-chart', '`ContourChart` (REQ-423), `source: \'grid\'`: a smooth surface of two hills and a pit on a 40 × 30 grid', gen.surface()), name: 'CONTOUR_CHART_GRID_DEMO', columns: 40 },
      keys('contour-chart', { xKey: 'x', yKey: 'y', valueKey: 'value' }, 'GRID_DEMO_KEYS'),
    ],
  },
  { slug: 'delaunay-chart', exports: [literal('delaunay-chart', '`DelaunayChart` (REQ-424): 60 distinct labelled points', gen.scatterPoints()), keys('delaunay-chart', { xKey: 'x', yKey: 'y', labelKey: 'label' })] },
  { slug: 'vector-field-chart', exports: [literal('vector-field-chart', '`VectorFieldChart` (REQ-425): a vortex on a 20 × 14 grid, its speed falling off with distance', gen.vortex()), keys('vector-field-chart', { xKey: 'x', yKey: 'y', uKey: 'u', vKey: 'v' })] },
  {
    slug: 'network-chart',
    exports: [
      literal('network-chart', '`NetworkChart` (REQ-426): 90 links between 40 people in four teams, most within a team', network.links),
      { ...literal('network-chart', '`NetworkChart` (REQ-426): its 40 nodes, in four groups', network.nodes, 'NetworkNode'), name: 'NETWORK_CHART_DEMO_NODES' },
      keys('network-chart', { sourceKey: 'source', targetKey: 'target', valueKey: 'weight' }),
    ],
  },
];

export const demoPath = (slug: string) => join(ROOT, 'packages/core/src/charts', slug, 'demo.ts');

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const quote = (text: string) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const key = (name: string) => (IDENTIFIER.test(name) ? name : quote(name));
const value = (v: string | number | null) => (v === null ? 'null' : typeof v === 'number' ? String(v) : quote(v));
const row = (r: Row) => `{ ${Object.entries(r).map(([k, v]) => `${key(k)}: ${value(v)}`).join(', ')} }`;
const keyValue = (v: KeyValue) => (Array.isArray(v) ? `/* @__PURE__ */ Object.freeze([${(v as readonly string[]).map(quote).join(', ')}])` : value(v as string | number));

/** A grid's values, ten to a line; it throws unless the rows are that grid, in that order. */
function gridValues(rows: readonly Row[], columns: number): string[] {
  const values = rows.map((r, k) => {
    if (Object.keys(r).join() !== 'x,y,value' || r.x !== k % columns || r.y !== Math.floor(k / columns) || typeof r.value !== 'number') {
      throw new Error(`Row ${k} is not cell ${k} of a ${columns}-column grid.`);
    }
    return String(r.value);
  });
  const lines: string[] = [];
  for (let k = 0; k < values.length; k += 10) lines.push(`    ${values.slice(k, k + 10).join(', ')},`);
  return lines;
}

/** The source of one demo module. */
export function renderDemoFile(file: DemoFile): string {
  const types = [...new Set(file.exports.flatMap((e) => (e.kind === 'literal' ? [e.type ?? 'Datum'] : [])))].sort();
  const out = ['// Generated by tools/demo-gen (T-167, REQ-446): synthetic, original, frozen. Do not edit by hand.', ''];
  if (types.length > 0) out.push(`import type { ${types.join(', ')} } from '../../types';`, '');
  for (const e of file.exports) {
    if (e.kind === 'reexport') {
      out.push(`/** Demo dataset of ${e.doc}. */`, `export { ${e.source} as ${e.name} } from '../${e.from}/demo';`, '');
    } else if (e.kind === 'literal' && e.columns !== undefined) {
      out.push(
        `/** Demo dataset of ${e.doc}. Its values row by row, ${e.columns} to a row; a row is \`{ x, y, value }\`, \`x\` the column and \`y\` the row. Part of the stable surface: changing it is never a patch (Data Model §4). */`,
        `export const ${e.name}: readonly ${e.type ?? 'Datum'}[] = /* @__PURE__ */ Object.freeze(`,
        '  /* @__PURE__ */ [',
        ...gridValues(e.rows, e.columns),
        `  ].map((value, k) => Object.freeze({ x: k % ${e.columns}, y: Math.floor(k / ${e.columns}), value })),`,
        ');',
        '',
      );
    } else if (e.kind === 'literal') {
      out.push(
        `/** Demo dataset of ${e.doc}. Part of the stable surface: changing it is never a patch (Data Model §4). */`,
        `export const ${e.name}: readonly ${e.type ?? 'Datum'}[] = /* @__PURE__ */ Object.freeze(`,
        '  /* @__PURE__ */ [',
        ...e.rows.map((r) => `    ${row(r)},`),
        '  ].map((row) => Object.freeze(row)),',
        ');',
        '',
      );
    } else {
      out.push(
        `export const ${e.name} = /* @__PURE__ */ Object.freeze({`,
        ...Object.entries(e.keys).map(([k, v]) => `  ${key(k)}: ${keyValue(v)},`),
        '} as const);',
        '',
      );
    }
  }
  return out.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const file of DEMO_FILES) {
    const path = demoPath(file.slug);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, renderDemoFile(file));
  }
  console.log(`Wrote ${DEMO_FILES.length} demo modules.`);
}
