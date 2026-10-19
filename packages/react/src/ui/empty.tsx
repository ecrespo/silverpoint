import { uiEmptyView, type SpEmptyProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement, ReactNode } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpEmptyProps extends CoreProps, UiCellProps {
  /** Actions under the description. */
  readonly extra?: ReactNode;
}

/** `SpEmpty`: a toned tray and a description; `extra` holds actions (REQ-483). `@silverpoint/react/server/ui/empty` renders it in a Server Component. */
export function SpEmpty({ extra, dashboardCell, ...props }: SpEmptyProps) {
  return renderUi(uiEmptyView(props, useUi(props, dashboardCell), { extra: extra != null }), { slots: { extra } }) as ReactElement;
}
