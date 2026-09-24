import type { ChartModel, ChartRecipe, HeatmapChartProps, HitArea, RecipeContext, Stroke, TextLabel } from '../../types';
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
      values: Array.isArray(raw) ? (raw as readonly unknown[]).map(finite) : [],
    };
  });
  const lengths = rows.map((r) => r.values.length);
  // Rows of unequal length use the shortest (Data Model §2.4).
  const columnCount = lengths.length > 0 ? Math.min(...lengths) : 0;
  const columns = Array.from({ length: columnCount }, (_, i) => `#${i + 1}`);

  const base = modelBase(CHART, props, context, 'Heatmap', {
    columns: [accessorName(labelKey, 'label'), ...columns],
    rows: rows.map((r) => [r.label, ...columns.map((_, c) => formatValue(r.values[c], locale, numberFormat))]),
  });

  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = inset(card.area, PLOT_INSET);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  const drawable = rows.some((r) => r.values.slice(0, columnCount).some((v) => v !== undefined));
  if (!drawable) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, rows.length === 0);
  }
  if (lengths.some((length) => length !== columnCount)) {
    warnValue(CHART, accessorName(valuesKey, 'values'), `Rows have ${Math.min(...lengths)} to ${Math.max(...lengths)} values; the first ${columnCount} of each are drawn.`);
  }

  const cellWidth = (plot.width - LABEL_COLUMN) / columnCount;
  const cellHeight = plot.height / rows.length;
  let omitted = 0;

  for (const row of rows) {
    const top = plot.y + row.index * cellHeight;
    labels.push({ x: plot.x, y: top + cellHeight / 2 + 4, text: row.label, kind: 'tick', part: 'text', anchor: 'start' });
    for (let c = 0; c < columnCount; c += 1) {
      const value = row.values[c];
      const cell = inset({ x: plot.x + LABEL_COLUMN + c * cellWidth, y: top, width: cellWidth, height: cellHeight }, CELL_GAP / 2);
      const cx = cell.x + cell.width / 2;
      const cy = cell.y + cell.height / 2;
      if (value === undefined) {
        omitted += 1;
        labels.push({ x: cx, y: cy + 4, text: '—', kind: 'tick', part: 'axis', anchor: 'middle' });
        continue;
      }
      const tone = toneOf(value / scaleMax);
      strokes.push({ d: rectPath(cell), role: 'encoding', part: 'ink', ...(tone > 0 ? { tone } : {}) });
      // The tone is quantised; the printed value carries it exactly (REQ-124).
      labels.push({ x: cx, y: cy + 4, text: formatNumber(value, locale, numberFormat), kind: 'tick', part: 'text', anchor: 'middle' });
      hitAreas.push({ seriesKey: columns[c] as string, index: row.index, datum: row.datum, value, x: cx, y: cy, box: cell });
    }
  }
  if (omitted > 0) warnValue(CHART, accessorName(valuesKey, 'values'), `${omitted} cells have no finite value and are left blank.`);

  const values = hitAreas.map((h) => h.value);
  const description =
    props.description ??
    `${base.name}. Heatmap of ${rows.length} rows by ${columnCount} columns, toned against ${formatNumber(scaleMax, locale, numberFormat)}; values range from ${formatNumber(Math.min(...values), locale, numberFormat)} to ${formatNumber(Math.max(...values), locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `HeatmapChart` recipe (REQ-084): labelled rows of cells, toned by value and printed. */
export const heatmapChart: ChartRecipe<HeatmapChartProps> = Object.freeze({
  name: CHART,
  build: buildHeatmapChart,
});
