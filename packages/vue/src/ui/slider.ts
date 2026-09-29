import { uiSliderView, type SpSliderProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, optionalBoolean, useUi, useValue, withClass } from './base';
import { renderUi } from './render';

/** `SpSlider`: a native range over the exact drawing, with `v-model`; `change` on commit (DD-025). */
export const SpSlider = defineComponent({
  name: 'SpSlider',
  inheritAttrs: false,
  props: {
    ...COMMON,
    modelValue: { type: Number, default: undefined },
    defaultValue: Number,
    label: { type: String, required: true },
    min: Number,
    max: Number,
    step: Number,
    name: String,
    disabled: optionalBoolean,
    marks: Array as PropType<readonly number[]>,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { attrs, emit }) {
    const resolved = useUi(() => props);
    const value = useValue(() => props.modelValue, props.defaultValue ?? props.min ?? 0, (v: number) => emit('update:modelValue', v));
    const native = {
      onInput: (event: Event) => value.set((event.target as HTMLInputElement).valueAsNumber),
      onChange: (event: Event) => emit('change', (event.target as HTMLInputElement).valueAsNumber),
    };
    return () => renderUi(uiSliderView(withClass(props as SpSliderProps, attrs), resolved.value, { value: value.current.value }), { native });
  },
});
