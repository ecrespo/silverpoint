import { uiInputView, type SpInputProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, optionalBoolean, useUi, useValue, withClass } from './base';
import { renderUi } from './render';

/** `SpInput`: a native `<input>` in a framed box, with `v-model` (REQ-314, REQ-334). */
export const SpInput = defineComponent({
  name: 'SpInput',
  inheritAttrs: false,
  props: {
    ...COMMON,
    modelValue: { type: String, default: undefined },
    defaultValue: String,
    type: String as PropType<SpInputProps['type']>,
    placeholder: String,
    name: String,
    disabled: optionalBoolean,
    readOnly: optionalBoolean,
    invalid: optionalBoolean,
    message: String,
    label: String,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { slots, attrs, emit }) {
    const resolved = useUi(() => props);
    const value = useValue(() => props.modelValue, props.defaultValue ?? '', (v: string) => emit('update:modelValue', v));
    return () => {
      const prefix = slots.prefix?.();
      const suffix = slots.suffix?.();
      const view = uiInputView(withClass(props as SpInputProps, attrs), resolved.value, { value: value.current.value, prefix: !!prefix, suffix: !!suffix });
      const native = {
        value: value.current.value,
        onInput: (event: Event) => value.set((event.target as HTMLInputElement).value),
        onChange: (event: Event) => emit('change', (event.target as HTMLInputElement).value),
      };
      return renderUi(view, { native, slots: { prefix, suffix } });
    };
  },
});
