/**
 * What the three hierarchy charts share (REQ-416..REQ-418, DD-031, DD-033): rows validated and
 * built into a tree, the controlled root and the depth drawn, the tabular alternative in pre-order,
 * and each drawn node's hit area — its frozen summary, its place in the tree and its moves.
 */
import { warnValue } from './cells';
import { checkCeiling, checkWhole, readHierarchy } from './contracts';
import { accessorName, formatNumber, numberFormatter } from './format';
import { flatten, reroot, stratify, type TreeNode } from './hierarchy';
import { treeMoves } from '../../interaction/tree';
import type { Accessor, CommonChartProps, DataTable, Datum, HitArea, RecipeContext } from '../../types';

/** A column name and a share of the parent, as the table and the announcement print it. */
const SHARE: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 1 };

export interface HierarchyKeys {
  readonly id: Accessor<unknown>;
  readonly parent: Accessor<unknown>;
  readonly label?: Accessor<unknown>;
  readonly value?: Accessor<unknown>;
}

export interface ReadTree {
  /** The tree drawn: the data root, or the subtree of `rootId`. `undefined` with no valid row. */
  readonly root: TreeNode | undefined;
  /** Where the centre or the frame returns to: the drawn root's parent, `null` at the data root. */
  readonly up: TreeNode | null;
  /** Every node of the drawn tree, in pre-order: `nodes[i].order === i`, the table's row `i`. */
  readonly nodes: readonly TreeNode[];
  /** Levels drawn below the root. */
  readonly depth: number;
  readonly valueName: string;
  readonly table: Omit<DataTable, 'caption'>;
  /** The value cell of a node: its value and, below the root, its share of its parent. */
  readonly valueText: (node: TreeNode) => string;
}

/**
 * Reads a hierarchy chart's rows into the tree it draws. `siblings` orders children; `rootId` and
 * `depth` are the chart's view props (an unknown `rootId` is the data root, warned `SP002`).
 */
export function readTree(
  chart: string,
  data: readonly Datum[],
  keys: HierarchyKeys,
  props: CommonChartProps & { readonly rootId?: string | null; readonly depth?: number },
  context: RecipeContext,
  siblings: 'data' | 'value',
): ReadTree {
  const { locale } = context;
  const valueName = keys.value === undefined ? 'leaves' : accessorName(keys.value, 'value');
  const rows = readHierarchy(chart, data, keys, props.title ?? 'All').rows;
  checkCeiling(chart, accessorName(keys.id, 'id'), 'nodes', rows.length);
  // Without a value key, a node counts its leaves: every leaf is 1 (TreeChart).
  const tree = stratify(keys.value === undefined ? rows.map((r) => ({ ...r, value: 1 })) : rows, siblings);
  let root = tree;
  let up: TreeNode | null = null;
  if (tree && props.rootId !== undefined && props.rootId !== null) {
    const rerooted = reroot(tree, props.rootId);
    if (rerooted.root === tree && props.rootId !== tree.id) warnValue(chart, 'rootId', `"${props.rootId}" names no node; the data root is drawn.`);
    root = rerooted.root;
    up = rerooted.up;
  }
  const nodes = root ? flatten(root) : [];
  const deepest = nodes.reduce((max, n) => Math.max(max, n.depth), 0);
  const depth = Math.min(checkWhole(chart, 'depth', props.depth, 1) ?? deepest, deepest);

  const value = numberFormatter(locale, props.numberFormat);
  const share = numberFormatter(locale, SHARE);
  const valueText = (node: TreeNode) => {
    const parent = node === root ? null : node.parent;
    return parent ? `${value(node.value)}, ${share(node.share)} of ${parent.label}` : value(node.value);
  };
  return {
    root,
    up,
    nodes,
    depth,
    valueName,
    valueText,
    table: { columns: ['node', valueName], rows: nodes.map((n) => [n.path.join(' › '), valueText(n)]) },
  };
}

/**
 * Hit areas for the drawn nodes, given where each sits: the frozen summary of API delta §4, the
 * node's place in the tree (`index` is its pre-order), and the tree's moves (REQ-438). The drawn
 * root's summary names `up`, the id its centre or frame returns to (`null`: the data root).
 */
export function nodeHitAreas(
  read: ReadTree,
  placed: readonly { readonly node: TreeNode; readonly x: number; readonly y: number; readonly box?: HitArea['box'] }[],
): HitArea[] {
  const { root, up } = read;
  const hits = placed.map(({ node, x, y, box }): HitArea => {
    const summary: Record<string, unknown> = { id: node.id, path: node.path, value: node.value, share: node.share };
    if (node === root && up) summary.up = up.parent === null ? null : up.id;
    return {
      seriesKey: read.valueName,
      index: node.order,
      datum: Object.freeze(summary),
      value: node.value,
      x,
      y,
      ...(box ? { box } : {}),
      node: { id: node.id, parent: node === root ? null : (node.parent?.id ?? null), depth: node.depth, order: node.order },
    };
  });
  return treeMoves(hits);
}

/** "3 levels, 38 nodes, 24 leaves, totalling 150,000", for a description. */
export function treeSummary(read: ReadTree, locale: string, numberFormat: Intl.NumberFormatOptions | undefined): string {
  const leaves = read.nodes.filter((n) => n.children.length === 0).length;
  const root = read.root as TreeNode;
  return `${read.depth + 1} levels, ${read.nodes.length} nodes, ${leaves} leaves, rooted at ${root.path.join(' › ')}, totalling ${formatNumber(root.value, locale, numberFormat)}`;
}
