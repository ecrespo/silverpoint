import type { DashboardBreakpoint, DashboardLayout, PerBreakpoint, ResolvedLayout } from './types';

const BREAKPOINTS: readonly DashboardBreakpoint[] = ['sm', 'md', 'lg'];

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

const everywhere = (n: number): Record<DashboardBreakpoint, number> => ({ sm: n, md: n, lg: n });

/**
 * The layout with its defaults applied (REQ-201, REQ-208). Pure and JSON-serialisable (I-10).
 * Validation, clamping and the matching of children are `resolveDashboard`'s (Data Model §2.13).
 */
export function resolveLayout(layout: DashboardLayout | undefined): ResolvedLayout {
  const one = everywhere(DASHBOARD_DEFAULTS.span);
  return {
    columns: perBreakpoint(layout?.columns, DASHBOARD_DEFAULTS.columns),
    rowHeight: layout?.rowHeight ?? DASHBOARD_DEFAULTS.rowHeight,
    gap: layout?.gap ?? DASHBOARD_DEFAULTS.gap,
    cells: (layout?.cells ?? []).map((cell) => {
      const col = perBreakpoint(cell.colSpan, one);
      const row = perBreakpoint(cell.rowSpan, one);
      return { id: cell.id, span: Object.fromEntries(BREAKPOINTS.map((bp) => [bp, { col: col[bp], row: row[bp] }])) as ResolvedLayout['cells'][number]['span'] };
    }),
  };
}
