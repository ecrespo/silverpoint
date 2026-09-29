import type { ReactElement } from 'react';
import { resolveUi, uiDividerView } from '@silverpoint/core/ui';
import type { SpDividerProps } from '../../ui/divider';
import { renderUi } from '../../ui/render';

export type { SpDividerProps };

/** `SpDivider` for React Server Components (REQ-104): props and dashboard cell only. */
export function SpDivider({ dashboardCell, ...props }: SpDividerProps) {
  return renderUi(uiDividerView(props, resolveUi(props, { cell: dashboardCell?.config })), {}) as ReactElement;
}
