import type { ChartModel, ChartRecipe, HitArea, PolarLineChartProps, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { finite } from '../shared/cells';
import { checkCeiling, checkPositive, readPolarPoints } from '../shared/contracts';
import { accessorName, circlePath, formatNumber, formatValue, read } from '../shared/format';
import { RIM_LABELS, pointAt, polarFrame } from '../shared/polar';
import { angleOf, angleSpokes, radialAxis } from '../shared/radial';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { POLAR_LINE_CHART_DEMO, POLAR_LINE_CHART_DEMO_KEYS } from './demo';

const CHART = 'PolarLineChart';
const DOT_RADIUS = 2.5;
const HEIGHTEN_RADIUS = 3.5;
/** The turn when no `period` is given: degrees (Data Model §2.21). */
const DEGREES = 360;

function buildPolarLineChart(props: PolarLineChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? POLAR_LINE_CHART_DEMO;
  const angleKey = usesDemo ? POLAR_LINE_CHART_DEMO_KEYS.angleKey : (props.angleKey ?? 'angle');
  const valueKey = usesDemo ? POLAR_LINE_CHART_DEMO_KEYS.valueKey : (props.valueKey ?? 'value');
  // `period` says the angle's units, so it goes with the data (REQ-099); given, the line closes.
  const given = usesDemo ? POLAR_LINE_CHART_DEMO_KEYS.period : checkPositive(CHART, 'period', props.period);
  const period = given ?? DEGREES;
  const closed = given !== undefined;
  const startAngle = finite(props.startAngle) ?? 0;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const angleName = accessorName(angleKey, 'angle');
  const valueName = accessorName(valueKey, 'value');

  const points = readPolarPoints(CHART, data, { angle: angleKey, value: valueKey }, period);
  checkCeiling(CHART, valueName, 'points', points.length);
  const base = modelBase(CHART, props, context, 'Polar line', {
    columns: [angleName, valueName],
    rows: data.map((datum, index) => [formatValue(read(angleKey, datum, index), locale, { maximumFractionDigits: 2 }), formatValue(read(valueKey, datum, index), locale, numberFormat)]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = card.area;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (points.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const frame = polarFrame(plot, RIM_LABELS);
  const axis = radialAxis(frame, Math.max(...points.map((p) => p.value)), { chart: CHART, property: valueName, locale, numberFormat });
  const spokes = angleSpokes(frame, period, startAngle, locale);
  strokes.push(...spokes.strokes, ...axis.strokes);
  labels.push(...spokes.labels, ...axis.labels);

  // In angle order, ties by row: the line runs round the circle, closing when the angle is cyclic.
  const ordered = [...points].sort((a, b) => a.angle - b.angle || a.index - b.index);
  const at = ordered.map((p) => pointAt(frame, angleOf(p.angle, period, startAngle), axis.scale(p.value)));
  strokes.push({ d: at.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join('') + (closed && at.length > 2 ? 'Z' : ''), role: 'encoding', part: 'ink' });
  ordered.forEach((p, i) => {
    const q = at[i] as { x: number; y: number };
    strokes.push({ d: circlePath(q.x, q.y, DOT_RADIUS), role: 'encoding', part: 'ink' });
    hitAreas.push({ seriesKey: valueName, index: p.index, datum: p.datum, value: p.value, x: q.x, y: q.y });
  });

  // One heightened element (REQ-442): the maximum point.
  let top = 0;
  ordered.forEach((p, i) => {
    if (p.value > (ordered[top] as (typeof ordered)[number]).value) top = i;
  });
  const peak = at[top] as { x: number; y: number };
  const mark = circlePath(peak.x, peak.y, HEIGHTEN_RADIUS);
  strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
  strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });

  const best = ordered[top] as (typeof ordered)[number];
  const description =
    props.description ??
    `${base.name}. Polar line of ${points.length} ${valueName} values by ${angleName}, one turn being ${formatNumber(period, locale, undefined)}${closed ? ', closed' : ''}; radius from 0, the maximum ${formatNumber(best.value, locale, numberFormat)} at ${formatNumber(best.angle, locale, { maximumFractionDigits: 2 })}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `PolarLineChart` recipe (REQ-420): a line over angle × radius, closed when the angle is cyclic. */
export const polarLineChart: ChartRecipe<PolarLineChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildPolarLineChart });
