import { linearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, ConnectedScatterChartProps, HitArea, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { TICK_CHAR, cartesianPlot, valueAxis } from '../shared/cartesian';
import { inset } from '../shared/cells';
import { checkCeiling, readPathPoints } from '../shared/contracts';
import { accessorName, circlePath, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { CONNECTED_SCATTER_CHART_DEMO, CONNECTED_SCATTER_CHART_DEMO_KEYS } from './demo';

const CHART = 'ConnectedScatterChart';
const DOT_RADIUS = 2.5;
const HEIGHTEN_RADIUS = 3.5;
/** A chevron's length back along the path and its half-width; segments shorter than `CHEVRON_ROOM` get none. */
const CHEVRON_BACK = 4;
const CHEVRON_HALF = 3;
const CHEVRON_ROOM = 14;
/** Two labels closer than this, in px, would collide: the later one is left to the table. */
const LABEL_ROOM = 22;

function buildConnectedScatterChart(props: ConnectedScatterChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? CONNECTED_SCATTER_CHART_DEMO;
  const xKey = usesDemo ? CONNECTED_SCATTER_CHART_DEMO_KEYS.xKey : (props.xKey ?? 'x');
  const yKey = usesDemo ? CONNECTED_SCATTER_CHART_DEMO_KEYS.yKey : (props.yKey ?? 'y');
  const labelKey = usesDemo ? CONNECTED_SCATTER_CHART_DEMO_KEYS.labelKey : props.labelKey;
  const arrows = props.arrows !== false;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const xName = accessorName(xKey, 'x');
  const yName = accessorName(yKey, 'y');

  const points = readPathPoints(CHART, data, { x: xKey, y: yKey, ...(labelKey === undefined ? {} : { label: labelKey }) });
  checkCeiling(CHART, yName, 'points', points.length);
  const base = modelBase(CHART, props, context, 'Connected scatter', {
    columns: [...(labelKey === undefined ? [] : [accessorName(labelKey, 'label')]), xName, yName],
    rows: data.map((datum, index) => [
      ...(labelKey === undefined ? [] : [formatValue(read(labelKey, datum, index), locale, { useGrouping: false, maximumFractionDigits: 2 })]),
      formatValue(read(xKey, datum, index), locale, numberFormat),
      formatValue(read(yKey, datum, index), locale, numberFormat),
    ]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = cartesianPlot(card.area);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (points.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const inner = inset(plot, HEIGHTEN_RADIUS);
  const axis = valueAxis(inner, extent(points.map((p) => p.y)) ?? [0, 0], { chart: CHART, property: yName, padding: context.domainPadding, locale, numberFormat, zero: false });
  const y = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  // The marks start after the value labels at the plot's left edge, as the scatter's do.
  const gutter = Math.min(Math.max(0, ...axis.labels.map((l) => l.text.length * TICK_CHAR)) + 6, inner.width / 3);
  const x = linearScale(extent(points.map((p) => p.x)) ?? [0, 0], [inner.x + gutter, inner.x + inner.width], { chart: CHART, property: xName, padding: context.domainPadding, nice: true });
  for (const tick of x.ticks(4)) {
    labels.push({ x: x(tick), y: card.area.y + card.area.height - 5, text: formatNumber(tick, locale, numberFormat), kind: 'tick', part: 'axis', anchor: 'middle' });
  }

  const at = points.map((p) => ({ x: x(p.x), y: y(p.y) }));
  strokes.push({ d: at.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(''), role: 'encoding', part: 'ink' });
  // A chevron at each segment's middle, pointing the way the path runs: exact, encoding.
  if (arrows) {
    for (let i = 1; i < at.length; i += 1) {
      const a = at[i - 1] as { x: number; y: number };
      const b = at[i] as { x: number; y: number };
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length < CHEVRON_ROOM) continue;
      const ux = dx / length;
      const uy = dy / length;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const bx = mx - ux * CHEVRON_BACK;
      const by = my - uy * CHEVRON_BACK;
      strokes.push({ d: `M${bx - uy * CHEVRON_HALF},${by + ux * CHEVRON_HALF}L${mx},${my}L${bx + uy * CHEVRON_HALF},${by - ux * CHEVRON_HALF}`, role: 'encoding', part: 'ink' });
    }
  }
  points.forEach((p, i) => {
    const q = at[i] as { x: number; y: number };
    strokes.push({ d: circlePath(q.x, q.y, DOT_RADIUS), role: 'encoding', part: 'ink' });
    hitAreas.push({ seriesKey: yName, index: p.index, datum: p.datum, value: p.y, x: q.x, y: q.y, box: { x: q.x - DOT_RADIUS, y: q.y - DOT_RADIUS, width: 2 * DOT_RADIUS, height: 2 * DOT_RADIUS } });
  });

  // Labels at both ends always, and where given, unless one would sit on another.
  const placed: { x: number; y: number }[] = [];
  const name = (i: number) => {
    const label = points[i]?.label;
    if (label !== undefined) return label;
    return i === 0 ? 'start' : i === points.length - 1 ? 'end' : undefined;
  };
  const ends = points.length > 1 ? [0, points.length - 1] : [0];
  const order = [...ends, ...points.map((_, i) => i).filter((i) => !ends.includes(i))];
  for (const i of order) {
    const text = name(i);
    const q = at[i] as { x: number; y: number };
    if (text === undefined || placed.some((p) => Math.abs(p.x - q.x) < LABEL_ROOM && Math.abs(p.y - q.y) < LABEL_ROOM / 2)) continue;
    placed.push(q);
    labels.push({ x: q.x + 5, y: q.y - 5, text, kind: 'tick', part: 'axis', anchor: q.x > plot.x + plot.width * 0.8 ? 'end' : 'start' });
  }

  // One heightened element (REQ-442): the path's last point.
  const last = at.at(-1) as { x: number; y: number };
  const mark = circlePath(last.x, last.y, HEIGHTEN_RADIUS);
  strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
  strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });

  const first = points[0] as (typeof points)[number];
  const end = points.at(-1) as (typeof points)[number];
  const description =
    props.description ??
    `${base.name}. A path through ${points.length} points in data order, ${xName} across and ${yName} up; it starts at ${formatNumber(first.x, locale, numberFormat)}, ${formatNumber(first.y, locale, numberFormat)} and ends at ${formatNumber(end.x, locale, numberFormat)}, ${formatNumber(end.y, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `ConnectedScatterChart` recipe (REQ-413): an ordered path through x-y points, with direction marks. */
export const connectedScatterChart: ChartRecipe<ConnectedScatterChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildConnectedScatterChart });
