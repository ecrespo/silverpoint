import { uiCardView, type SpCardProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement, ReactNode } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpCardProps extends CoreProps, UiCellProps {
  readonly children?: ReactNode;
  readonly extra?: ReactNode;
  readonly footer?: ReactNode;
}

/** `SpCard`: reads the provider; `@silverpoint/react/server/ui/card` renders it in a Server Component. */
export function SpCard({ children, extra, footer, dashboardCell, ...props }: SpCardProps) {
  const view = uiCardView(props, useUi(props, dashboardCell), { extra: extra != null, footer: footer != null });
  return renderUi(view, { slots: { content: children, extra, footer } }) as ReactElement;
}
