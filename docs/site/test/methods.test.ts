import { describe, expect, test } from 'vitest';
import { CATALOG } from '../../../tools/visual-gate/catalog';
import { METHODS } from '../src/methods';

/** REQ-449: every chart of the second catalog states the method behind each value it derives. */
describe('method statements (T-179)', () => {
  const second = CATALOG.filter((c) => Number(c.req.slice(4)) >= 400).map((c) => c.chart);

  test('REQ-449 · every chart of the second catalog has one, and no other chart', () => {
    expect(second.length).toBeGreaterThanOrEqual(14);
    expect(Object.keys(METHODS).sort()).toEqual([...second].sort());
  });

  test.each(second)('REQ-449 · %s · names each derived value and says how it is computed', (chart) => {
    const statements = METHODS[chart] ?? [];
    expect(statements.length).toBeGreaterThan(0);
    for (const { value, method } of statements) {
      expect(value.length).toBeGreaterThan(0);
      expect(method).toMatch(/^[A-Z`].*\.$/s);
    }
  });
});
