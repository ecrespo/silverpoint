import { test } from 'vitest';
import { BENCH_CONTEXT, HUNDRED_POINTS, POLAR_AT_CEILING, STATISTIC_CHARTS } from './hundred-points';

/**
 * TD §2, PRD NFR Performance: geometry for a 100-point chart in < 2 ms. Run nightly and reported
 * by `tools/bench-report`; shared PR runners are too noisy to enforce it, so nothing here fails
 * on time.
 */
for (const [chart, { recipe, props }] of Object.entries({ ...HUNDRED_POINTS, ...POLAR_AT_CEILING })) {
  test(`TD §2 · geometry of a 100-point ${chart}`, async ({ bench }) => {
    await bench(chart, () => {
      recipe.build(props, BENCH_CONTEXT);
    }).run();
  });
}

/** REQ-445: a wave-1 statistic chart over 1 000 observations in < 4 ms, the statistic included. */
for (const [chart, { recipe, props }] of Object.entries(STATISTIC_CHARTS)) {
  test(`REQ-445 · geometry of a ${chart} over its observations`, async ({ bench }) => {
    await bench(`stats · ${chart}`, () => {
      recipe.build(props, BENCH_CONTEXT);
    }).run();
  });
}
