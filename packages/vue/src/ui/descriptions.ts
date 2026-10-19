import { uiDescriptionsView, type SpDescriptionsProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, optionalBoolean, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpDescriptions`: label–value pairs as a `<dl>` (REQ-480). */
export const SpDescriptions = defineComponent({
  name: 'SpDescriptions',
  inheritAttrs: false,
  props: {
    ...COMMON,
    items: { type: Array as PropType<SpDescriptionsProps['items']>, required: true },
    title: String,
    columns: Number,
    bordered: optionalBoolean,
    headingLevel: Number as PropType<SpDescriptionsProps['headingLevel']>,
  },
  setup(props, { attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiDescriptionsView(withClass(props as SpDescriptionsProps, attrs), resolved.value), {});
  },
});
