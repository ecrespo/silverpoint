import { uiButtonView, type SpButtonProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, optionalBoolean, textOf, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpButton` (API delta §2): a native `<button>`, or `<a>` with `href`. */
export const SpButton = defineComponent({
  name: 'SpButton',
  inheritAttrs: false,
  props: {
    ...COMMON,
    variant: String as PropType<SpButtonProps['variant']>,
    type: String as PropType<SpButtonProps['type']>,
    disabled: optionalBoolean,
    label: String,
    block: optionalBoolean,
    href: String,
  },
  emits: ['click'],
  setup(props, { slots, attrs, emit }) {
    const resolved = useUi(() => props);
    return () => {
      const content = slots.default?.();
      const view = uiButtonView(withClass(props as SpButtonProps, attrs), resolved.value, { text: textOf(content) });
      // A disabled link is an `<a>` without `href`, which still takes clicks: it emits none (REQ-326).
      const onClick = (event: MouseEvent) => (props.disabled ? event.preventDefault() : emit('click', event));
      return renderUi(view, { root: { onClick }, slots: { content } });
    };
  },
});
