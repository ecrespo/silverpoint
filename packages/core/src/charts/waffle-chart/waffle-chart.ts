import type { ChartModel, ChartRecipe, HitArea, Rect, RecipeContext, Stroke, TextLabel, ToneLevel, WaffleChartProps } from '../../types';
import { cardLayout } from '../shared/card';
import { PLOT_INSET } from '../shared/cartesian';
import { rectPath, warnValue } from '../shared/cells';
import { checkWhole } from '../shared/contracts';
import { accessorName, formatNumber, formatValue } from '../shared/format';
import { checkSectors, readSectors, ringTones, sectorLegend } from '../shared/polar';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { allocateCells } from '../shared/stats';
import { WAFFLE_CHART_DEMO, WAFFLE_CHART_DEMO_KEYS } from './demo';

const CHART = 'WaffleChart';
const DEFAULT_CELLS = 100;
const DEFAULT_COLUMNS = 10;
/** Cells drawn at most: past it a cell is too small to see (the field ceiling, API delta §12). */
const MAX_CELLS = 3600;
/** The gap between cells, as a share of a cell's side. */
const GAP = 0.18;
const LEGEND_GAP = 14;
const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };

function buildWaffleChart(props: WaffleChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? WAFFLE_CHART_DEMO;
  const nameKey = usesDemo ? WAFFLE_CHART_DEMO_KEYS.nameKey : (props.nameKey ?? 'name');
  const valueKey = usesDemo ? WAFFLE_CHART_DEMO_KEYS.valueKey : (props.valueKey ?? 'value');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');
  const cells = Math.min(checkWhole(CHART, 'cells', props.cells, 1) ?? DEFAULT_CELLS, MAX_CELLS);
  const columns = Math.min(checkWhole(CHART, 'columns', props.columns, 1) ?? DEFAULT_COLUMNS, cells);
  checkSectors(CHART, valueName, data.length);

  const sectors = readSectors(data, nameKey, valueKey, CHART, locale);
  const counts = allocateCells(sectors.map((s) => s.value), cells);
  const total = sectors.reduce((sum, s) => sum + s.value, 0);
  const share = (value: number) => (total > 0 ? formatNumber(value / total, locale, PERCENT) : '—');
  const byRow = new Map(sectors.map((s, k) => [s.index, k]));
  const base = modelBase(CHART, props, context, 'Waffle chart', {
    columns: [accessorName(nameKey, 'name'), valueName, 'cells', 'share'],
    rows: data.map((_, index) => {
      const k = byRow.get(index);
      if (k === undefined) return ['—', '—', '—', '—'];
      const s = sectors[k] as (typeof sectors)[number];
      return [s.name, formatValue(s.value, locale, numberFormat), String(counts[k]), share(s.value)];
    }),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const area = card.area;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (sectors.length > 0 && total <= 0) warnValue(CHART, valueName, 'Every value is zero; a waffle has nothing to divide.');
  if (sectors.length === 0 || total <= 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot: area, strokes, labels }, data.length === 0);

  // Square cells, as large as the area allows; the legend beside them names every category.
  const rows = Math.ceil(cells / columns);
  const inner = { x: area.x + PLOT_INSET, y: area.y + PLOT_INSET, width: Math.max(area.width - 2 * PLOT_INSET, 1), height: Math.max(area.height - 2 * PLOT_INSET, 1) };
  const side = Math.min(inner.width / 2 / columns, inner.height / rows);
  const plot: Rect = { x: inner.x, y: inner.y, width: side * columns, height: side * rows };
  const gap = side * GAP;
  const cell = (n: number): Rect => ({ x: plot.x + (n % columns) * side + gap / 2, y: plot.y + Math.floor(n / columns) * side + gap / 2, width: side - gap, height: side - gap });

  // Reading order, category by category: each category's cells are one path (I-4 counts elements).
  const tones = ringTones(counts);
  const paths: string[] = [];
  let next = 0;
  sectors.forEach((s, k) => {
    const n = counts[k] as number;
    const own = Array.from({ length: n }, (_, j) => cell(next + j));
    const d = own.map(rectPath).join('');
    paths.push(d);
    if (d) strokes.push({ d, role: 'encoding', part: 'ink', tone: tones[k] as ToneLevel });
    const first = own[0] ?? cell(Math.min(next, cells - 1));
    hitAreas.push({ seriesKey: valueName, index: s.index, datum: s.datum, value: s.value, x: first.x + first.width / 2, y: first.y + first.height / 2, ...(own[0] ? { box: own[0] } : {}) });
    next += n;
  });

  const x = plot.x + plot.width + LEGEND_GAP;
  const key = sectorLegend({ x, y: area.y, width: Math.max(area.x + area.width - x, 1), height: area.height }, sectors.map((s, k) => ({ name: s.name, share: share(s.value), tone: tones[k] as ToneLevel })));
  strokes.push(...key.strokes);
  labels.push(...key.labels);

  // One heightened element (REQ-442): the largest category's cells, as one path (I-4).
  let largest = 0;
  sectors.forEach((s, k) => {
    if (s.value > (sectors[largest] as (typeof sectors)[number]).value) largest = k;
  });
  strokes.push({ d: paths[largest] as string, role: 'encoding', part: 'heighten', paint: 'fill' });

  const top = sectors[largest] as (typeof sectors)[number];
  const description =
    props.description ??
    `${base.name}. Waffle of ${cells} cells in ${columns} columns, filled in reading order by ${sectors.length} categories totalling ${formatNumber(total, locale, numberFormat)}; one cell is about ${formatNumber(total / cells, locale, numberFormat)}. The largest is ${top.name}, ${counts[largest]} cells, ${share(top.value)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `WaffleChart` recipe (REQ-414): a unit grid filled in reading order by category, cells by largest remainder. */
export const waffleChart: ChartRecipe<WaffleChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildWaffleChart });
