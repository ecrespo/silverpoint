import { linearScale } from '../../scales/scales';
import type { ChartModel, ChartRecipe, HistogramChartProps, HitArea, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { AXIS_BAND, PLOT_INSET, TICK_CHAR, cartesianPlot, horizontalValueAxis, valueAxis } from '../shared/cartesian';
import { rectPath } from '../shared/cells';
import { checkBins, checkCeiling, readObservations } from '../shared/contracts';
import { accessorName, circlePath, formatNumber } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { bins as binsOf, quantile, sortedValues, type Bin } from '../shared/stats';
import { HISTOGRAM_CHART_DEMO, HISTOGRAM_CHART_DEMO_KEYS } from './demo';

const CHART = 'HistogramChart';
const HEIGHTEN_RADIUS = 3.5;
/** Room at the left for the bin edges when bins run in rows. */
const ROW_LABELS = 48;
/** Minimum room per printed bin edge. */
const EDGE_SPACING = 36;

/** The rule the bins came from, for the description (REQ-431). */
function method(spec: number | readonly number[] | undefined, sorted: readonly number[]): string {
  if (Array.isArray(spec)) return 'at the given thresholds';
  if (typeof spec === 'number') return `as ${spec} equal bins`;
  const iqr = quantile(sorted, 0.75) - quantile(sorted, 0.25);
  return iqr > 0 ? 'by the Freedman–Diaconis rule' : "by Sturges' rule";
}

function buildHistogramChart(props: HistogramChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? HISTOGRAM_CHART_DEMO;
  const valueKey = usesDemo ? HISTOGRAM_CHART_DEMO_KEYS.valueKey : (props.valueKey ?? 'value');
  const rows = props.orientation === 'rows';
  const cumulative = props.cumulative === true;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');

  const { observations } = readObservations(CHART, data, { value: valueKey });
  checkCeiling(CHART, valueName, 'observations', observations.length);
  const spec = checkBins(CHART, props.bins);
  const sorted = sortedValues(observations.map((o) => o.value));
  let running = 0;
  const bins: Bin[] = binsOf(sorted, spec).map((bin) => (cumulative ? { ...bin, count: (running += bin.count) } : bin));
  const countName = cumulative ? 'cumulative count' : 'count';
  const range = (bin: Bin) => `${formatNumber(bin.x0, locale, numberFormat)}–${formatNumber(bin.x1, locale, numberFormat)}`;

  const base = modelBase(CHART, props, context, 'Histogram', {
    columns: [valueName, countName],
    rows: bins.map((bin) => [range(bin), formatNumber(bin.count, locale, undefined)]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const area = card.area;
  const plot: Rect = rows
    ? { x: area.x + ROW_LABELS, y: area.y + PLOT_INSET, width: Math.max(area.width - ROW_LABELS - PLOT_INSET, 1), height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1) }
    : cartesianPlot(area);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (bins.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const largest = Math.max(...bins.map((b) => b.count));
  const axisOptions = { chart: CHART, property: countName, padding: context.domainPadding, locale, numberFormat: undefined };
  const axis = rows ? horizontalValueAxis(plot, area, [0, largest], axisOptions) : valueAxis(plot, [0, largest], axisOptions);
  const count = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  // The bins sit on their own edges, which are already nice: the scale is not niced again.
  const first = (bins[0] as Bin).x0;
  const last = (bins.at(-1) as Bin).x1;
  const along = rows ? ([plot.y, plot.y + plot.height] as const) : ([plot.x, plot.x + plot.width] as const);
  const at = linearScale([first, last], along, { chart: CHART, property: valueName, padding: context.domainPadding });

  const tops: string[] = [];
  bins.forEach((bin, index) => {
    const a = at(bin.x0);
    const b = at(bin.x1);
    const end = count(bin.count);
    const zero = count(0);
    const box: Rect = rows ? { x: zero, y: a, width: end - zero, height: b - a } : { x: a, y: end, width: b - a, height: zero - end };
    strokes.push({ d: rectPath(box), role: 'encoding', part: 'ink', tone: cumulative ? 1 : 2 });
    // The running total's top edge: across each bin, then up (or out) to the next one.
    if (rows) tops.push(index === 0 ? `M${end},${a}V${b}` : `H${end}V${b}`);
    else tops.push(index === 0 ? `M${a},${end}H${b}` : `V${end}H${b}`);
    const centre = (a + b) / 2;
    hitAreas.push({
      seriesKey: countName,
      index,
      datum: Object.freeze({ x0: bin.x0, x1: bin.x1, count: bin.count }),
      value: bin.count,
      x: rows ? end : centre,
      y: rows ? centre : end,
      box,
    });
    const text = formatNumber(bin.count, locale, undefined);
    if (!rows && b - a >= text.length * TICK_CHAR + 2 && bin.count > 0) {
      // Clear of the heightened mark, which may sit on this bin's top.
      labels.push({ x: centre, y: end - HEIGHTEN_RADIUS - 3, text, kind: 'tick', part: 'axis', anchor: 'middle' });
    }
  });
  // The running total's top edge, one exact line over the toned bins (DD-035).
  if (cumulative) strokes.push({ d: tops.join(''), role: 'encoding', part: 'ink' });

  // Ticks at the bin edges, thinned so they never crowd.
  const edges = [first, ...bins.map((b) => b.x1)];
  const room = rows ? plot.height : plot.width;
  const step = Math.max(1, Math.ceil(edges.length / Math.max(2, Math.floor(room / EDGE_SPACING))));
  edges.forEach((edge, i) => {
    if (i % step !== 0 && i !== edges.length - 1) return;
    const text = formatNumber(edge, locale, numberFormat);
    labels.push(rows
      ? { x: area.x + PLOT_INSET, y: at(edge) + 3, text, kind: 'tick', part: 'axis', anchor: 'start' }
      : { x: at(edge), y: area.y + area.height - 5, text, kind: 'tick', part: 'axis', anchor: 'middle' });
  });

  // One heightened element (REQ-442): the modal bin's top, or the last bin's when cumulative.
  const raised = cumulative ? (hitAreas.at(-1) as HitArea) : hitAreas.reduce((best, hit) => (hit.value > best.value ? hit : best));
  const mark = circlePath(raised.x, raised.y, HEIGHTEN_RADIUS);
  strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
  strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });

  const modal = bins.reduce((best, bin) => (bin.count > best.count ? bin : best));
  const description =
    props.description ??
    `${base.name}. Histogram of ${observations.length} ${valueName} observations in ${bins.length} bins ${method(spec, sorted)}, from ${formatNumber(first, locale, numberFormat)} to ${formatNumber(last, locale, numberFormat)}; ${
      cumulative ? `the counts run up to ${observations.length}` : `the fullest bin, ${range(modal)}, holds ${modal.count}`
    }.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `HistogramChart` recipe (REQ-400): raw observations binned in the core, abutting bins. */
export const histogramChart: ChartRecipe<HistogramChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildHistogramChart });
