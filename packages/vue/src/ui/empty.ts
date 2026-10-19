import { uiEmptyView, type SpEmptyProps } from '@silverpoint/core/ui';
import { defineComponent } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpEmpty`: a toned tray and a description; slot `extra` holds actions (REQ-483). */
export const SpEmpty = defineComponent({
  name: 'SpEmpty',
  inheritAttrs: false,
  props: { ...COMMON, description: String },
  setup(props, { slots, attrs }) {
    const resolved = useUi(() => props);
    return () => {
      const extra = slots.extra?.();
      return renderUi(uiEmptyView(withClass(props as SpEmptyProps, attrs), resolved.value, { extra: !!extra }), { slots: { extra } });
    };
  },
});
