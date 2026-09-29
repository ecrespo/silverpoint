import { uiRateView, uiRovingFocus, type SpRateProps, type UiElement } from '@silverpoint/core/ui';
import { defineComponent } from 'vue';
import { COMMON, optionalBoolean, resyncRadios, useUi, useValue, withClass } from './base';
import { renderUi } from './render';

/** `SpRate`: native radios valued 1..count, with `v-model`; read-only takes no click and no key (REQ-326). */
export const SpRate = defineComponent({
  name: 'SpRate',
  inheritAttrs: false,
  props: {
    ...COMMON,
    modelValue: { type: Number, default: undefined },
    defaultValue: Number,
    label: { type: String, required: true },
    count: Number,
    name: String,
    disabled: optionalBoolean,
    readOnly: optionalBoolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { attrs, emit }) {
    const resolved = useUi(() => props);
    const value = useValue(() => props.modelValue, props.defaultValue ?? 0, (v: number) => emit('update:modelValue', v));
    const onKeydown = (event: KeyboardEvent) => {
      if (!props.readOnly) uiRovingFocus(event, event.currentTarget as HTMLElement, 'input.sp-ui-native', 'both', true);
    };
    return () => {
      const view = uiRateView(withClass(props as SpRateProps, attrs), resolved.value, { value: value.current.value });
      const native = (node: UiElement) => ({
        checked: node.attrs.checked === true,
        onClick: (event: MouseEvent) => props.readOnly && event.preventDefault(),
        onChange: (event: Event) => {
          if (!props.readOnly) {
            const n = Number((event.target as HTMLInputElement).value);
            value.set(n);
            emit('change', n);
          }
          resyncRadios(event.target, () => String(value.current.value));
        },
      });
      return renderUi(view, { root: { onKeydown }, native });
    };
  },
});
