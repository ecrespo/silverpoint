import { linearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, HitArea, ParallelCoordinatesChartProps, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { AXIS_BAND, PLOT_INSET } from '../shared/cartesian';
import { warnValue } from '../shared/cells';
import { readWideRows } from '../shared/contracts';
import { accessorName, circlePath, fitText, formatNumber, numberFormatter } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { PARALLEL_COORDINATES_CHART_DEMO, PARALLEL_COORDINATES_CHART_DEMO_KEYS } from './demo';

const CHART = 'ParallelCoordinatesChart';
const HEIGHTEN_RADIUS = 3.5;
/** Room above the axes for the dimension names and below them for the minimum ticks. */
const HEAD = 14;
/** Room at each side, so the first and last axes' ticks are not clipped. */
const SIDE = 22;

/** A valid domain: two finite, increasing bounds. */
const validDomain = (raw: unknown): readonly [number, number] | undefined =>
  Array.isArray(raw) && raw.length === 2 && Number.isFinite(raw[0]) && Number.isFinite(raw[1]) && (raw[0] as number) < (raw[1] as number) ? [raw[0] as number, raw[1] as number] : undefined;

function buildParallelCoordinatesChart(props: ParallelCoordinatesChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? PARALLEL_COORDINATES_CHART_DEMO;
  const labelKey = usesDemo ? PARALLEL_COORDINATES_CHART_DEMO_KEYS.labelKey : props.labelKey;
  const dimensions = usesDemo ? PARALLEL_COORDINATES_CHART_DEMO_KEYS.dimensions : (props.dimensions ?? []);
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const format = numberFormatter(locale, numberFormat);
  const labelName = labelKey === undefined ? 'row' : accessorName(labelKey, 'label');

  const rows = readWideRows(CHART, data, labelKey, dimensions);
  const byIndex = new Map(rows.map((r) => [r.index, r]));
  const base = modelBase(CHART, props, context, 'Parallel coordinates', {
    columns: [labelName, ...dimensions],
    rows: data.map((_, index) => {
      const row = byIndex.get(index);
      return row ? [row.label ?? `#${index + 1}`, ...row.values.map(format)] : ['—', ...dimensions.map(() => '—')];
    }),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const area = card.area;
  const plot: Rect = { x: area.x + SIDE, y: area.y + HEAD + PLOT_INSET, width: Math.max(area.width - 2 * SIDE, 1), height: Math.max(area.height - HEAD - AXIS_BAND - PLOT_INSET, 1) };
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (dimensions.length < 2) warnValue(CHART, 'dimensions', `${dimensions.length} dimensions; parallel coordinates need at least 2.`);
  if (rows.length === 0 || dimensions.length < 2) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  // Each axis' domain: the one given (REQ-097), else the data's extent, niced.
  const given = props.domains ?? {};
  let outside = 0;
  const axes = dimensions.map((name, d) => {
    const x = plot.x + (plot.width * d) / (dimensions.length - 1);
    const domain = validDomain(given[name]);
    const scale = linearScale(domain ?? extent(rows.map((r) => r.values[d] as number)) ?? [0, 1], [plot.y + plot.height, plot.y], { chart: CHART, property: name, padding: 0, nice: domain === undefined });
    const [lo, hi] = scale.domain;
    strokes.push({ d: `M${x},${plot.y}V${plot.y + plot.height}`, role: 'ornament', part: 'axis' });
    labels.push({ x, y: area.y + 10, text: fitText(name, plot.width / Math.max(dimensions.length - 1, 1)), kind: 'tick', part: 'axis', anchor: 'middle' });
    labels.push({ x: x + 3, y: plot.y + 3, text: formatNumber(hi, locale, numberFormat), kind: 'tick', part: 'axis', anchor: 'start' });
    labels.push({ x: x + 3, y: plot.y + plot.height + 10, text: formatNumber(lo, locale, numberFormat), kind: 'tick', part: 'axis', anchor: 'start' });
    // A value outside a given domain is drawn at the axis' end (SP002).
    const y = (v: number) => {
      if (v < lo || v > hi) outside += 1;
      return scale(Math.min(Math.max(v, lo), hi));
    };
    return { x, y, given: domain !== undefined };
  });

  // One polyline per row, in data order; the first row's drawn heavier, as the one heightened.
  const vertices = rows.map((row) => row.values.map((v, d) => ({ x: (axes[d] as (typeof axes)[number]).x, y: (axes[d] as (typeof axes)[number]).y(v) })));
  if (outside > 0) warnValue(CHART, 'domains', `${outside} values lie outside their given domain; they are drawn at the axis' end.`);
  rows.forEach((row, r) => {
    const at = vertices[r] as { x: number; y: number }[];
    strokes.push({ d: at.map((p, d) => `${d === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(''), role: 'encoding', part: 'ink', ...(r === 0 ? { weight: 2 } : {}) });
    row.values.forEach((value, d) => {
      const p = at[d] as { x: number; y: number };
      hitAreas.push({ seriesKey: dimensions[d] as string, index: row.index, datum: row.datum, value, x: p.x, y: p.y, cell: { column: d, row: r } });
    });
  });

  // One heightened element (REQ-442): the first row, marked where it meets the first axis. A
  // heightening is a fill (the grounds' rule), so an open line carries it as a mark at its start.
  const start = (vertices[0] as { x: number; y: number }[])[0] as { x: number; y: number };
  const mark = circlePath(start.x, start.y, HEIGHTEN_RADIUS);
  strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
  strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });

  const derived = axes.filter((a) => !a.given).length;
  const description =
    props.description ??
    `${base.name}. Parallel coordinates of ${rows.length} rows on ${dimensions.length} axes, ${dimensions.join(', ')}; ${
      derived === dimensions.length ? 'every axis spans its data, niced' : derived === 0 ? 'every axis spans its given domain' : `${derived} axes span their data, niced, the rest their given domain`
    }. The first row, ${rows[0]?.label ?? '#1'}, is drawn heavier.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `ParallelCoordinatesChart` recipe (REQ-419): one axis per dimension, one polyline per row. */
export const parallelCoordinatesChart: ChartRecipe<ParallelCoordinatesChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildParallelCoordinatesChart });
