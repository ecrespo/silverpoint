import { line } from 'd3-shape';
import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, ComposedChartProps, HitArea, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { cartesianPlot, categoryAxis, categoryLabels, checkVolume, legend, readSeries, seriesValues, valueAxis, type SeriesPoint } from '../shared/cartesian';
import { rectPath, warnValue } from '../shared/cells';
import { CURVES } from '../shared/curves';
import { accessorName, formatCategory, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { COMPOSED_CHART_DEMO, COMPOSED_CHART_DEMO_KEYS } from './demo';

const CHART = 'ComposedChart';
const BAR_FILL = 0.6;

function buildComposedChart(props: ComposedChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? COMPOSED_CHART_DEMO;
  const xKey = usesDemo ? COMPOSED_CHART_DEMO_KEYS.xKey : (props.xKey ?? 'x');
  const barKey = usesDemo ? COMPOSED_CHART_DEMO_KEYS.barKey : (props.barKey ?? 'bar');
  const lineKey = usesDemo ? COMPOSED_CHART_DEMO_KEYS.lineKey : (props.lineKey ?? 'line');
  const showLine = props.showLine ?? true;
  const { locale } = context;
  const numberFormat = props.numberFormat;

  const bars = readSeries(data, barKey, 'bar');
  const trend = readSeries(data, lineKey, 'line');
  const series = showLine ? [bars, trend] : [bars];
  checkVolume(CHART, series);
  const xName = accessorName(xKey, 'x');
  const xValues = data.map((datum, index) => read(xKey, datum, index));
  const xLabels = xValues.map((value) => formatCategory(value, locale));

  const base = modelBase(CHART, props, context, 'Composed chart', {
    columns: [xName, ...series.map((s) => s.key)],
    rows: data.map((_, i) => [xLabels[i] ?? '', ...series.map((s) => formatValue(s.points[i]?.value, locale, numberFormat))]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const key = legend(card.area, [
    { name: bars.key, part: 'ink', tone: 2 },
    ...(showLine ? [{ name: trend.key, part: 'ink-secondary' as const }] : []),
  ]);
  const plot = cartesianPlot(key.area);
  const strokes: Stroke[] = [...card.strokes, ...key.strokes];
  const labels: TextLabel[] = [...card.labels, ...key.labels];
  const hitAreas: HitArea[] = [];

  for (const s of series) if (s.missing > 0 && data.length > 0) warnValue(CHART, s.key, `${s.missing} of ${data.length} values are not finite; they are omitted.`);
  const range = extent(seriesValues(series));
  if (data.length === 0 || range === undefined) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const axis = valueAxis(plot, range, { chart: CHART, property: bars.key, padding: context.domainPadding, locale, numberFormat });
  const y = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  const categories = categoryAxis(xValues, plot, { chart: CHART, property: xName, padding: context.domainPadding, numeric: false, paddingInner: 0.3, paddingOuter: 0.15 });
  const width = categories.bandwidth * BAR_FILL;

  for (const p of bars.points) {
    if (p.value === undefined) continue;
    const top = y(Math.max(0, p.value));
    const bottom = y(Math.min(0, p.value));
    const bar: Rect = { x: categories.at(p.index) - width / 2, y: top, width, height: bottom - top };
    if (bar.height > 0) strokes.push({ d: rectPath(bar), role: 'encoding', part: 'ink', tone: 2 });
    hitAreas.push({ seriesKey: bars.key, index: p.index, datum: p.datum, value: p.value, x: categories.at(p.index), y: y(p.value), box: bar, cell: { column: p.index, row: 0 } });
  }
  if (showLine) {
    const d = line<SeriesPoint>().defined((p) => p.value !== undefined).x((p) => categories.at(p.index)).y((p) => y(p.value ?? 0)).curve(CURVES.monotone)(trend.points);
    if (d) strokes.push({ d, role: 'encoding', part: 'ink-secondary' });
    for (const p of trend.points) {
      if (p.value === undefined) continue;
      hitAreas.push({ seriesKey: trend.key, index: p.index, datum: p.datum, value: p.value, x: categories.at(p.index), y: y(p.value), cell: { column: p.index, row: 1 } });
    }
  }
  labels.push(...categoryLabels(xLabels, categories.at, key.area, plot));

  const description =
    props.description ??
    `${base.name}. Columns of ${bars.key}${showLine ? ` with a line of ${trend.key}` : ''} over ${data.length} ${xName} values, on one scale from ${formatNumber(range[0], locale, numberFormat)} to ${formatNumber(range[1], locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `ComposedChart` recipe (REQ-066): columns and a spline on one value scale. */
export const composedChart: ChartRecipe<ComposedChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildComposedChart });
