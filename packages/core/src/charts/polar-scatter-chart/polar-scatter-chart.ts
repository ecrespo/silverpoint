import type { ChartModel, ChartRecipe, HitArea, PolarScatterChartProps, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { checkCeiling, checkPositive, readPolarPoints } from '../shared/contracts';
import { accessorName, circlePath, formatNumber, formatValue, read } from '../shared/format';
import { RIM_LABELS, pointAt, polarFrame } from '../shared/polar';
import { angleOf, angleSpokes, radialAxis } from '../shared/radial';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { POLAR_SCATTER_CHART_DEMO, POLAR_SCATTER_CHART_DEMO_KEYS } from './demo';

const CHART = 'PolarScatterChart';
const DOT_RADIUS = 2.5;
/** With a size key, a point's area is its size: radii from the smallest to the largest here. */
const MIN_RADIUS = 1.5;
const MAX_RADIUS = 7;
const DEGREES = 360;

function buildPolarScatterChart(props: PolarScatterChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? POLAR_SCATTER_CHART_DEMO;
  const angleKey = usesDemo ? POLAR_SCATTER_CHART_DEMO_KEYS.angleKey : (props.angleKey ?? 'angle');
  const radiusKey = usesDemo ? POLAR_SCATTER_CHART_DEMO_KEYS.radiusKey : (props.radiusKey ?? 'radius');
  const sizeKey = usesDemo ? undefined : props.sizeKey;
  // `period` says the angle's units, so it goes with the data (REQ-099).
  const period = (usesDemo ? undefined : checkPositive(CHART, 'period', props.period)) ?? DEGREES;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const angleName = accessorName(angleKey, 'angle');
  const radiusName = accessorName(radiusKey, 'radius');

  const points = readPolarPoints(CHART, data, { angle: angleKey, value: radiusKey, ...(sizeKey === undefined ? {} : { size: sizeKey }) }, period);
  checkCeiling(CHART, radiusName, 'points', points.length);
  const base = modelBase(CHART, props, context, 'Polar scatter', {
    columns: [angleName, radiusName, ...(sizeKey === undefined ? [] : [accessorName(sizeKey, 'size')])],
    rows: data.map((datum, index) => [
      formatValue(read(angleKey, datum, index), locale, { maximumFractionDigits: 2 }),
      formatValue(read(radiusKey, datum, index), locale, numberFormat),
      ...(sizeKey === undefined ? [] : [formatValue(read(sizeKey, datum, index), locale, numberFormat)]),
    ]),
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
  const axis = radialAxis(frame, Math.max(...points.map((p) => p.value)), { chart: CHART, property: radiusName, locale, numberFormat });
  const spokes = angleSpokes(frame, period, 0, locale);
  strokes.push(...spokes.strokes, ...axis.strokes);
  labels.push(...spokes.labels, ...axis.labels);

  // A point's area is its size, when there is one: the radius goes with its square root.
  const largestSize = Math.max(0, ...points.map((p) => (p.size !== undefined && p.size > 0 ? p.size : 0)));
  const radiusOf = (s: number | undefined) => (sizeKey === undefined || s === undefined || s <= 0 || largestSize <= 0 ? DOT_RADIUS : Math.max(MAX_RADIUS * Math.sqrt(s / largestSize), MIN_RADIUS));
  // In angle order, ties by row: the order the keyboard walks round the circle.
  const ordered = [...points].sort((a, b) => a.angle - b.angle || a.index - b.index);
  const marks = ordered.map((p) => {
    const q = pointAt(frame, angleOf(p.angle, period, 0), axis.scale(p.value));
    const r = radiusOf(p.size);
    const d = circlePath(q.x, q.y, r);
    strokes.push({ d, role: 'encoding', part: 'ink' });
    hitAreas.push({ seriesKey: radiusName, index: p.index, datum: p.datum, value: p.value, x: q.x, y: q.y, box: { x: q.x - r, y: q.y - r, width: 2 * r, height: 2 * r } });
    return d;
  });

  // One heightened element (REQ-442): the point of largest radius, the point itself.
  let far = 0;
  ordered.forEach((p, i) => {
    if (p.value > (ordered[far] as (typeof ordered)[number]).value) far = i;
  });
  strokes.push({ d: marks[far] as string, role: 'encoding', part: 'heighten', paint: 'fill' });

  const farthest = ordered[far] as (typeof ordered)[number];
  const description =
    props.description ??
    `${base.name}. Polar scatter of ${points.length} points, ${angleName} round the circle (one turn being ${formatNumber(period, locale, undefined)}) and ${radiusName} out from the centre${sizeKey === undefined ? '' : `, each point's area its ${accessorName(sizeKey, 'size')}`}; the farthest at ${formatNumber(farthest.value, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `PolarScatterChart` recipe (REQ-421): points over angle × radius, unbinned. */
export const polarScatterChart: ChartRecipe<PolarScatterChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildPolarScatterChart });
