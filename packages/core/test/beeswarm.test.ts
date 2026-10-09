/**
 * T-171 · `charts/shared/beeswarm.ts` (DD-030): a greedy, value-ordered packing. Not iterative: a
 * pure function of the sorted positions, the radius and the side the seed picks, with only
 * `+ − × ÷` and `Math.sqrt` (REQ-435).
 */
import { describe, expect, test } from 'vitest';
import { createPrng } from '../src/render/prng';
import { round2 } from '../src/render/round';
import { packSwarm } from '../src/charts/shared/beeswarm';

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

describe('T-171 · beeswarm packing (DD-030)', () => {
  test('REQ-405 · isolated points stay on the axis', () => {
    expect(packSwarm([0, 10, 20], 3, 1)).toEqual([0, 0, 0]);
  });

  test('REQ-405 · equal values stack alternately from the side the seed picks, touching exactly', () => {
    expect(packSwarm([5, 5, 5, 5], 3, 1)).toEqual([0, 6, -6, 12]);
    expect(packSwarm([5, 5, 5, 5], 3, -1)).toEqual([0, -6, 6, -12]);
  });

  test('REQ-405 · a near neighbour rests at the tangency offset √(4r² − dx²)', () => {
    const [, second] = packSwarm([0, 3], 2.5, 1);
    expect(second).toBeCloseTo(Math.sqrt(25 - 9), 12);
  });

  test('REQ-405 · I-28 · no two points overlap, after rounding to 2 decimals, on random samples', () => {
    const random = createPrng(28);
    for (let run = 0; run < 20; run += 1) {
      const xs = Array.from({ length: 300 }, () => Math.round(random() * random() * 4000) / 10).sort((a, b) => a - b);
      const r = 2 + random() * 3;
      const ys = packSwarm(xs, r, run % 2 === 0 ? 1 : -1);
      const points = xs.map((x, i) => ({ x: round2(x), y: round2(ys[i] as number) }));
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length && (points[j] as { x: number }).x - (points[i] as { x: number }).x < 2 * r; j += 1) {
          expect(distance(points[i]!, points[j]!)).toBeGreaterThanOrEqual(2 * r - 0.01);
        }
      }
    }
  });

  test('REQ-405 · each point takes the smallest offset that fits: it touches a placed point or the axis', () => {
    const random = createPrng(3);
    const xs = Array.from({ length: 120 }, () => Math.round(random() * 600) / 10).sort((a, b) => a - b);
    const r = 3;
    const ys = packSwarm(xs, r, 1);
    ys.forEach((y, i) => {
      if (y === 0) return;
      const touching = xs.slice(0, i).some((x, j) => Math.abs(distance({ x: xs[i] as number, y }, { x, y: ys[j] as number }) - 2 * r) < 1e-9);
      expect(touching, `point ${i}`).toBe(true);
    });
  });

  test('REQ-435 · I-23 · a pure function: the same input gives the same offsets', () => {
    const xs = [1, 1.5, 2, 2, 2.2, 7, 7.1];
    expect(packSwarm(xs, 2, 1)).toEqual(packSwarm([...xs], 2, 1));
  });
});
