import { uiResultView, type SpResultProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpResult`: a status glyph, a heading and a subtitle; slot `extra` holds actions (REQ-483). */
export const SpResult = defineComponent({
  name: 'SpResult',
  inheritAttrs: false,
  props: {
    ...COMMON,
    status: String as PropType<SpResultProps['status']>,
    title: { type: String, required: true },
    subtitle: String,
    headingLevel: Number as PropType<SpResultProps['headingLevel']>,
  },
  setup(props, { slots, attrs }) {
    const resolved = useUi(() => props);
    return () => {
      const extra = slots.extra?.();
      return renderUi(uiResultView(withClass(props as SpResultProps, attrs), resolved.value, { extra: !!extra }), { slots: { extra } });
    };
  },
});
