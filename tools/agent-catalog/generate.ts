/**
 * Writes `packages/mcp/agent-catalog.json` (DD-045). Run after changing the public types, the
 * catalogs, a demo, the metadata files or the Reflex pin:
 *   pnpm --filter @silverpoint/agent-catalog generate
 */
import { writeFileSync } from 'node:fs';
import { buildAgentCatalog, CATALOG_FILE, serialise } from './catalog';

const catalog = await buildAgentCatalog();
writeFileSync(CATALOG_FILE, serialise(catalog));
console.log(`wrote packages/mcp/agent-catalog.json (${catalog.version}: ${catalog.charts.length} charts, ${catalog.components.length} components)`);
