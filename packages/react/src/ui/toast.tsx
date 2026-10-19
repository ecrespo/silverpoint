import { uiToastDuration, uiToasterView, uiToastView, type SpToasterProps as CoreToasterProps, type SpToastProps as CoreProps } from '@silverpoint/core/ui';
import { createContext, useContext, useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { useUi, type UiCellProps } from './base';
import { useOpen, type OverlayOpenProps } from './overlay';
import { renderUi } from './render';

/** The duration a toaster gives the toasts it holds. */
const ToasterDuration = createContext<number | undefined>(undefined);

export interface SpToastProps extends CoreProps, OverlayOpenProps, UiCellProps {
  /** An action beside the text, as a button. */
  readonly action?: ReactNode;
}

export interface SpToasterProps extends CoreToasterProps, UiCellProps {
  /** `SpToast`s. */
  readonly children?: ReactNode;
}

/**
 * `SpToast`: announced by its kind (REQ-497); it closes after its duration —its own, its toaster's
 * or 5000 ms, by `uiToastDuration`— counted again from the start once the pointer and focus have
 * left it, and reports the close through `onOpenChange`.
 */
export function SpToast({ action, open, defaultOpen, onOpenChange, dashboardCell, ...props }: SpToastProps) {
  const [isOpen, set] = useOpen({ open, defaultOpen, onOpenChange });
  const ref = useRef<HTMLLIElement>(null);
  const duration = uiToastDuration(props.duration, useContext(ToasterDuration));
  useEffect(() => {
    const toast = ref.current;
    if (!toast || !isOpen || duration === Infinity) return;
    // A pause restarts the whole duration when it ends: no clock is read (Art. 4).
    let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => set(false), duration);
    const pause = () => {
      clearTimeout(timer);
      timer = undefined;
    };
    const resume = () => {
      if (timer !== undefined || toast.contains(toast.ownerDocument.activeElement)) return;
      timer = setTimeout(() => set(false), duration);
    };
    const on: [string, EventListener][] = [
      ['pointerenter', pause],
      ['focusin', pause],
      ['pointerleave', resume],
      ['focusout', resume],
    ];
    for (const [type, listener] of on) toast.addEventListener(type, listener);
    return () => {
      clearTimeout(timer);
      for (const [type, listener] of on) toast.removeEventListener(type, listener);
    };
  }, [isOpen, duration, set]);
  const view = uiToastView(props, useUi(props, dashboardCell), { open: isOpen }, { action: action != null });
  return renderUi(view, { root: { ref }, close: { onClick: () => set(false) }, slots: { action } }) as ReactElement;
}

/** `SpToaster`: the labelled region of its toasts (REQ-497); F8 moves focus to it. */
export function SpToaster({ children, dashboardCell, ...props }: SpToasterProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const f8 = (event: KeyboardEvent) => {
      const region = ref.current;
      if (event.key !== 'F8' || !region) return;
      // Focusable once asked, never in the server markup.
      region.setAttribute('tabindex', '-1');
      region.focus();
    };
    document.addEventListener('keydown', f8);
    return () => document.removeEventListener('keydown', f8);
  }, []);
  const view = uiToasterView(props, useUi(props, dashboardCell));
  return <ToasterDuration.Provider value={props.duration}>{renderUi(view, { root: { ref }, slots: { content: children } })}</ToasterDuration.Provider>;
}
