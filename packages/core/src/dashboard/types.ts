import type { InkMode, SubstrateName } from '../types/data';
import type { ProviderConfig } from '../types/props';
import type { GroundRef } from '../types/ground';

/** The three container breakpoints; their widths are fixed (TD DD-014). */
export type DashboardBreakpoint = 'sm' | 'md' | 'lg';

/** A value that may differ per breakpoint; a bare number applies to all three. */
export type PerBreakpoint<T> = T | Partial<Record<DashboardBreakpoint, T>>;

/** Serialisable layout (REQ-201). No functions, no DOM, no chart references. */
export interface DashboardLayout {
  /** Columns per breakpoint. Default `{ sm: 1, md: 2, lg: 4 }` (REQ-208). */
  columns?: PerBreakpoint<number>;
  /** Height of one row unit, in px, card chrome included. Default `240`. */
  rowHeight?: number;
  /** Gap between cells, in px. Default `16`. */
  gap?: number;
  /** Cells in reading order (REQ-203). Omitted: every child, span 1. */
  cells?: readonly DashboardCellLayout[];
}

export interface DashboardCellLayout {
  /** Matches `DashboardCell`'s `cell` prop; unique within the dashboard (REQ-205). */
  id: string;
  /** Default `1`. Clamped to the breakpoint's columns with `SP014` (REQ-204). */
  colSpan?: PerBreakpoint<number>;
  /** Default `1`. */
  rowSpan?: PerBreakpoint<number>;
}

/** Link on a category key across the dashboard's charts (REQ-216). */
export interface DashboardLink {
  /** The datum field whose value is matched, e.g. `'hour'`. */
  key: string;
}

/** Name is required by the type: `title` or `label` (REQ-214). */
type DashboardName = { title: string; label?: string } | { title?: undefined; label: string };

export type DashboardProps = DashboardName & {
  /** Stable identifier; seeds of unnamed charts derive from it (REQ-209). Required. */
  id: string;
  layout?: DashboardLayout;
  /** Long description, exposed as the region's description (REQ-214). */
  description?: string;
  /** Heading level of `title`. Default `2`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Width in px used for nominal cell boxes on the server and at hydration (REQ-207). Default `1200`. */
  ssrWidth?: number;
  /** Linked interaction (REQ-216); client entry points only. */
  link?: DashboardLink;

  /** Inherited by every chart inside, below the chart's own prop (REQ-212). */
  ground?: GroundRef;
  substrate?: SubstrateName;
  mode?: InkMode;
  locale?: string;

  className?: string;
};

export interface DashboardCellProps {
  /** The layout cell this child fills. Omitted: next in source order, span 1. */
  cell?: string;
}

/** A cell's spans at every breakpoint. */
export type ResolvedSpan = Readonly<Record<DashboardBreakpoint, { readonly col: number; readonly row: number }>>;

/** The layout with every default applied and every per-breakpoint value expanded (internal surface). */
export interface ResolvedLayout {
  readonly columns: Readonly<Record<DashboardBreakpoint, number>>;
  readonly rowHeight: number;
  readonly gap: number;
  /** The layout's own cells, in its order; children are matched to them by `resolveDashboard`. */
  readonly cells: readonly { readonly id: string; readonly span: ResolvedSpan }[];
}

/** The resolved dashboard (internal surface, API Spec §2). */
export interface DashboardModel {
  readonly id: string;
  /** In reading order. */
  readonly cells: readonly ResolvedCell[];
  /** The CSS custom properties of the wrapper, e.g. `--sp-dashboard-columns-md: 2`. */
  readonly style: Readonly<Record<string, string>>;
}

export interface ResolvedCell {
  /** The layout cell's id; for a child placed in source order, its source index. */
  readonly id: string;
  /** The child this cell holds: its index in `childCells`, so the adapter emits it here (I-11). */
  readonly child: number;
  /** Derived chart id: `${dashboard.id}--${cell.id}` (REQ-209). */
  readonly chartId: string;
  readonly span: ResolvedSpan;
  /** Outer box at `ssrWidth`, 2 decimals (REQ-002, REQ-206). */
  readonly nominal: { readonly width: number; readonly height: number };
  /** The cell's CSS custom properties, e.g. `--sp-cell-col-lg: 2`. */
  readonly style: Readonly<Record<string, string>>;
}

/**
 * What a cell hands its chart (TD §3.3): the derived id, the nominal box and the configuration the
 * dashboard sets. Plain data, so it crosses a React Server Components boundary as a prop.
 */
export interface DashboardCellContext {
  readonly chartId: string;
  readonly box: { readonly width: number; readonly height: number };
  /** Only the keys the dashboard sets; the chart's own props and then the provider come around it. */
  readonly config: Readonly<ProviderConfig>;
}

/** Everything an adapter writes for a dashboard: attributes, texts and cells, all from the core (Art. 2). */
export interface DashboardView {
  readonly model: DashboardModel;
  readonly section: {
    readonly className: string;
    readonly substrate: SubstrateName;
    /** The heading's id, when there is a title. */
    readonly labelledby?: string;
    readonly describedby?: string;
    /** `aria-label`, when only `label` names the dashboard. */
    readonly label?: string;
    readonly style: Readonly<Record<string, string>>;
  };
  readonly heading?: { readonly level: 2 | 3 | 4 | 5 | 6; readonly id: string; readonly text: string };
  readonly description?: { readonly id: string; readonly text: string };
  /** In reading order. */
  readonly cells: readonly {
    /** Index of the child this cell holds. */
    readonly child: number;
    /** The chart's title id: `aria-labelledby` of the `article` (REQ-214). */
    readonly labelledby: string;
    readonly style: Readonly<Record<string, string>>;
    readonly context: DashboardCellContext;
  }[];
}
