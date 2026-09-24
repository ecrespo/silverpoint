import { describe, expect, test } from 'vitest';
import { checkGroundChange } from './check-ground-pr.mjs';

describe('check-ground-pr', () => {
  test('REQ-044 · a PR touching both a ground and core/src/charts fails', () => {
    const problems = checkGroundChange([
      'packages/grounds/src/burin/tokens.ts',
      'packages/core/src/charts/line-chart/line-chart.ts',
    ]);
    expect(problems.join('\n')).toMatch(/REQ-044.*burin.*packages\/core\/src\/charts\/line-chart\/line-chart.ts/);
  });

  test('REQ-044 · a PR adding a ground and nothing in the charts passes', () => {
    expect(checkGroundChange(['packages/grounds/src/burin/tokens.ts', 'packages/grounds/src/index.ts'])).toEqual([]);
  });

  test('REQ-044 · a chart change that touches no ground passes', () => {
    expect(checkGroundChange(['packages/core/src/charts/line-chart/line-chart.ts', 'packages/grounds/src/ink/rough-inker.ts'])).toEqual([]);
  });
});
