/**
 * T-166 · the `tree` keyboard model (DD-031, REQ-438) and `ringTone` shared by every family
 * (DD-032, REQ-440, REQ-447).
 */
import { describe, expect, test } from 'vitest';
import { stepActive, type ActiveItem, type Geometry, type HitArea } from '../src';
import { toActiveItem, treeLabel } from '../src/interaction/hit-test';
import { ringTone as fromCells, ringTones as tonesFromCells } from '../src/charts/shared/cells';
import { ringTone, ringTones } from '../src/charts/shared/polar';

/**
 *   root
 *   ├── a
 *   │   ├── a1
 *   │   └── a2
 *   ├── b          (a leaf in the middle)
 *   └── c
 *       └── c1
 * Depth-first pre-order: root, a, a1, a2, b, c, c1.
 */
const NODES = [
  ['root', null, 0],
  ['a', 'root', 1],
  ['a1', 'a', 2],
  ['a2', 'a', 2],
  ['b', 'root', 1],
  ['c', 'root', 1],
  ['c1', 'c', 2],
] as const;

// Hit areas deliberately out of pre-order: the model walks `order`, never the array.
const HITS: HitArea[] = [...NODES.keys()].reverse().map((order) => {
  const [id, parent, depth] = NODES[order] as (typeof NODES)[number];
  return { seriesKey: 'node', index: order, datum: { id }, value: 1, x: depth * 10, y: order * 10, node: { id, parent, depth, order } };
});
const geometry: Geometry = { viewBox: { x: 0, y: 0, width: 100, height: 100 }, plot: { x: 0, y: 0, width: 100, height: 100 }, strokes: [], labels: [], hitAreas: HITS, defs: [] };

const at = (id: string): ActiveItem => toActiveItem(HITS.find((h) => h.node?.id === id) as HitArea);
const step = (from: string | null, key: string) => {
  const next = stepActive(geometry, from === null ? null : at(from), key);
  return next ? (next.datum as { id: string }).id : next;
};

describe('T-166 · stepTree (WAI-ARIA tree pattern, REQ-438)', () => {
  test.each([
    // Down / Up: depth-first pre-order, stopping at the ends.
    ['root', 'ArrowDown', 'a'],
    ['a2', 'ArrowDown', 'b'],
    ['b', 'ArrowDown', 'c'],
    ['c1', 'ArrowDown', 'c1'],
    ['b', 'ArrowUp', 'a2'],
    ['a', 'ArrowUp', 'root'],
    ['root', 'ArrowUp', 'root'],
    // Right: to the first child; a leaf stays.
    ['root', 'ArrowRight', 'a'],
    ['a', 'ArrowRight', 'a1'],
    ['c', 'ArrowRight', 'c1'],
    ['a2', 'ArrowRight', 'a2'],
    ['b', 'ArrowRight', 'b'],
    // Left: to the parent; the root stays.
    ['a1', 'ArrowLeft', 'a'],
    ['a2', 'ArrowLeft', 'a'],
    ['c1', 'ArrowLeft', 'c'],
    ['b', 'ArrowLeft', 'root'],
    ['root', 'ArrowLeft', 'root'],
    // Home / End: the first and last node, from anywhere.
    ['a2', 'Home', 'root'],
    ['root', 'End', 'c1'],
    ['b', 'End', 'c1'],
  ])('REQ-438 · from %s, %s → %s', (from, key, expected) => {
    expect(step(from, key)).toBe(expected);
  });

  test('REQ-438 · with nothing active, every arrow lands on the root; End on the last node', () => {
    for (const key of ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home']) expect(step(null, key)).toBe('root');
    expect(step(null, 'End')).toBe('c1');
  });

  test('REQ-438 · Escape clears; a key outside the model is not handled', () => {
    expect(step('a', 'Escape')).toBeNull();
    expect(step('a', 'Enter')).toBeUndefined();
  });

  test('REQ-438 · RTL · Right still descends and Left ascends: the model takes no direction (documented, DD-031)', () => {
    expect(stepActive.length).toBe(3);
    expect(step('a', 'ArrowRight')).toBe('a1');
  });

  test('REQ-438 · the linear and grid models are untouched when no hit area is a node', () => {
    const linear: Geometry = { ...geometry, hitAreas: HITS.map(({ node: _node, ...rest }) => rest).reverse() };
    expect(stepActive(linear, null, 'ArrowRight')?.index).toBe(0);
  });

  test('REQ-438 · the announcement names the path from the root, the value and the share of the parent', () => {
    expect(treeLabel(['Budget', 'Operations', 'Travel'], '12,400', '8%')).toBe('Budget › Operations › Travel: 12,400, 8% of Operations');
    expect(treeLabel(['Budget'], '150,000')).toBe('Budget: 150,000');
  });
});

describe('T-166 · ringTone for every family (DD-032)', () => {
  test('REQ-440 · lives in cells.ts; polar.ts re-exports the same functions', () => {
    expect(ringTone).toBe(fromCells);
    expect(ringTones).toBe(tonesFromCells);
  });

  test('REQ-440 · neighbours never share a level, for 2 to 60 categories, the last and the first included', () => {
    for (let count = 2; count <= 60; count += 1) {
      const tones = Array.from({ length: count }, (_, i) => ringTone(i, count));
      tones.forEach((tone, i) => {
        expect(tone).toBeGreaterThanOrEqual(1);
        expect(tone).toBeLessThanOrEqual(4);
        if (i > 0) expect(tone).not.toBe(tones[i - 1]);
      });
      if (count > 2) expect(tones.at(-1)).not.toBe(tones[0]);
    }
  });

  test('REQ-440 · zero categories do not hold a place in the ramp', () => {
    expect(ringTones([3, 0, 2, 5])).toEqual([1, 2, 2, 3]);
  });
});
