import { test } from 'vitest';
import { BENCH_CONTEXT, HUNDRED_POINTS } from './hundred-points';

/**
 * TD §2, PRD NFR Performance: geometry for a 100-point chart in < 2 ms. Run nightly and reported
 * by `tools/bench-report`; shared PR runners are too noisy to enforce it, so nothing here fails
 * on time.
 */
for (const [chart, { recipe, props }] of Object.entries(HUNDRED_POINTS)) {
  test(`TD §2 · geometry of a 100-point ${chart}`, async ({ bench }) => {
    await bench(chart, () => {
      recipe.build(props, BENCH_CONTEXT);
    }).run();
  });
}
