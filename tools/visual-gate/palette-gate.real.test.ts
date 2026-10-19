import { describe, expect, test } from 'vitest';
import { loadPaletteFixtures } from './palette-fixtures';
import { runPaletteGate } from './palette-gate';

/** T-218: the palette fixtures over the published builds, three adapters, against the canonical render (REQ-516, I-25). */
describe('the palette gate over the published builds', () => {
  test('REQ-516 · REQ-468 · every palette fixture is identical across 3 adapters, against its canonical render', async () => {
    const fixtures = loadPaletteFixtures();
    expect(fixtures).toHaveLength(36);
    const results = await runPaletteGate(fixtures);
    expect(results.filter((r) => !r.equal).map((r) => `${r.adapter} · ${r.fixture} · ${r.difference}`)).toEqual([]);
    expect(results).toHaveLength(36 * 3);
  }, 600_000);
});
