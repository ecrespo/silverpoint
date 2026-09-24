import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, lineChart, type RecipeContext, type SpCode } from '../src';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const context: RecipeContext = { id: 'sp-cartesian', width: 320, locale: 'en', emptyState: { text: 'No data', rule: true }, domainPadding: 0.1 };
const points = (n: number) => Array.from({ length: n }, (_, i) => ({ x: i, value: Math.sin(i / 10) }));

describe('data-volume ceiling (REQ-096)', () => {
  test('REQ-096 · a series of 501 points warns SP008 and is still drawn in full', () => {
    const seen = capture();
    const model = lineChart.build({ data: points(501) }, context);
    expect(seen).toContain('SP008');
    expect(model.geometry.hitAreas).toHaveLength(501);
  });

  test('REQ-096 · 500 points is within the ceiling', () => {
    const seen = capture();
    lineChart.build({ data: points(500) }, context);
    expect(seen).not.toContain('SP008');
  });
});
