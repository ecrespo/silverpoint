import { uiSwitchView, type SpSwitchProps } from '@silverpoint/core/ui';
import { defineComponent } from 'vue';
import { COMMON, optionalBoolean, useUi, useValue, withClass } from './base';
import { renderUi } from './render';

/** `SpSwitch`: a native checkbox with `role="switch"`, with `v-model`. */
export const SpSwitch = defineComponent({
  name: 'SpSwitch',
  inheritAttrs: false,
  props: {
    ...COMMON,
    modelValue: optionalBoolean,
    defaultValue: optionalBoolean,
    label: { type: String, required: true },
    name: String,
    disabled: optionalBoolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { attrs, emit }) {
    const resolved = useUi(() => props);
    const value = useValue(() => props.modelValue, props.defaultValue ?? false, (v: boolean) => emit('update:modelValue', v));
    return () => {
      const view = uiSwitchView(withClass(props as SpSwitchProps, attrs), resolved.value, { checked: value.current.value });
      const native = {
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
