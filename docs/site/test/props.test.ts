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

  describe('what the demo ignores (delta-011)', () => {
    /** Accessor props say where a field lives in the consumer's rows: `…Key`, `keys`, `names`. */
    const isAccessor = (name: string) => name.endsWith('Key') || name === 'keys' || name === 'names';
    const accessors = reference.charts.flatMap(({ chart, own }) => own.filter((p) => isAccessor(p.name)).map((p) => ({ chart, ...p })));

    test('REQ-099 · every accessor prop says it is ignored without `data`', () => {
      expect(accessors.length).toBeGreaterThan(70);
      const silent = accessors.filter((p) => !p.doc.endsWith('Ignored without `data`.')).map((p) => `${p.chart}.${p.name}`);
      expect(silent).toEqual([]);
    });

    test('REQ-099 · REQ-098 · `data` states the rule: accessors ignored, every other prop applied', () => {
      const data = reference.common.find((p) => p.name === 'data')!;
      expect(data.doc).toBe('Rows to draw. If omitted, the demo dataset is rendered (REQ-093): accessor props (`…Key`, `keys`, `names`) are ignored, every other prop applies.');
    });

    test('REQ-099 · no other prop claims to be ignored without `data`', () => {
      const claimed = reference.charts.flatMap(({ chart, own }) => own.filter((p) => !isAccessor(p.name) && p.doc.includes('Ignored without')).map((p) => `${chart}.${p.name}`));
      expect(claimed).toEqual([]);
    });

    test('REQ-099 · VolvelleChart’s index names the demo’s rings', () => {
      const volvelle = reference.charts.find((c) => c.chart === 'VolvelleChart')!;
      for (const name of ['indexRing', 'indexValue']) {
        expect(volvelle.own.find((p) => p.name === name)!.doc, name).toContain('Without `data`, it addresses the demo’s rings: `Day`, `Shift`, `Team`.');
      }
    });
  });

  test('PRD §5.1 · the committed reference is current', () => {
    expect(JSON.parse(readFileSync(new URL('../generated/props.json', import.meta.url), 'utf8'))).toEqual(reference);
  });
});
