import type { ReactElement } from 'react';
import { resolveUi, uiProgressView } from '@silverpoint/core/ui';
import type { SpProgressProps as ClientProps } from '../../ui/progress';
import { renderUi } from '../../ui/render';

/** Props and dashboard cell only: a Server Component reads no provider. */
export type SpProgressProps = ClientProps;

/** `SpProgress` for React Server Components (REQ-104): no hook and no client boundary. */
export function SpProgress({ dashboardCell, ...props }: SpProgressProps) {
  return renderUi(uiProgressView(props, resolveUi(props, { cell: dashboardCell?.config })), {}) as ReactElement;
}
