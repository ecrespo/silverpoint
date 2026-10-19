import { uiInputNumberView, uiNumberStep, uiNumberValue, type SpInputNumberProps, type UiElement } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, optionalBoolean, useUi, useValue, withClass } from './base';
import { renderUi } from './render';

/**
 * `SpInputNumber`: a native number input between exact steppers, with `v-model` (REQ-485, REQ-488).
 * What is typed stays in the field until committed (`change`: blur or Enter), so a bound never
 * interrupts typing; the committed value is the core's `uiNumberValue`, a stepper's `uiNumberStep`.
 */
export const SpInputNumber = defineComponent({
  name: 'SpInputNumber',
  inheritAttrs: false,
  props: {
    ...COMMON,
    modelValue: { type: Number as PropType<number | null>, default: undefined },
    defaultValue: { type: Number as PropType<number | null>, default: undefined },
    min: Number,
    max: Number,
    step: Number,
    precision: Number,
    placeholder: String,
    label: String,
    message: String,
    invalid: optionalBoolean,
    disabled: optionalBoolean,
    readOnly: optionalBoolean,
    name: String,
    decrementLabel: String,
    incrementLabel: String,
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    const resolved = useUi(() => props);
    const value = useValue<number | null>(() => props.modelValue, props.defaultValue ?? null, (v) => emit('update:modelValue', v));
    const native = {
      onChange: (event: Event) => {
        const field = event.target as HTMLInputElement;
        const next = field.value.trim() === '' ? null : uiNumberValue(Number(field.value), props as SpInputNumberProps).value;
        value.set(next);
        // An unchanged value renders nothing new: the field shows the committed one all the same.
        field.value = next === null ? '' : String(next);
      },
    };
    const stepper = (node: UiElement) => ({ onClick: () => value.set(uiNumberStep(value.current.value, node.attrs['data-step'] === '1' ? 1 : -1, props as SpInputNumberProps)) });
    return () => renderUi(uiInputNumberView(withClass(props as SpInputNumberProps, attrs), resolved.value, { value: value.current.value }), { native, bound: { stepper } });
  },
});
