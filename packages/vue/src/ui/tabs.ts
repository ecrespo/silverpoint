import { uiItems, uiRovingFocus, uiSelectedKey, uiTabPanelView, uiTabsView, type SpTabsProps } from '@silverpoint/core/ui';
import { computed, defineComponent, inject, provide, type ComputedRef, type InjectionKey, type PropType } from 'vue';
import { COMMON, useUi, useValue, withClass } from './base';
import { itemsProp, orientationProp } from './items';
import { renderUi } from './render';

/** What a panel reads from its tabs: their id, for the ids that relate them, and the selected key. */
const TABS: InjectionKey<ComputedRef<{ id?: string; value: string | null }>> = Symbol('SpTabs');

/** `SpTabs`: a tablist of native buttons, with `v-model`; panels are `SpTabPanel` children (REQ-315). */
export const SpTabs = defineComponent({
  name: 'SpTabs',
  inheritAttrs: false,
  props: {
    ...COMMON,
    modelValue: { type: String, default: undefined },
    defaultValue: String,
    items: itemsProp,
    label: String,
    orientation: orientationProp,
    activation: String as PropType<SpTabsProps['activation']>,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { attrs, emit, slots }) {
    const resolved = useUi(() => props);
    const value = useValue<string | undefined>(() => props.modelValue, props.defaultValue, (v) => emit('update:modelValue', v));
    provide(
      TABS,
      computed(() => ({ id: props.id, value: uiSelectedKey(uiItems(props.items, 'SpTabs'), value.current.value, 'first') })),
    );
    const onKeydown = (event: KeyboardEvent) =>
      uiRovingFocus(event, event.currentTarget as HTMLElement, '[role="tab"]', props.orientation ?? 'horizontal', props.activation !== 'manual');
    const native = {
      onClick: (event: MouseEvent) => {
        const key = String((event.currentTarget as HTMLElement).dataset.key);
        value.set(key);
        emit('change', key);
      },
    };
    return () => {
      const view = uiTabsView(withClass(props as SpTabsProps, attrs), resolved.value, { value: value.current.value ?? null });
      return renderUi(view, { root: { onKeydown }, native, slots: { content: slots.default?.() } });
    };
  },
});

/** `SpTabPanel`: a `tabpanel` labelled by its tab, hidden unless its tab is selected. */
export const SpTabPanel = defineComponent({
  name: 'SpTabPanel',
  props: { value: { type: String, required: true } },
  setup(props, { slots }) {
    const tabs = inject(TABS, computed(() => ({ value: null })));
    return () => renderUi(uiTabPanelView({ value: props.value }, tabs.value), { slots: { content: slots.default?.() } });
  },
});
