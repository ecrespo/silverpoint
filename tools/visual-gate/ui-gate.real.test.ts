import { describe, expect, test } from 'vitest';
import { GATED_UI, loadUiFixtures } from './ui-fixtures';
import { runUiGate } from './ui-gate';
import { uiRenderers } from './ui-renderers';

/** T-154: the Art. 3 tree gate over the UI components, published builds, three adapters (DD-027). */
describe('the UI tree gate over the published builds', () => {
  test('REQ-327 · every committed UI fixture is identical across 3 adapters, against its canonical render', async () => {
    const fixtures = loadUiFixtures();
    const states = GATED_UI.reduce((n, c) => n + c.states.length, 0);
    expect(fixtures.length).toBeGreaterThanOrEqual(states * 10);
    const results = await runUiGate(fixtures, uiRenderers);
    const failures = results.filter((r) => !r.equal).map((r) => `${r.adapter} · ${r.fixture} · ${r.difference}`);
    expect(failures).toEqual([]);
    expect(results).toHaveLength(fixtures.length * 3);
  }, 900_000);
});
