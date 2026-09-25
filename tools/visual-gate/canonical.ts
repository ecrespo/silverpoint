/**
 * Writes the fixture matrix and its canonical renders.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate canonical
 *
 * Regenerating a canonical file changes the normalised SVG output, which is never a patch
 * (API Spec §13): commit it deliberately, with a changeset that says so.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CATALOG } from './catalog';
import { canonicalFor, FIXTURES_DIR, fixtureId, SIZES, type Fixture } from './fixtures';

/** The card each chart's fixtures draw around its demo dataset. */
const CARDS: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  LineChart: { title: 'Throughput per hour', badge: 'Live', value: 88, unit: 'requests', footerLeft: '00–22 h', footerRight: 'silverpoint' },
  BulletChart: { title: 'Quarter targets', badge: 'Q2', footerLeft: '0–100', footerRight: 'silverpoint' },
  PyramidChart: { title: 'Headcount by level', badge: '2026', footerLeft: 'width in %', footerRight: 'silverpoint' },
  HeatmapChart: { title: 'Load by weekday', badge: 'Week 26', footerLeft: 'of 100', footerRight: 'silverpoint' },
  TreemapChart: { title: 'Traffic sources', badge: 'June', footerLeft: 'share of visits', footerRight: 'silverpoint' },
  SankeyChart: { title: 'Visitor flow', badge: 'June', footerLeft: 'visits', footerRight: 'silverpoint' },
  ActivityGrid: { title: 'Contributions', badge: '26 weeks', footerLeft: 'Jan–Jun 2026', footerRight: 'silverpoint' },
  StepChart: { title: 'Price tier', badge: '2026', footerLeft: 'per month', footerRight: 'silverpoint' },
  SparklineRows: { title: 'Service health', badge: 'Live', footerLeft: 'last 8 checks', footerRight: 'silverpoint' },
  KpiCard: { title: 'Orders', badge: '14 days', footerLeft: 'daily', footerRight: 'silverpoint' },
  BarChart: { title: 'Orders per quarter', badge: 'vs 2025', footerLeft: 'thousands', footerRight: 'silverpoint' },
  StackedBarChart: { title: 'Signups by plan', badge: 'H1', footerLeft: 'per month', footerRight: 'silverpoint' },
  ComposedChart: { title: 'Revenue and margin', badge: 'H1', footerLeft: 'k€', footerRight: 'silverpoint' },
  WaterfallChart: { title: 'Cash bridge', badge: 'Q2', footerLeft: 'k€', footerRight: 'silverpoint' },
  FunnelChart: { title: 'Checkout funnel', badge: 'June', footerLeft: 'sessions', footerRight: 'silverpoint' },
  CandlestickChart: { title: 'Share price', badge: '2 weeks', footerLeft: 'daily OHLC', footerRight: 'silverpoint' },
  AreaChart: { title: 'Sessions', badge: 'Week 26', footerLeft: 'per day', footerRight: 'silverpoint' },
  RangeBandChart: { title: 'Temperature', badge: '°C', footerLeft: 'daily range', footerRight: 'silverpoint' },
  StreamChart: { title: 'Traffic sources', badge: 'Week 26', footerLeft: 'thousands', footerRight: 'silverpoint' },
  ScatterChart: { title: 'Height and weight', badge: 'n = 9', footerLeft: 'cm × kg', footerRight: 'silverpoint' },
  BubbleChart: { title: 'Markets', badge: '2026', footerLeft: 'growth × margin', footerRight: 'silverpoint' },
  DonutChart: { title: 'Budget', badge: 'May', footerLeft: 'share of spend', footerRight: 'silverpoint' },
  RadarChart: { title: 'Model scores', badge: 'v2', footerLeft: 'out of 10', footerRight: 'silverpoint' },
  PolarBarChart: { title: 'Monthly sales', badge: '2025', footerLeft: 'thousands', footerRight: 'silverpoint' },
  RadialArcGroup: { title: 'Pipeline', badge: 'Q3', footerLeft: 'by channel', footerRight: 'silverpoint' },
  RadialRings: { title: 'Daily goals', badge: 'today', footerLeft: 'percent reached', footerRight: 'silverpoint' },
  GaugeArc: { title: 'Capacity', badge: 'live', footerLeft: 'of the cluster', footerRight: 'silverpoint' },
  MeterChart: { title: 'Pressure', badge: 'now', footerLeft: 'of the rated maximum', footerRight: 'silverpoint' },
  CoxcombChart: { title: 'Tickets', badge: 'week', footerLeft: 'by weekday', footerRight: 'silverpoint' },
  WindRose: { title: 'Wind at DSM', badge: 'Mar 2024', footerLeft: 'knots, hourly METAR', footerRight: 'silverpoint' },
  VolvelleChart: { title: 'On call', badge: 'rota', footerLeft: 'day · shift · team', footerRight: 'silverpoint' },
  ChordRing: { title: 'Site journeys', badge: 'June', footerLeft: 'visitors between sections', footerRight: 'silverpoint' },
  OrbitChart: { title: 'Releases', badge: '3 years', footerLeft: 'by day of the year', footerRight: 'silverpoint' },
};

/**
 * The nightly matrix: every catalog chart × 2 modes × 4 substrates × 2 `hatchFill` × 3 sizes =
 * 1,584 cells; its `md` + `tile` slice is the PR matrix (Data Model §5).
 */
function matrix(): Fixture[] {
  const fixtures: Fixture[] = [];
  for (const { chart, req, slug } of CATALOG) {
    for (const size of [SIZES.sm, SIZES.md, SIZES.lg]) {
      for (const hatchFill of ['tile', 'per-shape'] as const) {
        for (const mode of ['ink', 'precision'] as const) {
          for (const substrate of ['cream', 'green', 'blue', 'ochre']) {
            const cell = { chart, ground: 'silverpoint', substrate, mode, hatchFill, size } as const;
            const id = fixtureId(cell);
            fixtures.push({
              ...cell,
              id,
              req,
              seed: 1592,
              props: CARDS[chart] ?? {},
              data: null,
              canonical: `${slug}/${id}.canonical.txt`,
            });
          }
        }
      }
    }
  }
  return fixtures;
}

const fixtures = matrix();
for (const fixture of fixtures) {
  const json = join(FIXTURES_DIR, dirname(fixture.canonical), `${fixture.id}.fixture.json`);
  mkdirSync(dirname(json), { recursive: true });
  writeFileSync(json, `${JSON.stringify(fixture, null, 2)}\n`);
  writeFileSync(join(FIXTURES_DIR, fixture.canonical), canonicalFor(fixture));
  console.log(`wrote ${fixture.id}`);
}

// The example apps read the matrix from a generated module: no filesystem access in a browser.
const harness = fileURLToPath(new URL('../../examples/harness/fixtures.generated.js', import.meta.url));
const embedded = [...fixtures]
  .sort((a, b) => (a.id < b.id ? -1 : 1))
  .map(({ canonical: _canonical, data, ...fixture }) => ({
    ...fixture,
    rows: data === null ? null : JSON.parse(readFileSync(join(FIXTURES_DIR, data), 'utf8')),
  }));
writeFileSync(
  harness,
  `// Generated by tools/visual-gate/canonical.ts — do not edit.\nexport const ALL_FIXTURES = ${JSON.stringify(embedded, null, 2)};\n`,
);
console.log(`wrote ${harness}`);
