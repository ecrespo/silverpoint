import type { ReactElement } from 'react';
import { resolveUi, uiBadgeView } from '@silverpoint/core/ui';
import type { SpBadgeProps as ClientProps } from '../../ui/badge';
import { renderUi, textOf } from '../../ui/render';

/** Props and dashboard cell only: a Server Component reads no provider. */
export type SpBadgeProps = ClientProps;

/** `SpBadge` for React Server Components (REQ-104): no hook and no client boundary. */
export function SpBadge({ children, dashboardCell, ...props }: SpBadgeProps) {
  return renderUi(uiBadgeView(props, resolveUi(props, { cell: dashboardCell?.config }), { text: textOf(children) }), { slots: { content: children } }) as ReactElement;
}
