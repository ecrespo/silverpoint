import type { LinkState } from '@silverpoint/core';
import { createContext } from 'react';

/** A linked dashboard's one reactive value, and how a chart sets it (TD DD-016, REQ-216). */
export interface DashboardLinkValue {
  readonly key: string;
  readonly state: LinkState | null;
  set(next: LinkState | null): void;
}

export const DashboardLinkContext = createContext<DashboardLinkValue | null>(null);
