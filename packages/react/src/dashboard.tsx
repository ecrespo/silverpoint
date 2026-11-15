import type { DashboardProps } from '@silverpoint/core';
// A package self-reference, kept external: the link keeps its own "use client" boundary (REQ-104).
import { DashboardRoot } from '@silverpoint/react/dashboard-link';
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
 * as well as on the client, and its charts are the client components the consumer passes in. Its
 * `section` is a client component that reads the provider; `server/dashboard` reads none.
 */
export function Dashboard({ onLinkChange, ...props }: ClientDashboardProps) {
  // What crosses into client code is the root: it reads the provider's ground, substrate and palette
  // (#17) and, for a linked dashboard, holds the linked value (REQ-219).
  return <DashboardMarkup {...props} root={(root) => <DashboardRoot {...root} link={props.link} onLinkChange={onLinkChange} />} />;
}
