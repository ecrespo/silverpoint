/**
 * Path-weight measurement (PRD NFR §7, DD-007, T-027). The budget is bytes of `d` data, not
 * element count: rough.js emits two paths per shape whatever the density.
 */
import { lineChart, pathBytes, type ChartModel, type ChartRecipe, type CommonChartProps, type Stroke } from '@silverpoint/core';
import { renderChart } from '@silverpoint/grounds';
import { canonicalDashboardMarkup } from '../visual-gate/dashboard-canonical';
import { dashboardMatrix, type DashboardFixture } from '../visual-gate/dashboard-fixtures';

const SIZES = { sm: { width: 240, height: 120 }, md: { width: 320, height: 150 }, lg: { width: 640, height: 300 } } as const;

/** Bytes of path data of the line chart with its demo dataset, full card, in both modes. */
export function measureLineChart(size: keyof typeof SIZES): { ink: number; precision: number } {
  const { width, height } = SIZES[size];
  const props = { width, height, title: 'Throughput per hour', badge: 'Live', value: 88, unit: 'requests', footerLeft: 'a', footerRight: 'b' };
  const bytes = (mode: 'ink' | 'precision') => pathBytes(renderChart(lineChart, { ...props, mode }, { id: `sp-weight-${size}` }).geometry);
  return { ink: bytes('ink'), precision: bytes('precision') };
}

/**
 * A deliberately dense card: `bars` columns 33 px wide and up to 110 px tall at the darkest,
 * cross-hatched tone, over a curved area at tone 3 — the shapes DD-007 measured.
 */
function denseCard(bars: number): ChartRecipe<CommonChartProps> {
  return {
    name: 'DenseCard',
    build(_props, context): ChartModel {
      const box = { x: 0, y: 0, width: 320, height: 150 };
      const step = 300 / bars;
      const strokes: Stroke[] = [
        { d: 'M0,150V60C80,20,160,100,320,30V150Z', role: 'encoding', part: 'ink-secondary', tone: 3 },
        ...Array.from({ length: bars }, (_, i): Stroke => {
          const x = 10 + i * step;
          const top = 140 - 110 * ((i % 4) + 1) / 4;
          return { d: `M${x},140V${top}H${x + Math.min(33, step - 4)}V140Z`, role: 'encoding', part: 'ink', tone: 4 };
        }),
      ];
      return {
        chart: 'DenseCard',
        id: context.id,
        status: 'ready',
        geometry: { viewBox: box, plot: box, strokes, labels: [], hitAreas: [], defs: [] },
        chrome: 'card',
        name: 'Dense card',
        description: 'Dense card',
        ids: { title: `${context.id}-title`, desc: `${context.id}-desc`, table: `${context.id}-table` },
        table: { caption: 'Dense card', columns: [], rows: [] },
        dataTable: 'none',
      };
    },
  };
}

/** Bytes of the dense card with the tile fill and with per-shape hatching. */
export function measureDenseCard(bars = 6): { tile: number; perShape: number; tileDefs: number } {
  const recipe = denseCard(bars);
  const render = (hatchFill: 'tile' | 'per-shape') => renderChart(recipe, { hatchFill, seed: 1592 }, { id: 'sp-dense' }).geometry;
  const tiled = render('tile');
  const tileDefs = pathBytes({ ...tiled, strokes: [] });
  return { tile: pathBytes(tiled), perShape: pathBytes(render('per-shape')), tileDefs };
}

/**
 * Bytes of path data of any chart with its demo dataset, full card, in precision and inked with
 * each hatch fill — the matrix families (many small toned shapes) are where the tile helps least.
 */
export function measureChart(
  recipe: ChartRecipe<CommonChartProps>,
  size: keyof typeof SIZES,
): { precision: number; tile: number; perShape: number } {
  const { width, height } = SIZES[size];
  const props = { width, height, seed: 1592, title: 'Weight', badge: 'Live', footerLeft: 'a', footerRight: 'b' };
  const bytes = (extra: CommonChartProps) => pathBytes(renderChart(recipe, { ...props, ...extra }, { id: `sp-weight-${size}` }).geometry);
  return {
    precision: bytes({ mode: 'precision' }),
    tile: bytes({ mode: 'ink', hatchFill: 'tile' }),
    perShape: bytes({ mode: 'ink', hatchFill: 'per-shape' }),
  };
}

/** API Spec §12: server HTML of the 12-card reference dashboard, `ops`. */
export const DASHBOARD_HTML_BUDGET = 480 * 1_024;

/** Bytes of a dashboard fixture's server HTML, as its canonical render writes it (UTF-8). */
export function measureDashboardHtml(fixture: DashboardFixture): number {
  return Buffer.byteLength(canonicalDashboardMarkup(fixture), 'utf8');
}

/** One line per `ops` fixture whose HTML is over `budget`; empty when every one fits. */
export function dashboardWeightProblems(budget = DASHBOARD_HTML_BUDGET): string[] {
  return dashboardMatrix()
    .filter((fixture) => fixture.dashboard === 'ops')
    .map((fixture) => [fixture.id, measureDashboardHtml(fixture)] as const)
    .filter(([, bytes]) => bytes > budget)
    .map(([id, bytes]) => `${id}: ${bytes} B of HTML, over ${budget} B (API Spec §12)`);
}
