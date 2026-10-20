import { describe, expect, test } from 'vitest';
import { loadTimelineFixtures, runTimelineGate } from './timeline-gate';

/** T-222: the Timeline surface fixtures over the published builds, three adapters, against the canonical render (REQ-516). */
describe('the timeline gate over the published builds', () => {
  test('REQ-516 · REQ-513 · every timeline surface fixture is identical across 3 adapters, against its canonical render', async () => {
    const fixtures = loadTimelineFixtures();
    expect(fixtures).toHaveLength(10);
    const results = await runTimelineGate(fixtures);
    expect(results.filter((r) => !r.equal).map((r) => `${r.adapter} · ${r.fixture} · ${r.difference}`)).toEqual([]);
    expect(results).toHaveLength(10 * 3);
  }, 600_000);
});
