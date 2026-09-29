import { uiAlertView, type SpAlertProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, optionalBoolean, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpAlert`: `alert` or `status` by kind (REQ-318); closable, a close button that emits `close`. */
export const SpAlert = defineComponent({
  name: 'SpAlert',
  inheritAttrs: false,
  props: { ...COMMON, kind: String as PropType<SpAlertProps['kind']>, title: String, closable: optionalBoolean, closeLabel: String },
  emits: ['close'],
  setup(props, { attrs, emit, slots }) {
    const resolved = useUi(() => props);
    const close = { onClick: (event: MouseEvent) => emit('close', event) };
    return () => {
      const view = uiAlertView(withClass(props as SpAlertProps, attrs), resolved.value, { closable: props.closable === true });
      return renderUi(view, { close, slots: { content: slots.default?.() } });
    };
  },
});
