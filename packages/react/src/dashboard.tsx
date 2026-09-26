import type { DashboardProps } from '@silverpoint/core';
// A package self-reference, kept external: the link keeps its own "use client" boundary (REQ-104).
import { DashboardLink } from '@silverpoint/react/dashboard-link';
import type { ReactNode } from 'react';
import { DashboardCell, DashboardMarkup, type DashboardCellProps } from './dashboard-markup';

export { DashboardCell, type DashboardCellProps };
export type { DashboardLayout, DashboardCellLayout, DashboardLink } from '@silverpoint/core';

export type ClientDashboardProps = DashboardProps & {
  readonly children?: ReactNode;
  /** The linked value changed; `null` when the source cleared (API Spec §9, REQ-216). */
  readonly onLinkChange?: (link: { key: string; value: unknown } | null) => void;
};

/**
 * `Dashboard` (REQ-200): a declarative grid of cards, laid out in the core from a data-only
 * layout (API Spec §7.1). No `"use client"` of its own (REQ-104): it renders in a Server Component
 * as well as on the client, and its charts are the client components the consumer passes in.
 */
export function Dashboard({ onLinkChange, ...props }: ClientDashboardProps) {
  const { link } = props;
  // Only a linked dashboard crosses into client code: the boundary is the link, not the grid.
  const wrapGrid = link
    ? (grid: ReactNode) => (
        <DashboardLink link={link} onLinkChange={onLinkChange}>
          {grid}
        </DashboardLink>
      )
    : undefined;
  return <DashboardMarkup {...props} wrapGrid={wrapGrid} />;
}
