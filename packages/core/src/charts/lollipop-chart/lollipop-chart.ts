import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, HitArea, LollipopChartProps, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { AXIS_BAND, PLOT_INSET, TICK_CHAR, cartesianPlot, categoryAxis, checkVolume, horizontalValueAxis, readSeries, seriesValues, valueAxis } from '../shared/cartesian';
import { warnValue } from '../shared/cells';
import { accessorName, circlePath, fitText, formatCategory, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { LOLLIPOP_CHART_DEMO, LOLLIPOP_CHART_DEMO_KEYS } from './demo';

const CHART = 'LollipopChart';
const HEAD_RADIUS = 4;
/** Room at the left for the category names when lollipops run in rows. */
const ROW_LABELS = 96;
/** Room, in px, a category name needs under a column before names are thinned. */
const MIN_LABEL_ROOM = 48;

function buildLollipopChart(props: LollipopChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? LOLLIPOP_CHART_DEMO;
  const xKey = usesDemo ? LOLLIPOP_CHART_DEMO_KEYS.xKey : (props.xKey ?? 'x');
  const valueKey = usesDemo ? LOLLIPOP_CHART_DEMO_KEYS.valueKey : (props.valueKey ?? 'value');
  const rows = props.orientation === 'rows';
  const { locale } = context;
  const numberFormat = props.numberFormat;

  const series = readSeries(data, valueKey, 'value');
  checkVolume(CHART, [series]);
  const xName = accessorName(xKey, 'x');
  const xLabels = data.map((datum, index) => formatCategory(read(xKey, datum, index), locale));

  const base = modelBase(CHART, props, context, 'Lollipop chart', {
    columns: [xName, series.key],
    rows: data.map((_, i) => [xLabels[i] ?? '', formatValue(series.points[i]?.value, locale, numberFormat)]),
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

  if (series.missing > 0 && data.length > 0) warnValue(CHART, series.key, `${series.missing} of ${data.length} values are not finite; their lollipops are omitted.`);
  const range = extent(seriesValues([series]));
  if (data.length === 0 || range === undefined) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const axisOptions = { chart: CHART, property: series.key, padding: context.domainPadding, locale, numberFormat };
  const axis = rows ? horizontalValueAxis(plot, area, range, axisOptions) : valueAxis(plot, range, axisOptions);
  const v = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);

  // The drawing order: data order, or sorted by value (ties by row); the table keeps data order.
  const drawn = series.points.filter((p) => p.value !== undefined);
  if (props.sort === 'ascending' || props.sort === 'descending') {
    const sign = props.sort === 'ascending' ? 1 : -1;
    drawn.sort((a, b) => sign * ((a.value as number) - (b.value as number)) || a.index - b.index);
  }
  const along = rows ? { x: plot.y, y: plot.x, width: plot.height, height: plot.width } : plot;
  const slots = categoryAxis(drawn.map((_, i) => i), along, { chart: CHART, property: xName, padding: context.domainPadding, numeric: false, paddingInner: 0.3, paddingOuter: 0.15 });
  const zero = v(0);

  drawn.forEach((p, slot) => {
    const value = p.value as number;
    const c = slots.at(slot);
    const end = v(value);
    const head = rows ? { x: end, y: c } : { x: c, y: end };
    // The stem stops at the head's edge, so the head's tone is never crossed by it.
    const toward = end > zero ? -HEAD_RADIUS : HEAD_RADIUS;
    const tip = Math.abs(end - zero) > HEAD_RADIUS ? end + toward : zero;
    strokes.push({ d: rows ? `M${zero},${c}H${tip}` : `M${c},${zero}V${tip}`, role: 'encoding', part: 'ink' });
    strokes.push({ d: circlePath(head.x, head.y, HEAD_RADIUS), role: 'encoding', part: 'ink', tone: 2 });
    hitAreas.push({ seriesKey: series.key, index: p.index, datum: p.datum, value, x: head.x, y: head.y, box: { x: head.x - HEAD_RADIUS, y: head.y - HEAD_RADIUS, width: 2 * HEAD_RADIUS, height: 2 * HEAD_RADIUS } });
    const text = formatNumber(value, locale, numberFormat);
    // The value at the head when the band holds it (DD-035).
    if (!rows && slots.bandwidth >= text.length * TICK_CHAR + 2) {
      labels.push({ x: c, y: value >= 0 ? end - HEAD_RADIUS - 4 : end + HEAD_RADIUS + 10, text, kind: 'tick', part: 'axis', anchor: 'middle' });
    }
  });
  const names = drawn.map((p) => xLabels[p.index] ?? '');
  if (rows) names.forEach((text, slot) => labels.push({ x: area.x + PLOT_INSET, y: slots.at(slot) + 4, text: fitText(text, ROW_LABELS - PLOT_INSET - 6), kind: 'tick', part: 'axis', anchor: 'start' }));
  else {
    // Long names are thinned to one every `step` slots and cut to the room that leaves; the table
    // and the readout carry them whole.
    const spacing = plot.width / Math.max(drawn.length, 1);
    const step = Math.max(1, Math.ceil(MIN_LABEL_ROOM / spacing));
    names.forEach((text, slot) => {
      if (slot % step !== 0) return;
      labels.push({ x: slots.at(slot), y: area.y + area.height - 5, text: fitText(text, spacing * step - 6), kind: 'tick', part: 'axis', anchor: 'middle' });
    });
  }

  // One heightened element (REQ-442): the largest head, the head itself.
  const largest = hitAreas.reduce((best, hit) => (hit.value > best.value ? hit : best));
  strokes.push({ d: circlePath(largest.x, largest.y, HEAD_RADIUS), role: 'encoding', part: 'heighten', paint: 'fill' });

  const description =
    props.description ??
    `${base.name}. Lollipop chart in ${rows ? 'rows' : 'columns'} of ${drawn.length} ${xName} values${props.sort && props.sort !== 'none' ? `, sorted ${props.sort}` : ''}; ${series.key} from ${formatNumber(range[0], locale, numberFormat)} to ${formatNumber(range[1], locale, numberFormat)}, the largest ${xLabels[largest.index] ?? ''}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `LollipopChart` recipe (REQ-406): a stem from the baseline and a head at the value. */
export const lollipopChart: ChartRecipe<LollipopChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildLollipopChart });
