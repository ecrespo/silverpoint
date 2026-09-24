import {
  curveLinear,
  curveMonotoneX,
  curveNatural,
  curveStepAfter,
  line,
  type CurveFactory,
} from 'd3-shape';
import { diagnose } from '../../diagnostics/diagnose';
import { bandScale, linearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import type {
  Accessor,
  ChartModel,
  ChartRecipe,
  Datum,
  HitArea,
  LineChartProps,
  LineCurve,
  RecipeContext,
  Rect,
  Stroke,
  TextLabel,
} from '../../types';
import { cardLayout } from '../shared/card';
import { accessorName, circlePath, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { LINE_CHART_DEMO, LINE_CHART_DEMO_KEYS } from './demo';

const CHART = 'LineChart';
/** Room under the plot for the category labels. */
const AXIS_BAND = 20;
/** Room around the plot so the heightened point is never clipped. */
const PLOT_INSET = 6;
const HEIGHTEN_RADIUS = 3.5;
/** Minimum horizontal room per category label. */
const LABEL_SPACING = 48;

const CURVES: Record<LineCurve, CurveFactory> = {
  monotone: curveMonotoneX,
  linear: curveLinear,
  natural: curveNatural,
  step: curveStepAfter,
};

interface SeriesPoint {
  readonly index: number;
  readonly datum: Datum;
  readonly value: number | undefined;
}

interface Series {
  readonly key: string;
  readonly points: readonly SeriesPoint[];
}

function readSeries(
  data: readonly Datum[],
  accessor: Accessor<number | null | undefined>,
  fallbackName: string,
): Series & { readonly missing: number } {
  let missing = 0;
  const points = data.map((datum, index) => {
    const raw = read(accessor, datum, index);
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
    if (value === undefined) missing += 1;
    return { index, datum, value };
  });
  return { key: accessorName(accessor, fallbackName), points, missing };
}

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
  const plot: Rect = {
    x: area.x + PLOT_INSET,
    y: area.y + PLOT_INSET,
    width: Math.max(area.width - 2 * PLOT_INSET, 1),
    height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1),
  };
  const plotBottom = plot.y + plot.height;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  for (const s of series) {
    if (s.missing > 0 && data.length > 0 && process.env.NODE_ENV !== 'production') {
      diagnose('SP002', CHART, {
        property: s.key,
        message: `${s.missing} of ${data.length} values were omitted.`,
      });
    }
  }

  const values = series.flatMap((s) => s.points.flatMap((p) => (p.value === undefined ? [] : [p.value])));
  const valueExtent = extent(values);

  if (data.length === 0 || valueExtent === undefined) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const y = linearScale(
    [Math.min(0, valueExtent[0]), valueExtent[1]],
    [plotBottom, plot.y],
    { chart: CHART, property: primary.key, padding: context.domainPadding, nice: true },
  );

  const numericX = xValues.every((value) => typeof value === 'number' && Number.isFinite(value));
  let xAt: (index: number) => number;
  if (numericX) {
    const numbers = xValues as number[];
    const xExtent = extent(numbers) ?? [0, 0];
    const x = linearScale(xExtent, [plot.x, plot.x + plot.width], {
      chart: CHART,
      property: xName,
      padding: context.domainPadding,
    });
    xAt = (index) => x(numbers[index] ?? 0);
  } else {
    const keys = data.map((_, index) => String(index));
    const x = bandScale(keys, [plot.x, plot.x + plot.width]);
    xAt = (index) => x.center(String(index)) ?? plot.x;
  }

  for (const tick of y.ticks(4)) {
    const ty = y(tick);
    if (tick === y.domain[0]) continue;
    strokes.push({ d: `M${plot.x},${ty}H${plot.x + plot.width}`, role: 'ornament', part: 'grid' });
    labels.push({
      x: plot.x,
      y: ty - 3,
      text: formatNumber(tick, locale, numberFormat),
      kind: 'tick',
      part: 'axis',
      anchor: 'start',
    });
  }
  strokes.push({ d: `M${plot.x},${plotBottom}H${plot.x + plot.width}`, role: 'ornament', part: 'rule' });

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
  const step = Math.max(1, Math.ceil(count / Math.max(2, Math.floor(plot.width / LABEL_SPACING))));
  for (let index = 0; index < count; index += step) {
    labels.push({
      x: xAt(index),
      y: area.y + area.height - 5,
      text: xLabels[index] ?? '',
      kind: 'tick',
      part: 'axis',
      anchor: index === 0 ? 'start' : 'middle',
    });
  }

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
