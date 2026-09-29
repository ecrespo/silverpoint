import { uiStepsView, type SpStepsProps, type StepItem } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { orientationProp } from './items';
import { renderUi } from './render';

/** `SpSteps`: an ordered list; the current step has `aria-current="step"` (REQ-318). */
export const SpSteps = defineComponent({
  name: 'SpSteps',
  inheritAttrs: false,
  props: {
    ...COMMON,
    items: { type: Array as PropType<readonly StepItem[]>, required: true },
    current: { type: Number, required: true },
    orientation: orientationProp,
    label: String,
  },
  setup(props, { attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiStepsView(withClass(props as SpStepsProps, attrs), resolved.value), {});
  },
});
