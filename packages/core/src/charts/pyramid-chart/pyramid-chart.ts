import type { ChartModel, ChartRecipe, HitArea, PyramidChartProps, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { finite, inset, rectPath, toneLevel, toneOf, warnValue } from '../shared/cells';
import { accessorName, formatCategory, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { PYRAMID_CHART_DEMO } from './demo';

const CHART = 'PyramidChart';
const PLOT_INSET = 6;
/** Room at the left for the tier labels and at the right for the values. */
const LABEL_COLUMN = 72;
const VALUE_COLUMN = 48;
const TIER_GAP = 2;

function buildPyramidChart(props: PyramidChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? PYRAMID_CHART_DEMO;
  const labelKey = usesDemo ? 'label' : (props.labelKey ?? 'label');
  const widthKey = usesDemo ? 'width' : (props.widthKey ?? 'width');
  const toneKey = usesDemo ? undefined : props.toneKey;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const widthName = accessorName(widthKey, 'width');
  const toneName = toneKey === undefined ? undefined : accessorName(toneKey, 'tone');

  const rows = data.map((datum, index) => ({
    index,
    datum,
    label: formatCategory(read(labelKey, datum, index), locale),
    width: finite(read(widthKey, datum, index)),
    tone: toneKey === undefined ? undefined : finite(read(toneKey, datum, index)),
  }));

  const base = modelBase(CHART, props, context, 'Pyramid chart', {
    columns: [accessorName(labelKey, 'label'), widthName, ...(toneName ? [toneName] : [])],
    rows: rows.map((r) => [
      r.label,
      formatValue(r.width, locale, numberFormat),
      ...(toneName ? [formatValue(r.tone, locale, undefined)] : []),
    ]),
  });

  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = inset(card.area, PLOT_INSET);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (rows.length === 0) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, true);
  }

  const track = { x: plot.x + LABEL_COLUMN, width: Math.max(plot.width - LABEL_COLUMN - VALUE_COLUMN, 1) };
  const centre = track.x + track.width / 2;
  const tierHeight = plot.height / rows.length;
  let previous = Number.NEGATIVE_INFINITY;
  let monotonic = true;

  for (const row of rows) {
    const top = plot.y + row.index * tierHeight;
    const baseline = top + tierHeight / 2 + 4;
    labels.push({ x: plot.x, y: baseline, text: row.label, kind: 'tick', part: 'text', anchor: 'start' });
    if (row.width === undefined) {
      warnValue(CHART, widthName, `Tier ${row.index} has no finite width; it is omitted.`);
      continue;
    }
    if (row.width < previous) monotonic = false;
    previous = row.width;
    const percent = Math.min(Math.max(row.width, 0), 100);
    if (percent !== row.width) warnValue(CHART, widthName, `Tier ${row.index} is ${row.width}; it is drawn at the nearest end of 0-100.`);

    const width = (percent / 100) * track.width;
    const tier = { x: centre - width / 2, y: top + TIER_GAP / 2, width, height: Math.max(tierHeight - TIER_GAP, 0) };
    // Without a toneKey the tone repeats the width, which the tier's length and label already say.
    const tone = row.tone === undefined ? toneOf(percent / 100) : toneLevel(row.tone);
    if (row.tone !== undefined && tone !== row.tone) {
      warnValue(CHART, toneName ?? 'tone', `Tier ${row.index} has tone ${row.tone}; it is drawn at level ${tone}.`);
    }
    if (width > 0) strokes.push({ d: rectPath(tier), role: 'encoding', part: 'ink', ...(tone > 0 ? { tone } : {}) });
    const right = plot.x + plot.width;
    labels.push({ x: right, y: baseline, text: formatNumber(row.width, locale, numberFormat), kind: 'tick', part: 'axis', anchor: 'end' });
    // A consumer tone is information of its own, so it is printed as well as hatched (REQ-124).
    if (row.tone !== undefined) {
      labels.push({ x: right, y: baseline + 11, text: `tone ${tone}`, kind: 'tick', part: 'axis', anchor: 'end' });
    }
    hitAreas.push({ seriesKey: widthName, index: row.index, datum: row.datum, value: row.width, x: centre, y: tier.y + tier.height / 2, box: tier });
  }

  if (!monotonic) warnValue(CHART, widthName, 'The widths do not increase from the top tier down; the pyramid is drawn as given.');

  const description =
    props.description ?? `${base.name}. Pyramid of ${rows.length} tiers, from ${rows[0]?.label} at the top to ${rows[rows.length - 1]?.label} at the base; width on a 0 to 100 scale.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `PyramidChart` recipe (REQ-070): stacked, centred tiers whose width encodes the value. */
export const pyramidChart: ChartRecipe<PyramidChartProps> = /* @__PURE__ */ Object.freeze({
  name: CHART,
  build: buildPyramidChart,
});
