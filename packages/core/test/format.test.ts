import { afterEach, describe, expect, test, vi } from 'vitest';
import { formatNumber, numberFormatter } from '../src/charts/shared/format';

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

describe('numberFormatter (T-178, REQ-445)', () => {
  // A table of 1 000 rows formats 3 000 cells: the formatter is resolved once per column.
  test.each([
    ['en', undefined],
    ['de', undefined],
    ['en', { style: 'percent', maximumFractionDigits: 1 }],
    ['fr', { minimumFractionDigits: 2 }],
    ['ar-EG', { useGrouping: false }],
  ] as const)('REQ-445 · %s %j · formats exactly as formatNumber does', (locale, options) => {
    const format = numberFormatter(locale, options);
    for (const value of [0, -0, 0.125, 1234.5678, -98765.4321, 1e21, Number.NaN]) {
      expect(format(value)).toBe(formatNumber(value, locale, options));
    }
  });
});
