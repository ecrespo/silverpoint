import type { ChartModel, ChartRecipe, Datum, HitArea, RecipeContext, SankeyChartProps, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { finite, inset, rectPath, warnValue } from '../shared/cells';
import { accessorName, formatCategory, formatNumber, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { SANKEY_CHART_DEMO } from './demo';

const CHART = 'SankeyChart';
const PLOT_INSET = 6;
const NODE_WIDTH = 8;
const NODE_GAP = 10;
/** The largest share of the height the gaps of one layer may take. */
const MAX_GAP_SHARE = 0.5;
const LABEL_GAP = 4;

interface Flow {
  readonly index: number;
  readonly datum: Datum;
  readonly source: string;
  readonly target: string;
  readonly value: number;
}

interface Node {
  readonly name: string;
  layer: number;
  inflow: number;
  outflow: number;
  x: number;
  y: number;
  height: number;
  /** Where the next outgoing and incoming band attach. */
  outCursor: number;
  inCursor: number;
}

/** True when `to` can already be reached from `from` along the kept flows. */
function reaches(edges: ReadonlyMap<string, readonly string[]>, from: string, to: string): boolean {
  const stack = [from];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const name = stack.pop() as string;
    if (name === to) return true;
    if (seen.has(name)) continue;
    seen.add(name);
    stack.push(...(edges.get(name) ?? []));
  }
  return false;
}

function buildSankeyChart(props: SankeyChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? SANKEY_CHART_DEMO;
  const sourceKey = usesDemo ? 'source' : (props.sourceKey ?? 'source');
  const targetKey = usesDemo ? 'target' : (props.targetKey ?? 'target');
  const valueKey = usesDemo ? 'value' : (props.valueKey ?? 'value');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');

  // Flows that cannot be drawn — non-positive, or closing a cycle — are dropped and warned
  // (Data Model §2.7): a band of negative width, or a loop, has no layered drawing.
  const flows: Flow[] = [];
  const edges = new Map<string, string[]>();
  data.forEach((datum, index) => {
    const rawSource = read(sourceKey, datum, index);
    const rawTarget = read(targetKey, datum, index);
    // A flow needs both ends: a missing one (often a mistyped key) is dropped, not named "—".
    const missing = rawSource === null || rawSource === undefined ? 'source' : rawTarget === null || rawTarget === undefined ? 'target' : undefined;
    if (missing) {
      warnValue(CHART, accessorName(missing === 'source' ? sourceKey : targetKey, missing), `Flow ${index} has no ${missing}; it is omitted.`);
      return;
    }
    const source = formatCategory(rawSource, locale);
    const target = formatCategory(rawTarget, locale);
    const value = finite(read(valueKey, datum, index));
    if (value === undefined || value <= 0) {
      warnValue(CHART, valueName, `Flow ${index} (${source} → ${target}) is ${String(value ?? 'not finite')}; flows must be positive, so it is omitted.`);
      return;
    }
    if (reaches(edges, target, source)) {
      warnValue(CHART, accessorName(targetKey, 'target'), `Flow ${index} (${source} → ${target}) would close a cycle; it is omitted.`);
      return;
    }
    edges.set(source, [...(edges.get(source) ?? []), target]);
    flows.push({ index, datum, source, target, value });
  });

  const base = modelBase(CHART, props, context, 'Sankey diagram', {
    columns: ['flow', valueName],
    rows: flows.map((f) => [`${f.source} → ${f.target}`, formatNumber(f.value, locale, numberFormat)]),
  });

  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = inset(card.area, PLOT_INSET);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (flows.length === 0) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  // Nodes in order of first appearance; each sits one layer past its furthest source.
  const nodes = new Map<string, Node>();
  const node = (name: string): Node => {
    let found = nodes.get(name);
    if (!found) {
      found = { name, layer: 0, inflow: 0, outflow: 0, x: 0, y: 0, height: 0, outCursor: 0, inCursor: 0 };
      nodes.set(name, found);
    }
    return found;
  };
  for (const flow of flows) {
    node(flow.source).outflow += flow.value;
    node(flow.target).inflow += flow.value;
  }
  // The graph is acyclic, so relaxing every flow once per node settles the longest paths.
  for (let pass = 0; pass < nodes.size; pass += 1) {
    for (const flow of flows) {
      const target = node(flow.target);
      target.layer = Math.max(target.layer, node(flow.source).layer + 1);
    }
  }

  const layers: Node[][] = [];
  for (const n of nodes.values()) (layers[n.layer] ??= []).push(n);
  const throughput = (n: Node) => Math.max(n.inflow, n.outflow);
  // Gaps between nodes take at most half the height, so a crowded layer still leaves room for
  // its flows; one scale for every layer then lets the fullest layer fill the height.
  const gapOf = (count: number) => (count > 1 ? Math.min(NODE_GAP, (plot.height * MAX_GAP_SHARE) / (count - 1)) : 0);
  const crowded = layers.filter((layer) => gapOf(layer.length) < NODE_GAP);
  if (crowded.length > 0) {
    warnValue(CHART, accessorName(targetKey, 'target'), `A layer of ${Math.max(...crowded.map((l) => l.length))} nodes is crowded; its gaps are narrowed to fit.`);
  }
  const scale = layers.reduce(
    (smallest, layer) => Math.min(smallest, (plot.height - (layer.length - 1) * gapOf(layer.length)) / layer.reduce((sum, n) => sum + throughput(n), 0)),
    Number.POSITIVE_INFINITY,
  );
  const step = layers.length > 1 ? (plot.width - NODE_WIDTH) / (layers.length - 1) : 0;
  layers.forEach((layer, index) => {
    const gap = gapOf(layer.length);
    const height = layer.reduce((sum, n) => sum + throughput(n) * scale, 0) + (layer.length - 1) * gap;
    let y = plot.y + (plot.height - height) / 2;
    for (const n of layer) {
      n.x = plot.x + index * step;
      n.y = y;
      n.height = throughput(n) * scale;
      n.outCursor = y;
      n.inCursor = y;
      y += n.height + gap;
    }
  });

  flows.forEach((flow, row) => {
    const source = node(flow.source);
    const target = node(flow.target);
    const width = flow.value * scale;
    const x0 = source.x + NODE_WIDTH;
    const x1 = target.x;
    const y0 = source.outCursor;
    const y1 = target.inCursor;
    source.outCursor += width;
    target.inCursor += width;
    const mx = (x0 + x1) / 2;
    const d = `M${x0},${y0}C${mx},${y0},${mx},${y1},${x1},${y1}V${y1 + width}C${mx},${y1 + width},${mx},${y0 + width},${x0},${y0 + width}Z`;
    strokes.push({ d, role: 'encoding', part: 'ink-secondary', tone: 1 });
    hitAreas.push({ seriesKey: valueName, index: row, datum: flow.datum, value: flow.value, x: mx, y: (y0 + y1) / 2 + width / 2 });
  });

  const last = layers.length - 1;
  for (const n of nodes.values()) {
    strokes.push({ d: rectPath({ x: n.x, y: n.y, width: NODE_WIDTH, height: n.height }), role: 'encoding', part: 'ink', tone: 3 });
    const end = n.layer === last && last > 0;
    labels.push({
      x: end ? n.x - LABEL_GAP : n.x + NODE_WIDTH + LABEL_GAP,
      y: n.y + n.height / 2 + 4,
      text: `${n.name} ${formatNumber(throughput(n), locale, numberFormat)}`,
      kind: 'tick',
      part: 'text',
      anchor: end ? 'end' : 'start',
    });
  }

  // REQ-097: the flow total is not a prop; it is derived as the flow leaving the nodes that
  // receive none, which is everything that enters the diagram.
  const total = [...nodes.values()].filter((n) => n.inflow === 0).reduce((sum, n) => sum + n.outflow, 0);
  const description =
    props.description ??
    `${base.name}. Sankey diagram of ${flows.length} flows between ${nodes.size} nodes in ${layers.length} layers; total flow of ${formatNumber(total, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `SankeyChart` recipe (REQ-086): flow bands between nodes layered by longest path. */
export const sankeyChart: ChartRecipe<SankeyChartProps> = /* @__PURE__ */ Object.freeze({
  name: CHART,
  build: buildSankeyChart,
});
