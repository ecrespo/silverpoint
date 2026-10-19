import { uiDrawerView, type SpDrawerProps } from '@silverpoint/core/ui';
import { defineComponent, ref, type PropType } from 'vue';
import { optionalBoolean, useUi, withClass } from './base';
import { DIALOG } from './modal';
import { OPEN_EMITS, useOpen, useOverlay, useTrigger } from './overlay';
import { renderUi } from './render';

/** `SpDrawer`: the Modal's dialog on a logical side; `modal: false` opens it with `show()` (REQ-491). */
export const SpDrawer = defineComponent({
  name: 'SpDrawer',
  inheritAttrs: false,
  props: { ...DIALOG, side: String as PropType<SpDrawerProps['side']>, extent: String, modal: optionalBoolean },
  emits: OPEN_EMITS,
  setup(props, { slots, attrs, emit }) {
    const resolved = useUi(() => props);
    const open = useOpen(props, (v) => emit('update:open', v));
    const dialog = ref<HTMLDialogElement | null>(null);
    useOverlay(dialog, () => (props.modal === false ? 'dialog' : 'modal'), open, () => ({ dismissible: props.dismissible }));
    const trigger = useTrigger('dialog', () => props.id, open);
    return () => {
      const footer = slots.footer?.();
      const view = uiDrawerView(withClass(props as SpDrawerProps, attrs), resolved.value, { open: open.current.value }, { footer: footer !== undefined });
      return [trigger(slots.trigger?.()), renderUi(view, { root: { ref: dialog }, close: { onClick: () => open.set(false) }, slots: { content: slots.default?.(), footer } })];
    };
  },
});
