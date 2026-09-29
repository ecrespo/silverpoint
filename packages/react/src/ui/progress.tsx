import { uiProgressView, type SpProgressProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpProgressProps extends CoreProps, UiCellProps {}

/** `SpProgress`: a `progressbar`; without `value`, indeterminate (REQ-318). */
export function SpProgress({ dashboardCell, ...props }: SpProgressProps) {
  return renderUi(uiProgressView(props, useUi(props, dashboardCell)), {}) as ReactElement;
}
