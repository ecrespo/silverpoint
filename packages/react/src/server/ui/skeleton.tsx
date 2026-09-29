import type { ReactElement } from 'react';
import { resolveUi, uiSkeletonView } from '@silverpoint/core/ui';
import type { SpSkeletonProps as ClientProps } from '../../ui/skeleton';
import { renderUi } from '../../ui/render';

/** Props and dashboard cell only: a Server Component reads no provider. */
export type SpSkeletonProps = ClientProps;

/** `SpSkeleton` for React Server Components (REQ-104): no hook and no client boundary. */
export function SpSkeleton({ dashboardCell, ...props }: SpSkeletonProps) {
  return renderUi(uiSkeletonView(props, resolveUi(props, { cell: dashboardCell?.config })), {}) as ReactElement;
}
