import { diagnose } from '../../diagnostics/diagnose';
import { roundGeometry } from '../../render/round';
import type {
  ChartModel,
  CommonChartProps,
  DataTable,
  Geometry,
  HitArea,
  RecipeContext,
  Rect,
  Stroke,
  TextLabel,
} from '../../types';

/** What every chart model shares, before any geometry: identity and the accessible layer. */
export type ModelBase = Pick<ChartModel, 'chart' | 'id' | 'chrome' | 'name' | 'ids' | 'table' | 'dataTable'>;

/** The accessible name, ids and table of a chart (REQ-120, REQ-121). */
export function modelBase(
  chart: string,
  props: CommonChartProps,
  context: RecipeContext,
  fallbackName: string,
  table: Omit<DataTable, 'caption'>,
): ModelBase {
  const { id } = context;
  const name = props.label ?? props.title ?? fallbackName;
  return {
    chart,
    id,
    chrome: props.chrome ?? 'card',
    name,
    ids: { title: `${id}-title`, desc: `${id}-desc`, table: `${id}-table` },
    table: { caption: name, ...table },
    dataTable: props.dataTable ?? 'hidden',
  };
}

/** The drawing-area height a chart asks for: the `height` prop or the default of API Spec §5.1. */
export function areaHeight(props: CommonChartProps): number {
  return props.height ?? 160;
}

/**
 * The width the chart draws at, or a deferred model when the container has no usable size yet:
 * the render waits, and no attribute ever carries `NaN` (REQ-009, SP003).
 */
export function measure(
  base: ModelBase,
  props: CommonChartProps,
  context: RecipeContext,
): { readonly width: number; readonly height: number } | { readonly deferred: ChartModel } {
  const width = props.width ?? context.width;
  const height = areaHeight(props);
  if (width !== undefined && width > 0 && height > 0) return { width, height };
  if (width !== undefined && process.env.NODE_ENV !== 'production') {
    diagnose('SP003', base.chart, {
      property: width <= 0 ? 'width' : 'height',
      message: `Measured ${width} × ${height} px.`,
    });
  }
  const box = { x: 0, y: 0, width: 0, height: 0 };
  return {
    deferred: {
      ...base,
      status: 'deferred',
      geometry: { viewBox: box, plot: box, strokes: [], labels: [], hitAreas: [], defs: [] },
      description: props.description ?? base.name,
    },
  };
}

/**
 * The ground's empty state inside the drawing area, with no spurious axes and no exception
 * (REQ-007). SP001 is reported only when the dataset itself is empty.
 */
export function emptyModel(
  base: ModelBase,
  props: CommonChartProps,
  context: RecipeContext,
  frame: { readonly viewBox: Rect; readonly plot: Rect; readonly strokes: readonly Stroke[]; readonly labels: readonly TextLabel[] },
  datasetEmpty: boolean,
): ChartModel {
  if (datasetEmpty && process.env.NODE_ENV !== 'production') {
    diagnose('SP001', base.chart, { property: 'data' });
  }
  const { plot } = frame;
  const strokes: Stroke[] = [...frame.strokes];
  if (context.emptyState.rule) {
    strokes.push({ d: `M${plot.x},${plot.y + plot.height}H${plot.x + plot.width}`, role: 'ornament', part: 'rule' });
  }
  const labels: TextLabel[] = [
    ...frame.labels,
    {
      x: plot.x + plot.width / 2,
      y: plot.y + plot.height / 2,
      text: context.emptyState.text,
      kind: 'empty',
      part: 'axis',
      anchor: 'middle',
    },
  ];
  return {
    ...base,
    status: 'ready',
    description: props.description ?? `${base.name}. ${context.emptyState.text}.`,
    geometry: roundGeometry({ viewBox: frame.viewBox, plot, strokes, labels, hitAreas: [], defs: [] }),
  };
}

/** A drawn chart: its geometry rounded to 2 decimals (REQ-002). */
export function readyModel(
  base: ModelBase,
  description: string,
  geometry: Omit<Geometry, 'defs' | 'hitAreas'> & { readonly hitAreas: readonly HitArea[] },
): ChartModel {
  return { ...base, status: 'ready', description, geometry: roundGeometry({ ...geometry, defs: [] }) };
}
