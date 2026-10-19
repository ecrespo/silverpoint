import { uiAnchor, uiOverlaySync, uiTriggerAria, type UiAnchorOptions, type UiOverlayKind, type UiTriggerKind } from '@silverpoint/core/ui';
import { cloneElement, isValidElement, useEffect, useRef, useState, type ReactElement, type RefObject, type SyntheticEvent } from 'react';

/** The open state of every overlay (REQ-500): controlled by `open`, held from `defaultOpen` otherwise. */
export interface OverlayOpenProps {
  /** Controlled. */
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  /** The user opened or closed it, or the platform did (Escape, a click outside). */
  readonly onOpenChange?: (open: boolean) => void;
}

/**
 * The open state: controlled or held (REQ-500, REQ-322). `set` reports a change only, never the
 * state the overlay is already in, so a close the platform made and the one that follows from it
 * are reported once. `latest` is the state of the last render, for native listeners.
 */
export function useOpen({ open, defaultOpen, onOpenChange }: OverlayOpenProps): [boolean, (next: boolean) => void, RefObject<boolean>] {
  const [held, setHeld] = useState(defaultOpen ?? false);
  const current = open ?? held;
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onOpenChange);
  report.current = onOpenChange;
  const set = useRef((next: boolean) => {
    if (next === latest.current) return;
    latest.current = next;
    setHeld(next);
    report.current?.(next);
  }).current;
  return [current, set, latest];
}

export interface OverlayOptions {
  /** Placement of an anchored overlay, from the element just before it: its trigger. */
  readonly place?: UiAnchorOptions;
  /** A dialog's Escape and backdrop click; default `true`. */
  readonly dismissible?: boolean;
}

/**
 * The native side of an overlay (T-215, DD-038): after mount, opens or closes it as `open` says
 * (`uiOverlaySync`), places an anchored one with `uiAnchor` while it is open, and reports a close the
 * platform made: a dialog's `close` (Escape, `close()`), a popover's `toggle` to `closed` (light
 * dismiss). A dialog that is not dismissible cancels Escape and ignores a click on its backdrop.
 */
export function useOverlay(element: RefObject<HTMLElement | null>, kind: UiOverlayKind, open: boolean, set: (next: boolean) => void, options: OverlayOptions = {}): void {
  const { side, align, offset } = options.place ?? {};
  const placed = options.place !== undefined;
  useEffect(() => {
    const overlay = element.current;
    if (!overlay) return;
    uiOverlaySync(overlay, kind, open);
    const anchor = overlay.previousElementSibling;
    if (!open || !placed || !anchor) return;
    return uiAnchor(anchor, overlay, { side: side ?? 'bottom', align: align ?? 'center', offset });
  }, [element, kind, open, placed, side, align, offset]);

  const dismissible = useRef(options.dismissible);
  dismissible.current = options.dismissible;
  useEffect(() => {
    const overlay = element.current;
    if (!overlay) return;
    const closed = () => set(false);
    if (kind === 'popover') {
      const toggle = (event: Event) => (event as Event & { newState?: string }).newState === 'closed' && closed();
      overlay.addEventListener('toggle', toggle);
      return () => overlay.removeEventListener('toggle', toggle);
    }
    const cancel = (event: Event) => dismissible.current === false && event.preventDefault();
    // A click on the dialog element itself, not on its content, is a click on the backdrop.
    const backdrop = (event: Event) => event.target === overlay && dismissible.current !== false && (overlay as HTMLDialogElement).close();
    overlay.addEventListener('close', closed);
    overlay.addEventListener('cancel', cancel);
    overlay.addEventListener('click', backdrop);
    return () => {
      overlay.removeEventListener('close', closed);
      overlay.removeEventListener('cancel', cancel);
      overlay.removeEventListener('click', backdrop);
    };
  }, [element, kind, set]);
}

type Handler = (event: SyntheticEvent) => void;

/**
 * The consumer's trigger, cloned with the ARIA its overlay's APG pattern asks (REQ-500) and a click
 * that toggles it. A press on the trigger of an open popover closes it, even when the press, outside
 * the popover, already dismissed it.
 */
export function useTrigger(trigger: ReactElement | undefined, kind: UiTriggerKind, id: string | undefined, open: RefObject<boolean>, set: (next: boolean) => void): ReactElement | undefined {
  const pressedOpen = useRef(false);
  if (!isValidElement(trigger)) return undefined;
  const own = trigger.props as { onClick?: Handler; onPointerDown?: Handler };
  return cloneElement(trigger as ReactElement<Record<string, unknown>>, {
    ...uiTriggerAria(kind, id, open.current),
    onPointerDown: (event: SyntheticEvent) => {
      own.onPointerDown?.(event);
      pressedOpen.current = open.current;
    },
    onClick: (event: SyntheticEvent) => {
      own.onClick?.(event);
      const wasOpen = pressedOpen.current || open.current;
      pressedOpen.current = false;
      set(!wasOpen);
    },
  });
}
