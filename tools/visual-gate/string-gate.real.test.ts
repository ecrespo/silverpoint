import { describe, expect, test } from 'vitest';
import { CATALOG } from './catalog';
import { loadFixtures } from './fixtures';
import { adapterRenderers } from './renderers';
import { runStringGate } from './string-gate';

describe('the cross-adapter string gate over the published builds', () => {
  test('REQ-100 · REQ-103 · REQ-109 · REQ-180 · the line chart is identical across 3 adapters × 2 modes × 5 ground substrates', async () => {
    const fixtures = loadFixtures().filter((f) => f.chart === 'LineChart');
    expect(fixtures).toHaveLength(10);
    const results = await runStringGate(fixtures, adapterRenderers);
    const failures = results.filter((r) => !r.equal).map((r) => `${r.adapter} · ${r.fixture} · ${r.difference}`);
    expect(failures).toEqual([]);
    expect(results).toHaveLength(30);
  }, 120_000);
});

describe('the string gate over the whole matrix', () => {
  test('REQ-100 · REQ-180 · REQ-028 · every catalog chart is identical across 3 adapters × 2 modes × 5 ground substrates', async () => {
    const fixtures = loadFixtures();
    // Every chart's 10 cells, and 10 for each of its state fixtures (the drilled roots, REQ-439).
    const cells = (CATALOG.length + CATALOG.reduce((n, c) => n + Object.keys(c.states ?? {}).length, 0)) * 10;
    expect(fixtures).toHaveLength(cells);
    const results = await runStringGate(fixtures, adapterRenderers);
    const failures = results.filter((r) => !r.equal).map((r) => `${r.adapter} · ${r.fixture} · ${r.difference}`);
    expect(failures).toEqual([]);
    expect(results).toHaveLength(cells * 3);
  }, 900_000);
});
