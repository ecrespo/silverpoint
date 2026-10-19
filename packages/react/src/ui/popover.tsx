import { uiPopoverView, type SpPopoverProps as CoreProps } from '@silverpoint/core/ui';
import { useRef, type ReactElement, type ReactNode } from 'react';
import { useUi, type UiCellProps } from './base';
import { useOpen, useOverlay, useTrigger, type OverlayOpenProps } from './overlay';
import { renderUi } from './render';

export interface SpPopoverProps extends CoreProps, OverlayOpenProps, UiCellProps {
  /** The element that opens it, cloned with `aria-haspopup`, `aria-expanded` and `aria-controls`; the popover hangs from it. */
  readonly trigger?: ReactElement;
  readonly children?: ReactNode;
}

/** `SpPopover`: an `auto` popover with the dialog role, placed by `uiAnchor` on open (REQ-492, REQ-493). */
export function SpPopover({ trigger, children, open, defaultOpen, onOpenChange, dashboardCell, ...props }: SpPopoverProps) {
  const [isOpen, set, latest] = useOpen({ open, defaultOpen, onOpenChange });
  const ref = useRef<HTMLDivElement>(null);
  useOverlay(ref, 'popover', isOpen, set, { place: { side: props.side ?? 'bottom', align: props.align ?? 'center', offset: props.offset } });
  const view = uiPopoverView(props, useUi(props, dashboardCell), { open: isOpen });
  const popover = renderUi(view, { root: { ref }, close: { onClick: () => set(false) }, slots: { content: children } });
  return (
    <>
      {useTrigger(trigger, 'popover', props.id, latest, set)}
      {popover}
    </>
  );
}
