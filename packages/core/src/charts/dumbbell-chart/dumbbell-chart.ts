import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, DumbbellChartProps, HitArea, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { AXIS_BAND, PLOT_INSET, cartesianPlot, categoryAxis, categoryLabels, horizontalValueAxis, legend, valueAxis } from '../shared/cartesian';
import { readPaired } from '../shared/contracts';
import { accessorName, circlePath, fitText, formatNumber, signedChange } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { DUMBBELL_CHART_DEMO, DUMBBELL_CHART_DEMO_KEYS } from './demo';

const CHART = 'DumbbellChart';
const MARK_RADIUS = 4;
/** Length of the arrowhead along the segment, and its half-width. */
const ARROW_LENGTH = 9;
const ARROW_HALF = 4.5;
/** Room at the left for the category names when dumbbells run in rows. */
const ROW_LABELS = 88;

/** A closed arrowhead whose tip is at `(x, y)`, pointing along `direction` (±1 on the value axis). */
function arrowPath(rows: boolean, tip: number, across: number, direction: number): string {
  const back = tip - direction * ARROW_LENGTH;
  return rows
    ? `M${tip},${across}L${back},${across - ARROW_HALF}L${back},${across + ARROW_HALF}Z`
    : `M${across},${tip}L${across - ARROW_HALF},${back}L${across + ARROW_HALF},${back}Z`;
}

function buildDumbbellChart(props: DumbbellChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? DUMBBELL_CHART_DEMO;
  const labelKey = usesDemo ? DUMBBELL_CHART_DEMO_KEYS.labelKey : (props.labelKey ?? 'label');
  const startKey = usesDemo ? DUMBBELL_CHART_DEMO_KEYS.startKey : (props.startKey ?? 'start');
  const endKey = usesDemo ? DUMBBELL_CHART_DEMO_KEYS.endKey : (props.endKey ?? 'end');
  const [first = 'start', second = 'end'] = usesDemo ? DUMBBELL_CHART_DEMO_KEYS.names : (props.names ?? []);
  const names = [first, second] as const;
  // Dumbbells read best in rows: long category names, values along one axis.
  const rows = props.orientation !== 'columns';
  const arrow = props.endMarker === 'arrow';
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const format = (v: number) => formatNumber(v, locale, numberFormat);
  const labelName = accessorName(labelKey, 'label');

  const pairs = readPaired(CHART, data, { label: labelKey, start: startKey, end: endKey });
  const base = modelBase(CHART, props, context, 'Dumbbell chart', {
    columns: [labelName, names[0], names[1], 'change'],
    rows: pairs.map((p) => [p.label, format(p.start), format(p.end), signedChange(p.end - p.start, format)]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const key = legend(card.area, [
    { name: names[0], part: 'ink-secondary', dash: 'dotted' },
    { name: names[1], part: 'ink', tone: 2 },
  ]);
  const area = key.area;
  const plot: Rect = rows
    ? { x: area.x + ROW_LABELS, y: area.y + PLOT_INSET, width: Math.max(area.width - ROW_LABELS - PLOT_INSET, 1), height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1) }
    : cartesianPlot(area);
  const strokes: Stroke[] = [...card.strokes, ...key.strokes];
  const labels: TextLabel[] = [...card.labels, ...key.labels];
  const hitAreas: HitArea[] = [];

  const range = extent(pairs.flatMap((p) => [p.start, p.end]));
  if (range === undefined) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const axisOptions = { chart: CHART, property: accessorName(endKey, 'end'), padding: context.domainPadding, locale, numberFormat };
  const axis = rows ? horizontalValueAxis(plot, area, range, axisOptions) : valueAxis(plot, range, { ...axisOptions, zero: false });
  const v = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  const along = rows ? { x: plot.y, y: plot.x, width: plot.height, height: plot.width } : plot;
  const slots = categoryAxis(pairs.map((_, i) => i), along, { chart: CHART, property: labelName, padding: context.domainPadding, numeric: false, paddingInner: 0.3, paddingOuter: 0.15 });
  const point = (value: number, c: number) => (rows ? { x: v(value), y: c } : { x: c, y: v(value) });

  let largest: { row: number; size: number } | undefined;
  const ends: string[] = [];
  pairs.forEach((pair, row) => {
    const c = slots.at(row);
    const a = point(pair.start, c);
    const b = point(pair.end, c);
    const direction = Math.sign(v(pair.end) - v(pair.start));
    // The segment runs between the marks' edges, so neither mark is crossed by it.
    const inset = (from: { x: number; y: number }, sign: number, by: number) => (rows ? { x: from.x + sign * by, y: from.y } : { x: from.x, y: from.y + sign * by });
    const gap = Math.abs(v(pair.end) - v(pair.start));
    if (gap > MARK_RADIUS + (arrow ? ARROW_LENGTH : MARK_RADIUS)) {
      const p = inset(a, direction, MARK_RADIUS);
      const q = inset(b, -direction, arrow ? ARROW_LENGTH : MARK_RADIUS);
      strokes.push({ d: `M${p.x},${p.y}L${q.x},${q.y}`, role: 'encoding', part: 'ink' });
    } else {
      strokes.push({ d: `M${a.x},${a.y}L${b.x},${b.y}`, role: 'encoding', part: 'ink' });
    }
    strokes.push({ d: circlePath(a.x, a.y, MARK_RADIUS), role: 'encoding', part: 'ink-secondary', dash: 'dotted' });
    const end = arrow && direction !== 0 ? arrowPath(rows, v(pair.end), c, direction) : circlePath(b.x, b.y, MARK_RADIUS);
    strokes.push({ d: end, role: 'encoding', part: 'ink', tone: 2 });
    ends.push(end);
    const datum = Object.freeze({ label: pair.label, start: pair.start, end: pair.end, change: pair.end - pair.start });
    const cell = (column: number) => ({ column, row });
    hitAreas.push({ seriesKey: names[0], index: row, datum, value: pair.start, x: a.x, y: a.y, cell: cell(0) });
    hitAreas.push({ seriesKey: names[1], index: row, datum, value: pair.end, x: b.x, y: b.y, cell: cell(1) });
    const change = Math.abs(pair.end - pair.start);
    if (!largest || change > largest.size) largest = { row, size: change };
  });
  const texts = pairs.map((p) => p.label);
  if (rows) texts.forEach((text, row) => labels.push({ x: area.x + PLOT_INSET, y: slots.at(row) + 4, text: fitText(text, ROW_LABELS - PLOT_INSET - 6), kind: 'tick', part: 'axis', anchor: 'start' }));
  else labels.push(...categoryLabels(texts, slots.at, area, plot));

  // One heightened element (REQ-442): the end mark of the largest change.
  if (largest) strokes.push({ d: ends[largest.row] as string, role: 'encoding', part: 'heighten', paint: 'fill' });

  const rises = pairs.filter((p) => p.end > p.start).length;
  const falls = pairs.filter((p) => p.end < p.start).length;
  const description =
    props.description ??
    `${base.name}. Dumbbell chart of ${pairs.length} ${labelName} values from ${names[0]} to ${names[1]}; ${rises} rise, ${falls} fall${
      largest ? `; the largest change is ${pairs[largest.row]?.label ?? ''}, ${signedChange((pairs[largest.row]?.end ?? 0) - (pairs[largest.row]?.start ?? 0), format)}` : ''
    }.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `DumbbellChart` recipe (REQ-407): two values per category joined by a segment. */
export const dumbbellChart: ChartRecipe<DumbbellChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildDumbbellChart });
