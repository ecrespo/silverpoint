import { uiPaginationView, type SpPaginationProps, type UiElement } from '@silverpoint/core/ui';
import { defineComponent } from 'vue';
import { COMMON, optionalBoolean, useUi, useValue, withClass } from './base';
import { renderUi } from './render';

/** `SpPagination`: a labelled nav of page buttons, with `v-model:current` (REQ-476, REQ-322). */
export const SpPagination = defineComponent({
  name: 'SpPagination',
  inheritAttrs: false,
  props: {
    ...COMMON,
    current: { type: Number, default: undefined },
    defaultCurrent: Number,
    total: { type: Number, required: true },
    pageSize: Number,
    siblings: Number,
    showTotal: optionalBoolean,
    totalTemplate: String,
    label: String,
    previousLabel: String,
    nextLabel: String,
    pageLabel: String,
    disabled: optionalBoolean,
  },
  emits: { 'update:current': (current: number) => typeof current === 'number' },
  setup(props, { attrs, emit }) {
    const resolved = useUi(() => props);
    const current = useValue(() => props.current, props.defaultCurrent ?? 1, (v: number) => emit('update:current', v));
    const page = (node: UiElement) => ({ onClick: () => current.set(Number(node.attrs['data-page'])) });
    return () => renderUi(uiPaginationView(withClass(props as SpPaginationProps, attrs), resolved.value, { current: current.current.value }), { bound: { page } });
  },
});
