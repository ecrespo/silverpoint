import { describe, expect, test } from 'vitest';
import { matrixScope } from './matrix';

/** T-092: the PR runs the reduced matrix, the nightly run the full one (TD §8, Data Model §5). */
describe('matrix scope', () => {
  test('REQ-180 · REQ-181 · the reduced PR matrix unless the run asks for the full one', () => {
    expect(matrixScope({})).toBe('pr');
    expect(matrixScope({ SP_MATRIX: 'full' })).toBe('full');
    expect(matrixScope({ SP_MATRIX: 'pr' })).toBe('pr');
  });

  test('REQ-180 · an unknown scope fails loudly instead of running a smaller gate', () => {
    expect(() => matrixScope({ SP_MATRIX: 'ful' })).toThrow(/SP_MATRIX/);
  });
});
