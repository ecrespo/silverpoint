/**
 * T-195 · the network layout the core owns (DD-030): Fruchterman–Reingold over a fixed number of
 * iterations from a seeded grid, in correctly rounded arithmetic only. REQ-426, REQ-435, REQ-436;
 * I-27.
 */
import { describe, expect, test } from 'vitest';
import { layoutNetwork, type LayoutLink } from '../src/charts/shared/network';

/** Two cliques of eight, joined by one bridge. */
const CLIQUES: LayoutLink[] = [];
for (const offset of [0, 8]) {
  for (let a = 0; a < 8; a += 1) for (let b = a + 1; b < 8; b += 1) CLIQUES.push({ source: offset + a, target: offset + b });
}
CLIQUES.push({ source: 0, target: 8 });

const distance = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2);

describe('T-195 · layoutNetwork', () => {
  test('REQ-435 · I-27 · no iteration leaves the seeded grid, fitted to the square: a permutation of its cells', () => {
    const start = layoutNetwork(9, [], { iterations: 0, seed: 7 });
    expect(start.map((p) => `${p.x},${p.y}`).sort()).toEqual(Array.from({ length: 9 }, (_, k) => `${(k % 3) / 2},${Math.floor(k / 3) / 2}`).sort());
    expect(layoutNetwork(9, [], { iterations: 0, seed: 8 })).not.toEqual(start);
  });

  test('REQ-435 · I-27 · the same seed gives the same layout to the last bit', () => {
    const a = layoutNetwork(16, CLIQUES, { iterations: 300, seed: 426 });
    expect(layoutNetwork(16, CLIQUES, { iterations: 300, seed: 426 })).toEqual(a);
    expect(JSON.stringify(a)).not.toMatch(/NaN|null/);
  });

  test('REQ-426 · every node stays in the unit square, even pushed out by repulsion alone', () => {
    for (const p of [...layoutNetwork(16, CLIQUES, { iterations: 300, seed: 1 }), ...layoutNetwork(30, [], { iterations: 300, seed: 1 })]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });

  test('REQ-426 · no wall stops a node: the layout is fitted to the square, so only its extremes touch the edges', () => {
    const at = layoutNetwork(16, CLIQUES, { iterations: 300, seed: 426 });
    const edge = at.filter((p) => p.x === 0 || p.x === 1 || p.y === 0 || p.y === 1);
    expect(edge.length).toBeLessThanOrEqual(4);
    expect(Math.min(...at.map((p) => p.x))).toBe(0);
    expect(Math.max(...at.map((p) => p.y))).toBe(1);
  });

  test('REQ-426 · linked nodes gather: each clique is tighter than the gap between the two', () => {
    const at = layoutNetwork(16, CLIQUES, { iterations: 300, seed: 426 });
    const mean = (pairs: [number, number][]) => pairs.reduce((s, [a, b]) => s + distance(at[a]!, at[b]!), 0) / pairs.length;
    const inside: [number, number][] = [];
    const across: [number, number][] = [];
    for (let a = 0; a < 16; a += 1) for (let b = a + 1; b < 16; b += 1) (Math.floor(a / 8) === Math.floor(b / 8) ? inside : across).push([a, b]);
    expect(mean(inside) * 2).toBeLessThan(mean(across));
  });

  test('REQ-426 · a self-link pulls nothing; an isolated node is still placed', () => {
    const at = layoutNetwork(3, [{ source: 0, target: 0 }, { source: 1, target: 2 }], { iterations: 50, seed: 3 });
    expect(at).toHaveLength(3);
    expect(JSON.stringify(at)).not.toMatch(/NaN|null/);
  });

  test('REQ-426 · one node sits in the middle', () => {
    expect(layoutNetwork(1, [], { iterations: 300, seed: 9 })).toEqual([{ x: 0.5, y: 0.5 }]);
  });
});
