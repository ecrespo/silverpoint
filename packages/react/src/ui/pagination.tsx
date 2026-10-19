import { uiPaginationView, type SpPaginationProps as CoreProps, type UiElement } from '@silverpoint/core/ui';
import type { ReactElement } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpPaginationProps extends CoreProps, UiCellProps {
  /** The controlled page, 1-based. */
  readonly current?: number;
  /** Default `1`. */
  readonly defaultCurrent?: number;
  /** The page the user chose, not the event (REQ-322). */
  readonly onChange?: (current: number) => void;
}

/** `SpPagination`: a labelled nav of page buttons; the current page is heightened (REQ-476). */
export function SpPagination({ current, defaultCurrent, onChange, dashboardCell, ...props }: SpPaginationProps) {
  const [page, set] = useValue(current, defaultCurrent ?? 1, onChange);
  const view = uiPaginationView(props, useUi(props, dashboardCell), { current: page });
  const bound = { page: (node: UiElement) => ({ onClick: () => set(Number(node.attrs['data-page'])) }) };
  return renderUi(view, { bound }) as ReactElement;
}
