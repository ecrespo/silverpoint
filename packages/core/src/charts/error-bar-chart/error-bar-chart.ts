import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, ErrorBarChartProps, HitArea, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { AXIS_BAND, PLOT_INSET, TICK_CHAR, cartesianPlot, categoryAxis, categoryLabels, horizontalValueAxis, valueAxis } from '../shared/cartesian';
import { finite } from '../shared/cells';
import { readEstimates } from '../shared/contracts';
import { accessorName, circlePath, fitText, formatNumber } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { ERROR_BAR_CHART_DEMO, ERROR_BAR_CHART_DEMO_KEYS } from './demo';

const CHART = 'ErrorBarChart';
const ESTIMATE_RADIUS = 3.5;
const CAP = 4;
/** Room at the left for the category names when estimates run in rows. */
const ROW_LABELS = 64;

function buildErrorBarChart(props: ErrorBarChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? ERROR_BAR_CHART_DEMO;
  const labelKey = usesDemo ? ERROR_BAR_CHART_DEMO_KEYS.labelKey : (props.labelKey ?? 'label');
  const estimateKey = usesDemo ? ERROR_BAR_CHART_DEMO_KEYS.estimateKey : (props.estimateKey ?? 'estimate');
  const lowKey = usesDemo ? ERROR_BAR_CHART_DEMO_KEYS.lowKey : (props.lowKey ?? 'low');
  const highKey = usesDemo ? ERROR_BAR_CHART_DEMO_KEYS.highKey : (props.highKey ?? 'high');
  const rows = props.orientation !== 'columns';
  const reference = finite(props.reference);
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const format = (v: number) => formatNumber(v, locale, numberFormat);
  const labelName = accessorName(labelKey, 'label');
  const estimateName = accessorName(estimateKey, 'estimate');

  const estimates = readEstimates(CHART, data, { label: labelKey, estimate: estimateKey, low: lowKey, high: highKey });
  const base = modelBase(CHART, props, context, 'Error bars', {
    columns: [labelName, estimateName, accessorName(lowKey, 'low'), accessorName(highKey, 'high')],
    rows: estimates.map((e) => [e.label, format(e.estimate), format(e.low), format(e.high)]),
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

  const range = extent([...estimates.flatMap((e) => [e.low, e.high, e.estimate]), ...(reference === undefined || estimates.length === 0 ? [] : [reference])]);
  if (range === undefined) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const axisOptions = { chart: CHART, property: estimateName, padding: context.domainPadding, locale, numberFormat };
  const axis = rows ? horizontalValueAxis(plot, area, range, axisOptions) : valueAxis(plot, range, { ...axisOptions, zero: false });
  const v = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  if (reference !== undefined) {
    const r = v(reference);
    strokes.push({ d: rows ? `M${r},${plot.y}V${plot.y + plot.height}` : `M${plot.x},${r}H${plot.x + plot.width}`, role: 'ornament', part: 'rule', dash: 'dotted' });
  }
  const along = rows ? { x: plot.y, y: plot.x, width: plot.height, height: plot.width } : plot;
  const slots = categoryAxis(estimates.map((_, i) => i), along, { chart: CHART, property: labelName, padding: context.domainPadding, numeric: false, paddingInner: 0.3, paddingOuter: 0.15 });

  const marks: string[] = [];
  estimates.forEach((e, row) => {
    const c = slots.at(row);
    const lo = v(e.low);
    const hi = v(e.high);
    const mid = v(e.estimate);
    // The interval with a cap at each end, one exact path.
    const d = rows
      ? `M${lo},${c}H${hi}M${lo},${c - CAP}V${c + CAP}M${hi},${c - CAP}V${c + CAP}`
      : `M${c},${lo}V${hi}M${c - CAP},${lo}H${c + CAP}M${c - CAP},${hi}H${c + CAP}`;
    strokes.push({ d, role: 'encoding', part: 'ink' });
    const point = rows ? { x: mid, y: c } : { x: c, y: mid };
    const mark = circlePath(point.x, point.y, ESTIMATE_RADIUS);
    marks.push(mark);
    strokes.push({ d: mark, role: 'encoding', part: 'ink', tone: 2 });
    hitAreas.push({
      seriesKey: estimateName,
      index: row,
      datum: Object.freeze({ label: e.label, estimate: e.estimate, low: e.low, high: e.high }),
      value: e.estimate,
      x: point.x,
      y: point.y,
      box: rows ? { x: Math.min(lo, hi), y: c - CAP, width: Math.abs(hi - lo), height: 2 * CAP } : { x: c - CAP, y: Math.min(lo, hi), width: 2 * CAP, height: Math.abs(hi - lo) },
    });
    const text = format(e.estimate);
    // The estimate is printed past the interval's end when the plot holds it (DD-035).
    if (rows && Math.max(lo, hi) + 6 + text.length * TICK_CHAR <= plot.x + plot.width) {
      labels.push({ x: Math.max(lo, hi) + 6, y: c + 3, text, kind: 'tick', part: 'axis', anchor: 'start' });
    }
  });
  const names = estimates.map((e) => e.label);
  if (rows) names.forEach((text, row) => labels.push({ x: area.x + PLOT_INSET, y: slots.at(row) + 4, text: fitText(text, ROW_LABELS - PLOT_INSET - 6), kind: 'tick', part: 'axis', anchor: 'start' }));
  else labels.push(...categoryLabels(names, slots.at, area, plot));

  // One heightened element (REQ-442): the estimate furthest from the reference, or the largest.
  const distance = (value: number) => (reference === undefined ? value : Math.abs(value - reference));
  let raised = 0;
  estimates.forEach((e, row) => {
    if (distance(e.estimate) > distance((estimates[raised] as (typeof estimates)[number]).estimate)) raised = row;
  });
  if (marks.length > 0) strokes.push({ d: marks[raised] as string, role: 'encoding', part: 'heighten', paint: 'fill' });

  const crossing = reference === undefined ? 0 : estimates.filter((e) => e.low <= reference && reference <= e.high).length;
  const description =
    props.description ??
    `${base.name}. ${estimates.length} estimates of ${estimateName} with their intervals${
      reference === undefined ? '' : `, read against ${format(reference)}; ${crossing} of them include it`
    }; estimates from ${format(Math.min(...estimates.map((e) => e.estimate)))} to ${format(Math.max(...estimates.map((e) => e.estimate)))}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `ErrorBarChart` recipe (REQ-410): a point estimate with its interval per category. */
export const errorBarChart: ChartRecipe<ErrorBarChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildErrorBarChart });
