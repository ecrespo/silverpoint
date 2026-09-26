import type { DashboardLink as Link, LinkState } from '@silverpoint/core';
import { useMemo, useState, type ReactNode } from 'react';
import { DashboardLinkContext } from './link-context';

export interface DashboardLinkProps {
  readonly link: Link;
  /** The linked value changed; `null` when the source cleared (API Spec §9, REQ-218). */
  readonly onLinkChange?: (link: { key: string; value: unknown } | null) => void;
  readonly children?: ReactNode;
}

/**
 * The client boundary of a linked dashboard (REQ-104, REQ-219): the one linked value its charts
 * share. The dashboard renders it only when `link` is given; it adds no element of its own.
 */
export function DashboardLink({ link, onLinkChange, children }: DashboardLinkProps) {
  const [state, setState] = useState<LinkState | null>(null);
  const value = useMemo(
    () => ({
      key: link.key,
      state,
      set(next: LinkState | null) {
        setState(next);
        onLinkChange?.(next && { key: next.key, value: next.value });
      },
    }),
    [link.key, state, onLinkChange],
  );
  return <DashboardLinkContext.Provider value={value}>{children}</DashboardLinkContext.Provider>;
}
