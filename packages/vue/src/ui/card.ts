import { uiCardView, type SpCardProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpCard`: slots `default`, `extra` and `footer` (API delta §5). */
export const SpCard = defineComponent({
  name: 'SpCard',
  inheritAttrs: false,
  props: { ...COMMON, title: String, headingLevel: Number as PropType<SpCardProps['headingLevel']> },
  setup(props, { slots, attrs }) {
    const resolved = useUi(() => props);
    return () => {
      const content = slots.default?.();
      const extra = slots.extra?.();
      const footer = slots.footer?.();
      const view = uiCardView(withClass(props as SpCardProps, attrs), resolved.value, { extra: !!extra, footer: !!footer });
      return renderUi(view, { slots: { content, extra, footer } });
    };
  },
});
