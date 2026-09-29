import { uiAlertView, type SpAlertProps as CoreProps } from '@silverpoint/core/ui';
import type { MouseEvent, ReactElement, ReactNode } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpAlertProps extends CoreProps, UiCellProps {
  readonly children?: ReactNode;
  /** From the close button of a closable alert. */
  readonly onClose?: (event: MouseEvent<HTMLButtonElement>) => void;
}

/** `SpAlert`: `alert` or `status` by kind (REQ-318); closable, a native close button. */
export function SpAlert({ children, onClose, dashboardCell, ...props }: SpAlertProps) {
  const view = uiAlertView(props, useUi(props, dashboardCell), { closable: props.closable === true });
  return renderUi(view, { close: { onClick: onClose }, slots: { content: children } }) as ReactElement;
}
