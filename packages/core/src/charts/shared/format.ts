import type { Accessor, Datum } from '../../types';

/** Reads a field through an accessor. */
export function read<T>(accessor: Accessor<T>, datum: Datum, index: number): T {
  return typeof accessor === 'function' ? accessor(datum, index) : (datum[accessor] as T);
}

/** Human name of an accessor, for tables and descriptions. */
export function accessorName(accessor: Accessor<unknown>, fallback: string): string {
  return typeof accessor === 'string' ? accessor : fallback;
}

/** Formats a number with the resolved locale. Formatting lives in the core so both adapters agree. */
export function formatNumber(
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions | undefined,
): string {
  return new Intl.NumberFormat(locale, options ?? { maximumFractionDigits: 2 }).format(value);
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

/** SVG path of a circle, drawn as two arcs so it survives inking as a closed path. */
export function circlePath(cx: number, cy: number, r: number): string {
  return `M${cx - r},${cy}A${r},${r},0,1,0,${cx + r},${cy}A${r},${r},0,1,0,${cx - r},${cy}Z`;
}
