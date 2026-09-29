import { uiDividerView, type SpDividerProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpDivider`: a `separator`. */
export const SpDivider = defineComponent({
  name: 'SpDivider',
  inheritAttrs: false,
  props: {
    ...COMMON,
    orientation: String as PropType<SpDividerProps['orientation']>,
    text: String,
    align: String as PropType<SpDividerProps['align']>,
  },
  setup(props, { attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiDividerView(withClass(props as SpDividerProps, attrs), resolved.value), {});
  },
});
