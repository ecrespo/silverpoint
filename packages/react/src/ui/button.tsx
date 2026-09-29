import { uiButtonView, type SpButtonProps as CoreProps } from '@silverpoint/core/ui';
import { forwardRef, type MouseEvent, type ReactNode, type ReactElement } from 'react';
import { textOf, useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpButtonProps extends CoreProps, UiCellProps {
  readonly children?: ReactNode;
  readonly onClick?: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
}

/** `SpButton` (API delta §2): a native `<button>`, or `<a>` with `href`; its ref is that element. */
export const SpButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, SpButtonProps>(function SpButton(
  { children, onClick, dashboardCell, ...props },
  ref,
) {
  const view = uiButtonView(props, useUi(props, dashboardCell), { text: textOf(children) });
  // A disabled link is an `<a>` without `href`, which still takes clicks: it emits none (REQ-326).
  const click = onClick && ((event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => (props.disabled ? event.preventDefault() : onClick(event)));
  return renderUi(view, { root: { ref, onClick: click }, slots: { content: children } }) as ReactElement;
});
