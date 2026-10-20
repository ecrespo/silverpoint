/**
 * Writes `packages/mcp/agent-catalog.json` (DD-045). Run after changing the public types, the
 * catalogs, a demo, the metadata files, the Reflex pin, the grounds' stylesheet or the face:
 *   pnpm --filter @silverpoint/agent-catalog generate
 */
import { writeFileSync } from 'node:fs';
import { ASSETS_FILE, assetsSource } from './assets';
import { buildAgentCatalog, CATALOG_FILE, serialise } from './catalog';

const catalog = await buildAgentCatalog();
writeFileSync(CATALOG_FILE, serialise(catalog));
console.log(`wrote packages/mcp/agent-catalog.json (${catalog.version}: ${catalog.charts.length} charts, ${catalog.components.length} components)`);
writeFileSync(ASSETS_FILE, assetsSource());
console.log('wrote packages/mcp/src/assets.generated.ts');
