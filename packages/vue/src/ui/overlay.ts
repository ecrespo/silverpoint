import { uiAnchor, uiOverlaySync, uiTriggerAria, type UiAnchorOptions, type UiOverlayKind, type UiTriggerKind } from '@silverpoint/core/ui';
import { cloneVNode, Comment, computed, onBeforeUnmount, onMounted, ref, watchEffect, type ComputedRef, type Ref, type VNode } from 'vue';
import { optionalBoolean } from './base';

/** `v-model:open` of every overlay (REQ-500): bound, or held from `defaultOpen`. */
export const OPEN = { open: optionalBoolean, defaultOpen: optionalBoolean } as const;

export const OPEN_EMITS = { 'update:open': (open: boolean) => typeof open === 'boolean' } as const;

export interface OpenState {
  readonly current: ComputedRef<boolean>;
  /** Reports a change only, never the state the overlay is already in. */
  set(next: boolean): void;
}

/**
 * The open state: bound or held (REQ-500, REQ-322). A close the platform made and the one that
 * follows from it are reported once.
 */
export function useOpen(props: { readonly open?: boolean; readonly defaultOpen?: boolean }, emit: (open: boolean) => void): OpenState {
  const held = ref(props.defaultOpen ?? false);
  const current = computed(() => props.open ?? held.value);
  return {
    current,
    set(next) {
      if (next === current.value) return;
      held.value = next;
      emit(next);
    },
  };
}

export interface OverlayOptions {
  /** Placement of an anchored overlay, from the element just before it: its trigger. */
  readonly place?: UiAnchorOptions;
  /** A dialog's Escape and backdrop click; default `true`. */
  readonly dismissible?: boolean;
}

/**
 * The native side of an overlay (T-215, DD-038): once rendered, opens or closes it as `open` says
 * (`uiOverlaySync`), places an anchored one with `uiAnchor` while it is open, and reports a close the
 * platform made: a dialog's `close` (Escape, `close()`), a popover's `toggle` to `closed` (light
 * dismiss). A dialog that is not dismissible cancels Escape and ignores a click on its backdrop.
 */
export function useOverlay(element: Ref<HTMLElement | null>, kind: () => UiOverlayKind, open: OpenState, options: () => OverlayOptions = () => ({})): void {
  watchEffect(
    (onCleanup) => {
      const overlay = element.value;
      if (!overlay) return;
      const isOpen = open.current.value;
      uiOverlaySync(overlay, kind(), isOpen);
      const { place } = options();
      const anchor = overlay.previousElementSibling;
      if (isOpen && place && anchor) onCleanup(uiAnchor(anchor, overlay, place));
    },
    { flush: 'post' },
  );

  let detach = () => {};
  onMounted(() => {
    const overlay = element.value;
    if (!overlay) return;
    const closed = () => open.set(false);
    if (kind() === 'popover') {
      const toggle = (event: Event) => (event as Event & { newState?: string }).newState === 'closed' && closed();
      overlay.addEventListener('toggle', toggle);
      detach = () => overlay.removeEventListener('toggle', toggle);
      return;
    }
    const cancel = (event: Event) => options().dismissible === false && event.preventDefault();
    // A click on the dialog element itself, not on its content, is a click on the backdrop.
    const backdrop = (event: Event) => event.target === overlay && options().dismissible !== false && (overlay as HTMLDialogElement).close();
    overlay.addEventListener('close', closed);
    overlay.addEventListener('cancel', cancel);
    overlay.addEventListener('click', backdrop);
    detach = () => {
      overlay.removeEventListener('close', closed);
      overlay.removeEventListener('cancel', cancel);
      overlay.removeEventListener('click', backdrop);
    };
  });
  onBeforeUnmount(() => detach());
}

/** The first element of a slot. */
export const firstOf = (nodes: readonly VNode[] | undefined): VNode | undefined => nodes?.find((node) => node.type !== Comment);

/**
 * The `trigger` slot, cloned with the ARIA its overlay's APG pattern asks (REQ-500) and, when
 * `toggles`, a click that toggles it. A press on the trigger of an open popover closes it, even when
 * the press, outside the popover, already dismissed it.
 */
export function useTrigger(kind: UiTriggerKind, id: () => string | undefined, open: OpenState, toggles = true): (nodes: readonly VNode[] | undefined) => VNode | undefined {
  let pressedOpen = false;
  const handlers = {
    onPointerdown: () => (pressedOpen = open.current.value),
    onClick: () => {
      const wasOpen = pressedOpen || open.current.value;
      pressedOpen = false;
      open.set(!wasOpen);
    },
  };
  return (nodes) => {
    const trigger = firstOf(nodes);
    return trigger && cloneVNode(trigger, { ...uiTriggerAria(kind, id(), open.current.value), ...(toggles && handlers) });
  };
}
