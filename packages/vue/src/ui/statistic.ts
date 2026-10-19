import { uiStatisticView, type SpStatisticProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpStatistic`: a title, a value and an optional trend (REQ-479). */
export const SpStatistic = defineComponent({
  name: 'SpStatistic',
  inheritAttrs: false,
  props: {
    ...COMMON,
    title: { type: String, required: true },
    value: { type: [String, Number] as PropType<SpStatisticProps['value']>, required: true },
    prefix: String,
    suffix: String,
    trend: String as PropType<SpStatisticProps['trend']>,
    delta: String,
  },
  setup(props, { attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiStatisticView(withClass(props as SpStatisticProps, attrs), resolved.value), {});
  },
});
