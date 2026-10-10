/**
 * T-180 · the hierarchy layouts the core owns (DD-028): stratify and reroot (DD-033), squarify
 * (Bruls, Huizing and van Wijk), partition, and the tidy tree (Buchheim, Jünger and Leipert).
 * REQ-437, REQ-430, REQ-444; I-25.
 */
import { describe, expect, test } from 'vitest';
import { readHierarchy, type HierarchyRow } from '../src/charts/shared/contracts';
import { flatten, partition, reroot, squarify, stratify, tidyTree, type TreeNode } from '../src/charts/shared/hierarchy';
import { SQUARIFIED_TREEMAP_DEMO, SQUARIFIED_TREEMAP_DEMO_KEYS } from '../src/charts/squarified-treemap/demo';
import type { Rect } from '../src';

const rowsOf = (spec: readonly (readonly [string, string | null, number?])[]): HierarchyRow[] =>
  spec.map(([id, parent, value], index) => ({ id, parent, value: value ?? 0, label: id.toUpperCase(), index, datum: { id } }));

const demo = () => {
  const k = SQUARIFIED_TREEMAP_DEMO_KEYS;
  return readHierarchy('SquarifiedTreemap', SQUARIFIED_TREEMAP_DEMO, { id: k.idKey, parent: k.parentKey, value: k.valueKey, label: k.labelKey }, 'All').rows;
};

describe('T-180 · stratify', () => {
  test('REQ-416 · I-25 · the demo: 38 nodes, 24 leaves at two depths, every node the sum of its children', () => {
    const root = stratify(demo(), 'data') as TreeNode;
    const nodes = flatten(root);
    expect(nodes).toHaveLength(38);
    const leaves = nodes.filter((n) => n.children.length === 0);
    expect(leaves).toHaveLength(24);
    expect(new Set(leaves.map((n) => n.depth)).size).toBe(2);
    for (const n of nodes) {
      if (n.children.length > 0) expect(n.value).toBeCloseTo(n.children.reduce((s, c) => s + c.value, 0), 9);
    }
  });

  test('REQ-438 · order is the depth-first pre-order; depth, share of the parent and path are derived', () => {
    const root = stratify(rowsOf([['r', null], ['a', 'r'], ['b', 'r', 3], ['a1', 'a', 1], ['a2', 'a', 4]]), 'data') as TreeNode;
    expect(flatten(root).map((n) => [n.id, n.order, n.depth])).toEqual([['r', 0, 0], ['a', 1, 1], ['a1', 2, 2], ['a2', 3, 2], ['b', 4, 1]]);
    const a2 = flatten(root).find((n) => n.id === 'a2') as TreeNode;
    expect(a2.path).toEqual(['R', 'A', 'A2']);
    expect(a2.share).toBeCloseTo(4 / 5, 12);
    expect(root.share).toBe(1);
    expect(root.value).toBe(8);
  });

  test('REQ-430 · I-23 · by value: siblings largest first, ties by id, whatever the row order', () => {
    const spec = [['r', null], ['c', 'r', 2], ['a', 'r', 5], ['b', 'r', 2]] as const;
    const ids = (rows: HierarchyRow[]) => (stratify(rows, 'value') as TreeNode).children.map((n) => n.id);
    expect(ids(rowsOf(spec))).toEqual(['a', 'b', 'c']);
    expect(ids(rowsOf([...spec].reverse()))).toEqual(['a', 'b', 'c']);
  });

  test('REQ-437 · no rows, no tree', () => {
    expect(stratify([], 'data')).toBeUndefined();
  });
});

describe('T-180 · reroot (DD-033)', () => {
  const root = stratify(rowsOf([['r', null], ['a', 'r'], ['b', 'r', 3], ['a1', 'a', 1], ['a2', 'a', 4]]), 'data') as TreeNode;

  test('REQ-439 · the subtree, renumbered from its own root, its path still from the data root; up is its parent', () => {
    const { root: a, up } = reroot(root, 'a');
    expect(flatten(a).map((n) => [n.id, n.order, n.depth])).toEqual([['a', 0, 0], ['a1', 1, 1], ['a2', 2, 1]]);
    expect(a.share).toBe(1);
    expect(a.parent).toBeNull();
    expect(a.children[1]?.path).toEqual(['R', 'A', 'A2']);
    expect(up?.id).toBe('r');
  });

  test('REQ-439 · pure: the input tree is unchanged; an unknown or absent id is the data root', () => {
    reroot(root, 'a');
    expect(flatten(root).map((n) => n.order)).toEqual([0, 1, 2, 3, 4]);
    expect(reroot(root, 'zz')).toEqual({ root, up: null });
    expect(reroot(root, null)).toEqual({ root, up: null });
  });
});

describe('T-180 · squarify', () => {
  const area = (r: Rect) => r.width * r.height;

  test('REQ-416 · Bruls et al.’s worked example: 6, 6, 4, 3, 2, 2, 1 in 6 × 4', () => {
    const tiles = squarify([6, 6, 4, 3, 2, 2, 1], { x: 0, y: 0, width: 6, height: 4 });
    const fixed = tiles.map((t) => [t.x, t.y, t.width, t.height].map((v) => Math.round(v * 1000) / 1000));
    expect(fixed).toEqual([
      [0, 0, 3, 2],
      [0, 2, 3, 2],
      [3, 0, 1.714, 2.333],
      [4.714, 0, 1.286, 2.333],
      [3, 2.333, 1.2, 1.667],
      [4.2, 2.333, 1.2, 1.667],
      [5.4, 2.333, 0.6, 1.667],
    ]);
  });

  test('REQ-416 · I-25 · tiles are proportional to value, disjoint, and cover their rectangle', () => {
    const values = [13, 8, 8, 5, 3, 2, 1, 1, 0.5];
    const rect = { x: 10, y: 20, width: 300, height: 140 };
    const tiles = squarify(values, rect);
    const total = values.reduce((s, v) => s + v, 0);
    tiles.forEach((t, i) => expect(area(t)).toBeCloseTo((area(rect) * (values[i] as number)) / total, 6));
    expect(tiles.reduce((s, t) => s + area(t), 0)).toBeCloseTo(area(rect), 6);
    for (const [i, a] of tiles.entries()) {
      expect(a.x).toBeGreaterThanOrEqual(rect.x - 1e-9);
      expect(a.y).toBeGreaterThanOrEqual(rect.y - 1e-9);
      expect(a.x + a.width).toBeLessThanOrEqual(rect.x + rect.width + 1e-9);
      expect(a.y + a.height).toBeLessThanOrEqual(rect.y + rect.height + 1e-9);
      for (const b of tiles.slice(i + 1)) {
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        expect(overlapX <= 1e-9 || overlapY <= 1e-9).toBe(true);
      }
    }
  });

  test('REQ-416 · a zero value has a zero tile; no values, no tiles', () => {
    const tiles = squarify([3, 0, 1], { x: 0, y: 0, width: 4, height: 1 });
    expect(area(tiles[1] as Rect)).toBe(0);
    expect(squarify([], { x: 0, y: 0, width: 4, height: 1 })).toEqual([]);
  });
});

describe('T-180 · partition', () => {
  test('REQ-417 · I-25 · each node spans its share of its parent, children in order, inside it', () => {
    const root = stratify(rowsOf([['r', null], ['a', 'r'], ['b', 'r', 2], ['a1', 'a', 1], ['a2', 'a', 3]]), 'data') as TreeNode;
    const spans = partition(root);
    expect(spans.get('r')).toEqual([0, 1]);
    expect(spans.get('a')).toEqual([0, 4 / 6]);
    expect(spans.get('b')).toEqual([4 / 6, 1]);
    expect(spans.get('a1')).toEqual([0, 1 / 6]);
    expect(spans.get('a2')).toEqual([1 / 6, 4 / 6]);
  });
});

describe('T-180 · tidy tree (Buchheim, Jünger and Leipert)', () => {
  const layout = (spec: readonly (readonly [string, string | null])[]) => {
    const at = tidyTree(stratify(rowsOf(spec), 'data') as TreeNode);
    return Object.fromEntries([...at].map(([id, p]) => [id, [p.x, p.y]]));
  };

  test('REQ-418 · a single chain stands in one column', () => {
    expect(layout([['a', null], ['b', 'a'], ['c', 'b']])).toEqual({ a: [0, 0], b: [0, 1], c: [0, 2] });
  });

  test('REQ-418 · a fan-out: leaves one gap apart, the parent centred over them', () => {
    expect(layout([['r', null], ['a', 'r'], ['b', 'r'], ['c', 'r']])).toEqual({ r: [1, 0], a: [0, 1], b: [1, 1], c: [2, 1] });
  });

  test('REQ-418 · unbalanced subtrees: deep contours are separated, not only the children (apportion)', () => {
    const at = layout([
      ['r', null], ['l', 'r'], ['m', 'r'],
      ['l1', 'l'], ['l1a', 'l1'], ['l1b', 'l1'], ['l1c', 'l1'],
      ['m1', 'm'], ['m1a', 'm1'], ['m1b', 'm1'], ['m1c', 'm1'],
    ]);
    // Without apportioning, l and m sit one apart and their grandchildren overlap.
    const byDepth = new Map<number, number[]>();
    for (const [x, y] of Object.values(at) as [number, number][]) byDepth.set(y, [...(byDepth.get(y) ?? []), x]);
    for (const xs of byDepth.values()) {
      const sorted = [...xs].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i += 1) expect((sorted[i] as number) - (sorted[i - 1] as number)).toBeGreaterThanOrEqual(1 - 1e-9);
    }
    expect(at.l1a).toEqual([0, 3]);
    expect(at.m1c).toEqual([5, 3]);
    expect(at.r?.[0]).toBe(2.5);
  });

  test('REQ-418 · the classic unbalanced tree keeps every depth one gap apart and every parent over its children', () => {
    const spec: [string, string | null][] = [['r', null]];
    // A wide left subtree, a lone middle leaf and a deep right subtree: the middle leaf must be
    // spaced by the shifts of its siblings (the change/shift bookkeeping of executeShifts).
    for (const id of ['a', 'b', 'c']) spec.push([id, 'r']);
    for (const id of ['a1', 'a2', 'a3', 'a4']) spec.push([id, 'a']);
    spec.push(['c1', 'c'], ['c11', 'c1'], ['c12', 'c1'], ['c13', 'c1'], ['c14', 'c1']);
    const at = layout(spec);
    const tree = stratify(rowsOf(spec), 'data') as TreeNode;
    for (const n of flatten(tree)) {
      if (n.children.length === 0) continue;
      const xs = n.children.map((c) => at[c.id]?.[0] as number);
      expect(at[n.id]?.[0]).toBeCloseTo(((xs[0] as number) + (xs.at(-1) as number)) / 2, 9);
    }
    const depth1 = ['a', 'b', 'c'].map((id) => at[id]?.[0] as number);
    expect(depth1[1]! - depth1[0]!).toBeCloseTo(depth1[2]! - depth1[1]!, 9);
  });
});
