import { test } from 'vitest';
import { RENDER_CARDS, renderCard } from './cards';

/**
 * TD §2, PRD NFR Performance: the full initial render of a card, inking included, in < 16 ms so
 * as not to drop a frame. Run nightly and reported by `tools/bench-report` beside the 2 ms
 * geometry benchmark; nothing here fails on time.
 */
for (const card of RENDER_CARDS) {
  test(`TD §2 · full render of a ${card.chart} card`, async ({ bench }) => {
    await bench(`render · ${card.chart}`, () => {
      renderCard(card);
    }).run();
  });
}
