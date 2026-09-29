import { uiTagView, type SpTagProps as CoreProps } from '@silverpoint/core/ui';
import type { MouseEvent, ReactElement, ReactNode } from 'react';
import { textOf, useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpTagProps extends CoreProps, UiCellProps {
  readonly children?: ReactNode;
  /** From the close button of a closable tag. */
  readonly onClose?: (event: MouseEvent<HTMLButtonElement>) => void;
}

/** `SpTag`: framed and toned; closable, a native close button (REQ-308). */
export function SpTag({ children, onClose, dashboardCell, ...props }: SpTagProps) {
  const view = uiTagView(props, useUi(props, dashboardCell), { text: textOf(children) });
  return renderUi(view, { close: { onClick: onClose }, slots: { content: children } }) as ReactElement;
}
