/**
 * Holds the agent catalog to the code (REQ-535, REQ-536, REQ-556; I-37, I-39..I-41): the charts and
 * components the adapters export, the metadata every chart needs, the version, the Reflex pin.
 *
 *   pnpm --filter @silverpoint/agent-catalog check [--release]
 *
 * Regenerates the catalog and fails when the committed one differs, or when a rule below breaks.
 * `--release` also fails on a Reflex catalog that wraps another silverpoint version.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AgentCatalog } from '../../packages/mcp/src/types';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const json = <T>(file: string): T => JSON.parse(readFileSync(join(ROOT, file), 'utf8')) as T;

/** Chart and UI subpaths an npm adapter exports (`./<slug>`, `./ui/<slug>`). */
function npmExports(adapter: 'react' | 'vue'): { charts: Set<string>; ui: Set<string> } {
  const keys = Object.keys(json<{ exports: Record<string, unknown> }>(`packages/${adapter}/package.json`).exports);
  const NOT_CHARTS = new Set(['dashboard', 'dashboard-link', 'ui', 'timeline', 'package.json']);
  return {
    charts: new Set(keys.map((k) => k.match(/^\.\/([a-z-]+)$/)?.[1]).filter((s): s is string => !!s && !NOT_CHARTS.has(s))),
    ui: new Set(keys.map((k) => k.match(/^\.\/ui\/([a-z-]+)$/)?.[1]).filter((s): s is string => !!s)),
  };
}

/** Angular secondary entry points: chart directories and `ui/<slug>` directories. */
function angularEntries(): { charts: Set<string>; ui: Set<string> } {
  const root = join(ROOT, 'packages/angular');
  const entries = (dir: string) => readdirSync(dir).filter((name) => existsSync(join(dir, name, 'ng-package.json')));
  const NOT_CHARTS = new Set(['dashboard', 'env', 'timeline', 'ui']);
  const NOT_UI = new Set(['base', 'overlay']);
  return {
    charts: new Set(entries(root).filter((name) => !NOT_CHARTS.has(name))),
    ui: new Set(entries(join(root, 'ui')).filter((name) => !NOT_UI.has(name))),
  };
}

export interface CheckResult {
  readonly errors: string[];
  readonly warnings: string[];
}

/** The pin is interim (T-231) while it is derived here rather than exported by the Reflex package (DD-049). */
export const isInterim = (reflex: { readonly derived?: string }): boolean => reflex.derived !== undefined;

/**
 * `release` refuses a stale Reflex catalog (REQ-556), but only once the pin is the Reflex package's
 * own export (`interim: false`): the interim pin, derived here, can only warn (user decision
 * 2026-10-21, the strict check starts with the wrapper's next version).
 */
export function checkCatalog(catalog: AgentCatalog, { release, interim }: { readonly release: boolean; readonly interim: boolean }): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const charts = new Set(catalog.charts.map((c) => c.slug));
  const components = new Set(catalog.components.map((c) => c.slug));

  // I-37: every chart and component an adapter exports has an entry, and every entry is exported.
  const exported = { react: npmExports('react'), vue: npmExports('vue'), angular: angularEntries() };
  for (const [adapter, found] of Object.entries(exported)) {
    for (const slug of found.charts) if (!charts.has(slug)) errors.push(`REQ-536 · @silverpoint/${adapter} exports the chart ${slug}, which the catalog lacks`);
    for (const slug of charts) if (!found.charts.has(slug)) errors.push(`REQ-536 · the catalog names the chart ${slug}, which @silverpoint/${adapter} does not export`);
    for (const slug of found.ui) if (!components.has(slug)) errors.push(`REQ-536 · @silverpoint/${adapter} exports the component ${slug}, which the catalog lacks`);
    for (const slug of components) if (!found.ui.has(slug)) errors.push(`REQ-536 · the catalog names the component ${slug}, which @silverpoint/${adapter} does not export`);
  }

  // REQ-536: what an agent needs to choose a chart; I-41: the fields name the chart's own accessors.
  for (const c of catalog.charts) {
    if (!c.family) errors.push(`REQ-536 · ${c.slug} has no family`);
    if (!c.summary) errors.push(`REQ-536 · ${c.slug} has no summary`);
    if (!c.data.shape) errors.push(`REQ-536 · ${c.slug} has no data shape`);
    if (c.intents.length === 0) errors.push(`REQ-536 · ${c.slug} has no intent`);
    for (const field of c.data.fields) {
      if (!c.props.some((p) => p.name === field.prop)) errors.push(`I-41 · ${c.slug}: the field ${field.role} names ${field.prop}, which is not one of its props`);
    }
  }

  // I-42: the recommender names charts that exist.
  for (const rule of catalog.recommend) {
    for (const { slug } of [...rule.charts, ...(rule.adjust ?? [])]) {
      if (!charts.has(slug)) errors.push(`I-42 · the rule ${rule.shape}/${rule.intent} names ${slug}, which is not a chart`);
    }
  }

  // REQ-531, REQ-532: a name in every framework.
  for (const e of [...catalog.charts, ...catalog.components, catalog.dashboard, catalog.timeline]) {
    for (const [framework, name] of Object.entries(e.names)) if (!name) errors.push(`REQ-531 · ${'slug' in e ? e.slug : 'an entry'} has no ${framework} name`);
  }

  // I-39: the catalog describes the core it ships with, and the server ships it.
  const core = json<{ version: string }>('packages/core/package.json').version;
  if (catalog.version !== core) errors.push(`I-39 · the catalog describes ${catalog.version}, the core is ${core}`);
  if (existsSync(join(ROOT, 'packages/mcp/package.json'))) {
    const mcp = json<{ version: string }>('packages/mcp/package.json').version;
    if (mcp !== catalog.version) errors.push(`I-39 · @silverpoint/mcp is ${mcp}, its catalog describes ${catalog.version}`);
  }

  // I-40, REQ-556: a stale Reflex catalog is reported; a release refuses it.
  if (catalog.reflex.stale !== (catalog.reflex.wraps !== catalog.version)) errors.push('I-40 · reflex.stale does not match reflex.wraps');
  if (release && catalog.reflex.stale) {
    const message = `REQ-556 · reflex-silverpoint-react ${catalog.reflex.version} wraps silverpoint ${catalog.reflex.wraps}, not ${catalog.version}`;
    if (interim) warnings.push(`${message}; the pin is interim, so the release goes ahead with every Reflex entry marked stale`);
    else errors.push(`${message}: pin a Reflex catalog that wraps it`);
  }

  // The stylesheets resolve to files the packages export.
  for (const sheet of [...catalog.stylesheets.always, ...catalog.stylesheets.ui, ...catalog.stylesheets.timeline]) {
    const match = sheet.match(/^@silverpoint\/([a-z]+)\/(.+)$/);
    if (match && !Object.keys(json<{ exports: Record<string, unknown> }>(`packages/${match[1]}/package.json`).exports).includes(`./${match[2]}`)) {
      errors.push(`REQ-533 · ${sheet} is not exported by @silverpoint/${match[1]}`);
    }
  }
  return { errors, warnings };
}

async function main(): Promise<void> {
  const { buildAgentCatalog, CATALOG_FILE, REFLEX_FILE, serialise } = await import('./catalog');
  const catalog = await buildAgentCatalog();
  const pin = JSON.parse(readFileSync(REFLEX_FILE, 'utf8')) as { derived?: string };
  const { errors, warnings } = checkCatalog(catalog, { release: process.argv.includes('--release'), interim: isInterim(pin) });
  for (const warning of warnings) console.warn(warning);
  if (!existsSync(CATALOG_FILE) || readFileSync(CATALOG_FILE, 'utf8') !== serialise(catalog)) {
    errors.unshift('REQ-535 · packages/mcp/agent-catalog.json is not current: run `pnpm --filter @silverpoint/agent-catalog generate`');
  }
  const { ASSETS_FILE, assetsSource } = await import('./assets');
  if (!existsSync(ASSETS_FILE) || readFileSync(ASSETS_FILE, 'utf8') !== assetsSource()) {
    errors.unshift('DD-047 · packages/mcp/src/assets.generated.ts is not current: run `pnpm --filter @silverpoint/agent-catalog generate`');
  }
  const { GUIDES_FILE, guidesSource, MARKETPLACE_FILE, marketplaceManifest, PLUGIN_FILE, pluginManifest, SKILL_DIR, skillFiles } = await import('./skill');
  for (const [file, manifest] of [
    [PLUGIN_FILE, pluginManifest],
    [MARKETPLACE_FILE, marketplaceManifest],
  ] as const) {
    const source = readFileSync(file, 'utf8');
    if (manifest(source, catalog.version) !== source) errors.unshift(`REQ-555 · ${file.slice(ROOT.length)} is not at ${catalog.version}: run \`pnpm --filter @silverpoint/agent-catalog generate\``);
  }
  const skill = skillFiles(catalog);
  for (const [path, content] of skill) {
    const file = join(SKILL_DIR, path);
    if (!existsSync(file) || readFileSync(file, 'utf8') !== content) errors.unshift(`DD-050 · skills/silverpoint/${path} is not current: run \`pnpm --filter @silverpoint/agent-catalog generate\``);
  }
  const references = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? references(join(dir, e.name)) : [join(dir, e.name).slice(SKILL_DIR.length + 1)]));
  for (const path of existsSync(join(SKILL_DIR, 'references')) ? references(join(SKILL_DIR, 'references')) : []) {
    if (!skill.has(path)) errors.unshift(`DD-050 · skills/silverpoint/${path} is not generated any more: run \`pnpm --filter @silverpoint/agent-catalog generate\``);
  }
  if (!existsSync(GUIDES_FILE) || readFileSync(GUIDES_FILE, 'utf8') !== guidesSource(skill)) {
    errors.unshift('API delta §4 · packages/mcp/src/guides.generated.ts is not current: run `pnpm --filter @silverpoint/agent-catalog generate`');
  }
  const { DOCS_TOOLS_FILE, README_FILE, toolList, toolsJson, withTools } = await import('./agent-tools');
  const tools = await toolList();
  const readme = readFileSync(README_FILE, 'utf8');
  if (withTools(readme, tools) !== readme) errors.unshift('REQ-569 · packages/mcp/README.md does not list the server’s tools: run `pnpm --filter @silverpoint/agent-catalog generate`');
  if (!existsSync(DOCS_TOOLS_FILE) || readFileSync(DOCS_TOOLS_FILE, 'utf8') !== toolsJson(tools)) {
    errors.unshift('REQ-569 · docs/site/generated/agent-tools.json is not the server’s tool list: run `pnpm --filter @silverpoint/agent-catalog generate`');
  }
  if (catalog.reflex.stale) console.warn(`reflex-silverpoint-react ${catalog.reflex.version} wraps ${catalog.reflex.wraps}; every Reflex entry is marked stale (REQ-556)`);
  for (const error of errors) console.error(error);
  if (errors.length > 0) process.exit(1);
  console.log(`agent catalog ${catalog.version}: ${catalog.charts.length} charts, ${catalog.components.length} components, current`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
