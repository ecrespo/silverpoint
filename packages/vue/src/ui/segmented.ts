import { uiItems, uiRovingFocus, uiSegmentedView, uiSelectedKey, type SpSegmentedProps, type UiElement } from '@silverpoint/core/ui';
import { defineComponent } from 'vue';
import { COMMON, resyncRadios, optionalBoolean, useUi, useValue, withClass } from './base';
import { itemsProp } from './items';
import { renderUi } from './render';

/** `SpSegmented`: native radios in one frame, with `v-model`; arrows through the core (REQ-315). */
export const SpSegmented = defineComponent({
  name: 'SpSegmented',
  inheritAttrs: false,
  props: {
    ...COMMON,
    modelValue: { type: String, default: undefined },
    defaultValue: String,
    items: itemsProp,
    label: { type: String, required: true },
    name: String,
    block: optionalBoolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { attrs, emit }) {
    const resolved = useUi(() => props);
    const value = useValue<string | undefined>(() => props.modelValue, props.defaultValue, (v) => emit('update:modelValue', v));
    const onKeydown = (event: KeyboardEvent) => uiRovingFocus(event, event.currentTarget as HTMLElement, 'input.sp-ui-native', 'both', true);
    return () => {
      const view = uiSegmentedView(withClass(props as SpSegmentedProps, attrs), resolved.value, { value: value.current.value ?? null });
      const native = (node: UiElement) => ({
        checked: node.attrs.checked === true,
        onChange: (event: Event) => {
          const key = (event.target as HTMLInputElement).value;
          value.set(key);
          emit('change', key);
          resyncRadios(event.target, () => uiSelectedKey(uiItems(props.items, 'SpSegmented'), value.current.value ?? null, 'first'));
        },
      });
      return renderUi(view, { root: { onKeydown }, native });
    };
  },
});
