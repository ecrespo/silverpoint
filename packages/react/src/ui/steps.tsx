import { uiStepsView, type SpStepsProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpStepsProps extends CoreProps, UiCellProps {}

/** `SpSteps`: reads the provider; `@silverpoint/react/server/ui/steps` renders it in a Server Component. */
export function SpSteps({ dashboardCell, ...props }: SpStepsProps) {
  return renderUi(uiStepsView(props, useUi(props, dashboardCell)), {}) as ReactElement;
}
