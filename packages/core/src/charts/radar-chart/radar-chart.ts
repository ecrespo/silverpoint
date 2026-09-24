import { linearScale } from '../../scales/scales';
import type { ChartModel, ChartRecipe, HitArea, RadarChartProps, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { warnValue } from '../shared/cells';
import { accessorName, formatNumber, formatValue } from '../shared/format';
import { checkSectors, pointAt, polarFrame, readSectors, RIM_LABELS, rimLabels } from '../shared/polar';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { RADAR_CHART_DEMO } from './demo';

const CHART = 'RadarChart';

const validDomain = (d: readonly [number, number] | undefined): d is readonly [number, number] =>
  !!d && Number.isFinite(d[0]) && Number.isFinite(d[1]) && d[0] < d[1];

function buildRadarChart(props: RadarChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? RADAR_CHART_DEMO;
  const subjectKey = usesDemo ? 'subject' : (props.subjectKey ?? 'subject');
  const valueKey = usesDemo ? 'value' : (props.valueKey ?? 'value');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');
  checkSectors(CHART, valueName, data.length);

  const subjects = readSectors(data, subjectKey, valueKey, CHART, locale);
  const byRow = new Map(subjects.map((s) => [s.index, s]));
  const base = modelBase(CHART, props, context, 'Radar chart', {
    columns: [accessorName(subjectKey, 'subject'), valueName],
    rows: data.map((_, index) => {
      const s = byRow.get(index);
      return s ? [s.name, formatValue(s.value, locale, numberFormat)] : ['—', '—'];
    }),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = card.area;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];
  if (subjects.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const frame = polarFrame(plot, RIM_LABELS);
  const pinned = validDomain(props.domain) ? props.domain : undefined;
  const radius = linearScale(pinned ?? [0, Math.max(...subjects.map((s) => s.value))], [0, frame.radius], {
    chart: CHART,
    property: 'domain',
    padding: context.domainPadding,
    nice: !pinned,
  });
  const [low, high] = radius.domain;
  const slot = (2 * Math.PI) / subjects.length;
  const angleOf = (k: number) => k * slot;

  // Rings at the ticks and one spoke per subject: the grid carries no data (ornament).
  const ring = (r: number) => subjects.map((_, k) => pointAt(frame, angleOf(k), r)).map((p, k) => `${k === 0 ? 'M' : 'L'}${p.x},${p.y}`).join('') + 'Z';
  for (const tick of radius.ticks(4)) {
    const r = radius(tick);
    if (r <= 0) continue;
    strokes.push({ d: ring(r), role: 'ornament', part: 'grid' });
    labels.push({ x: frame.cx + 3, y: frame.cy - r - 2, text: formatNumber(tick, locale, numberFormat), kind: 'tick', part: 'axis', anchor: 'start' });
  }
  subjects.forEach((_, k) => {
    const end = pointAt(frame, angleOf(k), frame.radius);
    strokes.push({ d: `M${frame.cx},${frame.cy}L${end.x},${end.y}`, role: 'ornament', part: 'grid' });
  });

  let outside = 0;
  const vertices = subjects.map((s, k) => {
    const held = Math.min(Math.max(s.value, low), high);
    if (held !== s.value) outside += 1;
    return { s, point: pointAt(frame, angleOf(k), radius(held)) };
  });
  if (outside > 0) warnValue(CHART, valueName, `${outside} values fall outside the domain [${low}, ${high}]; they are held at its edge.`);
  strokes.push({ d: vertices.map((v, k) => `${k === 0 ? 'M' : 'L'}${v.point.x},${v.point.y}`).join('') + 'Z', role: 'encoding', part: 'ink', tone: 1 });
  for (const v of vertices) hitAreas.push({ seriesKey: valueName, index: v.s.index, datum: v.s.datum, value: v.s.value, x: v.point.x, y: v.point.y });
  labels.push(...rimLabels(frame, subjects.map((s, k) => ({ angle: angleOf(k), text: s.name }))));

  const top = subjects.reduce((a, b) => (b.value > a.value ? b : a));
  const bottom = subjects.reduce((a, b) => (b.value < a.value ? b : a));
  const description =
    props.description ??
    `${base.name}. Radar of ${subjects.length} subjects on a scale from ${formatNumber(low, locale, numberFormat)} to ${formatNumber(high, locale, numberFormat)}; highest ${top.name} at ${formatNumber(top.value, locale, numberFormat)}, lowest ${bottom.name} at ${formatNumber(bottom.value, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `RadarChart` recipe (REQ-076): one spoke per subject, a closed polygon of values. */
export const radarChart: ChartRecipe<RadarChartProps> = /* @__PURE__ */ Object.freeze({ name: 'RadarChart', build: buildRadarChart });
