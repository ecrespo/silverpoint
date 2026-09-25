import type { ChartModel, ChartRecipe, DonutChartProps, HitArea, RecipeContext, Stroke, TextLabel, ToneLevel } from '../../types';
import { cardLayout } from '../shared/card';
import { warnValue } from '../shared/cells';
import { accessorName, formatNumber, formatValue } from '../shared/format';
import { checkSectors, pointAt, polarFrame, readSectors, ringTones, sectorLegend, sectorPath } from '../shared/polar';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { DONUT_CHART_DEMO } from './demo';

const CHART = 'DonutChart';
/** Inner radius as a share of the outer: room for the central readout. */
const HOLE = 0.62;
/** The legend sits beside the ring when the area is at least this much wider than tall. */
const LEGEND_ASPECT = 1.5;
const LEGEND_GAP = 14;

function buildDonutChart(props: DonutChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? DONUT_CHART_DEMO;
  const nameKey = usesDemo ? 'name' : (props.nameKey ?? 'name');
  const valueKey = usesDemo ? 'value' : (props.valueKey ?? 'value');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');
  checkSectors(CHART, valueName, data.length);

  const sectors = readSectors(data, nameKey, valueKey, CHART, locale);
  const total = sectors.reduce((sum, s) => sum + s.value, 0);
  const share = (value: number) => (total > 0 ? `${formatNumber((value / total) * 100, locale, { maximumFractionDigits: 0 })}%` : '—');
  const byRow = new Map(sectors.map((s) => [s.index, s]));

  const base = modelBase(CHART, props, context, 'Donut chart', {
    columns: [accessorName(nameKey, 'name'), valueName, 'share'],
    rows: data.map((_, index) => {
      const s = byRow.get(index);
      return s ? [s.name, formatValue(s.value, locale, numberFormat), share(s.value)] : ['—', '—', '—'];
    }),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = card.area;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (sectors.length > 0 && total <= 0) warnValue(CHART, valueName, 'Every value is zero; a donut has nothing to divide.');
  if (sectors.length === 0 || total <= 0) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const withLegend = (props.legend ?? true) && plot.width >= plot.height * LEGEND_ASPECT;
  const ringArea = withLegend ? { x: plot.x, y: plot.y, width: plot.height, height: plot.height } : plot;
  const frame = polarFrame(ringArea);
  const inner = frame.radius * HOLE;

  const tones = ringTones(sectors.map((s) => s.value));
  let start = 0;
  sectors.forEach((s, k) => {
    const end = start + (s.value / total) * 2 * Math.PI;
    const tone = tones[k] as ToneLevel;
    const d = sectorPath(frame, { inner, outer: frame.radius, start, end });
    if (d) strokes.push({ d, role: 'encoding', part: 'ink', tone });
    const middle = pointAt(frame, (start + end) / 2, (inner + frame.radius) / 2);
    hitAreas.push({ seriesKey: valueName, index: s.index, datum: s.datum, value: s.value, x: middle.x, y: middle.y });
    start = end;
  });

  const centre = props.centerValue ?? formatNumber(total, locale, numberFormat);
  const hasLabel = props.centerLabel !== undefined && props.centerLabel !== '';
  labels.push({ x: frame.cx, y: frame.cy + (hasLabel ? 2 : 6), text: typeof centre === 'number' ? formatNumber(centre, locale, numberFormat) : centre, kind: 'value', part: 'text', anchor: 'middle' });
  if (hasLabel) labels.push({ x: frame.cx, y: frame.cy + 16, text: props.centerLabel as string, kind: 'tick', part: 'axis', anchor: 'middle' });

  if (withLegend) {
    const x = ringArea.x + ringArea.width + LEGEND_GAP;
    const key = sectorLegend(
      { x, y: plot.y, width: Math.max(plot.x + plot.width - x, 1), height: plot.height },
      sectors.map((s, k) => ({ name: s.name, share: share(s.value), tone: tones[k] as ToneLevel })),
    );
    strokes.push(...key.strokes);
    labels.push(...key.labels);
  }

  const largest = sectors.reduce((a, b) => (b.value > a.value ? b : a));
  const description =
    props.description ??
    `${base.name}. Donut of ${sectors.length} sectors totalling ${formatNumber(total, locale, numberFormat)}; the largest is ${largest.name} at ${share(largest.value)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `DonutChart` recipe (REQ-075): sectors ∝ value, a central readout, a legend with shares. */
export const donutChart: ChartRecipe<DonutChartProps> = /* @__PURE__ */ Object.freeze({ name: 'DonutChart', build: buildDonutChart });
