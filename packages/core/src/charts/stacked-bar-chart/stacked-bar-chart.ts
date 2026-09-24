import type { ChartModel, ChartRecipe, HitArea, Rect, RecipeContext, StackedBarChartProps, Stroke, TextLabel, ToneLevel } from '../../types';
import { cardLayout } from '../shared/card';
import { cartesianPlot, categoryAxis, categoryLabels, checkVolume, legend, readSeries, valueAxis } from '../shared/cartesian';
import { rectPath, warnValue } from '../shared/cells';
import { accessorName, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { STACKED_BAR_CHART_DEMO, STACKED_BAR_CHART_DEMO_KEYS } from './demo';

const CHART = 'StackedBarChart';
/** Tones of the stacked keys, bottom to top; a fifth key starts over. */
const TONES: readonly ToneLevel[] = [1, 2, 3, 4];

function buildStackedBarChart(props: StackedBarChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? STACKED_BAR_CHART_DEMO;
  const xKey = usesDemo ? 'x' : (props.xKey ?? 'x');
  const keys = usesDemo ? STACKED_BAR_CHART_DEMO_KEYS : (props.keys ?? STACKED_BAR_CHART_DEMO_KEYS);
  const names = keys.map((k, i) => (usesDemo ? undefined : props.names?.[i]) ?? k);
  const { locale } = context;
  const numberFormat = props.numberFormat;

  const series = keys.map((k) => readSeries(data, k, k));
  checkVolume(CHART, series);
  const xName = accessorName(xKey, 'x');
  const xValues = data.map((datum, index) => read(xKey, datum, index));
  const xLabels = xValues.map((value) => formatValue(value, locale, undefined));

  const base = modelBase(CHART, props, context, 'Stacked bar chart', {
    columns: [xName, ...keys],
    rows: data.map((_, i) => [xLabels[i] ?? '', ...series.map((s) => formatValue(s.points[i]?.value, locale, numberFormat))]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  // The legend lists the keys in stack order, bottom first: the name tells a key, not its tone (REQ-124).
  const key = legend(card.area, names.map((name, k) => ({ name, part: 'ink' as const, tone: TONES[k % TONES.length] })));
  const plot = cartesianPlot(key.area);
  const strokes: Stroke[] = [...card.strokes, ...key.strokes];
  const labels: TextLabel[] = [...card.labels, ...key.labels];
  const hitAreas: HitArea[] = [];

  let missing = 0;
  let negative = 0;
  const totals = data.map((_, i) =>
    series.reduce((sum, s) => {
      const value = s.points[i]?.value;
      if (value === undefined) {
        missing += 1;
        return sum;
      }
      if (value < 0) negative += 1;
      return sum + Math.max(value, 0);
    }, 0),
  );
  if (missing > 0 && data.length > 0) warnValue(CHART, keys[0] ?? 'keys', `${missing} values are not finite; their segments are omitted.`);
  if (negative > 0) warnValue(CHART, keys[0] ?? 'keys', `${negative} negative values cannot stack; they are drawn at zero.`);
  if (data.length === 0 || keys.length === 0) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const axis = valueAxis(plot, [0, Math.max(0, ...totals)], { chart: CHART, property: keys[0] ?? 'value', padding: context.domainPadding, locale, numberFormat });
  const y = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  const categories = categoryAxis(xValues, plot, { chart: CHART, property: xName, padding: context.domainPadding, numeric: false, paddingInner: 0.35, paddingOuter: 0.2 });
  const width = categories.bandwidth;

  data.forEach((_, i) => {
    let below = 0;
    series.forEach((s, k) => {
      const p = s.points[i];
      if (p?.value === undefined) return;
      const height = Math.max(p.value, 0);
      const segment: Rect = { x: categories.at(i) - width / 2, y: y(below + height), width, height: y(below) - y(below + height) };
      if (segment.height > 0) strokes.push({ d: rectPath(segment), role: 'encoding', part: 'ink', tone: TONES[k % TONES.length] });
      hitAreas.push({ seriesKey: s.key, index: i, datum: p.datum, value: p.value, x: categories.at(i), y: segment.y, box: segment, cell: { column: i, row: k } });
      below += height;
    });
  });
  labels.push(...categoryLabels(xLabels, categories.at, key.area, plot));

  const largest = Math.max(...totals);
  const description =
    props.description ??
    `${base.name}. Stacked bars of ${keys.length} keys (${names.join(', ')}, bottom to top) over ${data.length} ${xName} values; the tallest stack totals ${formatNumber(largest, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `StackedBarChart` recipe (REQ-065): one segment per key, stacked from zero, named in a legend. */
export const stackedBarChart: ChartRecipe<StackedBarChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildStackedBarChart });
