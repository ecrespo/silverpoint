import { uiCheckboxView, type SpCheckboxProps } from '@silverpoint/core/ui';
import { defineComponent } from 'vue';
import { COMMON, optionalBoolean, useUi, useValue, withClass } from './base';
import { useIndeterminate } from './checkable';
import { renderUi } from './render';

/** `SpCheckbox`: a native checkbox, hidden for sight, in its `<label>`, with `v-model`. */
export const SpCheckbox = defineComponent({
  name: 'SpCheckbox',
  inheritAttrs: false,
  props: {
    ...COMMON,
    modelValue: optionalBoolean,
    defaultValue: optionalBoolean,
    label: { type: String, required: true },
    name: String,
    disabled: optionalBoolean,
    indeterminate: optionalBoolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { attrs, emit }) {
    const resolved = useUi(() => props);
    const value = useValue(() => props.modelValue, props.defaultValue ?? false, (v: boolean) => emit('update:modelValue', v));
    const element = useIndeterminate(() => props.indeterminate);
    return () => {
      const view = uiCheckboxView(withClass(props as SpCheckboxProps, attrs), resolved.value, { checked: value.current.value });
      const native = {
        ref: element,
        checked: value.current.value,
        onChange: (event: Event) => {
          const checked = (event.target as HTMLInputElement).checked;
          value.set(checked);
          emit('change', checked);
        },
      };
      return renderUi(view, { native });
    };
  },
});
