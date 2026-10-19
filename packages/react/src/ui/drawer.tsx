import { uiDrawerView, type SpDrawerProps as CoreProps } from '@silverpoint/core/ui';
import { forwardRef, useImperativeHandle, useRef, type ReactElement, type ReactNode } from 'react';
import { useUi, type UiCellProps } from './base';
import { useOpen, useOverlay, useTrigger, type OverlayOpenProps } from './overlay';
import { renderUi } from './render';

export interface SpDrawerProps extends CoreProps, OverlayOpenProps, UiCellProps {
  /** The element that opens it, cloned with `aria-haspopup`, `aria-expanded` and `aria-controls`. */
  readonly trigger?: ReactElement;
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
}

/** `SpDrawer`: the Modal's dialog on a logical side; `modal: false` opens it with `show()` (REQ-491). */
export const SpDrawer = forwardRef<HTMLDialogElement, SpDrawerProps>(function SpDrawer({ trigger, children, footer, open, defaultOpen, onOpenChange, dashboardCell, ...props }, forwarded) {
  const [isOpen, set, latest] = useOpen({ open, defaultOpen, onOpenChange });
  const ref = useRef<HTMLDialogElement>(null);
  useImperativeHandle(forwarded, () => ref.current!, []);
  useOverlay(ref, props.modal === false ? 'dialog' : 'modal', isOpen, set, { dismissible: props.dismissible });
  const view = uiDrawerView(props, useUi(props, dashboardCell), { open: isOpen }, { footer: footer != null });
  const dialog = renderUi(view, { root: { ref }, close: { onClick: () => set(false) }, slots: { content: children, footer } });
  return (
    <>
      {useTrigger(trigger, 'dialog', props.id, latest, set)}
      {dialog}
    </>
  );
});
