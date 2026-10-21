/**
 * Writes `packages/mcp/agent-catalog.json` (DD-045). Run after changing the public types, the
 * catalogs, a demo, the metadata files, the Reflex pin, the grounds' stylesheet, the face or a
 * template of the `silverpoint` skill:
 *   pnpm --filter @silverpoint/agent-catalog generate
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ASSETS_FILE, assetsSource } from './assets';
import { DOCS_TOOLS_FILE, README_FILE, toolList, toolsJson, withTools } from './agent-tools';
import { buildAgentCatalog, CATALOG_FILE, serialise } from './catalog';
import { GUIDES_FILE, guidesSource, MARKETPLACE_FILE, marketplaceManifest, PLUGIN_FILE, pluginManifest, SKILL_DIR, skillFiles } from './skill';

const catalog = await buildAgentCatalog();
writeFileSync(CATALOG_FILE, serialise(catalog));
console.log(`wrote packages/mcp/agent-catalog.json (${catalog.version}: ${catalog.charts.length} charts, ${catalog.components.length} components)`);
writeFileSync(ASSETS_FILE, assetsSource());
console.log('wrote packages/mcp/src/assets.generated.ts');

const skill = skillFiles(catalog);
// The generated files only: a reference the catalog no longer has must go, the templates stay.
rmSync(join(SKILL_DIR, 'references'), { recursive: true, force: true });
for (const [path, content] of skill) {
  mkdirSync(dirname(join(SKILL_DIR, path)), { recursive: true });
  writeFileSync(join(SKILL_DIR, path), content);
}
console.log(`wrote skills/silverpoint (${skill.size} files)`);
writeFileSync(GUIDES_FILE, guidesSource(skill));
console.log('wrote packages/mcp/src/guides.generated.ts');
writeFileSync(PLUGIN_FILE, pluginManifest(readFileSync(PLUGIN_FILE, 'utf8'), catalog.version));
writeFileSync(MARKETPLACE_FILE, marketplaceManifest(readFileSync(MARKETPLACE_FILE, 'utf8'), catalog.version));
console.log(`wrote .claude-plugin (${catalog.version})`);
const tools = await toolList();
writeFileSync(README_FILE, withTools(readFileSync(README_FILE, 'utf8'), tools));
writeFileSync(DOCS_TOOLS_FILE, toolsJson(tools));
console.log(`wrote the tool list (${tools.length} tools) into packages/mcp/README.md and docs/site/generated/agent-tools.json`);
