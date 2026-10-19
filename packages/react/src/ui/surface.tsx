import { uiSurfaceView, type SpSurfaceProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement, ReactNode } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpSurfaceProps extends CoreProps, UiCellProps {
  readonly children?: ReactNode;
}

/** `SpSurface`: the root contract on any element (`as`), with an optional frame and tone (REQ-472). `@silverpoint/react/server/ui/surface` renders it in a Server Component. */
export function SpSurface({ children, dashboardCell, ...props }: SpSurfaceProps) {
  return renderUi(uiSurfaceView(props, useUi(props, dashboardCell)), { slots: { content: children } }) as ReactElement;
}
