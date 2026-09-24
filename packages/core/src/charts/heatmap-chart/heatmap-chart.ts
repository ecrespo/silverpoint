import type { ChartModel, ChartRecipe, HeatmapChartProps, HitArea, RecipeContext, Stroke, TextLabel, ToneLevel } from '../../types';
import { cardLayout } from '../shared/card';
import { finite, inset, rectPath, toneOf, warnValue } from '../shared/cells';
import { accessorName, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { HEATMAP_CHART_DEMO } from './demo';

const CHART = 'HeatmapChart';
const PLOT_INSET = 6;
/** Room at the left for the row labels. */
const LABEL_COLUMN = 40;
const CELL_GAP = 2;
/** Advance of one tabular digit at the 9.5 px tick size, with room to spare. */
const DIGIT_WIDTH = 5.5;
const LINE_HEIGHT = 12;
/** Side of a cell, as a share of its slot, per tone, when the values do not fit as text. */
const CELL_SCALE: Readonly<Record<ToneLevel, number>> = { 0: 0.4, 1: 0.55, 2: 0.7, 3: 0.85, 4: 1 };

function buildHeatmapChart(props: HeatmapChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? HEATMAP_CHART_DEMO;
  const labelKey = usesDemo ? 'label' : (props.labelKey ?? 'label');
  const valuesKey = usesDemo ? 'values' : (props.valuesKey ?? 'values');
  const scaleMax = props.scaleMax !== undefined && props.scaleMax > 0 ? props.scaleMax : 100;
  const { locale } = context;
  const numberFormat = props.numberFormat;

  const rows = data.map((datum, index) => {
    const raw = read(valuesKey, datum, index);
    return {
      index,
      datum,
      label: formatValue(read(labelKey, datum, index), locale, undefined),
      values: Array.isArray(raw) ? (raw as readonly unknown[]).map(finite) : undefined,
    };
  });
  // A row without an array of values is drawn blank and warned; it does not set the width.
  const lengths = rows.flatMap((r) => (r.values ? [r.values.length] : []));
  // Rows of unequal length use the shortest (Data Model §2.4).
  const columnCount = lengths.length > 0 ? lengths.reduce((a, b) => Math.min(a, b)) : 0;
  const columns = Array.from({ length: columnCount }, (_, i) => `#${i + 1}`);

  const base = modelBase(CHART, props, context, 'Heatmap', {
    columns: [accessorName(labelKey, 'label'), ...columns],
    rows: rows.map((r) => [r.label, ...columns.map((_, c) => formatValue(r.values?.[c], locale, numberFormat))]),
  });

  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = inset(card.area, PLOT_INSET);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  const valuesName = accessorName(valuesKey, 'values');
  for (const row of rows) {
    if (!row.values) warnValue(CHART, valuesName, `Row ${row.index} has no array of values; it is left blank.`);
  }
  if (lengths.some((length) => length !== columnCount)) {
    warnValue(CHART, valuesName, `Rows have ${columnCount} to ${lengths.reduce((a, b) => Math.max(a, b))} values; the first ${columnCount} of each are drawn.`);
  }
  const drawable = rows.some((r) => r.values?.slice(0, columnCount).some((v) => v !== undefined));
  if (!drawable) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, rows.length === 0);
  }

  const cellWidth = (plot.width - LABEL_COLUMN) / columnCount;
  const cellHeight = plot.height / rows.length;
  // When the widest value cannot be printed inside a cell, the value is carried by the cell's
  // size instead, as the activity grid carries its level, so it never overprints and still
  // survives `precision` mode (REQ-124).
  let widest = 0;
  for (const r of rows) for (const v of r.values ?? []) if (v !== undefined) widest = Math.max(widest, formatNumber(v, locale, numberFormat).length);
  const printed = widest * DIGIT_WIDTH <= cellWidth - CELL_GAP - 2 && cellHeight >= LINE_HEIGHT;
  let omitted = 0;

  for (const row of rows) {
    const top = plot.y + row.index * cellHeight;
    labels.push({ x: plot.x, y: top + cellHeight / 2 + 4, text: row.label, kind: 'tick', part: 'text', anchor: 'start' });
    for (let c = 0; c < columnCount; c += 1) {
      const value = row.values?.[c];
      const cell = inset({ x: plot.x + LABEL_COLUMN + c * cellWidth, y: top, width: cellWidth, height: cellHeight }, CELL_GAP / 2);
      const cx = cell.x + cell.width / 2;
      const cy = cell.y + cell.height / 2;
      if (value === undefined) {
        omitted += 1;
        if (printed) labels.push({ x: cx, y: cy + 4, text: '—', kind: 'tick', part: 'axis', anchor: 'middle' });
        continue;
      }
      const tone = toneOf(value / scaleMax);
      const scale = printed ? 1 : CELL_SCALE[tone];
      const drawn = { x: cx - (cell.width * scale) / 2, y: cy - (cell.height * scale) / 2, width: cell.width * scale, height: cell.height * scale };
      strokes.push({ d: rectPath(drawn), role: 'encoding', part: 'ink', ...(tone > 0 ? { tone } : {}) });
      // The tone is quantised; the printed value, or the cell's size, carries it too (REQ-124).
      if (printed) labels.push({ x: cx, y: cy + 4, text: formatNumber(value, locale, numberFormat), kind: 'tick', part: 'text', anchor: 'middle' });
      hitAreas.push({ seriesKey: columns[c] as string, index: row.index, datum: row.datum, value, x: cx, y: cy, box: cell, cell: { column: c, row: row.index } });
    }
  }
  if (omitted > 0) warnValue(CHART, valuesName, `${omitted} cells have no finite value and are left blank.`);

  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (const h of hitAreas) {
    low = Math.min(low, h.value);
    high = Math.max(high, h.value);
  }
  const description =
    props.description ??
    `${base.name}. Heatmap of ${rows.length} rows by ${columnCount} columns, toned against ${formatNumber(scaleMax, locale, numberFormat)}; values range from ${formatNumber(low, locale, numberFormat)} to ${formatNumber(high, locale, numberFormat)}${printed ? '' : '; values are shown by cell size'}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `HeatmapChart` recipe (REQ-084): labelled rows of cells, toned by value and printed. */
export const heatmapChart: ChartRecipe<HeatmapChartProps> = /* @__PURE__ */ Object.freeze({
  name: CHART,
  build: buildHeatmapChart,
});
