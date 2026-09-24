import type { ChartModel, ChartRecipe, HitArea, PolarBarChartProps, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { warnValue } from '../shared/cells';
import { accessorName, formatNumber, formatValue } from '../shared/format';
import { arcPath, checkSectors, pointAt, polarFrame, readSectors, RIM_LABELS, rimLabels, sectorPath } from '../shared/polar';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { POLAR_BAR_CHART_DEMO } from './demo';

const CHART = 'PolarBarChart';
/** Radius of the hole the bars grow out from, as a share of the outer radius. */
const HOLE = 0.22;
/** Share of each slot left empty between bars. */
const SLOT_GAP = 0.14;

function buildPolarBarChart(props: PolarBarChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? POLAR_BAR_CHART_DEMO;
  const nameKey = usesDemo ? 'name' : (props.nameKey ?? 'name');
  const valueKey = usesDemo ? 'value' : (props.valueKey ?? 'value');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');
  checkSectors(CHART, valueName, data.length);

  const bars = readSectors(data, nameKey, valueKey, CHART, locale);
  const byRow = new Map(bars.map((s) => [s.index, s]));
  const base = modelBase(CHART, props, context, 'Polar bar chart', {
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

  const largest = Math.max(0, ...bars.map((b) => b.value));
  if (bars.length > 0 && largest <= 0) warnValue(CHART, valueName, 'Every value is zero; no bar has a length.');
  if (bars.length === 0 || largest <= 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const frame = polarFrame(plot, RIM_LABELS);
  const hole = frame.radius * HOLE;
  const reach = frame.radius - hole;
  const slot = (2 * Math.PI) / bars.length;
  strokes.push({ d: arcPath(frame, hole, 0, 2 * Math.PI), role: 'ornament', part: 'rule' });

  bars.forEach((b, k) => {
    const start = k * slot + (slot * SLOT_GAP) / 2;
    const end = (k + 1) * slot - (slot * SLOT_GAP) / 2;
    // Length out from the hole is proportional to the value: a bar, bent around the circle.
    const tip = hole + (b.value / largest) * reach;
    const d = sectorPath(frame, { inner: hole, outer: tip, start, end });
    if (d && tip > hole) strokes.push({ d, role: 'encoding', part: 'ink', tone: 2 });
    const at = pointAt(frame, (start + end) / 2, tip);
    hitAreas.push({ seriesKey: valueName, index: b.index, datum: b.datum, value: b.value, x: at.x, y: at.y });
  });
  labels.push(...rimLabels(frame, bars.map((b, k) => ({ angle: (k + 0.5) * slot, text: b.name }))));

  const top = bars.reduce((a, b) => (b.value > a.value ? b : a));
  const description =
    props.description ?? `${base.name}. Polar bars for ${bars.length} categories around the circle; the longest is ${top.name} at ${formatNumber(top.value, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `PolarBarChart` recipe (REQ-077): equal slots around the turn, bar length ∝ value. */
export const polarBarChart: ChartRecipe<PolarBarChartProps> = /* @__PURE__ */ Object.freeze({ name: 'PolarBarChart', build: buildPolarBarChart });
