import { curveStep, curveStepAfter, curveStepBefore, line, type CurveFactory } from 'd3-shape';
import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, HitArea, RecipeContext, StepChartProps, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { cartesianPlot, categoryAxis, categoryLabels, checkVolume, readSeries, seriesValues, valueAxis, type SeriesPoint } from '../shared/cartesian';
import { warnValue } from '../shared/cells';
import { accessorName, circlePath, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { STEP_CHART_DEMO } from './demo';

const CHART = 'StepChart';
const HEIGHTEN_RADIUS = 3.5;
const STEPS: Readonly<Record<NonNullable<StepChartProps['step']>, CurveFactory>> = {
  after: curveStepAfter,
  before: curveStepBefore,
  middle: curveStep,
};

function buildStepChart(props: StepChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? STEP_CHART_DEMO;
  const xKey = usesDemo ? 'x' : (props.xKey ?? 'x');
  const valueKey = usesDemo ? 'value' : (props.valueKey ?? 'value');
  const { locale } = context;
  const numberFormat = props.numberFormat;

  const series = readSeries(data, valueKey, 'value');
  checkVolume(CHART, [series]);
  const xName = accessorName(xKey, 'x');
  const xValues = data.map((datum, index) => read(xKey, datum, index));
  const xLabels = xValues.map((value) => formatValue(value, locale, undefined));

  const base = modelBase(CHART, props, context, 'Step chart', {
    columns: [xName, series.key],
    rows: data.map((_, i) => [xLabels[i] ?? '', formatValue(series.points[i]?.value, locale, numberFormat)]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = cartesianPlot(card.area);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (series.missing > 0 && data.length > 0) warnValue(CHART, series.key, `${series.missing} of ${data.length} values are not finite; the steps skip them.`);
  const range = extent(seriesValues([series]));
  if (data.length === 0 || range === undefined) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const axis = valueAxis(plot, range, { chart: CHART, property: series.key, padding: context.domainPadding, locale, numberFormat });
  const y = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  const xAt = categoryAxis(xValues, plot, { chart: CHART, property: xName, padding: context.domainPadding }).at;

  const d = line<SeriesPoint>()
    .defined((p) => p.value !== undefined)
    .x((p) => xAt(p.index))
    .y((p) => y(p.value ?? 0))
    .curve(STEPS[props.step ?? 'after'])(series.points);
  if (d) strokes.push({ d, role: 'encoding', part: 'ink' });

  for (const p of series.points) {
    if (p.value === undefined) continue;
    hitAreas.push({ seriesKey: series.key, index: p.index, datum: p.datum, value: p.value, x: xAt(p.index), y: y(p.value) });
  }
  const live = hitAreas.at(-1);
  if (live) {
    const mark = circlePath(live.x, live.y, HEIGHTEN_RADIUS);
    strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
    strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });
  }
  labels.push(...categoryLabels(xLabels, xAt, card.area, plot));

  const description =
    props.description ??
    `${base.name}. Step chart of ${data.length} ${xName} values, stepping ${props.step ?? 'after'} each point; ${series.key} ranges from ${formatNumber(range[0], locale, numberFormat)} to ${formatNumber(range[1], locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `StepChart` recipe (REQ-061): a series drawn as exact steps. */
export const stepChart: ChartRecipe<StepChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildStepChart });
