import { uiTagView, type SpTagProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, optionalBoolean, textOf, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpTag`: framed and toned; closable, a native close button that emits `close` (REQ-308). */
export const SpTag = defineComponent({
  name: 'SpTag',
  inheritAttrs: false,
  props: { ...COMMON, tone: Number as PropType<SpTagProps['tone']>, closable: optionalBoolean, closeLabel: String },
  emits: ['close'],
  setup(props, { attrs, emit, slots }) {
    const resolved = useUi(() => props);
    const close = { onClick: (event: MouseEvent) => emit('close', event) };
    return () => {
      const content = slots.default?.();
      return renderUi(uiTagView(withClass(props as SpTagProps, attrs), resolved.value, { text: textOf(content) }), { close, slots: { content } });
    };
  },
});
