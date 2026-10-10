import type { ChartModel, ChartRecipe, HitArea, RecipeContext, Stroke, TextLabel, VectorFieldChartProps } from '../../types';
import { cardLayout } from '../shared/card';
import { LEGEND_BAND, PLOT_INSET, cartesianPlot } from '../shared/cartesian';
import { checkCeiling, checkPositive, readVectorField, type Vector } from '../shared/contracts';
import { accessorName, circlePath, formatNumber } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { xyFrame } from '../shared/xy';
import { VECTOR_FIELD_CHART_DEMO, VECTOR_FIELD_CHART_DEMO_KEYS } from './demo';

const CHART = 'VectorFieldChart';
/** By default the longest arrow spans this share of the grid's spacing. */
const FILL = 0.9;
/** Spacing assumed along an axis with a single value. */
const LONE_SPACING = 24;
/** The head: at most this long, its half-width a share of its length. */
const HEAD = 5;
const HEAD_WIDTH = 0.6;
const DOT_RADIUS = 1.2;
/** Length of the key's arrow, at most, in px. */
const KEY_ROOM = 40;

/** Arrow from `tail` to `tip`: the shaft, then the head as a closed triangle (heightening fills it). */
function arrowPath(tail: { x: number; y: number }, tip: { x: number; y: number }): string {
  const dx = tip.x - tail.x;
  const dy = tip.y - tail.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const head = Math.min(HEAD, length * 0.4);
  const ux = dx / length;
  const uy = dy / length;
  const bx = tip.x - ux * head;
  const by = tip.y - uy * head;
  const w = head * HEAD_WIDTH;
  return `M${tail.x},${tail.y}L${bx},${by}M${tip.x},${tip.y}L${bx - uy * w},${by + ux * w}L${bx + uy * w},${by - ux * w}Z`;
}

/** The smallest gap between neighbouring positions, in px. */
function spacing(positions: readonly number[]): number {
  let gap = Number.POSITIVE_INFINITY;
  for (let k = 1; k < positions.length; k += 1) gap = Math.min(gap, Math.abs((positions[k] as number) - (positions[k - 1] as number)));
  return gap;
}

function buildVectorFieldChart(props: VectorFieldChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? VECTOR_FIELD_CHART_DEMO;
  const keys = VECTOR_FIELD_CHART_DEMO_KEYS;
  const xKey = usesDemo ? keys.xKey : (props.xKey ?? 'x');
  const yKey = usesDemo ? keys.yKey : (props.yKey ?? 'y');
  const uKey = usesDemo ? keys.uKey : (props.uKey ?? 'u');
  const vKey = usesDemo ? keys.vKey : (props.vKey ?? 'v');
  const given = checkPositive(CHART, 'scale', props.scale);
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const xName = accessorName(xKey, 'x');
  const yName = accessorName(yKey, 'y');
  const uName = accessorName(uKey, 'u');
  const vName = accessorName(vKey, 'v');

  const field = readVectorField(CHART, data, { x: xKey, y: yKey, u: uKey, v: vKey });
  const nx = field.xs.length;
  const ny = field.ys.length;
  checkCeiling(CHART, uName, 'gridCells', nx * ny);
  // Grid order, top row first and left to right: the order of the table and of the keyboard.
  const cells: { i: number; j: number; vector: Vector; magnitude: number }[] = [];
  for (let j = ny - 1; j >= 0; j -= 1) {
    for (let i = 0; i < nx; i += 1) {
      const vector = field.vectors[j * nx + i];
      if (vector) cells.push({ i, j, vector, magnitude: Math.sqrt(vector.u * vector.u + vector.v * vector.v) });
    }
  }
  const summaries = cells.map((c) => Object.freeze({ x: field.xs[c.i] as number, y: field.ys[c.j] as number, u: c.vector.u, v: c.vector.v, magnitude: c.magnitude }));
  const base = modelBase(CHART, props, context, 'Vector field', {
    columns: [`${xName}, ${yName}`, uName, vName, 'magnitude'],
    rows: summaries.map((s) => [
      `${formatNumber(s.x, locale, numberFormat)}, ${formatNumber(s.y, locale, numberFormat)}`,
      formatNumber(s.u, locale, numberFormat),
      formatNumber(s.v, locale, numberFormat),
      formatNumber(s.magnitude, locale, numberFormat),
    ]),
  });
  const measured = measure(base, props, context);
  if ('deferred' in measured) return measured.deferred;
  const card = cardLayout(props, { width: measured.width, areaHeight: measured.height, chrome: props.chrome ?? 'card', locale });
  if (cells.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot: cartesianPlot(card.area), strokes: [...card.strokes], labels: [...card.labels] }, data.length === 0);

  // The key above the plot: one arrow of a stated magnitude.
  const keyArea = { ...card.area, height: LEGEND_BAND };
  const below = { ...card.area, y: card.area.y + LEGEND_BAND, height: Math.max(card.area.height - LEGEND_BAND, 1) };
  const plot = cartesianPlot(below);
  const frame = xyFrame(below, plot, { x: [field.xs[0] as number, field.xs.at(-1) as number], y: [field.ys[0] as number, field.ys.at(-1) as number] }, { chart: CHART, xName, yName, padding: context.domainPadding, locale, numberFormat, inset: 0 });
  const across = nx > 1 ? spacing(field.xs.map((x) => frame.x(x))) : LONE_SPACING;
  const down = ny > 1 ? spacing(field.ys.map((y) => frame.y(y))) : LONE_SPACING;
  const largest = Math.max(...cells.map((c) => c.magnitude));
  // Px per unit of magnitude: given, or the longest arrow filling the grid's spacing.
  const scale = given ?? (largest > 0 ? (FILL * Math.min(across, down)) / largest : 1);

  const strokes: Stroke[] = [...card.strokes, ...frame.strokes];
  const labels: TextLabel[] = [...card.labels, ...frame.labels];
  const hitAreas: HitArea[] = [];
  const marks = cells.map((c, k) => {
    const cx = frame.x(field.xs[c.i] as number);
    const cy = frame.y(field.ys[c.j] as number);
    // Up the page is +v: the screen's y runs down.
    const hx = (c.vector.u * scale) / 2;
    const hy = (-c.vector.v * scale) / 2;
    const d = c.magnitude > 0 ? arrowPath({ x: cx - hx, y: cy - hy }, { x: cx + hx, y: cy + hy }) : circlePath(cx, cy, DOT_RADIUS);
    strokes.push({ d, role: 'encoding', part: 'ink' });
    hitAreas.push({ seriesKey: 'magnitude', index: k, datum: summaries[k] as (typeof summaries)[number], value: c.magnitude, x: cx, y: cy, cell: { column: c.i, row: ny - 1 - c.j } });
    return d;
  });

  if (largest > 0) {
    // The key's magnitude: the largest, to two significant digits, at a length that fits.
    const unit = Number(largest.toPrecision(2));
    const shown = Math.min(unit * scale, KEY_ROOM);
    const stated = shown / scale;
    const y = keyArea.y + 8;
    const x = keyArea.x + PLOT_INSET;
    strokes.push({ d: arrowPath({ x, y }, { x: x + shown, y }), role: 'ornament', part: 'ink' });
    labels.push({ x: x + shown + 6, y: y + 3.5, text: `${formatNumber(stated, locale, numberFormat)} ${uName}, ${vName}`, kind: 'tick', part: 'axis', anchor: 'start' });
  }

  // One heightened element (REQ-442): the arrow of largest magnitude, the first in grid order.
  const strongest = cells.findIndex((c) => c.magnitude === largest);
  strokes.push({ d: marks[strongest] as string, role: 'encoding', part: 'heighten', paint: 'fill' });

  const top = summaries[strongest] as (typeof summaries)[number];
  const description =
    props.description ??
    `${base.name}. ${cells.length} arrows on a ${nx} × ${ny} grid of ${xName} across and ${yName} up, each along (${uName}, ${vName}), its length its magnitude at ${formatNumber(scale, locale, undefined)} px per unit; the largest, ${formatNumber(largest, locale, numberFormat)}, at ${formatNumber(top.x, locale, numberFormat)}, ${formatNumber(top.y, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `VectorFieldChart` recipe (REQ-425): an arrow per grid point, its direction and length the vector's. */
export const vectorFieldChart: ChartRecipe<VectorFieldChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildVectorFieldChart });
