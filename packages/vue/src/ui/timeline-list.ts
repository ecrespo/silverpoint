import { uiTimelineListView, type SpTimelineListProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpTimelineList`: events in reading order, one marked current (REQ-481). */
export const SpTimelineList = defineComponent({
  name: 'SpTimelineList',
  inheritAttrs: false,
  props: { ...COMMON, items: { type: Array as PropType<SpTimelineListProps['items']>, required: true }, label: String },
  setup(props, { attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiTimelineListView(withClass(props as SpTimelineListProps, attrs), resolved.value), {});
  },
});
