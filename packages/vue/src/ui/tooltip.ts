import { uiTooltipView, type SpTooltipProps } from '@silverpoint/core/ui';
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { OPEN, OPEN_EMITS, useOpen, useOverlay, useTrigger } from './overlay';
import { PLACE } from './popover';
import { renderUi } from './render';

/** Time the pointer has to cross from the trigger onto the tooltip, ms (WCAG 1.4.13: hoverable). */
const GRACE = 100;

/**
 * `SpTooltip`: a `manual` popover over its `trigger` slot, which it describes (REQ-492, REQ-496):
 * shown `delay` ms after hover or keyboard focus, kept while the pointer is on the tooltip itself,
 * hidden on blur, pointer leave or Escape.
 */
export const SpTooltip = defineComponent({
  name: 'SpTooltip',
  inheritAttrs: false,
  props: { ...COMMON, ...OPEN, ...PLACE, text: { type: String, required: true }, delay: Number },
  emits: OPEN_EMITS,
  setup(props, { slots, attrs, emit }) {
    const resolved = useUi(() => props);
    const open = useOpen(props, (v) => emit('update:open', v));
    const tooltip = ref<HTMLElement | null>(null);
    useOverlay(tooltip, () => 'popover', open, () => ({ place: { side: props.side ?? 'top', align: props.align ?? 'center', offset: props.offset } }));
    const trigger = useTrigger('tooltip', () => props.id, open, false);

    let detach = () => {};
    onMounted(() => {
      const shown = tooltip.value;
      const target = shown?.previousElementSibling;
      if (!shown || !target) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const later = (next: boolean, ms: number) => {
        clearTimeout(timer);
        timer = setTimeout(() => open.set(next), ms);
      };
      const now = (next: boolean) => {
        clearTimeout(timer);
        open.set(next);
      };
      const show = () => later(true, props.delay ?? 300);
      const leave = () => later(false, GRACE);
      const stay = () => clearTimeout(timer);
      const hide = () => now(false);
      const escape = (event: Event) => (event as KeyboardEvent).key === 'Escape' && now(false);
      const on: [EventTarget, string, EventListener][] = [
        [target, 'pointerenter', show],
        [target, 'pointerleave', leave],
        [target, 'focus', show],
        [target, 'blur', hide],
        [target, 'keydown', escape],
        [shown, 'pointerenter', stay],
        [shown, 'pointerleave', leave],
      ];
      for (const [element, type, listener] of on) element.addEventListener(type, listener);
      detach = () => {
        clearTimeout(timer);
        for (const [element, type, listener] of on) element.removeEventListener(type, listener);
      };
    });
    onBeforeUnmount(() => detach());
    return () => [trigger(slots.trigger?.()), renderUi(uiTooltipView(withClass(props as SpTooltipProps, attrs), resolved.value, { open: open.current.value }), { root: { ref: tooltip } })];
  },
});
