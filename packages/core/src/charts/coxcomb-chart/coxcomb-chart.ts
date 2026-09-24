import type { ChartModel, ChartRecipe, CoxcombChartProps, HitArea, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { warnValue } from '../shared/cells';
import { accessorName, formatNumber, formatValue } from '../shared/format';
import { arcPath, checkSectors, pointAt, polarFrame, readSectors, RIM_LABELS, rimLabels, ringTone, sectorPath } from '../shared/polar';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { COXCOMB_CHART_DEMO } from './demo';

const CHART = 'CoxcombChart';

function buildCoxcombChart(props: CoxcombChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? COXCOMB_CHART_DEMO;
  const nameKey = usesDemo ? 'name' : (props.nameKey ?? 'name');
  const valueKey = usesDemo ? 'value' : (props.valueKey ?? 'value');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');
  checkSectors(CHART, valueName, data.length);

  const sectors = readSectors(data, nameKey, valueKey, CHART, locale);
  const byRow = new Map(sectors.map((s) => [s.index, s]));
  const base = modelBase(CHART, props, context, 'Coxcomb chart', {
    columns: [accessorName(nameKey, 'name'), valueName],
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

  const largest = Math.max(0, ...sectors.map((s) => s.value));
  if (sectors.length > 0 && largest <= 0) warnValue(CHART, valueName, 'Every value is zero; no sector has an area.');
  if (sectors.length === 0 || largest <= 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const frame = polarFrame(plot, RIM_LABELS);
  const start = Number.isFinite(props.startAngle) ? ((props.startAngle as number) * Math.PI) / 180 : 0;
  const slot = (2 * Math.PI) / sectors.length;
  strokes.push({ d: arcPath(frame, frame.radius, 0, 2 * Math.PI), role: 'ornament', part: 'grid' });

  sectors.forEach((s, k) => {
    const from = start + k * slot;
    // Nightingale's rule: the AREA of a sector is proportional to its value, so its radius is ∝ √value.
    const r = frame.radius * Math.sqrt(s.value / largest);
    const d = sectorPath(frame, { inner: 0, outer: r, start: from, end: from + slot });
    if (d) strokes.push({ d, role: 'encoding', part: 'ink', tone: ringTone(k, sectors.length) });
    const at = pointAt(frame, from + slot / 2, r * 0.6);
    hitAreas.push({ seriesKey: valueName, index: s.index, datum: s.datum, value: s.value, x: at.x, y: at.y });
  });
  labels.push(...rimLabels(frame, sectors.map((s, k) => ({ angle: start + (k + 0.5) * slot, text: s.name }))));

  const top = sectors.reduce((a, b) => (b.value > a.value ? b : a));
  const description =
    props.description ??
    `${base.name}. Coxcomb of ${sectors.length} equal-angle sectors whose area is proportional to the value; the largest is ${top.name} at ${formatNumber(top.value, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `CoxcombChart` recipe (REQ-088): Nightingale's polar area — equal angles, area ∝ value. */
export const coxcombChart: ChartRecipe<CoxcombChartProps> = /* @__PURE__ */ Object.freeze({ name: 'CoxcombChart', build: buildCoxcombChart });
