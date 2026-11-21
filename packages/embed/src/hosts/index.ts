/**
 * `@silverpoint/embed/hosts` (API delta §15): the host catalog, `specFromTable` and
 * `hostCatalogFollows`. DOM-free.
 */
import catalog from './host-catalog.json' with { type: 'json' };
import type { HostCatalog } from './types';

export type { Binding, HostCatalog, HostChart, HostEntry, HostOption, HostRole, Table, TableBinding } from './types';
export { specFromTable } from './spec-from-table';
export { hostCatalogFollows } from './follows';

/** The host catalog this version publishes (REQ-653..REQ-655). */
export const HOST_CATALOG: HostCatalog = catalog as HostCatalog;
