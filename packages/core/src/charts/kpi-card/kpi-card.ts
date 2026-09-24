import { area, line } from 'd3-shape';
import { linearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, HitArea, KpiCardProps, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { checkVolume, readSeries, seriesValues, type SeriesPoint } from '../shared/cartesian';
import { inset, warnValue } from '../shared/cells';
import { CURVES } from '../shared/curves';
import { accessorName, formatNumber, formatValue } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { KPI_CARD_DEMO, KPI_CARD_DEMO_PROPS } from './demo';

const CHART = 'KpiCard';
const PLOT_INSET = 6;
/** The row at the top of the drawing area that carries the delta. */
const DELTA_BAND = 18;
const MARK = 7;
const CHAR = 5.6;

function buildKpiCard(props: KpiCardProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? KPI_CARD_DEMO;
  const valueKey = usesDemo ? 'value' : (props.valueKey ?? 'value');
  const metric = usesDemo ? (props.metric ?? KPI_CARD_DEMO_PROPS.metric) : props.metric;
  const delta = usesDemo ? (props.delta ?? KPI_CARD_DEMO_PROPS.delta) : props.delta;
  const { locale } = context;
  const numberFormat = props.numberFormat;

  const series = readSeries(data, valueKey, 'value');
  checkVolume(CHART, [series]);
  const last = [...series.points].reverse().find((p) => p.value !== undefined)?.value;

  const base = modelBase(CHART, props, context, metric ?? 'KPI', {
    columns: ['point', series.key],
    rows: series.points.map((p) => [String(p.index + 1), formatValue(p.value, locale, numberFormat)]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  // The figure is the card's own value line: the prop, else the latest value; the metric names it.
  const card = cardLayout({ ...props, value: props.value ?? last, unit: props.unit ?? metric }, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const drawing = inset(card.area, PLOT_INSET);
  const plot = { x: drawing.x, y: drawing.y + DELTA_BAND, width: drawing.width, height: Math.max(drawing.height - DELTA_BAND, 1) };
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (delta !== undefined && Number.isFinite(delta)) {
    // The delta is printed with its sign, and a mark points its way: never tone alone (REQ-124).
    const text = formatNumber(delta, locale, { ...(numberFormat ?? { maximumFractionDigits: 2 }), signDisplay: 'always' });
    const right = drawing.x + drawing.width;
    labels.push({ x: right, y: drawing.y + 11, text, kind: 'tick', part: 'text', anchor: 'end' });
    const tone = props.deltaTone ?? (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat');
    const x0 = right - text.length * CHAR - MARK - 6;
    const top = drawing.y + 3;
    const bottom = top + MARK;
    const d =
      tone === 'up'
        ? `M${x0},${bottom}L${x0 + MARK / 2},${top}L${x0 + MARK},${bottom}Z`
        : tone === 'down'
          ? `M${x0},${top}L${x0 + MARK / 2},${bottom}L${x0 + MARK},${top}Z`
          : `M${x0},${top}L${x0 + MARK},${(top + bottom) / 2}L${x0},${bottom}Z`;
    strokes.push({ d, role: 'encoding', part: 'ink', paint: 'fill' });
  }

  if (series.missing > 0 && data.length > 0) warnValue(CHART, series.key, `${series.missing} of ${data.length} values are not finite; the sparkline breaks there.`);
  const range = extent(seriesValues([series]));
  if (data.length === 0 || range === undefined) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const bottom = plot.y + plot.height;
  const y = linearScale(range, [bottom, plot.y], { chart: CHART, property: series.key, padding: context.domainPadding });
  const xAt = (i: number) => (data.length > 1 ? plot.x + (i / (data.length - 1)) * plot.width : plot.x + plot.width / 2);
  const defined = (p: SeriesPoint) => p.value !== undefined;
  const shape = area<SeriesPoint>().defined(defined).x((p) => xAt(p.index)).y0(bottom).y1((p) => y(p.value ?? 0)).curve(CURVES.monotone)(series.points);
  if (shape) strokes.push({ d: shape, role: 'encoding', part: 'ink', paint: 'stroke', tone: 1 });
  const top = line<SeriesPoint>().defined(defined).x((p) => xAt(p.index)).y((p) => y(p.value ?? 0)).curve(CURVES.monotone)(series.points);
  if (top) strokes.push({ d: top, role: 'encoding', part: 'ink' });
  for (const p of series.points) {
    if (p.value === undefined) continue;
    hitAreas.push({ seriesKey: series.key, index: p.index, datum: p.datum, value: p.value, x: xAt(p.index), y: y(p.value) });
  }

  const description =
    props.description ??
    `${base.name}. ${metric ?? accessorName(valueKey, 'value')} at ${formatValue(props.value ?? last, locale, numberFormat)}${
      delta !== undefined && Number.isFinite(delta) ? `, change ${formatNumber(delta, locale, { signDisplay: 'always', maximumFractionDigits: 2 })}` : ''
    }; ${data.length} points from ${formatNumber(range[0], locale, numberFormat)} to ${formatNumber(range[1], locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `KpiCard` recipe (REQ-063): the figure, its signed delta with a direction mark, and an area sparkline. */
export const kpiCard: ChartRecipe<KpiCardProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildKpiCard });
