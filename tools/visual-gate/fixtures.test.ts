import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { AFTER_LINE_CHART } from './catalog';
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

  test('REQ-182 · 8 fixtures cover 2 modes × 4 substrates at the md size', () => {
    expect(fixtures).toHaveLength(8);
    const cells = fixtures.map((f) => `${f.mode}/${f.substrate}/${f.size.width}x${f.size.height}`).sort();
    expect(cells).toEqual(
      ['ink', 'precision'].flatMap((mode) => ['blue', 'cream', 'green', 'ochre'].map((s) => `${mode}/${s}/320x150`)).sort(),
    );
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

  test('REQ-182 · 8 fixtures cover 2 modes × 4 substrates at the md size', () => {
    expect(fixtures).toHaveLength(8);
    const cells = fixtures.map((f) => `${f.mode}/${f.substrate}/${f.size.width}x${f.size.height}`).sort();
    expect(cells).toEqual(
      ['ink', 'precision'].flatMap((mode) => ['blue', 'cream', 'green', 'ochre'].map((s) => `${mode}/${s}/320x150`)).sort(),
    );
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

test('REQ-182 · the PR matrix holds 7 charts × 8 cells', () => {
  expect(loadFixtures()).toHaveLength(56);
});
