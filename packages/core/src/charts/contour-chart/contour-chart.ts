import { linearScale } from '../../scales/scales';
import type { ChartModel, ChartRecipe, ContourChartProps, HitArea, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { cartesianPlot } from '../shared/cartesian';
import { toneOf } from '../shared/cells';
import { checkCeiling, checkLevels, readGrid, readPointCloud } from '../shared/contracts';
import { silverman } from '../shared/density';
import { contours, densityGrid, type GridPoint, type ScalarGrid } from '../shared/field';
import { accessorName, formatNumber } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { sortedValues } from '../shared/stats';
import { xyFrame } from '../shared/xy';
import { CONTOUR_CHART_DEMO, CONTOUR_CHART_DEMO_KEYS, CONTOUR_CHART_GRID_DEMO, CONTOUR_CHART_GRID_DEMO_KEYS } from './demo';

const CHART = 'ContourChart';
const LEVELS = 4;
/** Density nodes per px of the plot, and their bounds per axis (a 60 × 60 field at most, REQ-445). */
const NODE_SPACING = 6;
const MIN_NODES = 10;
const MAX_NODES = 60;
/** A level is named on its longest line when the line is at least this long, in px. */
const LABEL_ROOM = 60;
/** Two level names closer than this, in px, would collide: the later one is left to the table. */
const LABEL_GAP = 28;

const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };

/** The field to contour, in grid coordinates, and how a grid coordinate maps to data. */
interface Field {
  readonly grid: ScalarGrid;
  readonly xAt: (i: number) => number;
  readonly yAt: (j: number) => number;
}

/** A fractional index along sorted node values, as the data value it stands for. */
const along = (nodes: readonly number[]) => (t: number) => {
  const i = Math.min(Math.max(Math.floor(t), 0), nodes.length - 1);
  const next = nodes[i + 1];
  return next === undefined ? (nodes[i] as number) : (nodes[i] as number) + (t - i) * (next - (nodes[i] as number));
};

/** The nice ticks strictly inside `(low, high)`, about `count` of them. */
function ticksInside(low: number, high: number, count: number): number[] {
  if (!(high > low)) return [];
  const scale = linearScale([low, high], [0, 1], { chart: CHART, property: 'levels', padding: 0 });
  return scale.ticks(count + 1).filter((t) => t > low && t < high);
}

function buildContourChart(props: ContourChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const fromGrid = props.source === 'grid';
  const data = props.data ?? (fromGrid ? CONTOUR_CHART_GRID_DEMO : CONTOUR_CHART_DEMO);
  const demoKeys = fromGrid ? CONTOUR_CHART_GRID_DEMO_KEYS : CONTOUR_CHART_DEMO_KEYS;
  const xKey = usesDemo ? demoKeys.xKey : (props.xKey ?? 'x');
  const yKey = usesDemo ? demoKeys.yKey : (props.yKey ?? 'y');
  const valueKey = usesDemo ? CONTOUR_CHART_GRID_DEMO_KEYS.valueKey : (props.valueKey ?? 'value');
  const levels = checkLevels(CHART, props.levels) ?? LEVELS;
  const filled = props.filled !== false;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const xName = accessorName(xKey, 'x');
  const yName = accessorName(yKey, 'y');
  const valueName = fromGrid ? accessorName(valueKey, 'value') : 'density';

  const values = fromGrid ? readGrid(CHART, data, { x: xKey, y: yKey, value: valueKey }) : undefined;
  const points = fromGrid ? [] : readPointCloud(CHART, data, { x: xKey, y: yKey });
  if (values) checkCeiling(CHART, valueName, 'gridCells', values.xs.length * values.ys.length);
  else checkCeiling(CHART, yName, 'observations', points.length);
  const format = (level: number) => (fromGrid ? formatNumber(level, locale, numberFormat) : formatNumber(level, locale, PERCENT));

  // The levels are known before the layout: of the grid's values, or as shares of the density's peak.
  const known = values ? values.values.filter((v): v is number => v !== undefined) : [];
  let thresholds: readonly number[];
  if (Array.isArray(levels)) thresholds = levels;
  else if (values) thresholds = ticksInside(Math.min(...known), Math.max(...known), levels as number);
  else thresholds = Array.from({ length: levels as number }, (_, k) => (k + 1) / ((levels as number) + 1));

  const named = modelBase(CHART, props, context, 'Contours', { columns: [valueName, 'band'], rows: [] });
  const measured = measure(named, props, context);
  if ('deferred' in measured) return measured.deferred;
  const card = cardLayout(props, { width: measured.width, areaHeight: measured.height, chrome: props.chrome ?? 'card', locale });
  const plot = cartesianPlot(card.area);
  const empty = values ? known.length === 0 : points.length === 0;
  if (empty) return emptyModel(named, props, context, { viewBox: card.viewBox, plot, strokes: [...card.strokes], labels: [...card.labels] }, data.length === 0);

  let field: Field;
  let method: string;
  let frame: ReturnType<typeof xyFrame>;
  const site = { chart: CHART, xName, yName, padding: context.domainPadding, locale, numberFormat, inset: 0 };
  if (values) {
    frame = xyFrame(card.area, plot, { x: [values.xs[0] as number, values.xs.at(-1) as number], y: [values.ys[0] as number, values.ys.at(-1) as number] }, site);
    field = { grid: { nx: values.xs.length, ny: values.ys.length, values: values.values }, xAt: along(values.xs), yAt: along(values.ys) };
    method = `over a ${values.xs.length} × ${values.ys.length} grid of ${xName} and ${yName}`;
  } else {
    // An Epanechnikov density (DD-029), each axis' bandwidth by Silverman's rule; the field
    // reaches a bandwidth past the points so every contour closes inside it.
    const bx = silverman(sortedValues(points.map((p) => p.x)));
    const by = silverman(sortedValues(points.map((p) => p.y)));
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    frame = xyFrame(card.area, plot, { x: [Math.min(...xs) - bx, Math.max(...xs) + bx], y: [Math.min(...ys) - by, Math.max(...ys) + by] }, site);
    const nodes = (px: number) => Math.min(Math.max(Math.round(px / NODE_SPACING) + 1, MIN_NODES), MAX_NODES);
    const nx = nodes(frame.region.width);
    const ny = nodes(frame.region.height);
    const [x0, x1] = frame.x.domain;
    const [y0, y1] = frame.y.domain;
    const density = densityGrid(points, { x: [x0, x1], y: [y0, y1] }, nx, ny, { x: bx, y: by });
    const peak = Math.max(...density.values);
    field = {
      grid: { nx, ny, values: density.values.map((v) => (peak > 0 ? (v ?? 0) / peak : 0)) },
      xAt: (i) => x0 + (i * (x1 - x0)) / (nx - 1),
      yAt: (j) => y0 + (j * (y1 - y0)) / (ny - 1),
    };
    method = `of the density of ${points.length} points of ${xName} and ${yName}, estimated with an Epanechnikov kernel (bandwidths ${formatNumber(bx, locale, undefined)} and ${formatNumber(by, locale, undefined)}, Silverman's rule) and read as a share of its peak`;
  }
  const toPx = (p: GridPoint) => ({ x: frame.x(field.xAt(p.x)), y: frame.y(field.yAt(p.y)) });
  const pathOf = (polylines: readonly (readonly GridPoint[])[], close: boolean) =>
    polylines
      .map((line) =>
        line
          .map(toPx)
          .map((q, k) => `${k === 0 ? 'M' : 'L'}${q.x},${q.y}`)
          .join('') + (close ? 'Z' : ''),
      )
      .join('');

  const strokes: Stroke[] = [...card.strokes, ...frame.strokes];
  const labels: TextLabel[] = [...card.labels, ...frame.labels];
  const hitAreas: HitArea[] = [];
  const traced = contours(field.grid, thresholds);
  const drawn = traced.map((c, k) => ({ ...c, k })).filter((c) => c.rings.length > 0);
  const summaries = thresholds.map((level, k) => Object.freeze({ level, next: thresholds[k + 1] ?? null }));
  const base = modelBase(CHART, props, context, 'Contours', {
    columns: [valueName, 'band'],
    rows: summaries.map((s) => [format(s.level), s.next === null ? `${format(s.level)} and above` : `${format(s.level)} to ${format(s.next)}`]),
  });

  let top = '';
  const placed: { x: number; y: number }[] = [];
  drawn.forEach((c, n) => {
    const band = pathOf(c.band, true);
    top = filled ? band : pathOf(c.rings, true);
    if (filled) strokes.push({ d: band, role: 'encoding', part: 'ink', tone: toneOf((n + 1) / drawn.length) });
    else if (c.lines.length > 0) strokes.push({ d: pathOf(c.lines, false), role: 'encoding', part: 'ink' });
    // The level is named and reached on its longest line, or its first ring when it draws none.
    const lines = c.lines.length > 0 ? c.lines : c.rings;
    const length = (line: readonly GridPoint[]) => line.map(toPx).reduce((s, q, i, all) => (i === 0 ? 0 : s + Math.sqrt((q.x - (all[i - 1] as typeof q).x) ** 2 + (q.y - (all[i - 1] as typeof q).y) ** 2)), 0);
    const longest = lines.reduce((best, line) => (length(line) > length(best) ? line : best), lines[0] as readonly GridPoint[]);
    // Levels are named at staggered places along their lines, and not where a name already is.
    const pick = (f: number) => toPx(longest[Math.min(Math.floor(longest.length * f), longest.length - 1)] as GridPoint);
    const spots = [(n + 1) / (drawn.length + 1), 0.5, 0.25, 0.75, 0.1, 0.9].map(pick);
    const free = spots.find((q) => placed.every((o) => (o.x - q.x) * (o.x - q.x) + (o.y - q.y) * (o.y - q.y) >= LABEL_GAP * LABEL_GAP));
    const mid = free ?? (spots[0] as { x: number; y: number });
    if (free && c.lines.length > 0 && length(longest) >= LABEL_ROOM) {
      placed.push(free);
      labels.push({ x: free.x, y: free.y - 3, text: format(c.level), kind: 'tick', part: 'axis', anchor: 'middle' });
    }
    hitAreas.push({ seriesKey: 'band', index: c.k, datum: summaries[c.k] as (typeof summaries)[number], value: c.level, x: mid.x, y: mid.y });
  });
  // One heightened element (REQ-442): the highest band — the region above the top level drawn.
  if (top !== '') {
    strokes.push({ d: top, role: 'encoding', part: 'heighten', paint: 'fill' });
    if (!filled) strokes.push({ d: top, role: 'encoding', part: 'ink', paint: 'stroke' });
  }

  const shown = drawn.map((c) => format(c.level));
  const description =
    props.description ??
    `${base.name}. Contours ${method}, ${filled ? 'filled in bands' : 'as lines'} at ${shown.length} levels${shown.length > 0 ? `: ${shown.join(', ')}; the highest band is ${shown.at(-1) as string} and above` : ''}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `ContourChart` recipe (REQ-423): iso-lines and filled bands of a point density or a regular grid. */
export const contourChart: ChartRecipe<ContourChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildContourChart });
