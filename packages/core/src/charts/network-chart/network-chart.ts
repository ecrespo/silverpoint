import { resolveSeed } from '../../render/seed';
import type { ChartModel, ChartRecipe, HitArea, NetworkChartProps, NetworkNode, RecipeContext, Rect, Stroke, TextLabel, ToneLevel } from '../../types';
import { cardLayout } from '../shared/card';
import { PLOT_INSET } from '../shared/cartesian';
import { inset } from '../shared/cells';
import { checkCeiling, checkIterations, readNetwork } from '../shared/contracts';
import { accessorName, circlePath, formatNumber } from '../shared/format';
import { layoutNetwork } from '../shared/network';
import { ringTone, sectorLegend } from '../shared/polar';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { NETWORK_CHART_DEMO, NETWORK_CHART_DEMO_KEYS, NETWORK_CHART_DEMO_NODES } from './demo';

const CHART = 'NetworkChart';
const ITERATIONS = 300;
const NODE_RADIUS = 4;
const HEIGHTEN_RADIUS = NODE_RADIUS + 1.5;
/** A self-link is a loop of this radius above its node. */
const LOOP = 6;
/** The busiest nodes are named, this many at most. */
const NAMED = 3;
const LEGEND_GAP = 14;
const LEGEND_WIDTH = 110;

const clamp = (v: number, low: number, high: number) => Math.min(Math.max(v, low), high);

function buildNetworkChart(props: NetworkChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? NETWORK_CHART_DEMO;
  const sourceKey = usesDemo ? NETWORK_CHART_DEMO_KEYS.sourceKey : (props.sourceKey ?? 'source');
  const targetKey = usesDemo ? NETWORK_CHART_DEMO_KEYS.targetKey : (props.targetKey ?? 'target');
  const valueKey = usesDemo ? NETWORK_CHART_DEMO_KEYS.valueKey : props.valueKey;
  // `nodes` is data: with the demo, the demo's nodes (API delta §2).
  const given = usesDemo ? NETWORK_CHART_DEMO_NODES : props.nodes;
  const iterations = checkIterations(CHART, props.iterations) ?? ITERATIONS;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = valueKey === undefined ? 'value' : accessorName(valueKey, 'value');

  const network = readNetwork(CHART, data, { source: sourceKey, target: targetKey, ...(valueKey === undefined ? {} : { value: valueKey }) }, given);
  const nodes: NetworkNode[] = network.nodes;
  const links = network.links;
  checkCeiling(CHART, 'nodes', 'networkNodes', nodes.length);
  checkCeiling(CHART, accessorName(sourceKey, 'source'), 'links', links.length);
  const position = new Map(nodes.map((n, k) => [n.id, k]));
  const nameOf = (id: string) => nodes[position.get(id) as number]?.label ?? id;
  const degree = nodes.map(() => 0);
  for (const link of links) {
    const s = position.get(link.source) as number;
    const t = position.get(link.target) as number;
    degree[s] = (degree[s] as number) + 1;
    if (t !== s) degree[t] = (degree[t] as number) + 1;
  }
  const groups = [...new Set(nodes.flatMap((n) => (n.group === undefined ? [] : [n.group])))];

  const base = modelBase(CHART, props, context, 'Network', {
    columns: ['node', 'group', 'degree', valueName],
    rows: [
      ...nodes.map((n, k) => [n.label ?? n.id, n.group ?? '', formatNumber(degree[k] as number, locale, undefined), '']),
      ...links.map((l) => [`${nameOf(l.source)} – ${nameOf(l.target)}`, '', '', formatNumber(l.value, locale, numberFormat)]),
    ],
  });
  const measured = measure(base, props, context);
  if ('deferred' in measured) return measured.deferred;
  const card = cardLayout(props, { width: measured.width, areaHeight: measured.height, chrome: props.chrome ?? 'card', locale });
  const area = card.area;
  const legendWidth = groups.length > 0 ? Math.min(LEGEND_WIDTH, area.width * 0.3) : 0;
  const plot: Rect = inset({ ...area, width: Math.max(area.width - legendWidth - (legendWidth > 0 ? LEGEND_GAP : 0), 1) }, PLOT_INSET);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];
  if (nodes.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  // Where the nodes go: the consumer's positions when every node has them (REQ-436), else the
  // layout, run on the nodes by id and the links by their ends, so the row order cannot move it.
  const room = inset(plot, NODE_RADIUS);
  const placed = nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y));
  let at: { x: number; y: number }[];
  if (placed) {
    const xs = nodes.map((n) => n.x as number);
    const ys = nodes.map((n) => n.y as number);
    const span = (values: number[]) => [Math.min(...values), Math.max(...values)] as const;
    const [x0, x1] = span(xs);
    const [y0, y1] = span(ys);
    // Up the page is +y, as in the data.
    at = nodes.map((n) => ({
      x: x1 > x0 ? room.x + (((n.x as number) - x0) / (x1 - x0)) * room.width : room.x + room.width / 2,
      y: y1 > y0 ? room.y + room.height - (((n.y as number) - y0) / (y1 - y0)) * room.height : room.y + room.height / 2,
    }));
  } else {
    const byId = nodes.map((n, k) => [n.id, k] as const).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    const rank = new Map(byId.map(([id], r) => [id, r]));
    const pulls = links
      .map((l) => ({ source: rank.get(l.source) as number, target: rank.get(l.target) as number }))
      .sort((a, b) => a.source - b.source || a.target - b.target);
    const laid = layoutNetwork(nodes.length, pulls, { iterations, seed: resolveSeed(props.seed, context.id) });
    at = nodes.map((n) => {
      const p = laid[rank.get(n.id) as number] as { x: number; y: number };
      return { x: room.x + p.x * room.width, y: room.y + p.y * room.height };
    });
  }
  const inPlot = (p: { x: number; y: number }) => ({ x: clamp(p.x, plot.x, plot.x + plot.width), y: clamp(p.y, plot.y, plot.y + plot.height) });

  // Links first, under the nodes: secondary ink, exact (REQ-441).
  const linkHits: HitArea[] = links.map((l, k) => {
    const s = at[position.get(l.source) as number] as { x: number; y: number };
    const t = at[position.get(l.target) as number] as { x: number; y: number };
    const loop = l.source === l.target;
    strokes.push({ d: loop ? circlePath(s.x, s.y - LOOP, LOOP) : `M${s.x},${s.y}L${t.x},${t.y}`, role: 'encoding', part: 'ink-secondary' });
    const mid = inPlot(loop ? { x: s.x, y: s.y - 2 * LOOP } : { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 });
    return { seriesKey: valueName, index: nodes.length + k, datum: Object.freeze({ source: l.source, target: l.target, value: l.value }), value: l.value, ...mid };
  });
  const nodeHits: HitArea[] = nodes.map((n, k) => {
    const p = at[k] as { x: number; y: number };
    const group = n.group === undefined ? -1 : groups.indexOf(n.group);
    const tone: ToneLevel | undefined = group < 0 ? undefined : ringTone(group, groups.length);
    strokes.push({ d: circlePath(p.x, p.y, NODE_RADIUS), role: 'encoding', part: 'ink', ...(tone === undefined ? {} : { tone }) });
    const summary = Object.freeze({ id: n.id, ...(n.label === undefined ? {} : { label: n.label }), ...(n.group === undefined ? {} : { group: n.group }), degree: degree[k] as number });
    return { seriesKey: 'degree', index: k, datum: summary, value: degree[k] as number, x: p.x, y: p.y, box: { x: p.x - NODE_RADIUS, y: p.y - NODE_RADIUS, width: 2 * NODE_RADIUS, height: 2 * NODE_RADIUS } };
  });

  // The keyboard (API delta §3): nodes in order by Right and Left; Down walks the links a node
  // starts, in data order, Up back towards it; Home and End reach the first and last node.
  const starts = nodes.map(() => [] as number[]);
  links.forEach((l, k) => starts[position.get(l.source) as number]?.push(nodes.length + k));
  const last = nodes.length - 1;
  const step = (v: number, by: number) => (v + by >= 0 && v + by <= last ? v + by : undefined);
  const movesOf = (v: number, own: Record<string, number | undefined>) =>
    Object.fromEntries(Object.entries({ ArrowRight: step(v, 1), ArrowLeft: step(v, -1), Home: 0, End: last, ...own }).filter(([, to]) => to !== undefined)) as HitArea['moves'];
  nodeHits.forEach((hit, v) => hitAreas.push({ ...hit, moves: movesOf(v, { ArrowDown: starts[v]?.[0] }) }));
  linkHits.forEach((hit, k) => {
    const v = position.get((links[k] as (typeof links)[number]).source) as number;
    const list = starts[v] as number[];
    const p = list.indexOf(hit.index);
    hitAreas.push({ ...hit, moves: movesOf(v, { ArrowDown: list[p + 1], ArrowUp: p > 0 ? list[p - 1] : v }) });
  });

  // The busiest nodes: highest degree, ties to the first id, so the row order cannot change them.
  const busiest = nodes
    .map((n, k) => k)
    .sort((a, b) => (degree[b] as number) - (degree[a] as number) || ((nodes[a] as NetworkNode).id < (nodes[b] as NetworkNode).id ? -1 : 1));
  for (const k of busiest.slice(0, NAMED)) {
    const p = at[k] as { x: number; y: number };
    const right = p.x < plot.x + plot.width * 0.8;
    labels.push({ x: p.x + (right ? 1 : -1) * (HEIGHTEN_RADIUS + 3), y: p.y + 3.5, text: (nodes[k] as NetworkNode).label ?? (nodes[k] as NetworkNode).id, kind: 'tick', part: 'axis', anchor: right ? 'start' : 'end' });
  }
  if (groups.length > 0) {
    const x = plot.x + plot.width + PLOT_INSET + LEGEND_GAP;
    const counts = groups.map((g) => nodes.filter((n) => n.group === g).length);
    const key = sectorLegend({ x, y: area.y, width: Math.max(area.x + area.width - x, 1), height: area.height }, groups.map((g, k) => ({ name: g, share: formatNumber(counts[k] as number, locale, undefined), tone: ringTone(k, groups.length) })));
    strokes.push(...key.strokes);
    labels.push(...key.labels);
  }

  // One heightened element (REQ-442): the node of highest degree.
  const top = busiest[0] as number;
  const spot = at[top] as { x: number; y: number };
  const mark = circlePath(spot.x, spot.y, HEIGHTEN_RADIUS);
  strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
  strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });

  const how = placed ? 'at the given positions' : `laid out by force (Fruchterman–Reingold, ${iterations} iterations from the seed)`;
  const description =
    props.description ??
    `${base.name}. ${nodes.length} nodes and ${links.length} links, ${how}${groups.length > 0 ? `, in ${groups.length} groups` : ''}; the busiest, ${(nodes[top] as NetworkNode).label ?? (nodes[top] as NetworkNode).id}, has ${formatNumber(degree[top] as number, locale, undefined)} links.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `NetworkChart` recipe (REQ-426): a node-link graph, laid out deterministically or placed by the consumer. */
export const networkChart: ChartRecipe<NetworkChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildNetworkChart });
