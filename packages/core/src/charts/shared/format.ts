import type { Accessor, Datum } from '../../types';

/** Reads a field through an accessor. */
export function read<T>(accessor: Accessor<T>, datum: Datum, index: number): T {
  return typeof accessor === 'function' ? accessor(datum, index) : (datum[accessor] as T);
}

/** Human name of an accessor, for tables and descriptions. */
export function accessorName(accessor: Accessor<unknown>, fallback: string): string {
  return typeof accessor === 'string' ? accessor : fallback;
}

/** Formatters already built, by locale and options: building one costs more than a label (TD §2). */
const FORMATTERS = /* @__PURE__ */ new Map<string, Intl.NumberFormat>();
/** Distinct locale-and-options pairs kept; past it the cache starts over, so it stays bounded. */
const MAX_FORMATTERS = 64;

/** Formats a number with the resolved locale. Formatting lives in the core so both adapters agree. */
export function formatNumber(
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions | undefined,
): string {
  const resolved = options ?? { maximumFractionDigits: 2 };
  // Every option Intl reads, inherited ones included: JSON.stringify sees own properties only.
  const read: string[] = [];
  for (const name in resolved) read.push(`${name}=${JSON.stringify(resolved[name as keyof Intl.NumberFormatOptions])}`);
  const key = `${locale}|${read.sort().join('&')}`;
  let formatter = FORMATTERS.get(key);
  if (!formatter) {
    if (FORMATTERS.size >= MAX_FORMATTERS) FORMATTERS.clear();
    formatter = new Intl.NumberFormat(locale, resolved);
    FORMATTERS.set(key, formatter);
  }
  return formatter.format(value);
}

/** Formats a label that may be a number or free text. */
export function formatValue(
  value: unknown,
  locale: string,
  options: Intl.NumberFormatOptions | undefined,
): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? formatNumber(value, locale, options) : '—';
  }
  return value === null || value === undefined ? '—' : String(value);
}

/**
 * Formats a category — an x value, a time, a stage, a name. A number here is an identifier such as
 * a year, so it is printed without grouping: 2020, never 2,020.
 */
export function formatCategory(value: unknown, locale: string): string {
  return formatValue(value, locale, typeof value === 'number' ? { useGrouping: false, maximumFractionDigits: 2 } : undefined);
}

/** SVG path of a circle, drawn as two arcs so it survives inking as a closed path. */
export function circlePath(cx: number, cy: number, r: number): string {
  return `M${cx - r},${cy}A${r},${r},0,1,0,${cx + r},${cy}A${r},${r},0,1,0,${cx - r},${cy}Z`;
}
