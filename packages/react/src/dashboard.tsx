import type { DashboardProps } from '@silverpoint/core';
import type { ReactNode } from 'react';
import { DashboardCell, DashboardMarkup, type DashboardCellProps } from './dashboard-markup';

export { DashboardCell, type DashboardCellProps };
export type { DashboardLayout, DashboardCellLayout, DashboardLink } from '@silverpoint/core';

export type ClientDashboardProps = DashboardProps & { readonly children?: ReactNode };

/**
 * `Dashboard` (REQ-200): a declarative grid of cards, laid out in the core from a data-only
 * layout (API Spec §7.1). No `"use client"` of its own (REQ-104): it renders in a Server Component
 * as well as on the client, and its charts are the client components the consumer passes in.
 */
export function Dashboard(props: ClientDashboardProps) {
  return <DashboardMarkup {...props} />;
}
