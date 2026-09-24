import { afterEach, describe, expect, test, vi } from 'vitest';
import { formatNumber } from '../src/charts/shared/format';

afterEach(() => vi.restoreAllMocks());

describe('formatNumber', () => {
  test('API §5 · formats with the locale and the options', () => {
    expect(formatNumber(1234.567, 'en', undefined)).toBe('1,234.57');
    expect(formatNumber(1234.567, 'de', undefined)).toBe('1.234,57');
    expect(formatNumber(0.5, 'en', { style: 'percent' })).toBe('50%');
  });

  // TD §2 (geometry < 2 ms for 100 points): building a formatter costs several times the rest of
  // a label's work, and a chart prints hundreds of labels. One formatter serves every label of the
  // same locale and options.
  test('TD §2 · one formatter per locale and options, reused across labels', () => {
    const spy = vi.spyOn(Intl, 'NumberFormat');
    for (let i = 0; i < 50; i++) formatNumber(i, 'fr', { maximumFractionDigits: 1 });
    for (let i = 0; i < 50; i++) formatNumber(i, 'fr', { maximumFractionDigits: 1 });
    expect(spy.mock.calls.length).toBeLessThanOrEqual(1);
    expect(formatNumber(1.23456, 'fr', { maximumFractionDigits: 3 })).toBe('1,235');
  });
});
