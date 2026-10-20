import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import type { Catalog } from '../catalog';

/** `get_version` (API delta §3, REQ-550): what the server describes and speaks. */
export function getVersion(catalog: Catalog) {
  return { version: catalog.version, reflex: catalog.data.reflex, protocol: LATEST_PROTOCOL_VERSION };
}
