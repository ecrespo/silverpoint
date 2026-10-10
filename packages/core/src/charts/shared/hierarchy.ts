/**
 * The hierarchy layouts of the treemap, the sunburst and the tree (DD-028, REQ-416..REQ-418): the
 * tree built from validated rows, a subtree drawn as root (DD-033), squarify, partition and the
 * tidy tree — all owned, with only `+ − × ÷` and comparisons inside them (REQ-435). Rows are
 * validated before they get here (`readHierarchy`, REQ-437).
 */
import type { Datum, Rect } from '../../types';
import type { HierarchyRow } from './contracts';

/** A node of the tree, with what is derived from its rows (Data Model §2.23). */
export interface TreeNode {
  readonly id: string;
  readonly label: string;
  /** The row it came from; `-1` for a synthetic root. */
  readonly index: number;
  readonly datum: Datum;
  readonly parent: TreeNode | null;
  readonly children: readonly TreeNode[];
  readonly depth: number;
  /** Depth-first pre-order, from 0: the keyboard's order (REQ-438). */
  readonly order: number;
  /** A leaf's own value; an internal node's is the sum of its children (I-25). */
  readonly value: number;
  /** The node's value over its parent's; 1 for the root, 0 under a parent of value 0. */
  readonly share: number;
  /** Labels from the data root to the node, for the announcement (DD-031). */
  readonly path: readonly string[];
}

interface Building {
  id: string;
  label: string;
  index: number;
  datum: Datum;
  parent: Building | null;
  children: Building[];
  depth: number;
  order: number;
  value: number;
  share: number;
  path: string[];
}

/** Largest first, ties by id: an order no shuffle of the rows can change (I-23). */
const byValue = (a: Building, b: Building) => b.value - a.value || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Depth, pre-order, share and path, from `node` down; `path` is the path of its parent. */
function number(node: Building, depth: number, path: readonly string[], counter: { next: number }): void {
  node.depth = depth;
  node.order = counter.next++;
  node.path = [...path, node.label];
  for (const child of node.children) {
    child.share = node.value > 0 ? child.value / node.value : 0;
    number(child, depth + 1, node.path, counter);
  }
}

/**
 * The tree of validated rows. Siblings keep the data order (`data`), or run largest first with
 * ties by id (`value`), so a value-ordered layout does not depend on the order of the rows.
 */
export function stratify(rows: readonly HierarchyRow[], siblings: 'data' | 'value'): TreeNode | undefined {
  const nodes = new Map<string, Building>();
  for (const row of rows) {
    nodes.set(row.id, { id: row.id, label: row.label, index: row.index, datum: row.datum, parent: null, children: [], depth: 0, order: 0, value: row.value, share: 1, path: [] });
  }
  let root: Building | undefined;
  for (const row of rows) {
    const node = nodes.get(row.id) as Building;
    const parent = row.parent === null ? undefined : nodes.get(row.parent);
    if (parent) {
      node.parent = parent;
      parent.children.push(node);
    } else root ??= node;
  }
  if (!root) return undefined;
  // Post-order sums: an internal node's own value is ignored (Data Model §2.23).
  const sum = (node: Building): number => {
    if (node.children.length > 0) node.value = node.children.reduce((total, child) => total + sum(child), 0);
    return node.value;
  };
  sum(root);
  if (siblings === 'value') {
    const sort = (node: Building): void => {
      node.children.sort(byValue);
      node.children.forEach(sort);
    };
    sort(root);
  }
  root.share = 1;
  number(root, 0, [], { next: 0 });
  return root;
}

/** Every node, in pre-order. */
export function flatten(root: TreeNode): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (node: TreeNode) => {
    out.push(node);
    node.children.forEach(walk);
  };
  walk(root);
  return out;
}

/**
 * The subtree of `rootId` drawn as root (DD-033): a copy renumbered from its own root — depth 0,
 * share 1, pre-order from 0 — whose paths still run from the data root, and `up`, the node the
 * centre or the frame returns to. The input is not touched. An unknown or absent id is the data root.
 */
export function reroot(root: TreeNode, rootId: string | null | undefined): { root: TreeNode; up: TreeNode | null } {
  const found = rootId === null || rootId === undefined ? undefined : flatten(root).find((n) => n.id === rootId);
  if (!found || found === root) return { root, up: null };
  const copy = (node: TreeNode, parent: Building | null): Building => {
    const made: Building = { ...node, parent, children: [], path: [...node.path] } as Building;
    made.children = node.children.map((child) => copy(child, made));
    return made;
  };
  const top = copy(found, null);
  top.share = 1;
  number(top, 0, found.path.slice(0, -1), { next: 0 });
  return { root: top, up: found.parent };
}

/** Each node's span of its root, `[start, end]` in 0–1, children in order inside their parent's (I-25). */
export function partition(root: TreeNode): Map<string, readonly [number, number]> {
  const spans = new Map<string, readonly [number, number]>();
  const walk = (node: TreeNode, start: number, end: number) => {
    spans.set(node.id, [start, end]);
    let at = start;
    for (const child of node.children) {
      const width = node.value > 0 ? ((end - start) * child.value) / node.value : 0;
      // The last child ends exactly where its parent does, whatever the sum's last bit says.
      const next = child === node.children.at(-1) ? end : at + width;
      walk(child, at, next);
      at = next;
    }
  };
  walk(root, 0, 1);
  return spans;
}

/** The worst aspect ratio of a row of `areas` laid along a side of length `side` (Bruls et al.). */
function worst(areas: readonly number[], side: number): number {
  let sum = 0;
  let max = 0;
  let min = Number.POSITIVE_INFINITY;
  for (const a of areas) {
    sum += a;
    if (a > max) max = a;
    if (a < min) min = a;
  }
  const s2 = sum * sum;
  const w2 = side * side;
  return Math.max((w2 * max) / s2, s2 / (w2 * min));
}

/**
 * Squarified tiles of `rect` for `values`, in the given order (Bruls, Huizing and van Wijk): rows
 * are laid along the shorter side, and a tile joins the row while it does not worsen the row's
 * worst aspect ratio. Tile areas are proportional to the values (I-25); a zero value gets a tile of
 * no area at the row's end.
 */
export function squarify(values: readonly number[], rect: Rect): Rect[] {
  const total = values.reduce((sum, v) => sum + (v > 0 ? v : 0), 0);
  const tiles: Rect[] = values.map(() => ({ x: rect.x, y: rect.y, width: 0, height: 0 }));
  if (total <= 0) return values.length === 0 ? [] : tiles;
  const scale = (rect.width * rect.height) / total;
  const queue = values.map((v, i) => [v > 0 ? v * scale : 0, i] as const).filter(([a]) => a > 0);
  let free = { ...rect };
  let k = 0;
  while (k < queue.length) {
    const side = Math.min(free.width, free.height);
    const row = [queue[k] as readonly [number, number]];
    k += 1;
    while (k < queue.length) {
      const next = queue[k] as readonly [number, number];
      if (worst([...row, next].map(([a]) => a), side) > worst(row.map(([a]) => a), side)) break;
      row.push(next);
      k += 1;
    }
    const sum = row.reduce((s, [a]) => s + a, 0);
    const last = k === queue.length;
    if (free.width >= free.height) {
      // A column along the left edge, as tall as the free rectangle.
      const width = last ? free.width : sum / free.height;
      let y = free.y;
      row.forEach(([a, i], j) => {
        const height = j === row.length - 1 ? free.y + free.height - y : a / width;
        tiles[i] = { x: free.x, y, width, height };
        y += height;
      });
      free = { x: free.x + width, y: free.y, width: free.width - width, height: free.height };
    } else {
      // A row along the top edge, as wide as the free rectangle.
      const height = last ? free.height : sum / free.width;
      let x = free.x;
      row.forEach(([a, i], j) => {
        const width = j === row.length - 1 ? free.x + free.width - x : a / height;
        tiles[i] = { x, y: free.y, width, height };
        x += width;
      });
      free = { x: free.x, y: free.y + height, width: free.width, height: free.height - height };
    }
  }
  return tiles;
}

/** Walker's per-node state, as Buchheim, Jünger and Leipert name it. */
interface Walk {
  readonly node: TreeNode;
  readonly children: Walk[];
  readonly parent: Walk | null;
  /** 1-based position among its siblings. */
  readonly number: number;
  prelim: number;
  mod: number;
  shift: number;
  change: number;
  thread: Walk | null;
  ancestor: Walk;
}

/** The gap between neighbouring nodes of one depth, in layout units. */
const GAP = 1;

/**
 * The tidy tree of `root` (REQ-418): Buchheim, Jünger and Leipert's linear-time version of the
 * Reingold–Tilford algorithm with Walker's spreading of the smaller subtrees. `x` is the position
 * across the depth, in node gaps from the leftmost node; `y` is the depth. No two nodes of one depth
 * are closer than one gap, and every parent is centred over its children.
 */
export function tidyTree(root: TreeNode): Map<string, { x: number; y: number }> {
  const build = (node: TreeNode, parent: Walk | null, n: number): Walk => {
    const walk = { node, children: [] as Walk[], parent, number: n, prelim: 0, mod: 0, shift: 0, change: 0, thread: null } as unknown as Walk;
    walk.ancestor = walk;
    node.children.forEach((child, i) => walk.children.push(build(child, walk, i + 1)));
    return walk;
  };
  const top = build(root, null, 1);
  const leftSibling = (v: Walk) => (v.parent && v.number > 1 ? (v.parent.children[v.number - 2] as Walk) : null);
  const leftmostSibling = (v: Walk) => (v.parent && v.number > 1 ? (v.parent.children[0] as Walk) : null);
  const nextLeft = (v: Walk) => v.children[0] ?? v.thread;
  const nextRight = (v: Walk) => v.children.at(-1) ?? v.thread;

  const moveSubtree = (wm: Walk, wp: Walk, shift: number) => {
    const subtrees = wp.number - wm.number;
    wp.change -= shift / subtrees;
    wp.shift += shift;
    wm.change += shift / subtrees;
    wp.prelim += shift;
    wp.mod += shift;
  };
  const executeShifts = (v: Walk) => {
    let shift = 0;
    let change = 0;
    for (let i = v.children.length - 1; i >= 0; i -= 1) {
      const w = v.children[i] as Walk;
      w.prelim += shift;
      w.mod += shift;
      change += w.change;
      shift += w.shift + change;
    }
  };
  const ancestorOf = (vim: Walk, v: Walk, fallback: Walk) => (vim.ancestor.parent === v.parent ? vim.ancestor : fallback);

  const apportion = (v: Walk, defaultAncestor: Walk): Walk => {
    const w = leftSibling(v);
    if (!w) return defaultAncestor;
    let vip: Walk = v;
    let vop: Walk = v;
    let vim: Walk = w;
    let vom: Walk = leftmostSibling(v) as Walk;
    let sip = vip.mod;
    let sop = vop.mod;
    let sim = vim.mod;
    let som = vom.mod;
    let ancestor = defaultAncestor;
    while (nextRight(vim) && nextLeft(vip)) {
      vim = nextRight(vim) as Walk;
      vip = nextLeft(vip) as Walk;
      vom = nextLeft(vom) as Walk;
      vop = nextRight(vop) as Walk;
      vop.ancestor = v;
      const shift = vim.prelim + sim - (vip.prelim + sip) + GAP;
      if (shift > 0) {
        moveSubtree(ancestorOf(vim, v, ancestor), v, shift);
        sip += shift;
        sop += shift;
      }
      sim += vim.mod;
      sip += vip.mod;
      som += vom.mod;
      sop += vop.mod;
    }
    if (nextRight(vim) && !nextRight(vop)) {
      vop.thread = nextRight(vim);
      vop.mod += sim - sop;
    }
    if (nextLeft(vip) && !nextLeft(vom)) {
      vom.thread = nextLeft(vip);
      vom.mod += sip - som;
      ancestor = v;
    }
    return ancestor;
  };

  const firstWalk = (v: Walk) => {
    const w = leftSibling(v);
    if (v.children.length === 0) {
      v.prelim = w ? w.prelim + GAP : 0;
      return;
    }
    let defaultAncestor = v.children[0] as Walk;
    for (const child of v.children) {
      firstWalk(child);
      defaultAncestor = apportion(child, defaultAncestor);
    }
    executeShifts(v);
    const midpoint = ((v.children[0] as Walk).prelim + (v.children.at(-1) as Walk).prelim) / 2;
    if (w) {
      v.prelim = w.prelim + GAP;
      v.mod = v.prelim - midpoint;
    } else v.prelim = midpoint;
  };

  const at = new Map<string, { x: number; y: number }>();
  const secondWalk = (v: Walk, m: number) => {
    at.set(v.node.id, { x: v.prelim + m, y: v.node.depth - root.depth });
    for (const child of v.children) secondWalk(child, m + v.mod);
  };
  firstWalk(top);
  secondWalk(top, -top.prelim);
  // From the leftmost node: every x at or above 0.
  let left = Number.POSITIVE_INFINITY;
  for (const p of at.values()) if (p.x < left) left = p.x;
  for (const p of at.values()) p.x -= left;
  return at;
}
