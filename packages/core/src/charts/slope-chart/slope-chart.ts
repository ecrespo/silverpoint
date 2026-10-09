import { linearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, HitArea, Rect, RecipeContext, SlopeChartProps, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { AXIS_BAND, PLOT_INSET, TICK_CHAR, spreadLabels } from '../shared/cartesian';
import { readPaired } from '../shared/contracts';
import { accessorName, circlePath, formatNumber, signedChange } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { SLOPE_CHART_DEMO, SLOPE_CHART_DEMO_KEYS } from './demo';

const CHART = 'SlopeChart';
const HEIGHTEN_RADIUS = 3.5;
/** Vertical room one end label needs. */
const LABEL_GAP = 11;
/** The two period axes keep at least this share of the width between them. */
const MIN_SPAN = 0.4;

function buildSlopeChart(props: SlopeChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? SLOPE_CHART_DEMO;
  const labelKey = usesDemo ? SLOPE_CHART_DEMO_KEYS.labelKey : (props.labelKey ?? 'label');
  const startKey = usesDemo ? SLOPE_CHART_DEMO_KEYS.startKey : (props.startKey ?? 'start');
  const endKey = usesDemo ? SLOPE_CHART_DEMO_KEYS.endKey : (props.endKey ?? 'end');
  const [first = 'start', second = 'end'] = usesDemo ? SLOPE_CHART_DEMO_KEYS.names : (props.names ?? []);
  const names = [first, second] as const;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const format = (v: number) => formatNumber(v, locale, numberFormat);
  const labelName = accessorName(labelKey, 'label');

  const pairs = readPaired(CHART, data, { label: labelKey, start: startKey, end: endKey });
  const base = modelBase(CHART, props, context, 'Slopegraph', {
    columns: [labelName, names[0], names[1], 'change'],
    rows: pairs.map((p) => [p.label, format(p.start), format(p.end), signedChange(p.end - p.start, format)]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const area = card.area;
  const leftTexts = pairs.map((p) => `${p.label} ${format(p.start)}`);
  const rightTexts = pairs.map((p) => `${format(p.end)} ${p.label}`);
  const room = (texts: readonly string[]) => Math.max(0, ...texts.map((t) => t.length * TICK_CHAR)) + 8;
  const budget = (area.width * (1 - MIN_SPAN)) / 2;
  const left = area.x + Math.min(room(leftTexts), budget);
  const right = area.x + area.width - Math.min(room(rightTexts), budget);
  // The period names sit above the plot; the plot spans the two axes.
  const plot: Rect = { x: left, y: area.y + AXIS_BAND, width: Math.max(right - left, 1), height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1) };
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  const range = extent(pairs.flatMap((p) => [p.start, p.end]));
  if (range === undefined) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const bottom = plot.y + plot.height;
  const y = linearScale(range, [bottom, plot.y], { chart: CHART, property: accessorName(endKey, 'end'), padding: context.domainPadding });
  for (const [x, name, anchor] of [[left, names[0], 'start'], [right, names[1], 'end']] as const) {
    strokes.push({ d: `M${x},${plot.y}V${bottom}`, role: 'ornament', part: 'axis' });
    labels.push({ x, y: area.y + 11, text: name, kind: 'tick', part: 'axis', anchor });
  }

  let largest: { row: number; size: number } | undefined;
  pairs.forEach((pair, row) => {
    const a = { x: left, y: y(pair.start) };
    const b = { x: right, y: y(pair.end) };
    const falls = pair.end < pair.start;
    strokes.push({ d: `M${a.x},${a.y}L${b.x},${b.y}`, role: 'encoding', part: falls ? 'ink-secondary' : 'ink', ...(falls ? { dash: 'dotted' as const } : {}) });
    const datum = Object.freeze({ label: pair.label, start: pair.start, end: pair.end, change: pair.end - pair.start });
    hitAreas.push({ seriesKey: names[0], index: row, datum, value: pair.start, x: a.x, y: a.y, cell: { column: 0, row } });
    hitAreas.push({ seriesKey: names[1], index: row, datum, value: pair.end, x: b.x, y: b.y, cell: { column: 1, row } });
    const change = Math.abs(pair.end - pair.start);
    if (!largest || change > largest.size) largest = { row, size: change };
  });
  // Name and value at both ends, spread so they never overlap (no legend: DD-035).
  const lefts = spreadLabels(pairs.map((p) => y(p.start)), LABEL_GAP, plot.y, bottom);
  const rights = spreadLabels(pairs.map((p) => y(p.end)), LABEL_GAP, plot.y, bottom);
  pairs.forEach((_, row) => {
    labels.push({ x: left - 6, y: (lefts[row] as number) + 3, text: leftTexts[row] as string, kind: 'tick', part: 'axis', anchor: 'end' });
    labels.push({ x: right + 6, y: (rights[row] as number) + 3, text: rightTexts[row] as string, kind: 'tick', part: 'axis', anchor: 'start' });
  });

  // One heightened element (REQ-442): the end of the largest change.
  if (largest) {
    const mark = circlePath(right, y(pairs[largest.row]?.end ?? 0), HEIGHTEN_RADIUS);
    strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
    strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });
  }

  const rises = pairs.filter((p) => p.end > p.start).length;
  const falls = pairs.filter((p) => p.end < p.start).length;
  const description =
    props.description ??
    `${base.name}. Slopegraph of ${pairs.length} ${labelName} values from ${names[0]} to ${names[1]}; ${rises} rise, ${falls} fall, ${pairs.length - rises - falls} hold${
      largest ? `; the largest change is ${pairs[largest.row]?.label ?? ''}, ${signedChange((pairs[largest.row]?.end ?? 0) - (pairs[largest.row]?.start ?? 0), format)}` : ''
    }.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `SlopeChart` recipe (REQ-408): two period axes, one segment per category, labelled at both ends. */
export const slopeChart: ChartRecipe<SlopeChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildSlopeChart });
