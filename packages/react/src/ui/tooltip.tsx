import { uiTooltipView, uiTriggerAria, type SpTooltipProps as CoreProps } from '@silverpoint/core/ui';
import { cloneElement, isValidElement, useEffect, useRef, type ReactElement } from 'react';
import { useUi, type UiCellProps } from './base';
import { useOpen, useOverlay, type OverlayOpenProps } from './overlay';
import { renderUi } from './render';

export interface SpTooltipProps extends CoreProps, OverlayOpenProps, UiCellProps {
  /** The element it describes, cloned with `aria-describedby`. */
  readonly trigger: ReactElement;
}

/** Time the pointer has to cross from the trigger onto the tooltip, ms (WCAG 1.4.13: hoverable). */
const GRACE = 100;

/**
 * `SpTooltip`: a `manual` popover over the element it describes (REQ-492, REQ-496): shown `delay` ms
 * after hover or keyboard focus, kept while the pointer is on the tooltip itself, hidden on blur,
 * pointer leave or Escape.
 */
export function SpTooltip({ trigger, open, defaultOpen, onOpenChange, dashboardCell, ...props }: SpTooltipProps) {
  const [isOpen, set] = useOpen({ open, defaultOpen, onOpenChange });
  const ref = useRef<HTMLDivElement>(null);
  useOverlay(ref, 'popover', isOpen, set, { place: { side: props.side ?? 'top', align: props.align ?? 'center', offset: props.offset } });
  const delay = props.delay ?? 300;
  useEffect(() => {
    const tooltip = ref.current;
    const target = tooltip?.previousElementSibling;
    if (!tooltip || !target) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const later = (next: boolean, ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => set(next), ms);
    };
    const now = (next: boolean) => {
      clearTimeout(timer);
      set(next);
    };
    const show = () => later(true, delay);
    const leave = () => later(false, GRACE);
    const stay = () => clearTimeout(timer);
    const hide = () => now(false);
    const escape = (event: Event) => (event as KeyboardEvent).key === 'Escape' && now(false);
    const on: [EventTarget, string, EventListener][] = [
      [target, 'pointerenter', show],
      [target, 'pointerleave', leave],
      [target, 'focus', show],
      [target, 'blur', hide],
      // Escape dismisses it wherever focus is, without moving the pointer (WCAG 1.4.13).
      [target.ownerDocument, 'keydown', escape],
      [tooltip, 'pointerenter', stay],
      [tooltip, 'pointerleave', leave],
    ];
    for (const [element, type, listener] of on) element.addEventListener(type, listener);
    return () => {
      clearTimeout(timer);
      for (const [element, type, listener] of on) element.removeEventListener(type, listener);
    };
  }, [delay, set]);
  const view = uiTooltipView(props, useUi(props, dashboardCell), { open: isOpen });
  const described = isValidElement(trigger) ? cloneElement(trigger as ReactElement<Record<string, unknown>>, uiTriggerAria('tooltip', props.id, isOpen)) : trigger;
  return (
    <>
      {described}
      {renderUi(view, { root: { ref } })}
    </>
  );
}
