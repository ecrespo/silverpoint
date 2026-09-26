import { diagnose } from '../diagnostics/diagnose';
import type { DashboardBreakpoint, DashboardLayout, PerBreakpoint, ResolvedLayout, ResolvedSpan } from './types';

export const BREAKPOINTS: readonly DashboardBreakpoint[] = ['sm', 'md', 'lg'];
export const DASHBOARD = 'Dashboard';
/** Columns a breakpoint may have, and rows a cell may span (Data Model §2.13). */
const MAX_COLUMNS = 12;
const MAX_ROW_SPAN = 6;

/** The dashboard's documented defaults (API Spec §5.1, REQ-208). */
export const DASHBOARD_DEFAULTS = /* @__PURE__ */ Object.freeze({
  columns: /* @__PURE__ */ Object.freeze({ sm: 1, md: 2, lg: 4 }),
  rowHeight: 240,
  gap: 16,
  span: 1,
  headingLevel: 2,
  ssrWidth: 1200,
} as const);

/** A per-breakpoint value expanded to all three: a bare value applies everywhere, a gap keeps `fallback`. */
export function perBreakpoint<T>(value: PerBreakpoint<T> | undefined, fallback: Readonly<Record<DashboardBreakpoint, T>>): Record<DashboardBreakpoint, T> {
  const given = value !== null && typeof value === 'object' ? (value as Partial<Record<DashboardBreakpoint, T>>) : undefined;
  const bare = value !== undefined && given === undefined ? (value as T) : undefined;
  return Object.fromEntries(BREAKPOINTS.map((bp) => [bp, bare ?? given?.[bp] ?? fallback[bp]])) as Record<DashboardBreakpoint, T>;
}

/** Warns SP002 for a number outside the layout contract and returns what is used instead. */
function corrected(property: string, given: unknown, used: number, rule: string): number {
  if (process.env.NODE_ENV !== 'production') {
    diagnose('SP002', DASHBOARD, { property, message: `${String(given)} is not ${rule}; ${used} is used.` });
  }
  return used;
}

const isInteger = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n);

/**
 * The layout with its defaults applied and its numbers held to the contract of Data Model §2.13
 * (REQ-201, REQ-204, REQ-208): invalid numbers fall back with SP002, a column span wider than its
 * breakpoint is clamped with SP014 (I-12). Pure but for diagnostics; JSON-serialisable (I-10).
 */
export function resolveLayout(layout: DashboardLayout | undefined): ResolvedLayout {
  const asked = perBreakpoint<unknown>(layout?.columns, DASHBOARD_DEFAULTS.columns);
  const columns = Object.fromEntries(
    BREAKPOINTS.map((bp) => {
      const n = asked[bp];
      const ok = isInteger(n) && n >= 1 && n <= MAX_COLUMNS;
      return [bp, ok ? n : corrected(`columns.${bp}`, n, DASHBOARD_DEFAULTS.columns[bp], `an integer from 1 to ${MAX_COLUMNS}`)];
    }),
  ) as Record<DashboardBreakpoint, number>;
  const rowHeight = layout?.rowHeight;
  const gap = layout?.gap;
  const one = { sm: 1, md: 1, lg: 1 };
  return {
    columns,
    rowHeight:
      rowHeight === undefined ? DASHBOARD_DEFAULTS.rowHeight : Number.isFinite(rowHeight) && rowHeight > 0 ? rowHeight : corrected('rowHeight', rowHeight, DASHBOARD_DEFAULTS.rowHeight, 'a number above 0'),
    gap: gap === undefined ? DASHBOARD_DEFAULTS.gap : Number.isFinite(gap) && gap >= 0 ? gap : corrected('gap', gap, DASHBOARD_DEFAULTS.gap, 'a number of 0 or more'),
    cells: (layout?.cells ?? []).map((cell, index) => {
      const col = perBreakpoint<unknown>(cell.colSpan, one);
      const row = perBreakpoint<unknown>(cell.rowSpan, one);
      const where = `cells[${index}]`;
      const span = Object.fromEntries(
        BREAKPOINTS.map((bp) => {
          let c = col[bp];
          if (!isInteger(c) || c < 1) c = corrected(`${where}.colSpan.${bp}`, c, 1, 'an integer of 1 or more');
          else if (c > columns[bp]) {
            if (process.env.NODE_ENV !== 'production') {
              diagnose('SP014', DASHBOARD, { property: `${where}.colSpan.${bp}`, message: `Cell "${cell.id}" spans ${c} columns at ${bp}, which has ${columns[bp]}; it spans ${columns[bp]}.` });
            }
            c = columns[bp];
          }
          let r = row[bp];
          if (!isInteger(r)) r = corrected(`${where}.rowSpan.${bp}`, r, 1, `an integer from 1 to ${MAX_ROW_SPAN}`);
          else if (r < 1 || r > MAX_ROW_SPAN) r = corrected(`${where}.rowSpan.${bp}`, r, Math.min(Math.max(r, 1), MAX_ROW_SPAN), `an integer from 1 to ${MAX_ROW_SPAN}`);
          return [bp, { col: c as number, row: r as number }];
        }),
      ) as ResolvedSpan;
      return { id: cell.id, span };
    }),
  };
}
