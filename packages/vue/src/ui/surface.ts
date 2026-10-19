import { uiSurfaceView, type SpSurfaceProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpSurface`: the root contract on any element (`as`), with an optional frame and tone; slot `default` (REQ-472). */
export const SpSurface = defineComponent({
  name: 'SpSurface',
  inheritAttrs: false,
  props: { ...COMMON, as: String, name: String, frame: String as PropType<SpSurfaceProps['frame']>, tone: [String, Number] as PropType<SpSurfaceProps['tone']> },
  setup(props, { slots, attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiSurfaceView(withClass(props as SpSurfaceProps, attrs), resolved.value), { slots: { content: slots.default?.() } });
  },
});
