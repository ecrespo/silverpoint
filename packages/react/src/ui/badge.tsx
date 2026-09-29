import { uiBadgeView, type SpBadgeProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement, ReactNode } from 'react';
import { textOf, useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpBadgeProps extends CoreProps, UiCellProps {
  readonly children?: ReactNode;
}

/** `SpBadge`: its count is text, in the accessible name (REQ-318). */
export function SpBadge({ children, dashboardCell, ...props }: SpBadgeProps) {
  return renderUi(uiBadgeView(props, useUi(props, dashboardCell), { text: textOf(children) }), { slots: { content: children } }) as ReactElement;
}
