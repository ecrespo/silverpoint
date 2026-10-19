import type { ReactElement } from 'react';
import { resolveUi, uiEmptyView } from '@silverpoint/core/ui';
import type { SpEmptyProps } from '../../ui/empty';
import { renderUi } from '../../ui/render';

export type { SpEmptyProps };

/** `SpEmpty` for React Server Components (REQ-104): props and dashboard cell only, no provider. */
export function SpEmpty({ extra, dashboardCell, ...props }: SpEmptyProps) {
  return renderUi(uiEmptyView(props, resolveUi(props, { cell: dashboardCell?.config }), { extra: extra != null }), { slots: { extra } }) as ReactElement;
}
