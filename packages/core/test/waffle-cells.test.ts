/** T-184 · the waffle's allocation of cells (REQ-414, I-26): largest remainder, no category left out. */
import { describe, expect, test } from 'vitest';
import { allocateCells } from '../src/charts/shared/stats';

describe('allocateCells (I-26)', () => {
  test('REQ-414 · largest remainder: the demo’s 1 000 kWh in 100 cells', () => {
    expect(allocateCells([412, 263, 158, 97, 70], 100)).toEqual([41, 26, 16, 10, 7]);
  });

  test('REQ-414 · I-26 · the cells always sum to `cells`, ties to the earlier category', () => {
    expect(allocateCells([1, 1, 1], 100)).toEqual([34, 33, 33]);
    for (const cells of [1, 7, 10, 100, 400]) {
      for (const values of [[5, 3, 2], [1, 1, 1, 1, 1, 1, 1], [1000, 1, 1], [0.3, 0.3, 0.4]]) {
        expect(allocateCells(values, cells).reduce((s, c) => s + c, 0)).toBe(cells);
      }
    }
  });

  test('REQ-414 · I-26 · a positive category gets a cell when there are enough cells; zero gets none', () => {
    expect(allocateCells([1000, 1, 1], 10)).toEqual([8, 1, 1]);
    expect(allocateCells([5, 0, 5], 10)).toEqual([5, 0, 5]);
    expect(allocateCells([0, 0], 10)).toEqual([0, 0]);
  });
});
