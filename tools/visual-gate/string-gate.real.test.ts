import { describe, expect, test } from 'vitest';
import { CATALOG } from './catalog';
import { loadFixtures } from './fixtures';
import { adapterRenderers } from './renderers';
import { runStringGate } from './string-gate';

describe('the cross-adapter string gate over the published builds', () => {
  test('REQ-100 · REQ-103 · REQ-109 · REQ-180 · the line chart is identical across 3 adapters × 2 modes × 4 substrates', async () => {
    const fixtures = loadFixtures().filter((f) => f.chart === 'LineChart');
    expect(fixtures).toHaveLength(8);
    const results = await runStringGate(fixtures, adapterRenderers);
    const failures = results.filter((r) => !r.equal).map((r) => `${r.adapter} · ${r.fixture} · ${r.difference}`);
    expect(failures).toEqual([]);
    expect(results).toHaveLength(24);
  }, 120_000);
});

describe('the string gate over the whole matrix', () => {
  test('REQ-100 · REQ-180 · every catalog chart is identical across 3 adapters × 2 modes × 4 substrates', async () => {
    const fixtures = loadFixtures();
    expect(fixtures).toHaveLength(CATALOG.length * 8);
    const results = await runStringGate(fixtures, adapterRenderers);
    const failures = results.filter((r) => !r.equal).map((r) => `${r.adapter} · ${r.fixture} · ${r.difference}`);
    expect(failures).toEqual([]);
    expect(results).toHaveLength(CATALOG.length * 8 * 3);
  }, 900_000);
});
