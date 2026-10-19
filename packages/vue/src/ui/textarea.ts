import { uiTextareaView, type SpTextareaProps } from '@silverpoint/core/ui';
import { defineComponent } from 'vue';
import { COMMON, optionalBoolean, useUi, useValue, withClass } from './base';
import { renderUi } from './render';

/** `SpTextarea`: a native `<textarea>` on the `SpInput` contract, with `v-model` (REQ-484, REQ-488). */
export const SpTextarea = defineComponent({
  name: 'SpTextarea',
  inheritAttrs: false,
  props: {
    ...COMMON,
    modelValue: { type: String, default: undefined },
    defaultValue: String,
    rows: Number,
    placeholder: String,
    label: String,
    message: String,
    invalid: optionalBoolean,
    disabled: optionalBoolean,
    readOnly: optionalBoolean,
    maxLength: Number,
    showCount: optionalBoolean,
    name: String,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { attrs, emit }) {
    const resolved = useUi(() => props);
    const value = useValue(() => props.modelValue, props.defaultValue ?? '', (v: string) => emit('update:modelValue', v));
    return () => {
      const native = {
        value: value.current.value,
        onInput: (event: Event) => value.set((event.target as HTMLTextAreaElement).value),
        onChange: (event: Event) => emit('change', (event.target as HTMLTextAreaElement).value),
      };
      return renderUi(uiTextareaView(withClass(props as SpTextareaProps, attrs), resolved.value, { value: value.current.value }), { native });
    };
  },
});
