import { uiToastDuration, uiToasterView, uiToastView, type AlertKind, type SpToasterProps, type SpToastProps } from '@silverpoint/core/ui';
import { computed, defineComponent, inject, onBeforeUnmount, onMounted, provide, ref, watchEffect, type ComputedRef, type InjectionKey, type PropType } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { OPEN, OPEN_EMITS, useOpen } from './overlay';
import { renderUi } from './render';

/** The duration a toaster gives the toasts it holds. */
const TOASTER_DURATION: InjectionKey<ComputedRef<number | undefined>> = Symbol('SpToaster');

/**
 * `SpToast`: announced by its kind, with `v-model:open` and an `action` slot (REQ-497); it closes
 * after its duration —its own, its toaster's or 5000 ms, by `uiToastDuration`— counted again from
 * the start once the pointer and focus have left it.
 */
export const SpToast = defineComponent({
  name: 'SpToast',
  inheritAttrs: false,
  props: { ...COMMON, ...OPEN, title: { type: String, required: true }, description: String, kind: String as PropType<AlertKind>, duration: Number, closeLabel: String },
  emits: OPEN_EMITS,
  setup(props, { slots, attrs, emit }) {
    const resolved = useUi(() => props);
    const open = useOpen(props, (v) => emit('update:open', v));
    const toaster = inject(
      TOASTER_DURATION,
      computed(() => undefined),
    );
    const duration = computed(() => uiToastDuration(props.duration, toaster.value));
    const root = ref<HTMLElement | null>(null);
    watchEffect(
      (onCleanup) => {
        const toast = root.value;
        const ms = duration.value;
        if (!toast || !open.current.value || ms === Infinity) return;
        // A pause restarts the whole duration when it ends: no clock is read (Art. 4).
        let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => open.set(false), ms);
        const pause = () => {
          clearTimeout(timer);
          timer = undefined;
        };
        const resume = () => {
          if (timer !== undefined || toast.contains(toast.ownerDocument.activeElement)) return;
          timer = setTimeout(() => open.set(false), ms);
        };
        const on: [string, EventListener][] = [
          ['pointerenter', pause],
          ['focusin', pause],
          ['pointerleave', resume],
          ['focusout', resume],
        ];
        for (const [type, listener] of on) toast.addEventListener(type, listener);
        onCleanup(() => {
          clearTimeout(timer);
          for (const [type, listener] of on) toast.removeEventListener(type, listener);
        });
      },
      { flush: 'post' },
    );
    return () => {
      const action = slots.action?.();
      const view = uiToastView(withClass(props as SpToastProps, attrs), resolved.value, { open: open.current.value }, { action: action !== undefined });
      return renderUi(view, { root: { ref: root }, close: { onClick: () => open.set(false) }, slots: { action } });
    };
  },
});

/** `SpToaster`: the labelled region of its toasts, which take its `duration` (REQ-497); F8 moves focus to it. */
export const SpToaster = defineComponent({
  name: 'SpToaster',
  inheritAttrs: false,
  props: { ...COMMON, position: String as PropType<SpToasterProps['position']>, duration: Number, label: String },
  setup(props, { slots, attrs }) {
    const resolved = useUi(() => props);
    provide(
      TOASTER_DURATION,
      computed(() => props.duration),
    );
    const region = ref<HTMLElement | null>(null);
    const f8 = (event: KeyboardEvent) => {
      if (event.key !== 'F8' || !region.value) return;
      // Focusable once asked, never in the server markup.
      region.value.setAttribute('tabindex', '-1');
      region.value.focus();
    };
    onMounted(() => document.addEventListener('keydown', f8));
    onBeforeUnmount(() => document.removeEventListener('keydown', f8));
    return () => renderUi(uiToasterView(withClass(props as SpToasterProps, attrs), resolved.value), { root: { ref: region }, slots: { content: slots.default?.() } });
  },
});
