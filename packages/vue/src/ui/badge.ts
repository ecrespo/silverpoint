import { uiBadgeView, type SpBadgeProps } from '@silverpoint/core/ui';
import { defineComponent } from 'vue';
import { COMMON, optionalBoolean, textOf, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpBadge`: its count is text, in the accessible name (REQ-318). */
export const SpBadge = defineComponent({
  name: 'SpBadge',
  inheritAttrs: false,
  props: { ...COMMON, count: Number, max: Number, dot: optionalBoolean, label: String },
  setup(props, { attrs, slots }) {
    const resolved = useUi(() => props);
    return () => {
      const content = slots.default?.();
      return renderUi(uiBadgeView(withClass(props as SpBadgeProps, attrs), resolved.value, { text: textOf(content) }), { slots: { content } });
    };
  },
});
