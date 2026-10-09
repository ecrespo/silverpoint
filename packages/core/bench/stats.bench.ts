import { test } from 'vitest';
import { createPrng } from '../src/render/prng';
import { kde, silverman } from '../src/charts/shared/density';
import { bins, ecdf, fiveNumber, sortedValues } from '../src/charts/shared/stats';

/**
 * REQ-445: a statistic over 1 000 observations in < 4 ms, sort included. Reported nightly by
 * `tools/bench-report`; nothing here fails on time.
 */
const random = createPrng(445);
const OBSERVATIONS = Array.from({ length: 1000 }, () => Math.round((random() + random() + random()) * random() * 10_000) / 100);

const CASES: Record<string, () => unknown> = {
  'bins of 1 000': () => bins(sortedValues(OBSERVATIONS)),
  'five-number summary of 1 000': () => fiveNumber(sortedValues(OBSERVATIONS)),
  'ecdf of 1 000': () => ecdf(sortedValues(OBSERVATIONS)),
  'kde of 1 000': () => {
    const sorted = sortedValues(OBSERVATIONS);
    const h = silverman(sorted);
    return kde(sorted, h, [(sorted[0] as number) - h, (sorted.at(-1) as number) + h]);
  },
};

for (const [name, run] of Object.entries(CASES)) {
  test(`REQ-445 · ${name}`, async ({ bench }) => {
    await bench(`stats · ${name}`, run).run();
  });
}
