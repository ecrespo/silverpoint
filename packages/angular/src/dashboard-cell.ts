import { InjectionToken, type Signal } from '@angular/core';
import type { DashboardCellContext, LinkState } from '@silverpoint/core';

/**
 * A dashboard cell, as the chart inside it sees it (TD §3.3). Provided by `sp-dashboard-cell`
 * (`@silverpoint/angular/dashboard`); declared here so the charts need not import that entry.
 */
export interface DashboardCellHandle {
  /** The cell's id, nominal box and config; `undefined` outside a dashboard. */
  readonly context: Signal<DashboardCellContext | undefined>;
  /** Called by the chart inside, so the cell can label itself with the chart's own `id` (REQ-214). */
  attach(id: Signal<string | undefined>): void;
}

export const SP_DASHBOARD_CELL = new InjectionToken<DashboardCellHandle>('SP_DASHBOARD_CELL');

/** A linked dashboard's one value, and how a chart sets it (TD DD-016, REQ-216); provided by `sp-dashboard`. */
export interface DashboardLinkHandle {
  /** The linked key; `undefined` when the dashboard has no link. */
  linkKey(): string | undefined;
  readonly linkState: Signal<LinkState | null>;
  setLink(next: LinkState | null): void;
}

export const SP_DASHBOARD_LINK = new InjectionToken<DashboardLinkHandle>('SP_DASHBOARD_LINK');
