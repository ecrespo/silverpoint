import type { ChartModel, ChartRecipe, HitArea, Rect, RecipeContext, Stroke, TextLabel, TreeChartProps } from '../../types';
import { cardLayout } from '../shared/card';
import { PLOT_INSET, TICK_CHAR } from '../shared/cartesian';
import { circlePath, fitText } from '../shared/format';
import { tidyTree, type TreeNode } from '../shared/hierarchy';
import { nodeHitAreas, readTree, treeSummary } from '../shared/nodes';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { TREE_CHART_DEMO, TREE_CHART_DEMO_KEYS } from './demo';

const CHART = 'TreeChart';
const NODE_RADIUS = 3;
const HEIGHTEN_RADIUS = 3.5;
/** Two labels nearer than this across the depth would collide: the later one is left to the table. */
const LABEL_GAP = 10;

function buildTreeChart(props: TreeChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? TREE_CHART_DEMO;
  const k = TREE_CHART_DEMO_KEYS;
  const keys = usesDemo
    ? { id: k.idKey, parent: k.parentKey, label: k.labelKey, value: k.valueKey }
    : {
        id: props.idKey ?? 'id',
        parent: props.parentKey ?? 'parent',
        ...(props.labelKey === undefined ? {} : { label: props.labelKey }),
        ...(props.valueKey === undefined ? {} : { value: props.valueKey }),
      };
  const horizontal = props.orientation !== 'vertical';
  const { locale } = context;
  const numberFormat = props.numberFormat;

  // A tree keeps the data's sibling order: an organisation reads in the order it is given.
  const read = readTree(CHART, data, keys, props, context, 'data');
  const base = modelBase(CHART, props, context, 'Tree', read.table);
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const area = card.area;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const root = read.root;
  if (!root) return emptyModel(base, props, context, { viewBox: card.viewBox, plot: area, strokes, labels }, data.length === 0);

  const at = tidyTree(root);
  const depth = Math.max(read.depth, 1);
  let breadth = 0;
  for (const p of at.values()) if (p.x > breadth) breadth = p.x;
  // Room for the names: the root's before it and the leaves' after them (horizontal), or the
  // leaves' below them (vertical).
  const longest = (nodes: readonly TreeNode[]) => Math.max(0, ...nodes.map((n) => n.label.length * TICK_CHAR));
  const leaves = read.nodes.filter((n) => n.children.length === 0 && n.depth === read.depth);
  const before = horizontal ? Math.min(longest([root]) + 8, area.width / 5) : 0;
  const after = horizontal ? Math.min(longest(leaves) + 8, area.width / 3) : 14;
  const plot: Rect = horizontal
    ? { x: area.x + PLOT_INSET + before, y: area.y + PLOT_INSET, width: Math.max(area.width - 2 * PLOT_INSET - before - after, 1), height: Math.max(area.height - 2 * PLOT_INSET, 1) }
    : { x: area.x + PLOT_INSET, y: area.y + PLOT_INSET + 6, width: Math.max(area.width - 2 * PLOT_INSET, 1), height: Math.max(area.height - 2 * PLOT_INSET - 6 - after, 1) };
  const across = (x: number) => (breadth > 0 ? x / breadth : 0.5);
  const position = (node: TreeNode) => {
    const p = at.get(node.id) as { x: number; y: number };
    return horizontal
      ? { x: plot.x + (p.y / depth) * plot.width, y: plot.y + across(p.x) * plot.height }
      : { x: plot.x + across(p.x) * plot.width, y: plot.y + (p.y / depth) * plot.height };
  };
  const place = new Map(read.nodes.map((n) => [n, position(n)] as const));

  // Links, parent to child: an exact cubic with its tangents along the depth (encoding: the tree is the data).
  for (const node of read.nodes) {
    if (node === root) continue;
    const a = place.get(node.parent as TreeNode) as { x: number; y: number };
    const b = place.get(node) as { x: number; y: number };
    const d = horizontal
      ? `M${a.x},${a.y}C${(a.x + b.x) / 2},${a.y},${(a.x + b.x) / 2},${b.y},${b.x},${b.y}`
      : `M${a.x},${a.y}C${a.x},${(a.y + b.y) / 2},${b.x},${(a.y + b.y) / 2},${b.x},${b.y}`;
    strokes.push({ d, role: 'encoding', part: 'ink' });
  }
  for (const node of read.nodes) {
    const p = place.get(node) as { x: number; y: number };
    strokes.push({ d: circlePath(p.x, p.y, NODE_RADIUS), role: 'encoding', part: 'ink' });
  }

  // Names: each leaf past its node, the root before it, an inner node beside it; thinned so none
  // collide (the table and the announcement name every node, REQ-121).
  const lastAt = new Map<number, number>();
  for (const node of read.nodes) {
    const p = place.get(node) as { x: number; y: number };
    // Only the deepest leaves have the room past them; a shallower leaf is named as an inner node is.
    const leaf = node.children.length === 0 && node.depth === read.depth;
    const lane = horizontal ? (leaf ? Number.POSITIVE_INFINITY : node.depth) : leaf ? Number.POSITIVE_INFINITY : node.depth;
    const along = horizontal ? p.y : p.x;
    const room = horizontal ? LABEL_GAP : Math.min(node.label.length, 12) * TICK_CHAR;
    const previous = lastAt.get(lane);
    if (previous !== undefined && Math.abs(along - previous) < room) continue;
    lastAt.set(lane, along);
    if (horizontal) {
      const text = fitText(node.label, leaf ? after - 8 : node === root ? before - 4 : plot.width / depth - 12);
      labels.push(leaf ? { x: p.x + 6, y: p.y + 3, text, kind: 'tick', part: 'axis', anchor: 'start' } : { x: p.x - 6, y: p.y - 4, text, kind: 'tick', part: 'axis', anchor: 'end' });
    } else {
      const text = fitText(node.label, 12 * TICK_CHAR);
      labels.push(leaf ? { x: p.x, y: p.y + 13, text, kind: 'tick', part: 'axis', anchor: 'middle' } : { x: p.x + 6, y: p.y - 4, text, kind: 'tick', part: 'axis', anchor: 'start' });
    }
  }

  const hitAreas: HitArea[] = nodeHitAreas(
    read,
    read.nodes.map((node) => {
      const p = place.get(node) as { x: number; y: number };
      return { node, x: p.x, y: p.y, box: { x: p.x - NODE_RADIUS, y: p.y - NODE_RADIUS, width: 2 * NODE_RADIUS, height: 2 * NODE_RADIUS } };
    }),
  );

  // One heightened element (REQ-442): the root.
  const r = place.get(root) as { x: number; y: number };
  const mark = circlePath(r.x, r.y, HEIGHTEN_RADIUS);
  strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
  strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });

  const description = props.description ?? `${base.name}. Tidy tree, ${horizontal ? 'left to right' : 'top to bottom'}, of ${treeSummary(read, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `TreeChart` recipe (REQ-418): a tidy node-link tree, horizontal or vertical. */
export const treeChart: ChartRecipe<TreeChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildTreeChart });
