import {
  curveLinear,
  curveMonotoneX,
  curveNatural,
  curveStepAfter,
  line,
  type CurveFactory,
} from 'd3-shape';
import { diagnose } from '../../diagnostics/diagnose';
import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, HitArea, LineChartProps, LineCurve, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { cartesianPlot, categoryAxis, checkVolume, categoryLabels, readSeries, seriesValues, valueAxis, type Series, type SeriesPoint } from '../shared/cartesian';
import { accessorName, circlePath, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { LINE_CHART_DEMO, LINE_CHART_DEMO_KEYS } from './demo';

const CHART = 'LineChart';
const HEIGHTEN_RADIUS = 3.5;

const CURVES: Record<LineCurve, CurveFactory> = {
  monotone: curveMonotoneX,
  linear: curveLinear,
  natural: curveNatural,
  step: curveStepAfter,
};

function buildLineChart(props: LineChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? LINE_CHART_DEMO;
  const xKey = usesDemo ? LINE_CHART_DEMO_KEYS.xKey : (props.xKey ?? 'x');
  const valueKey = usesDemo ? LINE_CHART_DEMO_KEYS.valueKey : (props.valueKey ?? 'value');
  const secondaryKey = usesDemo ? LINE_CHART_DEMO_KEYS.secondaryKey : props.secondaryKey;
  const chrome = props.chrome ?? 'card';
  const { locale } = context;
  const numberFormat = props.numberFormat;

  const primary = readSeries(data, valueKey, 'value');
  const secondary =
    secondaryKey !== undefined && (props.series ?? 'all') === 'all'
      ? readSeries(data, secondaryKey, 'secondary')
      : undefined;
  const series = secondary ? [primary, secondary] : [primary];
  checkVolume(CHART, series);

  const xName = accessorName(xKey, 'x');
  const xValues = data.map((datum, index) => read(xKey, datum, index));
  const xLabels = xValues.map((value) => formatValue(value, locale, undefined));

  const base = modelBase(CHART, props, context, 'Line chart', {
    columns: [xName, ...series.map((s) => s.key)],
    rows: data.map((_, index) => [
      xLabels[index] ?? '',
      ...series.map((s) => formatValue(s.points[index]?.value, locale, numberFormat)),
    ]),
  });
  const { name } = base;

  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const { width } = size;

  const card = cardLayout(props, { width, areaHeight: size.height, chrome, locale });
  const { area } = card;
  const plot = cartesianPlot(area);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  for (const s of series) {
    if (s.missing > 0 && data.length > 0 && process.env.NODE_ENV !== 'production') {
      diagnose('SP002', CHART, {
        property: s.key,
        message: `${s.missing} of ${data.length} values were omitted from the stroke; set \`connectNulls\` to bridge the gap.`,
      });
    }
  }

  const valueExtent = extent(seriesValues(series));

  if (data.length === 0 || valueExtent === undefined) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const axis = valueAxis(plot, valueExtent, { chart: CHART, property: primary.key, padding: context.domainPadding, locale, numberFormat });
  const y = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  const xAt = categoryAxis(xValues, plot, { chart: CHART, property: xName, padding: context.domainPadding }).at;

  const curve = CURVES[props.curve ?? 'monotone'];
  const connectNulls = props.connectNulls ?? false;
  const pathFor = (s: Series): string => {
    const generator = line<SeriesPoint>()
      .x((p) => xAt(p.index))
      .y((p) => y(p.value ?? 0))
      .curve(curve);
    const points = connectNulls ? s.points.filter((p) => p.value !== undefined) : s.points;
    if (!connectNulls) generator.defined((p) => p.value !== undefined);
    return generator(points) ?? '';
  };

  // The secondary series is drawn first so the primary one reads on top of it.
  const ordered = secondary ? [secondary, primary] : [primary];
  for (const s of ordered) {
    const d = pathFor(s);
    if (d === '') continue;
    strokes.push(
      s === primary
        ? { d, role: 'encoding', part: 'ink' }
        : { d, role: 'encoding', part: 'ink-secondary', dash: 'dotted' },
    );
  }

  for (const s of series) {
    for (const p of s.points) {
      if (p.value === undefined) continue;
      hitAreas.push({
        seriesKey: s.key,
        index: p.index,
        datum: p.datum,
        value: p.value,
        x: xAt(p.index),
        y: y(p.value),
      });
    }
  }

  const live = [...primary.points].reverse().find((p) => p.value !== undefined);
  if (live?.value !== undefined) {
    const d = circlePath(xAt(live.index), y(live.value), HEIGHTEN_RADIUS);
    strokes.push({ d, role: 'encoding', part: 'heighten', paint: 'fill' });
    strokes.push({ d, role: 'encoding', part: 'ink', paint: 'stroke' });
  }

  const count = data.length;
  labels.push(...categoryLabels(xLabels, xAt, area, plot));

  const ranges = series.map((s) => {
    const seriesExtent = extent(s.points.flatMap((p) => (p.value === undefined ? [] : [p.value])));
    return seriesExtent
      ? `${s.key} ranges from ${formatNumber(seriesExtent[0], locale, numberFormat)} to ${formatNumber(seriesExtent[1], locale, numberFormat)}`
      : `${s.key} has no values`;
  });
  const description =
    props.description ??
    `${name}. Line chart of ${count} ${xName} values${secondary ? ' in 2 series' : ''}; ${ranges.join('; ')}.`;

  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `LineChart` recipe (REQ-060): props plus scales produce exact geometry. */
export const lineChart: ChartRecipe<LineChartProps> = /* @__PURE__ */ Object.freeze({
  name: CHART,
  build: buildLineChart,
});
