import type { ReactElement } from 'react';
import { resolveUi, uiTableView } from '@silverpoint/core/ui';
import type { SpTableProps } from '../../ui/table';
import { renderUi } from '../../ui/render';

export type { SpTableProps };

/** `SpTable` for React Server Components (REQ-104): the same markup; sorting needs the client entry. */
export function SpTable({ onSort: _onSort, dashboardCell, ...props }: SpTableProps) {
  return renderUi(uiTableView(props, resolveUi(props, { cell: dashboardCell?.config })), {}) as ReactElement;
}
