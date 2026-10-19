import { uiPopoverView, type SpPopoverProps } from '@silverpoint/core/ui';
import { defineComponent, ref, type PropType } from 'vue';
import { COMMON, optionalBoolean, useUi, withClass } from './base';
import { OPEN, OPEN_EMITS, useOpen, useOverlay, useTrigger } from './overlay';
import { renderUi } from './render';

/** Placement props of the anchored overlays. */
export const PLACE = { side: String as PropType<SpPopoverProps['side']>, align: String as PropType<SpPopoverProps['align']>, offset: Number } as const;

/** `SpPopover`: an `auto` popover with the dialog role, hung from its `trigger` slot by `uiAnchor` (REQ-492, REQ-493). */
export const SpPopover = defineComponent({
  name: 'SpPopover',
  inheritAttrs: false,
  props: { ...COMMON, ...OPEN, ...PLACE, title: String, label: String, closable: optionalBoolean, closeLabel: String, width: String },
  emits: OPEN_EMITS,
  setup(props, { slots, attrs, emit }) {
    const resolved = useUi(() => props);
    const open = useOpen(props, (v) => emit('update:open', v));
    const popover = ref<HTMLElement | null>(null);
    useOverlay(popover, () => 'popover', open, () => ({ place: { side: props.side ?? 'bottom', align: props.align ?? 'center', offset: props.offset } }));
    const trigger = useTrigger('popover', () => props.id, open);
    return () => {
      const view = uiPopoverView(withClass(props as SpPopoverProps, attrs), resolved.value, { open: open.current.value });
      return [trigger(slots.trigger?.()), renderUi(view, { root: { ref: popover }, close: { onClick: () => open.set(false) }, slots: { content: slots.default?.() } })];
    };
  },
});
