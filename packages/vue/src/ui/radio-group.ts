import { uiRadioGroupView, uiRovingFocus, type SpRadioGroupProps, type UiElement } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, resyncRadios, useUi, useValue, withClass } from './base';
import { itemsProp, orientationProp } from './items';
import { renderUi } from './render';

/** `SpRadioGroup`: a `<fieldset>` of native radios, with `v-model`; arrows through the core (REQ-315). */
export const SpRadioGroup = defineComponent({
  name: 'SpRadioGroup',
  inheritAttrs: false,
  props: {
    ...COMMON,
    modelValue: { type: String as PropType<string | null>, default: undefined },
    defaultValue: { type: String as PropType<string | null>, default: undefined },
    items: itemsProp,
    name: { type: String, required: true },
    label: { type: String, required: true },
    orientation: orientationProp,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { attrs, emit }) {
    const resolved = useUi(() => props);
    const value = useValue<string | null>(() => props.modelValue, props.defaultValue ?? null, (v) => emit('update:modelValue', v));
    const onKeydown = (event: KeyboardEvent) => uiRovingFocus(event, event.currentTarget as HTMLElement, 'input.sp-ui-native', 'both', true);
    return () => {
      const view = uiRadioGroupView(withClass(props as SpRadioGroupProps, attrs), resolved.value, { value: value.current.value });
      const native = (node: UiElement) => ({
        checked: node.attrs.checked === true,
        onChange: (event: Event) => {
          const key = (event.target as HTMLInputElement).value;
          value.set(key);
          emit('change', key);
          resyncRadios(event.target, () => value.current.value);
        },
      });
      return renderUi(view, { root: { onKeydown }, native });
    };
  },
});
