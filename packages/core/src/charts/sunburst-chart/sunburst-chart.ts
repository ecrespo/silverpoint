import type { ChartModel, ChartRecipe, HitArea, RecipeContext, Stroke, SunburstChartProps, TextLabel, ToneLevel } from '../../types';
import { cardLayout } from '../shared/card';
import { TICK_CHAR } from '../shared/cartesian';
import { ringTone, warnValue } from '../shared/cells';
import { circlePath, fitText, formatNumber } from '../shared/format';
import { partition, type TreeNode } from '../shared/hierarchy';
import { nodeHitAreas, readTree, treeSummary } from '../shared/nodes';
import { pointAt, polarFrame, sectorLegend, sectorPath } from '../shared/polar';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { SUNBURST_CHART_DEMO, SUNBURST_CHART_DEMO_KEYS } from './demo';

const CHART = 'SunburstChart';
/** The legend sits beside the rings when the area is at least this much wider than tall (as the donut's). */
const LEGEND_ASPECT = 1.5;
const LEGEND_GAP = 14;
const TURN = 2 * Math.PI;
const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };

function buildSunburstChart(props: SunburstChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? SUNBURST_CHART_DEMO;
  const k = SUNBURST_CHART_DEMO_KEYS;
  const keys = usesDemo
    ? { id: k.idKey, parent: k.parentKey, label: k.labelKey, value: k.valueKey }
    : { id: props.idKey ?? 'id', parent: props.parentKey ?? 'parent', value: props.valueKey ?? 'value', ...(props.labelKey === undefined ? {} : { label: props.labelKey }) };
  const { locale } = context;
  const numberFormat = props.numberFormat;

  // Largest first, ties by id, clockwise from 12 o'clock: no shuffle of the rows moves an arc (I-23).
  const read = readTree(CHART, data, keys, props, context, 'value');
  const base = modelBase(CHART, props, context, 'Sunburst', read.table);
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = card.area;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const root = read.root;

  if (root && root.value <= 0) warnValue(CHART, read.valueName, 'Every leaf is zero; a sunburst has nothing to divide.');
  if (!root || root.value <= 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const withLegend = plot.width >= plot.height * LEGEND_ASPECT;
  const ringArea = withLegend ? { x: plot.x, y: plot.y, width: plot.height, height: plot.height } : plot;
  const frame = polarFrame(ringArea);
  // The drawn root is the centre disc; each level below it a ring of equal width.
  const ring = frame.radius / (read.depth + 1);
  const spans = partition(root);
  const drawn = read.nodes.filter((n) => n.depth <= read.depth && n.value > 0);
  const first = root.children.filter((c) => c.value > 0);
  const share = (node: TreeNode) => formatNumber(node.value / root.value, locale, PERCENT);

  // Tone by the first ring, the ring's rule (DD-032, REQ-440): an outer arc takes its ancestor's.
  const toneOf = new Map<TreeNode, ToneLevel>();
  const tone = (node: TreeNode): ToneLevel => {
    const known = toneOf.get(node);
    if (known) return known;
    const own = node.depth <= 1 ? ringTone(Math.max(first.indexOf(node), 0), first.length) : tone(node.parent as TreeNode);
    toneOf.set(node, own);
    return own;
  };

  const centre = circlePath(frame.cx, frame.cy, ring);
  strokes.push({ d: centre, role: 'encoding', part: 'ink', paint: 'stroke' });
  const paths = new Map<TreeNode, string>();
  const placed = drawn.map((node) => {
    if (node === root) return { node, x: frame.cx, y: frame.cy };
    const [s, e] = spans.get(node.id) as readonly [number, number];
    const start = s * TURN;
    const end = e * TURN;
    const shape = { inner: node.depth * ring, outer: (node.depth + 1) * ring, start, end };
    const d = sectorPath(frame, shape);
    paths.set(node, d);
    if (d) strokes.push({ d, role: 'encoding', part: 'ink', tone: tone(node) });
    const middle = pointAt(frame, (start + end) / 2, (shape.inner + shape.outer) / 2);
    // A first-ring arc long enough for its name carries it, centred on the arc (REQ-440).
    const text = node.label;
    if (node.depth === 1 && ((end - start) * (shape.inner + shape.outer)) / 2 >= Math.min(text.length, 10) * TICK_CHAR && ring >= 12) {
      labels.push({ x: middle.x, y: middle.y + 3, text: fitText(text, ((end - start) * (shape.inner + shape.outer)) / 2), kind: 'tick', part: 'text', anchor: 'middle' });
    }
    return { node, x: middle.x, y: middle.y };
  });
  // The centre names the drawn root and its total; activating it returns to `up` (DD-033).
  labels.push({ x: frame.cx, y: frame.cy + 3, text: fitText(root.label, ring * 2 - 6), kind: 'tick', part: 'text', anchor: 'middle' });

  if (withLegend) {
    const x = ringArea.x + ringArea.width + LEGEND_GAP;
    const key = sectorLegend({ x, y: plot.y, width: Math.max(plot.x + plot.width - x, 1), height: plot.height }, first.map((n) => ({ name: n.label, share: share(n), tone: tone(n) })));
    strokes.push(...key.strokes);
    labels.push(...key.labels);
  }

  const hitAreas: HitArea[] = nodeHitAreas(read, placed);

  // One heightened element (REQ-442): the largest first-ring arc, the arc itself.
  // A root drawn alone (a leaf as `rootId`) heightens the centre.
  const largest = first.length > 0 ? first.reduce((a, b) => (b.value > a.value ? b : a)) : root;
  const raised = paths.get(largest) ?? centre;
  strokes.push({ d: raised, role: 'encoding', part: 'heighten', paint: 'fill' });

  const description =
    props.description ??
    `${base.name}. Sunburst of ${treeSummary(read, locale, numberFormat)}; each arc's angle is its value, each ring a level.${largest === root ? '' : ` The largest first-level arc is ${largest.label}, ${share(largest)} of the whole.`}`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `SunburstChart` recipe (REQ-417): a hierarchy as concentric rings of arcs, angle ∝ value, with a controlled root. */
export const sunburstChart: ChartRecipe<SunburstChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildSunburstChart });
