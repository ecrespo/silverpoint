import { uiBreadcrumbView, type SpBreadcrumbProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpBreadcrumb`: a labelled `nav`; the last item is the current page (REQ-477). */
export const SpBreadcrumb = defineComponent({
  name: 'SpBreadcrumb',
  inheritAttrs: false,
  props: { ...COMMON, items: { type: Array as PropType<SpBreadcrumbProps['items']>, required: true }, label: String },
  setup(props, { attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiBreadcrumbView(withClass(props as SpBreadcrumbProps, attrs), resolved.value), {});
  },
});
