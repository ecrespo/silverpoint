import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';
import { CATALOG } from '../../../tools/visual-gate/catalog';
import {
  __setDiagnosticSink,
  cellChartBox,
  DASHBOARD_DEFAULTS,
  dashboardView,
  inCell,
  linkedItems,
  barChart,
  kpiCard,
  lineChart,
  perBreakpoint,
  resolveDashboard,
  resolveLayout,
  type ChartRecipe,
  type CommonChartProps,
  type DashboardLayout,
  type DashboardProps,
  type RecipeContext,
  type SpCode,
} from '../src';
import * as core from '../src';
import { DASHBOARD_DEMOS } from '../src/dashboard-demos';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): { code: SpCode; message: string }[] {
  const seen: { code: SpCode; message: string }[] = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}
const codes = (seen: { code: SpCode }[]) => seen.map((d) => d.code);

/**
 * Feature-001, Phase 5a. T-106: the layout types and their defaults (API Spec §3, Data Model §2.13).
 */
const root = fileURLToPath(new URL('..', import.meta.url));
const repo = fileURLToPath(new URL('../../..', import.meta.url));

/** Runs tsc on a snippet placed in a scratch directory inside the package; '' when it compiles. */
function typeErrors(snippet: string): string {
  const dir = mkdtempSync(join(root, 'test/.types-'));
  try {
    writeFileSync(join(dir, 'use.ts'), `import type { DashboardProps } from '../../src';\n${snippet}\n`);
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ extends: '../../tsconfig.json', include: ['use.ts'] }));
    try {
      execFileSync(join(repo, 'node_modules/.bin/tsc'), ['--noEmit', '-p', join(dir, 'tsconfig.json')], { encoding: 'utf8' });
      return '';
    } catch (error) {
      return String((error as { stdout?: string }).stdout ?? error);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The layout of API Spec §8's example. */
const OPS: DashboardLayout = {
  columns: { sm: 1, md: 2, lg: 4 },
  cells: [
    { id: 'revenue' },
    { id: 'users' },
    { id: 'churn' },
    { id: 'nps' },
    { id: 'traffic', colSpan: { md: 2, lg: 3 }, rowSpan: 2 },
    { id: 'errors' },
  ],
};

describe('dashboard layout defaults (T-106)', () => {
  test('REQ-208 · without a layout: 1 column at sm, 2 at md, 4 at lg; row unit 240, gap 16', () => {
    const layout = resolveLayout(undefined);
    expect(layout.columns).toEqual({ sm: 1, md: 2, lg: 4 });
    expect(layout.rowHeight).toBe(240);
    expect(layout.gap).toBe(16);
    // No layout cells: every child is placed in source order, span 1 (Data Model §2.13, rule 3).
    expect(layout.cells).toEqual([]);
    expect(resolveLayout({})).toEqual(layout);
  });

  test('REQ-208 · the documented defaults, frozen', () => {
    expect(DASHBOARD_DEFAULTS).toEqual({ columns: { sm: 1, md: 2, lg: 4 }, rowHeight: 240, gap: 16, span: 1, headingLevel: 2, ssrWidth: 1200 });
    expect(Object.isFrozen(DASHBOARD_DEFAULTS)).toBe(true);
    expect(Object.isFrozen(DASHBOARD_DEFAULTS.columns)).toBe(true);
  });

  test('REQ-201 · a bare number applies to all three breakpoints; a partial record keeps the other defaults', () => {
    expect(perBreakpoint(3, { sm: 1, md: 2, lg: 4 })).toEqual({ sm: 3, md: 3, lg: 3 });
    expect(perBreakpoint({ md: 3 }, { sm: 1, md: 2, lg: 4 })).toEqual({ sm: 1, md: 3, lg: 4 });
    expect(perBreakpoint(undefined, { sm: 1, md: 2, lg: 4 })).toEqual({ sm: 1, md: 2, lg: 4 });
    expect(resolveLayout({ columns: 3 }).columns).toEqual({ sm: 3, md: 3, lg: 3 });
    expect(resolveLayout({ columns: { lg: 6 } }).columns).toEqual({ sm: 1, md: 2, lg: 6 });
  });

  test('REQ-208 · REQ-203 · layout cells keep their order; a span is 1 unless given, a bare span applies everywhere', () => {
    const { cells } = resolveLayout(OPS);
    expect(cells.map((c) => c.id)).toEqual(['revenue', 'users', 'churn', 'nps', 'traffic', 'errors']);
    expect(cells[0]!.span).toEqual({ sm: { col: 1, row: 1 }, md: { col: 1, row: 1 }, lg: { col: 1, row: 1 } });
    expect(cells[4]!.span).toEqual({ sm: { col: 1, row: 2 }, md: { col: 2, row: 2 }, lg: { col: 3, row: 2 } });
  });

  test('REQ-201 · I-10 · the layout and its resolution are plain data: they survive JSON unchanged', () => {
    expect(JSON.parse(JSON.stringify(OPS))).toEqual(OPS);
    const resolved = resolveLayout(OPS);
    expect(JSON.parse(JSON.stringify(resolved))).toEqual(resolved);
  });

  test('REQ-201 · I-10 · resolving is pure: same layout, deep-equal result; the input is not touched', () => {
    const before = JSON.stringify(OPS);
    expect(resolveLayout(OPS)).toEqual(resolveLayout(OPS));
    expect(JSON.stringify(OPS)).toBe(before);
  });
});

describe('DashboardProps names the region (T-106)', () => {
  test('REQ-214 · a dashboard with a title, or with a label, compiles', () => {
    expect(typeErrors(`const a: DashboardProps = { id: 'ops', title: 'Operations' };\nconst b: DashboardProps = { id: 'ops', label: 'Operations' };\nvoid a; void b;`)).toBe('');
  }, 60_000);

  test('REQ-214 · a dashboard with neither title nor label is a type error', () => {
    expect(typeErrors(`const c: DashboardProps = { id: 'ops' };\nvoid c;`)).toMatch(/error TS/);
  }, 60_000);

  test('REQ-209 · a dashboard without an id is a type error', () => {
    expect(typeErrors(`const d: DashboardProps = { title: 'Operations' };\nvoid d;`)).toMatch(/error TS.*id/s);
  }, 60_000);
});

const ops = (layout?: DashboardLayout, extra: Partial<DashboardProps> = {}): DashboardProps => ({ id: 'ops', title: 'Operations', layout, ...extra }) as DashboardProps;
// Spans per breakpoint: a bare 2 would also apply at sm, which has 1 column, and warn SP014 there.
const ABC: DashboardLayout = { cells: [{ id: 'a' }, { id: 'b', colSpan: { md: 2, lg: 2 } }, { id: 'c' }] };

describe('resolveDashboard: matching children to cells (T-107)', () => {
  test('REQ-208 · without a layout every child is placed in source order, span 1 everywhere', () => {
    const seen = capture();
    const model = resolveDashboard(ops(), [undefined, undefined, undefined]);
    expect(model.cells.map((c) => c.child)).toEqual([0, 1, 2]);
    for (const cell of model.cells) expect(cell.span).toEqual({ sm: { col: 1, row: 1 }, md: { col: 1, row: 1 }, lg: { col: 1, row: 1 } });
    expect(seen).toEqual([]);
  });

  test('REQ-205 · REQ-203 · rules 1-2: matched children take their cell and follow the layout order', () => {
    const seen = capture();
    const model = resolveDashboard(ops(ABC), ['c', 'a', 'b']);
    expect(model.cells.map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(model.cells.map((c) => c.child)).toEqual([1, 2, 0]);
    expect(model.cells[1]!.span.lg.col).toBe(2);
    expect(seen).toEqual([]);
  });

  test('REQ-205 · rule 3: a child with no cell, or an unknown one, follows in source order with span 1; unknown warns SP015', () => {
    const seen = capture();
    const model = resolveDashboard(ops(ABC), ['c', undefined, 'a', 'zzz', 'b']);
    expect(model.cells.map((c) => c.child)).toEqual([2, 4, 0, 1, 3]);
    expect(model.cells[4]!.span.lg).toEqual({ col: 1, row: 1 });
    expect(codes(seen)).toEqual(['SP015']);
    expect(seen[0]!.message).toContain('zzz');
  });

  test('REQ-205 · rule 4: a layout cell with no child is dropped, leaving no hole, with SP015', () => {
    const seen = capture();
    const model = resolveDashboard(ops(ABC), ['a', 'c']);
    expect(model.cells.map((c) => c.id)).toEqual(['a', 'c']);
    expect(codes(seen)).toEqual(['SP015']);
    expect(seen[0]!.message).toContain('"b"');
  });

  test('REQ-205 · duplicate ids warn SP015 and never throw: the later layout cell is ignored, the later child unplaced', () => {
    const seen = capture();
    const layout: DashboardLayout = { cells: [{ id: 'a', colSpan: { lg: 2 } }, { id: 'a', colSpan: { lg: 3 } }] };
    let model!: ReturnType<typeof resolveDashboard>;
    expect(() => (model = resolveDashboard(ops(layout), ['a', 'a']))).not.toThrow();
    expect(model.cells.map((c) => c.child)).toEqual([0, 1]);
    expect(model.cells[0]!.span.lg.col).toBe(2);
    expect(model.cells[1]!.span.lg.col).toBe(1);
    expect(codes(seen)).toEqual(['SP015', 'SP015']);
  });
});

describe('resolveDashboard: spans, numbers and ids (T-107)', () => {
  test('REQ-204 · a span wider than a breakpoint is clamped to its columns, with SP014 naming the breakpoint', () => {
    const seen = capture();
    const model = resolveDashboard(ops({ cells: [{ id: 'wide', colSpan: 5 }] }), ['wide']);
    expect(model.cells[0]!.span).toEqual({ sm: { col: 1, row: 1 }, md: { col: 2, row: 1 }, lg: { col: 4, row: 1 } });
    expect(codes(seen)).toEqual(['SP014', 'SP014', 'SP014']);
    expect(seen.map((d) => d.message).join(' ')).toMatch(/lg.*4/);
  });

  test('REQ-204 · I-12 · for every cell and breakpoint, 1 ≤ span.col ≤ columns', () => {
    capture();
    const spans = [0, 1, 2, 3, 5, 9, 1.5, -2, Number.NaN];
    for (const columns of [1, 2, 3, 4, 6, 12]) {
      const layout: DashboardLayout = { columns: { sm: 1, md: Math.min(columns, 2), lg: columns }, cells: spans.map((n, i) => ({ id: `c${i}`, colSpan: { sm: n, md: n, lg: n } })) };
      const model = resolveDashboard(ops(layout), spans.map((_, i) => `c${i}`));
      const resolved = resolveLayout(layout).columns;
      for (const cell of model.cells) {
        for (const bp of ['sm', 'md', 'lg'] as const) {
          expect(cell.span[bp].col).toBeGreaterThanOrEqual(1);
          expect(cell.span[bp].col).toBeLessThanOrEqual(resolved[bp]);
          expect(Number.isInteger(cell.span[bp].col)).toBe(true);
        }
      }
    }
  });

  test('REQ-008 · invalid numbers fall back to their defaults with SP002', () => {
    const seen = capture();
    const layout = resolveLayout({ columns: { sm: 0, md: 2.5, lg: 13 }, rowHeight: -1, gap: Number.NaN, cells: [{ id: 'x', colSpan: 0, rowSpan: 9 }, { id: 'y', colSpan: 1.5, rowSpan: 0 }] });
    expect(layout.columns).toEqual({ sm: 1, md: 2, lg: 4 });
    expect(layout.rowHeight).toBe(240);
    expect(layout.gap).toBe(16);
    expect(layout.cells[0]!.span.lg).toEqual({ col: 1, row: 6 });
    expect(layout.cells[1]!.span.lg).toEqual({ col: 1, row: 1 });
    expect(codes(seen).every((c) => c === 'SP002')).toBe(true);
    expect(seen.length).toBeGreaterThanOrEqual(7);
    capture();
    expect(resolveLayout({ gap: 0 }).gap).toBe(0);
  });

  test('REQ-209 · chart ids come from the dashboard and the cell; an unplaced child from its source index', () => {
    capture();
    const model = resolveDashboard(ops({ cells: [{ id: 'traffic' }] }), ['traffic', undefined, undefined, undefined]);
    expect(model.cells.map((c) => c.chartId)).toEqual(['ops--traffic', 'ops--1', 'ops--2', 'ops--3']);
  });

  test('REQ-209 · chart ids keep only the characters safe in IDREFs and url(#…)', () => {
    capture();
    const model = resolveDashboard({ id: 'my ops', title: 'Ops', layout: { cells: [{ id: 'a b/c' }] } }, ['a b/c']);
    expect(model.cells[0]!.chartId).toMatch(/^[A-Za-z0-9_.:-]+$/);
    expect(model.cells[0]!.chartId.startsWith('my-ops--')).toBe(true);
  });

  test('REQ-209 · I-14 · no two cells share a chart id, even when a cell is named like a source index', () => {
    capture();
    const model = resolveDashboard(ops({ cells: [{ id: '1' }, { id: 'a b' }, { id: 'a-b' }] }), ['1', undefined, 'a b', 'a-b']);
    const ids = model.cells.map((c) => c.chartId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('REQ-202 · the wrapper and each cell carry their numbers as --sp- custom properties', () => {
    capture();
    const model = resolveDashboard(ops({ columns: { lg: 3 }, rowHeight: 200, gap: 12, cells: [{ id: 'a', colSpan: { md: 2, lg: 3 }, rowSpan: 2 }] }), ['a']);
    expect(model.style).toEqual({
      '--sp-dashboard-columns-sm': '1',
      '--sp-dashboard-columns-md': '2',
      '--sp-dashboard-columns-lg': '3',
      '--sp-dashboard-row-height': '200px',
      '--sp-dashboard-layout-gap': '12px',
    });
    expect(model.cells[0]!.style).toEqual({
      '--sp-cell-col-sm': '1',
      '--sp-cell-col-md': '2',
      '--sp-cell-col-lg': '3',
      '--sp-cell-row-sm': '2',
      '--sp-cell-row-md': '2',
      '--sp-cell-row-lg': '2',
    });
  });

  test('REQ-201 · I-10 · I-11 · pure and serialisable: same input, deep-equal model; JSON round-trips', () => {
    capture();
    const props = ops(ABC);
    const children = ['c', undefined, 'a', 'b'];
    const model = resolveDashboard(props, children);
    expect(resolveDashboard(props, children)).toEqual(model);
    expect(JSON.parse(JSON.stringify(model))).toEqual(model);
    expect(model.id).toBe('ops');
  });
});

describe('nominal boxes and cellChartBox (T-108)', () => {
  const context: RecipeContext = { id: 'sp-t108', width: 320, locale: 'en', emptyState: { text: 'No data', rule: true }, domainPadding: 0.1 };
  const outer = (recipe: ChartRecipe<CommonChartProps>, props: CommonChartProps, cell: { width: number; height: number }) => {
    const box = cellChartBox(cell, props, recipe);
    return recipe.build({ ...props, width: box.width, height: box.height }, { ...context, width: box.width }).geometry.viewBox;
  };

  test('REQ-206 · DD-015 · at ssrWidth 1200 (lg, 4 columns, gap 16) a cell is (1200 − 48) / 4 wide per column', () => {
    capture();
    const model = resolveDashboard(ops({ cells: [{ id: 'one' }, { id: 'wide', colSpan: 3, rowSpan: 2 }] }), ['one', 'wide']);
    expect(model.cells[0]!.nominal).toEqual({ width: 288, height: 240 });
    expect(model.cells[1]!.nominal).toEqual({ width: 896, height: 496 });
  });

  test('REQ-206 · A-03 · the nominal box uses the breakpoint ssrWidth falls in: md at 800, sm at 360', () => {
    capture();
    const layout: DashboardLayout = { cells: [{ id: 'w', colSpan: { md: 2, lg: 3 } }, { id: 'n' }] };
    const md = resolveDashboard(ops(layout, { ssrWidth: 800 }), ['w', 'n']);
    expect(md.cells.map((c) => c.nominal.width)).toEqual([800, 392]);
    const sm = resolveDashboard(ops(layout, { ssrWidth: 360 }), ['w', 'n']);
    expect(sm.cells.map((c) => c.nominal.width)).toEqual([360, 360]);
  });

  test('REQ-002 · nominal boxes carry 2 decimals', () => {
    capture();
    const model = resolveDashboard(ops({ columns: { lg: 3 } }, { ssrWidth: 1101 }), [undefined]);
    expect(model.cells[0]!.nominal.width).toBe(356.33);
  });

  test('REQ-008 · an invalid ssrWidth falls back to 1200 with SP002', () => {
    const seen = capture();
    const model = resolveDashboard(ops(undefined, { ssrWidth: -5 }), [undefined]);
    expect(model.cells[0]!.nominal.width).toBe(288);
    expect(codes(seen)).toEqual(['SP002']);
  });

  test('REQ-206 · a chart fills its cell exactly: width, and drawing area = cell height − its own card chrome', () => {
    capture();
    const cell = { width: 288, height: 240 };
    const box = outer(lineChart as ChartRecipe<CommonChartProps>, { title: 'Traffic', footerLeft: 'last 24 h' }, cell);
    expect(box.width).toBe(288);
    expect(box.height).toBe(240);
  });

  test('REQ-206 · I-13 · a KpiCard beside a LineChart with footers: the same outer height in one row', () => {
    capture();
    const cell = { width: 288, height: 240 };
    const kpi = outer(kpiCard as ChartRecipe<CommonChartProps>, { title: 'Revenue' }, cell);
    const line = outer(lineChart as ChartRecipe<CommonChartProps>, { title: 'Traffic', footerLeft: 'a', footerRight: 'b' }, cell);
    expect(kpi.height).toBe(240);
    expect(line.height).toBe(240);
  });

  test('REQ-206 · a chart’s own height and width take precedence over the cell box', () => {
    capture();
    expect(cellChartBox({ width: 288, height: 240 }, { height: 100 }, lineChart as ChartRecipe<CommonChartProps>)).toEqual({ width: 288, height: 100 });
    expect(cellChartBox({ width: 288, height: 240 }, { width: 500 }, lineChart as ChartRecipe<CommonChartProps>).width).toBe(500);
  });

  test('REQ-206 · the chrome subtracted is exactly what the card adds, for every catalog chart and card option', () => {
    capture();
    const options: CommonChartProps[] = [
      {},
      { title: 'T' },
      { title: 'T', badge: 'B' },
      { title: 'T', value: 12, unit: 'u' },
      { footerLeft: 'f' },
      { title: 'T', value: 3, footerLeft: 'f', footerRight: 'g' },
      { chrome: 'bare' },
    ];
    for (const entry of CATALOG) {
      for (const option of options) {
        for (const cell of [{ width: 288, height: 240 }, { width: 600, height: 496 }]) {
          expect(outer(entry.recipe, option, cell).height, `${entry.chart} ${JSON.stringify(option)}`).toBe(cell.height);
        }
      }
    }
  });
});

describe('reference dashboards (T-109)', () => {
  const context: RecipeContext = { id: 'sp-t109', width: 320, locale: 'en', emptyState: { text: 'No data', rule: true }, domainPadding: 0.1 };
  const byName = new Map(CATALOG.map((entry) => [entry.chart, entry.recipe]));

  /** Where each cell of a rowSpan-1 layout lands under `grid-auto-flow: row` with `cols` columns. */
  function rowEndGaps(spans: readonly number[], cols: number): number {
    let gaps = 0;
    let used = 0;
    for (const span of spans) {
      if (used + span > cols) {
        gaps += cols - used;
        used = 0;
      }
      used += span;
    }
    return gaps;
  }

  test('Data Model §4 · three reference dashboards: kpi-strip (5 cells), ops (12), mixed-spans (7)', () => {
    expect(Object.keys(DASHBOARD_DEMOS)).toEqual(['kpi-strip', 'ops', 'mixed-spans']);
    expect(DASHBOARD_DEMOS['kpi-strip'].children).toHaveLength(5);
    expect(DASHBOARD_DEMOS.ops.children).toHaveLength(12);
    expect(DASHBOARD_DEMOS['mixed-spans'].children).toHaveLength(7);
  });

  test('Data Model §4 · ops holds the DD-007 card mix, links on hour, and names catalog charts only', () => {
    const charts = DASHBOARD_DEMOS.ops.children.map((c) => c.chart);
    expect(charts.filter((c) => c === 'KpiCard')).toHaveLength(4);
    for (const chart of ['LineChart', 'BarChart', 'HeatmapChart', 'DonutChart', 'SparklineRows', 'ActivityGrid', 'GaugeArc']) expect(charts).toContain(chart);
    expect(DASHBOARD_DEMOS.ops.props.link).toEqual({ key: 'hour' });
    for (const demo of Object.values(DASHBOARD_DEMOS)) for (const child of demo.children) expect(byName.has(child.chart), child.chart).toBe(true);
  });

  test('REQ-201 · I-9 · the reference dashboards are data only, and frozen all the way down', () => {
    const frozen = (value: unknown): boolean => value === null || typeof value !== 'object' || (Object.isFrozen(value) && Object.values(value).every(frozen));
    expect(frozen(DASHBOARD_DEMOS)).toBe(true);
    expect(JSON.parse(JSON.stringify(DASHBOARD_DEMOS))).toEqual(DASHBOARD_DEMOS);
  });

  test('REQ-205 · REQ-206 · each resolves and renders every cell without a diagnostic', () => {
    const seen = capture();
    for (const demo of Object.values(DASHBOARD_DEMOS)) {
      const model = resolveDashboard(demo.props, demo.children.map((c) => c.cell));
      expect(model.cells).toHaveLength(demo.children.length);
      for (const cell of model.cells) {
        const child = demo.children[cell.child]!;
        const recipe = byName.get(child.chart)!;
        const box = cellChartBox(cell.nominal, child.props, recipe);
        const built = recipe.build({ ...child.props, ...box }, { ...context, id: cell.chartId, width: box.width });
        expect(built.geometry.viewBox.height, `${demo.props.id} ${cell.id}`).toBe(cell.nominal.height);
      }
    }
    expect(seen).toEqual([]);
  });

  test('REQ-203 · mixed-spans leaves a row-end gap at md and keeps its order', () => {
    capture();
    const demo = DASHBOARD_DEMOS['mixed-spans'];
    const model = resolveDashboard(demo.props, demo.children.map((c) => c.cell));
    expect(model.cells.map((c) => c.id)).toEqual(demo.props.layout!.cells!.map((c) => c.id));
    expect(rowEndGaps(model.cells.map((c) => c.span.md.col), 2)).toBeGreaterThan(0);
  });
});

describe('dashboardView: what every adapter writes (T-111..T-113)', () => {
  test('REQ-214 · a titled dashboard is a section labelled by its heading, described by its description', () => {
    capture();
    const view = dashboardView({ id: 'ops', title: 'Operations', description: 'Service health.' }, []);
    expect(view.section).toEqual({
      className: 'sp-dashboard sp-ground-silverpoint',
      substrate: 'cream',
      labelledby: 'ops-title',
      describedby: 'ops-desc',
      style: view.model.style,
    });
    expect(view.heading).toEqual({ level: 2, id: 'ops-title', text: 'Operations' });
    expect(view.description).toEqual({ id: 'ops-desc', text: 'Service health.' });
  });

  test('REQ-214 · headingLevel sets the heading; a label alone names the section with aria-label and no heading', () => {
    capture();
    expect(dashboardView({ id: 'ops', title: 'Ops', headingLevel: 4 }, []).heading?.level).toBe(4);
    const labelled = dashboardView({ id: 'ops', label: 'Operations' }, []);
    expect(labelled.heading).toBeUndefined();
    expect(labelled.section.label).toBe('Operations');
    expect(labelled.section.labelledby).toBeUndefined();
    expect(labelled.description).toBeUndefined();
  });

  test('REQ-212 · REQ-213 · the wrapper takes the dashboard’s ground and substrate, and its own className', () => {
    capture();
    const view = dashboardView({ id: 'ops', title: 'Ops', substrate: 'green', className: 'mine' }, []);
    expect(view.section.className).toBe('sp-dashboard sp-ground-silverpoint mine');
    expect(view.section.substrate).toBe('green');
  });

  test('REQ-209 · REQ-214 · each cell is labelled by its chart’s name: the derived id, or the chart’s own', () => {
    capture();
    const view = dashboardView({ id: 'ops', title: 'Ops', layout: { cells: [{ id: 'a' }, { id: 'b' }] } }, [{ cell: 'b' }, { cell: 'a', id: 'mine' }]);
    expect(view.cells.map((c) => c.child)).toEqual([1, 0]);
    expect(view.cells.map((c) => c.labelledby)).toEqual(['mine-title', 'ops--b-title']);
    expect(view.cells[1]!.context).toEqual({ chartId: 'ops--b', box: view.model.cells[1]!.nominal, config: {} });
    expect(view.cells[1]!.style).toBe(view.model.cells[1]!.style);
  });

  test('REQ-212 · the cell context carries only what the dashboard sets', () => {
    capture();
    const view = dashboardView({ id: 'ops', title: 'Ops', substrate: 'ochre', mode: 'precision', locale: 'es' }, [{}]);
    expect(view.cells[0]!.context.config).toEqual({ substrate: 'ochre', mode: 'precision', locale: 'es' });
  });

  test('REQ-214 · a dashboard named by neither title nor label warns SP002 at runtime, where a type cannot prevent it', () => {
    const seen = capture();
    dashboardView({ id: 'ops' } as unknown as DashboardProps, []);
    expect(codes(seen)).toEqual(['SP002']);
    const named = capture();
    dashboardView({ id: 'ops', label: 'Ops' }, []);
    expect(named).toEqual([]);
  });

  test('REQ-209 · the heading id keeps only IDREF-safe characters', () => {
    capture();
    expect(dashboardView({ id: 'my ops', title: 'Ops' }, []).heading?.id).toBe('my-ops-title');
  });
});

describe('inCell: a chart inside a cell (T-111..T-113)', () => {
  const cell = { chartId: 'ops--traffic', box: { width: 288, height: 240 }, config: { substrate: 'green', mode: 'precision' } } as const;
  const line = lineChart as ChartRecipe<CommonChartProps>;

  test('REQ-209 · REQ-206 · id from the cell, height fitted to the box, width offered as the fallback', () => {
    capture();
    const fitted = inCell({ title: 'Traffic' }, cell, line);
    expect(fitted.props.id).toBe('ops--traffic');
    expect(fitted.props.height).toBe(cellChartBox(cell.box, { title: 'Traffic' }, line).height);
    expect(fitted.props.width).toBeUndefined();
    expect(fitted.width).toBe(288);
  });

  test('REQ-212 · precedence: the chart’s own prop, then the dashboard', () => {
    capture();
    const fitted = inCell({ substrate: 'blue' }, cell, line);
    expect(fitted.props.substrate).toBe('blue');
    expect(fitted.props.mode).toBe('precision');
  });

  test('REQ-212 · an own prop present but undefined (as Vue passes every declared prop) does not hide the dashboard’s', () => {
    capture();
    const fitted = inCell({ substrate: undefined, mode: undefined, id: undefined, height: undefined }, cell, line);
    expect(fitted.props.substrate).toBe('green');
    expect(fitted.props.mode).toBe('precision');
    expect(fitted.props.id).toBe('ops--traffic');
  });

  test('REQ-206 · the chart’s own id, width and height win', () => {
    capture();
    const fitted = inCell({ id: 'mine', width: 500, height: 90 }, cell, line);
    expect(fitted.props).toMatchObject({ id: 'mine', width: 500, height: 90 });
    expect(fitted.width).toBe(500);
  });

  test('REQ-206 · outside a cell nothing changes', () => {
    const props = { title: 'Alone' };
    expect(inCell(props, undefined, line)).toEqual({ props, width: undefined });
  });
});

describe('the reference dashboards ship apart (T-111)', () => {
  test('REQ-164 · they live on their own subpath, off the main entry, so no app pays for them', async () => {
    expect('DASHBOARD_DEMOS' in core).toBe(false);
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { exports: Record<string, Record<string, string>> };
    expect(pkg.exports['./dashboard-demos']?.['@silverpoint/source']).toBe('./src/dashboard-demos.ts');
    expect(pkg.exports['./dashboard-demos']?.import).toBe('./dist/dashboard-demos.js');
    expect((await import('../src/dashboard-demos')).DASHBOARD_DEMOS).toBe(DASHBOARD_DEMOS);
  });
});

describe('linkedItems: the linked interaction, in the core (T-120)', () => {
  const context: RecipeContext = { id: 'sp-t120', width: 320, locale: 'en', emptyState: { text: 'No data', rule: true }, domainPadding: 0.1 };
  const hours = (values: number[]) => values.map((hits, i) => ({ hour: String(10 + i), hits }));
  const line = lineChart.build({ data: hours([3, 5, 4, 6]), xKey: 'hour', valueKey: 'hits' }, context);
  const bars = barChart.build({ data: [{ hour: '12', n: 2 }, { hour: '13', n: 7 }, { hour: '15', n: 1 }], xKey: 'hour', valueKey: 'n' }, context);

  test('REQ-216 · items are matched by the value of the key, across charts with different rows', () => {
    capture();
    const hitsAt = (indices: readonly number[]) => indices.map((i) => bars.geometry.hitAreas[i]!.datum.hour);
    expect(hitsAt(linkedItems(bars, 'hour', '13'))).toEqual(['13']);
    expect(linkedItems(line, 'hour', '12').map((i) => line.geometry.hitAreas[i]!.datum.hour)).toEqual(['12']);
  });

  test('REQ-217 · no item carries the value: no mark at all, no nearest match', () => {
    const seen = capture();
    expect(linkedItems(bars, 'hour', '14')).toEqual([]);
    expect(linkedItems(bars, 'hour', 13)).toEqual([]);
    expect(seen).toEqual([]);
  });

  test('REQ-217 · a chart whose data lacks the key altogether warns SP016, once', () => {
    const seen = capture();
    expect(linkedItems(bars, 'minute', '13')).toEqual([]);
    expect(linkedItems(bars, 'minute', '14')).toEqual([]);
    expect(codes(seen)).toEqual(['SP016']);
  });

  test('REQ-216 · pure: the model is not touched, and the same question gives the same answer', () => {
    capture();
    const before = JSON.stringify(bars);
    expect(linkedItems(bars, 'hour', '12')).toEqual(linkedItems(bars, 'hour', '12'));
    expect(JSON.stringify(bars)).toBe(before);
  });
});
