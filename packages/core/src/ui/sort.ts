import type { Datum } from '../types';

/** A cell's sort key, computed once per row: numbers before anything else, which compares by code point after lowercasing. */
type SortKey = readonly [rank: 0, value: number] | readonly [rank: 1, value: string];

const sortKey = (value: unknown): SortKey => (typeof value === 'number' ? [0, value] : [1, String(value).toLowerCase()]);

function compare(a: SortKey, b: SortKey): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[0] === 0) return a[1] - (b[1] as number);
  return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
}

/**
 * A table's rows in order of `key` (REQ-474, I-34): stable, `null` and missing values last in input
 * order, `desc` reversing the present rows only. No locale, so the order is the same on every
 * server. Pure: the input is never mutated.
 */
export function uiSortRows<T extends Datum>(rows: readonly T[], key: string | undefined, order: 'asc' | 'desc' = 'asc'): readonly T[] {
  if (!key) return [...rows];
  const sign = order === 'desc' ? -1 : 1;
  const present: { readonly row: T; readonly key: SortKey }[] = [];
  const missing: T[] = [];
  for (const row of rows) {
    const value = row[key];
    if (value === null || value === undefined) missing.push(row);
    else present.push({ row, key: sortKey(value) });
  }
  // Array.prototype.sort is stable (ES2019): ties keep input order.
  present.sort((a, b) => sign * compare(a.key, b.key));
  return [...present.map((p) => p.row), ...missing];
}
