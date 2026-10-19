import { uiTableView, type SpTableProps, type UiElement } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, optionalBoolean, useUi, withClass } from './base';
import { renderUi } from './render';

/**
 * `SpTable`: a native table (REQ-473). A sortable header emits `sort` with its column's key; the
 * consumer sorts (`uiSortRows`) and sets `sortKey` / `sortOrder` (REQ-474).
 */
export const SpTable = defineComponent({
  name: 'SpTable',
  inheritAttrs: false,
  props: {
    ...COMMON,
    columns: { type: Array as PropType<SpTableProps['columns']>, required: true },
    data: { type: Array as PropType<SpTableProps['data']>, required: true },
    caption: String,
    sortKey: String,
    sortOrder: String as PropType<SpTableProps['sortOrder']>,
    striped: optionalBoolean,
    hoverable: optionalBoolean,
    bordered: optionalBoolean,
    emptyText: String,
    rowKey: String,
  },
  emits: { sort: (key: string) => typeof key === 'string' },
  setup(props, { attrs, emit }) {
    const resolved = useUi(() => props);
    const sort = (node: UiElement) => ({ onClick: () => emit('sort', node.attrs['data-key'] as string) });
    return () => renderUi(uiTableView(withClass(props as SpTableProps, attrs), resolved.value), { bound: { sort } });
  },
});
