import { DASHBOARD_DEMOS, resolveDashboard, type DashboardProps } from '@silverpoint/core';
import { test } from 'vitest';

/**
 * API Spec §12: resolving the layout of a 24-cell dashboard — the advisory ceiling — in < 0.5 ms.
 * Run nightly and reported by `tools/bench-report`; nothing here fails on time.
 */
const WIDE = [1, 2, 1, 3, 1, 1, 2, 1] as const;
const TWENTY_FOUR: DashboardProps = {
  id: 'bench',
  title: 'Twenty-four cells',
  layout: {
    cells: Array.from({ length: 24 }, (_, i) => ({ id: `c${i}`, colSpan: { md: Math.min(WIDE[i % WIDE.length]!, 2), lg: WIDE[i % WIDE.length]! }, rowSpan: i % 5 === 0 ? 2 : 1 })),
  },
};
const CHILDREN = Array.from({ length: 24 }, (_, i) => `c${(i * 7) % 24}`);

test('API Spec §12 · resolving a 24-cell dashboard', async ({ bench }) => {
  await bench('dashboard · resolve 24 cells', () => {
    resolveDashboard(TWENTY_FOUR, CHILDREN);
  }).run();
});

test('API Spec §12 · resolving the ops reference dashboard', async ({ bench }) => {
  const ops = DASHBOARD_DEMOS.ops;
  const children = ops.children.map((c) => c.cell);
  await bench('dashboard · resolve ops', () => {
    resolveDashboard(ops.props, children);
  }).run();
});
