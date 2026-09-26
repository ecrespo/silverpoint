import type { DashboardCellContext, LinkState } from '@silverpoint/core';
import type { ComputedRef, InjectionKey, Ref } from 'vue';

/** What a dashboard cell provides to the chart inside it (TD §3.3): id, nominal box, config. */
export const DASHBOARD_CELL: InjectionKey<ComputedRef<DashboardCellContext | undefined>> = Symbol('silverpoint-dashboard-cell');

/** A linked dashboard's one reactive value, and how a chart sets it (TD DD-016, REQ-216). */
export interface DashboardLinkValue {
  /** The linked key; `undefined` when the dashboard has no link. */
  readonly key: string | undefined;
  readonly state: Readonly<Ref<LinkState | null>>;
  set(next: LinkState | null): void;
}

export const DASHBOARD_LINK: InjectionKey<DashboardLinkValue> = Symbol('silverpoint-dashboard-link');
