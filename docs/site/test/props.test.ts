import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { CATALOG } from '../../../tools/visual-gate/catalog';
import { propsReference } from '../scripts/props';

/**
 * The site's props reference is read from the published types (`packages/core/src/types/props.ts`),
 * never written by hand, so it cannot drift from the API (T-097).
 */
describe('props reference', () => {
  const reference = propsReference();

  test('PRD §5.1 · every catalog chart has its own props, and the common ones are listed once', () => {
    expect(reference.charts.map((c) => c.chart).sort()).toEqual(CATALOG.map((c) => c.chart).sort());
    expect(reference.common.map((p) => p.name)).toEqual(expect.arrayContaining(['data', 'ground', 'mode', 'substrate', 'hatchFill', 'seed', 'title']));
  });

  test('PRD §5.1 · a prop carries its name, type, whether it is optional, and its documentation', () => {
    const donut = reference.charts.find((c) => c.chart === 'DonutChart')!;
    expect(donut.own.map((p) => p.name)).toEqual(['nameKey', 'valueKey', 'centerValue', 'centerLabel', 'legend']);
    expect(donut.own.find((p) => p.name === 'legend')).toEqual({ name: 'legend', type: 'boolean', optional: true, doc: 'Names every sector with its share beside the ring; `true` by default.' });
  });

  test('PRD §5.1 · the committed reference is current', () => {
    expect(JSON.parse(readFileSync(new URL('../generated/props.json', import.meta.url), 'utf8'))).toEqual(reference);
  });
});
