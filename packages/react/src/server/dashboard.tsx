import type { DashboardProps } from '@silverpoint/core';
import type { ReactNode } from 'react';
import { DashboardCell, DashboardMarkup, type DashboardCellProps } from '../dashboard-markup';

export { DashboardCell, type DashboardCellProps };
export type { DashboardLayout, DashboardCellLayout } from '@silverpoint/core';

/** A server dashboard has no linked interaction: linked state lives on the client only (REQ-219). */
export type ServerDashboardProps = DashboardProps & { readonly link?: never; readonly children?: ReactNode };

/** `Dashboard` for React Server Components and static rendering: no client JavaScript (API Spec §7.1). */
export function Dashboard(props: ServerDashboardProps) {
  return <DashboardMarkup {...props} />;
}
