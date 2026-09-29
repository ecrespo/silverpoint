import { uiProgressView, type SpProgressProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, optionalBoolean, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpProgress`: a `progressbar`; without `value`, indeterminate (REQ-318). */
export const SpProgress = defineComponent({
  name: 'SpProgress',
  inheritAttrs: false,
  props: {
    ...COMMON,
    value: Number,
    shape: String as PropType<SpProgressProps['shape']>,
    label: { type: String, required: true },
    showValue: optionalBoolean,
  },
  setup(props, { attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiProgressView(withClass(props as SpProgressProps, attrs), resolved.value), {});
  },
});
