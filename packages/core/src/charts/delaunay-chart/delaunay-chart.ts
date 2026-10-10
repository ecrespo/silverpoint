import type { ChartModel, ChartRecipe, DelaunayChartProps, HitArea, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { cartesianPlot } from '../shared/cartesian';
import { warnValue } from '../shared/cells';
import { checkCeiling, readPointCloud } from '../shared/contracts';
import { triangulate, voronoiCells } from '../shared/delaunay';
import { accessorName, circlePath, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { xyFrame } from '../shared/xy';
import { DELAUNAY_CHART_DEMO, DELAUNAY_CHART_DEMO_KEYS } from './demo';

const CHART = 'DelaunayChart';
const DOT_RADIUS = 2.5;
const HEIGHTEN_RADIUS = 3.5;
/** Up to this many points every given label is printed; past it, only the heightened point's. */
const LABELLED = 24;

const round2 = (v: number) => Math.round(v * 100) / 100;

type Spot = { readonly x: number; readonly y: number };

function buildDelaunayChart(props: DelaunayChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? DELAUNAY_CHART_DEMO;
  const xKey = usesDemo ? DELAUNAY_CHART_DEMO_KEYS.xKey : (props.xKey ?? 'x');
  const yKey = usesDemo ? DELAUNAY_CHART_DEMO_KEYS.yKey : (props.yKey ?? 'y');
  const labelKey = usesDemo ? DELAUNAY_CHART_DEMO_KEYS.labelKey : props.labelKey;
  const voronoi = props.mesh === 'voronoi';
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const xName = accessorName(xKey, 'x');
  const yName = accessorName(yKey, 'y');
  const labelName = labelKey === undefined ? 'point' : accessorName(labelKey, 'label');

  const points = readPointCloud(CHART, data, { x: xKey, y: yKey, ...(labelKey === undefined ? {} : { label: labelKey }) });
  checkCeiling(CHART, yName, 'points', points.length);
  // Degrees are known after the layout; until then the table names the chart.
  const named = modelBase(CHART, props, context, voronoi ? 'Voronoi cells' : 'Delaunay triangulation', { columns: [labelName, xName, yName, 'degree'], rows: [] });
  const measured = measure(named, props, context);
  if ('deferred' in measured) return measured.deferred;
  const card = cardLayout(props, { width: measured.width, areaHeight: measured.height, chrome: props.chrome ?? 'card', locale });
  const plot = cartesianPlot(card.area);
  if (points.length === 0) return emptyModel(named, props, context, { viewBox: card.viewBox, plot, strokes: [...card.strokes], labels: [...card.labels] }, data.length === 0);

  const extent = (values: number[]) => [Math.min(...values), Math.max(...values)] as const;
  const frame = xyFrame(card.area, plot, { x: extent(points.map((p) => p.x)), y: extent(points.map((p) => p.y)) }, { chart: CHART, xName, yName, padding: context.domainPadding, locale, numberFormat, inset: HEIGHTEN_RADIUS });
  // The mesh is built on the drawn positions, rounded as they are emitted (REQ-002), so it is the
  // triangulation of what the reader sees.
  const at = points.map((p) => ({ x: round2(frame.x(p.x)), y: round2(frame.y(p.y)) }));
  const mesh = triangulate(at);
  if (mesh.duplicates.length > 0) {
    warnValue(CHART, yName, `${mesh.duplicates.length} points fall on another; the first row is drawn. The first repeat is row ${(points[mesh.duplicates[0] as number] as (typeof points)[number]).index}.`);
  }
  const degree = new Map<number, number>(mesh.kept.map((k) => [k, 0]));
  for (const [u, v] of mesh.edges) {
    degree.set(u, (degree.get(u) as number) + 1);
    degree.set(v, (degree.get(v) as number) + 1);
  }

  const byRow = new Map(points.map((p, k) => [p.index, k]));
  const base = modelBase(CHART, props, context, voronoi ? 'Voronoi cells' : 'Delaunay triangulation', {
    columns: [labelName, xName, yName, 'degree'],
    rows: data.map((datum, index) => {
      const k = byRow.get(index);
      const d = k === undefined ? undefined : degree.get(k);
      return [
        labelKey === undefined ? String(index + 1) : formatValue(read(labelKey, datum, index), locale, { useGrouping: false, maximumFractionDigits: 2 }),
        formatValue(read(xKey, datum, index), locale, numberFormat),
        formatValue(read(yKey, datum, index), locale, numberFormat),
        d === undefined ? '—' : formatNumber(d, locale, undefined),
      ];
    }),
  });

  const strokes: Stroke[] = [...card.strokes, ...frame.strokes];
  const labels: TextLabel[] = [...card.labels, ...frame.labels];
  const hitAreas: HitArea[] = [];
  // The mesh as one secondary stroke, drawn in the order of its coordinates, so the row order does
  // not move it (I-23).
  const key = (q: { x: number; y: number }) => `${q.x},${q.y}`;
  let d = '';
  if (voronoi) {
    const cells = voronoiCells(at, mesh, frame.region);
    d = [...cells.entries()]
      .sort(([a], [b]) => (at[a] as { x: number }).x - (at[b] as { x: number }).x || (at[a] as { y: number }).y - (at[b] as { y: number }).y)
      .map(([, cell]) => `${cell.map((q, i) => `${i === 0 ? 'M' : 'L'}${key({ x: round2(q.x), y: round2(q.y) })}`).join('')}Z`)
      .join('');
  } else {
    d = mesh.edges
      .map(([u, v]) => [at[u], at[v]].sort((a, b) => (a as Spot).x - (b as Spot).x || (a as Spot).y - (b as Spot).y) as [Spot, Spot])
      .sort(([a, b], [c, e]) => a.x - c.x || a.y - c.y || b.x - e.x || b.y - e.y)
      .map(([a, b]) => `M${key(a)}L${key(b)}`)
      .join('');
  }
  if (d !== '') strokes.push({ d, role: 'encoding', part: 'ink-secondary' });

  // Points in data order, which the keyboard walks (API delta §3).
  const kept = [...mesh.kept].sort((a, b) => (points[a] as { index: number }).index - (points[b] as { index: number }).index);
  // The busiest point: the highest degree; a tie goes to the lowest x, then y, so the row order
  // cannot change it (I-23).
  const rank = (k: number) => [-(degree.get(k) as number), (points[k] as { x: number }).x, (points[k] as { y: number }).y];
  const before = (a: number, b: number) => {
    const [ra, rb] = [rank(a), rank(b)];
    return (ra[0] as number) - (rb[0] as number) || (ra[1] as number) - (rb[1] as number) || (ra[2] as number) - (rb[2] as number);
  };
  const busiest = kept.reduce((best, k) => (before(k, best) < 0 ? k : best), kept[0] as number);
  for (const k of kept) {
    const p = points[k] as (typeof points)[number];
    const q = at[k] as { x: number; y: number };
    strokes.push({ d: circlePath(q.x, q.y, DOT_RADIUS), role: 'encoding', part: 'ink' });
    hitAreas.push({ seriesKey: 'degree', index: p.index, datum: p.datum, value: degree.get(k) as number, x: q.x, y: q.y, box: { x: q.x - DOT_RADIUS, y: q.y - DOT_RADIUS, width: 2 * DOT_RADIUS, height: 2 * DOT_RADIUS } });
    if (p.label !== undefined && (kept.length <= LABELLED || k === busiest)) {
      labels.push({ x: q.x + 5, y: q.y - 5, text: p.label, kind: 'tick', part: 'axis', anchor: q.x > plot.x + plot.width * 0.8 ? 'end' : 'start' });
    }
  }
  const top = points[busiest] as (typeof points)[number];
  const spot = at[busiest] as { x: number; y: number };

  // One heightened element (REQ-442): the point of highest degree.
  const mark = circlePath(spot.x, spot.y, HEIGHTEN_RADIUS);
  strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
  strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });

  const triangles = mesh.triangles.length / 3;
  const name = top.label ?? `point ${top.index + 1}`;
  const description =
    props.description ??
    `${base.name}. ${voronoi ? `The Voronoi cells of ${kept.length} points` : `The Delaunay triangulation of ${kept.length} points, ${triangles} triangles`}, ${xName} across and ${yName} up; ${name} has the most neighbours, ${formatNumber(degree.get(busiest) as number, locale, undefined)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `DelaunayChart` recipe (REQ-424): the triangulation of x-y points, or its Voronoi cells. */
export const delaunayChart: ChartRecipe<DelaunayChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildDelaunayChart });
