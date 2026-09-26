import type { DashboardCellContext } from '@silverpoint/core';
import type { ComputedRef, InjectionKey } from 'vue';

/** What a dashboard cell provides to the chart inside it (TD §3.3): id, nominal box, config. */
export const DASHBOARD_CELL: InjectionKey<ComputedRef<DashboardCellContext | undefined>> = Symbol('silverpoint-dashboard-cell');
