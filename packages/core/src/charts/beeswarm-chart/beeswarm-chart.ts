import { linearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import { resolveSeed } from '../../render/seed';
import type { BeeswarmChartProps, ChartModel, ChartRecipe, HitArea, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { packSwarm } from '../shared/beeswarm';
import { cardLayout } from '../shared/card';
import { AXIS_BAND, PLOT_INSET, cartesianPlot } from '../shared/cartesian';
import { checkCeiling, checkRadius, readObservations, type Observation } from '../shared/contracts';
import { ROW_LABELS } from '../shared/distribution';
import { accessorName, circlePath, fitText, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { BEESWARM_CHART_DEMO, BEESWARM_CHART_DEMO_KEYS } from './demo';

const CHART = 'BeeswarmChart';
const DEFAULT_RADIUS = 3;
/** A swarm that outgrows its band is packed again at a smaller radius, at most this many times. */
const FIT_ATTEMPTS = 8;
const SHRINK = 0.8;
const MIN_RADIUS = 1;

/** Value order, ties by row: the order points are packed, drawn and walked by keyboard. */
const byValue = (a: Observation, b: Observation) => a.value - b.value || a.index - b.index;

function buildBeeswarmChart(props: BeeswarmChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? BEESWARM_CHART_DEMO;
  const valueKey = usesDemo ? BEESWARM_CHART_DEMO_KEYS.valueKey : (props.valueKey ?? 'value');
  const labelKey = usesDemo ? BEESWARM_CHART_DEMO_KEYS.labelKey : props.labelKey;
  const groupKey = usesDemo ? undefined : props.groupKey;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');
  const labelName = labelKey === undefined ? 'observation' : accessorName(labelKey, 'label');
  const groupName = groupKey === undefined ? undefined : accessorName(groupKey, 'group');

  const { observations, groups } = readObservations(CHART, data, {
    value: valueKey,
    ...(groupKey === undefined ? {} : { group: groupKey }),
    ...(labelKey === undefined ? {} : { label: labelKey }),
  });
  checkCeiling(CHART, valueName, 'points', observations.length);
  const asked = checkRadius(CHART, props.radius) ?? DEFAULT_RADIUS;

  const base = modelBase(CHART, props, context, 'Beeswarm', {
    columns: [labelName, valueName, ...(groupName ? [groupName] : [])],
    rows: data.map((datum, index) => [
      labelKey === undefined ? `#${index + 1}` : formatValue(read(labelKey, datum, index), locale, undefined),
      formatValue(read(valueKey, datum, index), locale, numberFormat),
      ...(groupKey ? [formatValue(read(groupKey, datum, index), locale, undefined)] : []),
    ]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const area = card.area;
  const grouped = groupKey !== undefined;
  const plot: Rect = grouped
    ? { x: area.x + ROW_LABELS, y: area.y + PLOT_INSET, width: Math.max(area.width - ROW_LABELS - PLOT_INSET, 1), height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1) }
    : cartesianPlot(area);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  const range = extent(observations.map((o) => o.value));
  if (range === undefined) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  // The value axis runs inside the plot by the radius, so no point is clipped at the ends.
  const x = linearScale(range, [plot.x + asked, plot.x + plot.width - asked], { chart: CHART, property: valueName, padding: context.domainPadding, nice: true });
  for (const tick of x.ticks(4)) {
    labels.push({ x: x(tick), y: area.y + area.height - 5, text: formatNumber(tick, locale, numberFormat), kind: 'tick', part: 'axis', anchor: 'middle' });
  }
  strokes.push({ d: `M${plot.x},${plot.y + plot.height}H${plot.x + plot.width}`, role: 'ornament', part: 'rule' });

  // The side the first point off the axis takes is the seed's (DD-030).
  const side = (resolveSeed(props.seed, context.id) & 1) === 0 ? 1 : -1;
  const band = plot.height / groups.length;
  const placed: { o: Observation; x: number; y: number; r: number }[] = [];
  groups.forEach((group, g) => {
    const members = observations.filter((o) => o.group === group).sort(byValue);
    const xs = members.map((o) => x(o.value));
    const centre = plot.y + band * (g + 0.5);
    // A swarm taller than its band is packed again at a smaller radius: points never overlap.
    let r = asked;
    let ys = packSwarm(xs, r, side);
    for (let attempt = 0; attempt < FIT_ATTEMPTS && r > MIN_RADIUS && Math.max(0, ...ys.map((y) => (y < 0 ? -y : y))) + r > band / 2; attempt += 1) {
      r = Math.max(r * SHRINK, MIN_RADIUS);
      ys = packSwarm(xs, r, side);
    }
    members.forEach((o, k) => placed.push({ o, x: xs[k] as number, y: centre + (ys[k] as number), r }));
    if (grouped) labels.push({ x: area.x + PLOT_INSET, y: centre + 4, text: fitText(group, ROW_LABELS - PLOT_INSET - 6), kind: 'tick', part: 'axis', anchor: 'start' });
  });

  for (const p of [...placed].sort((a, b) => byValue(a.o, b.o))) {
    strokes.push({ d: circlePath(p.x, p.y, p.r), role: 'encoding', part: 'ink' });
    hitAreas.push({ seriesKey: valueName, index: p.o.index, datum: p.o.datum, value: p.o.value, x: p.x, y: p.y, box: { x: p.x - p.r, y: p.y - p.r, width: 2 * p.r, height: 2 * p.r } });
  }

  // One heightened element (REQ-442): the maximum observation, the point itself.
  const top = [...placed].sort((a, b) => byValue(a.o, b.o)).at(-1);
  if (top) strokes.push({ d: circlePath(top.x, top.y, top.r), role: 'encoding', part: 'heighten', paint: 'fill' });

  const description =
    props.description ??
    `${base.name}. Beeswarm of ${observations.length} ${valueName} observations${grouped ? ` in ${groups.length} groups` : ''}, one point each, packed without overlap; from ${formatNumber(range[0], locale, numberFormat)} to ${formatNumber(range[1], locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `BeeswarmChart` recipe (REQ-405): one point per observation, packed without overlap. */
export const beeswarmChart: ChartRecipe<BeeswarmChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildBeeswarmChart });
