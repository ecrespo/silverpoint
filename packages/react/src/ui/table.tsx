import { uiTableView, type SpTableProps as CoreProps, type UiElement } from '@silverpoint/core/ui';
import type { ReactElement } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpTableProps extends CoreProps, UiCellProps {
  /** A sortable header was activated: its column's key. The consumer sorts (`uiSortRows`) and sets `sortKey` / `sortOrder`. */
  readonly onSort?: (key: string) => void;
}

/** `SpTable`: a native table; sortable headers report their key (REQ-473, REQ-474). `@silverpoint/react/server/ui/table` renders it in a Server Component. */
export function SpTable({ onSort, dashboardCell, ...props }: SpTableProps) {
  const sort = (node: UiElement) => ({ onClick: () => onSort?.(node.attrs['data-key'] as string) });
  return renderUi(uiTableView(props, useUi(props, dashboardCell)), { bound: { sort } }) as ReactElement;
}
