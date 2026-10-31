import { describe, expect, test } from 'vitest';
import { deckMatrix } from './deck-fixtures';
import { runDeckGate } from './deck-gate';

/** T-278: the deck fixtures over the published builds, three adapters, against the canonical render (REQ-623). */
describe('the deck gate over the published builds', () => {
  test('REQ-623 · every deck fixture is identical across 3 adapters, against its canonical render', async () => {
    const fixtures = deckMatrix();
    expect(fixtures).toHaveLength(24);
    const results = await runDeckGate(fixtures);
    expect(results.filter((r) => !r.equal).map((r) => `${r.adapter} · ${r.fixture} · ${r.difference}`)).toEqual([]);
    expect(results).toHaveLength(24 * 3);
  }, 600_000);
});
