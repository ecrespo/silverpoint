import { uiSkeletonView, type SpSkeletonProps } from '@silverpoint/core/ui';
import { defineComponent } from 'vue';
import { COMMON, optionalBoolean, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpSkeleton`: `aria-busy`, a hidden label, hidden toned shapes (REQ-318). */
export const SpSkeleton = defineComponent({
  name: 'SpSkeleton',
  inheritAttrs: false,
  props: { ...COMMON, lines: Number, avatar: optionalBoolean, label: String },
  setup(props, { attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiSkeletonView(withClass(props as SpSkeletonProps, attrs), resolved.value), {});
  },
});
