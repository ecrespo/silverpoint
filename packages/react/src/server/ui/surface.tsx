import type { ReactElement } from 'react';
import { resolveUi, uiSurfaceView } from '@silverpoint/core/ui';
import type { SpSurfaceProps } from '../../ui/surface';
import { renderUi } from '../../ui/render';

export type { SpSurfaceProps };

/** `SpSurface` for React Server Components (REQ-104): props and dashboard cell only, no provider. */
export function SpSurface({ children, dashboardCell, ...props }: SpSurfaceProps) {
  return renderUi(uiSurfaceView(props, resolveUi(props, { cell: dashboardCell?.config })), { slots: { content: children } }) as ReactElement;
}
