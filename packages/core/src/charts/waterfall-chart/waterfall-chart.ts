import type { ChartModel, ChartRecipe, Datum, HitArea, Rect, RecipeContext, Stroke, TextLabel, WaterfallChartProps } from '../../types';
import { cardLayout } from '../shared/card';
import { cartesianPlot, categoryAxis, categoryLabels, checkCount, valueAxis } from '../shared/cartesian';
import { finite, rectPath, warnValue } from '../shared/cells';
import { accessorName, formatCategory, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { WATERFALL_CHART_DEMO } from './demo';

const CHART = 'WaterfallChart';
const BAR_FILL = 0.62;

interface Step {
  readonly index: number;
  readonly datum: Datum;
  readonly kind: 'total' | 'delta';
  readonly value: number;
  /** Running total before and after this step. */
  readonly from: number;
  readonly to: number;
}

function buildWaterfallChart(props: WaterfallChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? WATERFALL_CHART_DEMO;
  const stepKey = usesDemo ? 'step' : (props.stepKey ?? 'step');
  const baseKey = usesDemo ? 'base' : (props.baseKey ?? 'base');
  const deltaKey = usesDemo ? 'delta' : (props.deltaKey ?? 'delta');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const baseName = accessorName(baseKey, 'base');
  const deltaName = accessorName(deltaKey, 'delta');

  // A total starts at zero and resets the running total; a delta floats from it (API Spec §7).
  const steps: Step[] = [];
  let running = 0;
  let skipped = 0;
  data.forEach((datum, index) => {
    const total = finite(read(baseKey, datum, index));
    const delta = finite(read(deltaKey, datum, index));
    if (total !== undefined) {
      if (delta !== undefined) warnValue(CHART, deltaName, `Row ${index} has both a ${baseName} and a ${deltaName}; a total resets the running total, so its ${deltaName} is ignored.`);
      steps.push({ index, datum, kind: 'total', value: total, from: 0, to: total });
      running = total;
    } else if (delta !== undefined) {
      steps.push({ index, datum, kind: 'delta', value: delta, from: running, to: running + delta });
      running += delta;
    } else {
      skipped += 1;
    }
  });
  checkCount(CHART, deltaName, data.length);
  const stepName = accessorName(stepKey, 'step');
  const stepLabels = data.map((datum, index) => formatCategory(read(stepKey, datum, index), locale));
  const signed = (value: number) => formatNumber(value, locale, { ...(numberFormat ?? { maximumFractionDigits: 2 }), signDisplay: 'always' });

  const base = modelBase(CHART, props, context, 'Waterfall chart', {
    columns: [stepName, baseName, deltaName],
    rows: data.map((datum, index) => [
      stepLabels[index] ?? '',
      formatValue(finite(read(baseKey, datum, index)), locale, numberFormat),
      formatValue(finite(read(deltaKey, datum, index)), locale, numberFormat),
    ]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = cartesianPlot(card.area);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (skipped > 0 && data.length > 0) warnValue(CHART, deltaName, `${skipped} rows have neither a finite ${baseName} nor a finite ${deltaName}; they are omitted.`);
  if (steps.length === 0) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const levels = steps.flatMap((s) => [s.from, s.to]);
  const axis = valueAxis(plot, [Math.min(...levels), Math.max(...levels)], { chart: CHART, property: deltaName, padding: context.domainPadding, locale, numberFormat });
  const y = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  const categories = categoryAxis(stepLabels, plot, { chart: CHART, property: stepName, padding: context.domainPadding, numeric: false, paddingInner: 0.3, paddingOuter: 0.15 });
  const width = categories.bandwidth * BAR_FILL;

  steps.forEach((step, n) => {
    const top = y(Math.max(step.from, step.to));
    const bar: Rect = { x: categories.at(step.index) - width / 2, y: top, width, height: y(Math.min(step.from, step.to)) - top };
    // Rises, falls and totals differ by tone, but also by their printed sign and their position (REQ-124).
    const tone = step.kind === 'total' ? 3 : step.value >= 0 ? 1 : 2;
    if (bar.height > 0) strokes.push({ d: rectPath(bar), role: 'encoding', part: 'ink', tone });
    const next = steps[n + 1];
    if (next?.kind === 'delta') {
      strokes.push({ d: `M${bar.x + width},${y(step.to)}H${categories.at(next.index) - width / 2}`, role: 'ornament', part: 'grid', dash: 'dotted' });
    }
    labels.push({
      x: categories.at(step.index),
      y: top - 3,
      text: step.kind === 'total' ? formatNumber(step.value, locale, numberFormat) : signed(step.value),
      kind: 'tick',
      part: 'text',
      anchor: 'middle',
    });
    hitAreas.push({
      seriesKey: step.kind === 'total' ? baseName : deltaName,
      index: step.index,
      datum: step.datum,
      value: step.value,
      x: categories.at(step.index),
      y: y(step.to),
      box: bar,
      cell: { column: n, row: 0 },
    });
  });
  labels.push(...categoryLabels(stepLabels, categories.at, card.area, plot));

  const description =
    props.description ?? `${base.name}. Waterfall of ${steps.length} steps, ending at ${formatNumber(running, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `WaterfallChart` recipe (REQ-067): totals from zero and signed deltas floating on the running total. */
export const waterfallChart: ChartRecipe<WaterfallChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildWaterfallChart });
