import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { AFTER_LINE_CHART, CATALOG } from './catalog';
import { canonicalFor, FIXTURES_DIR, loadFixtures, validateFixture, type Fixture } from './fixtures';

const valid: Fixture = {
  id: 'line-chart--silverpoint--cream--ink--md',
  chart: 'LineChart',
  req: 'REQ-060',
  ground: 'silverpoint',
  substrate: 'cream',
  mode: 'ink',
  hatchFill: 'tile',
  seed: 1592,
  size: { width: 320, height: 150 },
  props: {},
  data: null,
  canonical: 'line-chart/line-chart--silverpoint--cream--ink--md.canonical.txt',
};

/** The PR cells of one chart (Data Model §5): each mode on every ground and substrate, at `md`. */
const PR_CELLS = ['ink', 'precision']
  .flatMap((mode) => [...['blue', 'cream', 'green', 'ochre'].map((s) => `silverpoint/${s}`), 'cyanotype/prussian'].map((gs) => `${mode}/${gs}/320x150`))
  .sort();

describe('fixture schema', () => {
  test('REQ-182 · a fixture following Data Model §5 validates', () => {
    expect(validateFixture(valid)).toEqual([]);
  });

  test.each([
    ['a missing canonical', { ...valid, canonical: undefined }],
    ['an unknown mode', { ...valid, mode: 'sketch' }],
    ['a non-numeric seed', { ...valid, seed: 'x' }],
    ['a size without height', { ...valid, size: { width: 320 } }],
    ['a req that is not a REQ id', { ...valid, req: 'line' }],
    ['an id that does not spell its own matrix cell', { ...valid, id: 'line-chart--silverpoint--blue--ink--md' }],
  ])('REQ-182 · %s is rejected', (_what, fixture) => {
    expect(validateFixture(fixture).length).toBeGreaterThan(0);
  });
});

describe('the line-chart fixtures', () => {
  const fixtures = loadFixtures().filter((fixture) => fixture.chart === 'LineChart');

  test('REQ-182 · REQ-028 · 10 fixtures cover 2 modes × (4 silverpoint substrates + cyanotype) at the md size', () => {
    expect(fixtures).toHaveLength(10);
    const cells = fixtures.map((f) => `${f.mode}/${f.ground}/${f.substrate}/${f.size.width}x${f.size.height}`).sort();
    expect(cells).toEqual(PR_CELLS);
  });

  test('REQ-182 · every fixture validates against the schema', () => {
    for (const fixture of fixtures) expect(validateFixture(fixture), fixture.id).toEqual([]);
  });

  test('REQ-182 · every committed canonical render is current', () => {
    for (const fixture of fixtures) {
      const committed = readFileSync(`${FIXTURES_DIR}/${fixture.canonical}`, 'utf8');
      expect(committed, fixture.id).toBe(canonicalFor(fixture));
    }
  });
});

describe.each(AFTER_LINE_CHART.map((e) => [e.chart, e] as const))('the %s fixtures', (chart, entry) => {
  const fixtures = loadFixtures().filter((fixture) => fixture.chart === chart);

  test('REQ-182 · REQ-028 · 10 fixtures cover 2 modes × (4 silverpoint substrates + cyanotype) at the md size', () => {
    expect(fixtures).toHaveLength(10);
    const cells = fixtures.map((f) => `${f.mode}/${f.ground}/${f.substrate}/${f.size.width}x${f.size.height}`).sort();
    expect(cells).toEqual(PR_CELLS);
  });

  test('REQ-182 · every fixture validates and traces to the chart requirement', () => {
    for (const fixture of fixtures) {
      expect(validateFixture(fixture), fixture.id).toEqual([]);
      expect(fixture.req, fixture.id).toBe(entry.req);
    }
  });

  test('REQ-182 · every committed canonical render is current', () => {
    for (const fixture of fixtures) {
      const committed = readFileSync(`${FIXTURES_DIR}/${fixture.canonical}`, 'utf8');
      expect(committed, fixture.id).toBe(canonicalFor(fixture));
    }
  });
});

test('REQ-182 · the PR matrix holds every catalog chart × 10 cells', () => {
  expect(loadFixtures()).toHaveLength(CATALOG.length * 10);
  expect(CATALOG).toHaveLength(33);
});

/** The nightly product of Data Model §5 (T-091): every cell, not only the PR's `md` + `tile` slice. */
describe('the full matrix', () => {
  const full = loadFixtures('full');

  const cell = (f: Fixture) => `${f.chart}/${f.ground}/${f.mode}/${f.substrate}/${f.hatchFill}/${f.size.width}x${f.size.height}`;

  test('REQ-182 · 1,782 fixtures: 33 charts × 2 modes × 3 sizes × (silverpoint: 4 substrates × 2 hatchFill; cyanotype: 1 × tile), each once', () => {
    expect(full).toHaveLength(1782);
    expect(new Set(full.map(cell)).size).toBe(1782);
    expect(full.filter((f) => f.ground === 'silverpoint')).toHaveLength(1584);
    expect(new Set(full.map((f) => f.hatchFill))).toEqual(new Set(['tile', 'per-shape']));
    // REQ-028: hatchFill has no effect under `weight`, so cyanotype's axis collapses to `tile`.
    expect(new Set(full.filter((f) => f.ground === 'cyanotype').map((f) => `${f.substrate}/${f.hatchFill}`))).toEqual(new Set(['prussian/tile']));
    expect(new Set(full.map((f) => `${f.size.width}x${f.size.height}`))).toEqual(new Set(['240x120', '320x150', '640x300']));
  });

  test('REQ-182 · the PR matrix is its md + tile slice', () => {
    expect(loadFixtures().map((f) => f.id)).toEqual(full.filter((f) => f.hatchFill === 'tile' && f.size.width === 320).map((f) => f.id));
  });

  test('REQ-182 · every fixture of the full matrix validates, and its committed canonical is current', () => {
    for (const fixture of full) {
      expect(validateFixture(fixture), fixture.id).toEqual([]);
      expect(readFileSync(`${FIXTURES_DIR}/${fixture.canonical}`, 'utf8'), fixture.id).toBe(canonicalFor(fixture));
    }
  }, 120_000);

  test('REQ-182 · the apps can open any cell: the harness embeds the full matrix beside the PR one', async () => {
    const harness = await import('../../examples/harness/index.js');
    expect(harness.ALL_FIXTURES).toHaveLength(1782);
    expect(harness.FIXTURES).toHaveLength(330);
    expect(harness.fixtureById('bar-chart--silverpoint--ochre--precision--lg--per-shape')?.hatchFill).toBe('per-shape');
  });
});
