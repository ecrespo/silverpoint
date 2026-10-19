import { uiModalView, type SpModalProps } from '@silverpoint/core/ui';
import { defineComponent, ref } from 'vue';
import { COMMON, optionalBoolean, useUi, withClass } from './base';
import { OPEN, OPEN_EMITS, useOpen, useOverlay, useTrigger } from './overlay';
import { renderUi } from './render';

/** Props of a Modal, and of the Drawer built on its dialog. */
export const DIALOG = { ...COMMON, ...OPEN, title: String, description: String, label: String, closable: optionalBoolean, closeLabel: String, dismissible: optionalBoolean } as const;

/**
 * `SpModal`: a native `<dialog>` opened with `showModal()` once rendered, with `v-model:open`; the
 * `trigger` slot opens it and takes `aria-haspopup`, `aria-expanded` and `aria-controls` (REQ-491, REQ-502).
 */
export const SpModal = defineComponent({
  name: 'SpModal',
  inheritAttrs: false,
  props: { ...DIALOG, width: String },
  emits: OPEN_EMITS,
  setup(props, { slots, attrs, emit }) {
    const resolved = useUi(() => props);
    const open = useOpen(props, (v) => emit('update:open', v));
    const dialog = ref<HTMLDialogElement | null>(null);
    useOverlay(dialog, () => 'modal', open, () => ({ dismissible: props.dismissible }));
    const trigger = useTrigger('dialog', () => props.id, open);
    return () => {
      const footer = slots.footer?.();
      const view = uiModalView(withClass(props as SpModalProps, attrs), resolved.value, { open: open.current.value }, { footer: footer !== undefined });
      return [trigger(slots.trigger?.()), renderUi(view, { root: { ref: dialog }, close: { onClick: () => open.set(false) }, slots: { content: slots.default?.(), footer } })];
    };
  },
});
