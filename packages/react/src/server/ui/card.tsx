import type { ReactElement } from 'react';
import { resolveUi, uiCardView } from '@silverpoint/core/ui';
import type { SpCardProps } from '../../ui/card';
import { renderUi } from '../../ui/render';

export type { SpCardProps };

/**
 * `SpCard` for React Server Components (REQ-104): no hook and no client boundary. A Server
 * Component reads no context, so ground, substrate and mode come from its props or its dashboard cell.
 */
export function SpCard({ children, extra, footer, dashboardCell, ...props }: SpCardProps) {
  const view = uiCardView(props, resolveUi(props, { cell: dashboardCell?.config }), { extra: extra != null, footer: footer != null });
  return renderUi(view, { slots: { content: children, extra, footer } }) as ReactElement;
}
