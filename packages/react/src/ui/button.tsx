import { uiButtonView, type SpButtonProps as CoreProps } from '@silverpoint/core/ui';
import { forwardRef, type MouseEvent, type PointerEvent, type ReactNode, type ReactElement } from 'react';
import { textOf, useUi, type UiCellProps } from './base';
import { renderUi } from './render';

/**
 * What an overlay clones onto its trigger (`uiTriggerAria`, `useTrigger`; REQ-500): `SpButton`
 * forwards these to its root and nothing else, so its attributes stay the core's (delta-014, Art. 3).
 */
export interface SpButtonTriggerProps {
  readonly 'aria-haspopup'?: string;
  readonly 'aria-expanded'?: string;
  readonly 'aria-controls'?: string;
  readonly 'aria-describedby'?: string;
  readonly onPointerDown?: (event: PointerEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
}

export interface SpButtonProps extends CoreProps, UiCellProps, SpButtonTriggerProps {
  readonly children?: ReactNode;
  readonly onClick?: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
}

/** `SpButton` (API delta §2): a native `<button>`, or `<a>` with `href`; its ref is that element. */
export const SpButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, SpButtonProps>(function SpButton(
  {
    children,
    onClick,
    dashboardCell,
    'aria-haspopup': haspopup,
    'aria-expanded': expanded,
    'aria-controls': controls,
    'aria-describedby': describedby,
    onPointerDown,
    ...props
  },
  ref,
) {
  const view = uiButtonView(props, useUi(props, dashboardCell), { text: textOf(children) });
  // A disabled link is an `<a>` without `href`, which still takes clicks: it emits none (REQ-326).
  const click = onClick && ((event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => (props.disabled ? event.preventDefault() : onClick(event)));
  const trigger = {
    'aria-haspopup': haspopup,
    'aria-expanded': expanded,
    'aria-controls': controls,
    'aria-describedby': describedby,
    onPointerDown,
  };
  return renderUi(view, { root: { ref, onClick: click, ...trigger }, slots: { content: children } }) as ReactElement;
});
