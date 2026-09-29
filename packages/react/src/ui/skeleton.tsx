import { uiSkeletonView, type SpSkeletonProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpSkeletonProps extends CoreProps, UiCellProps {}

/** `SpSkeleton`: `aria-busy`, a hidden label, hidden toned shapes (REQ-318). */
export function SpSkeleton({ dashboardCell, ...props }: SpSkeletonProps) {
  return renderUi(uiSkeletonView(props, useUi(props, dashboardCell)), {}) as ReactElement;
}
