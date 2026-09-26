import { InjectionToken, type Signal } from '@angular/core';
import type { DashboardCellContext } from '@silverpoint/core';

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
