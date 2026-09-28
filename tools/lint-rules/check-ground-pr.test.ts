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

  test('REQ-312 · REQ-044 · a ground change that also touches the UI core or an adapter\'s ui/ fails', () => {
    const problems = checkGroundChange([
      'packages/grounds/src/burin/tokens.ts',
      'packages/core/src/ui/frame.ts',
      'packages/react/src/ui/button.tsx',
      'packages/vue/src/ui/SpButton.vue',
      'packages/angular/ui/button/button.ts',
    ]);
    expect(problems).toHaveLength(4);
    expect(problems.join('\n')).toMatch(/packages\/core\/src\/ui\/frame\.ts/);
    expect(problems.join('\n')).toMatch(/packages\/angular\/ui\/button\/button\.ts/);
  });

  test('REQ-312 · a UI change that touches no ground passes, and so does the grounds\' shared ui build', () => {
    expect(checkGroundChange(['packages/core/src/ui/frame.ts', 'packages/react/src/ui/button.tsx'])).toEqual([]);
    expect(checkGroundChange(['packages/grounds/src/ui/pieces.ts', 'packages/core/src/ui/frame.ts'])).toEqual([]);
  });
});
