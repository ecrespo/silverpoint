import type { DashboardView } from '@silverpoint/core';
import { computed, defineComponent, h, provide, type PropType } from 'vue';
import { DASHBOARD_CELL } from './dashboard-context';

export interface SpDashboardCellProps {
  /** The layout cell this child fills. Omitted: next in source order, span 1 (API Spec §7.1). */
  cell?: string;
}

/**
 * `SpDashboardCell` (REQ-200): marks a child of `SpDashboard` with its layout cell. Inside a
 * dashboard it is the cell's `article` and provides its chart the cell's id, box and config;
 * on its own it renders its slot. It emits no wrapper of its own, so no fragment markers (DD-017).
 */
export const SpDashboardCell = defineComponent({
  name: 'SpDashboardCell',
  props: {
    cell: { type: String, required: false },
    /** @internal Set by `SpDashboard`: the cell as `dashboardView` resolves it. */
    view: { type: Object as PropType<DashboardView['cells'][number]>, required: false },
  },
  setup(props, { slots }) {
    provide(
      DASHBOARD_CELL,
      computed(() => props.view?.context),
    );
    return () =>
      props.view
        ? h('article', { class: 'sp-dashboard-cell', part: 'dashboard-cell', 'aria-labelledby': props.view.labelledby, style: props.view.style }, slots.default?.())
        : slots.default?.();
  },
});
