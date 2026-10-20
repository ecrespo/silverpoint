/**
 * The agent catalog (feature-005, DD-045): composes the props reference, the chart catalog,
 * `UI_COMPONENTS`, the adapters' surfaces, the demos, the diagnostics, the palettes, the grounds,
 * the metadata files and the pinned Reflex catalog into one document. Output is sorted and stable
 * (Art. 4); `generate.ts` writes it, `check.ts` holds it to the adapters.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { cyanotype, silverpoint } from '../../packages/grounds/src/index';
import { PALETTE_NAMES, PALETTES } from '../../packages/core/src/palettes';
import { UI_COMPONENTS } from '../../packages/core/src/ui/catalog';
import { UI_DEMOS } from '../../packages/core/src/ui/demo';
import type {
  AgentCatalog,
  ChartEntry,
  ComponentEntry,
  Diagnostic,
  Imports,
  Names,
  PropEntry,
  ReflexCatalog,
  ReflexProp,
} from '../../packages/mcp/src/types';
import { CATALOG } from '../visual-gate/catalog';
import { componentSurfaces } from './adapters';
import { CHART_META, FAMILIES } from './charts.meta';
import { COMPONENT_SUMMARY } from './components.meta';
import { chartFallbacks, docDefault, specDefaults } from './defaults';
import { propsReference, type PropDoc } from './props';
import { RECOMMEND_RULES } from './recommend.rules';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const CATALOG_FILE = join(ROOT, 'packages/mcp/agent-catalog.json');
export const REFLEX_FILE = join(ROOT, 'tools/agent-catalog/reflex/reflex-catalog.json');

const json = <T>(file: string): T => JSON.parse(readFileSync(join(ROOT, file), 'utf8')) as T;
const constantCase = (slug: string) => slug.toUpperCase().replace(/-/g, '_');

export const serialise = (catalog: AgentCatalog): string => `${JSON.stringify(catalog, null, 2)}\n`;

/** A prop of the reference with its default, in a stable key order. */
function entry(prop: PropDoc, fallback?: string): PropEntry {
  const value = fallback ?? docDefault(prop.doc);
  return { name: prop.name, type: prop.type, optional: prop.optional, ...(value === undefined ? {} : { default: value }), doc: prop.doc };
}

/** Names exported by a chart's `demo.ts`, re-exports included. */
function demoExports(slug: string): Set<string> {
  const file = join(ROOT, 'packages/core/src/charts', slug, 'demo.ts');
  const names = new Set<string>();
  if (!existsSync(file)) return names;
  ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true).forEachChild((node) => {
    if (ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const decl of node.declarationList.declarations) if (ts.isIdentifier(decl.name)) names.add(decl.name.text);
    } else if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const spec of node.exportClause.elements) names.add(spec.name.text);
    }
  });
  return names;
}

/** The demo constants themselves, read from the core's sources. */
async function demoModule(slug: string): Promise<Record<string, unknown>> {
  const file = join(ROOT, 'packages/core/src/charts', slug, 'demo.ts');
  return existsSync(file) ? ((await import(file)) as Record<string, unknown>) : {};
}

/** The diagnostic templates of `diagnose.ts` (`ERRORS`, `WARNINGS`), read without running it. */
function diagnostics(): Diagnostic[] {
  const file = join(ROOT, 'packages/core/src/diagnostics/diagnose.ts');
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const found: Diagnostic[] = [];
  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const decl of node.declarationList.declarations) {
      const table = decl.name.getText(source);
      if ((table !== 'ERRORS' && table !== 'WARNINGS') || !decl.initializer || !ts.isObjectLiteralExpression(decl.initializer)) continue;
      for (const row of decl.initializer.properties) {
        if (!ts.isPropertyAssignment(row) || !ts.isObjectLiteralExpression(row.initializer)) continue;
        const field = (name: string) => {
          const p = (row.initializer as ts.ObjectLiteralExpression).properties.find((q): q is ts.PropertyAssignment => ts.isPropertyAssignment(q) && q.name.getText(source) === name);
          return p && ts.isStringLiteralLike(p.initializer) ? p.initializer.text : '';
        };
        const code = row.name.getText(source);
        // SP005 throws in development and is stripped in production (REQ-025): an error to an author.
        found.push({ code, severity: table === 'ERRORS' || code === 'SP005' ? 'error' : 'warn', req: field('req'), what: field('what'), todo: field('todo') });
      }
    }
  });
  return found.sort((a, b) => a.code.localeCompare(b.code));
}

/** The first selector of an Angular entry point's component class. */
function angularSelector(entry: string, component: string): string {
  const source = readFileSync(join(ROOT, 'packages/angular', entry, `${component.replace(/[A-Z]/g, (m, i: number) => (i ? '-' : '') + m.toLowerCase())}.ts`), 'utf8');
  const at = source.search(new RegExp(`export class ${component}\\b`));
  const selector = [...source.slice(0, Math.max(at, 0)).matchAll(/selector: '([^']+)'/g)].at(-1)?.[1];
  if (at < 0 || !selector) throw new Error(`packages/angular/${entry} has no ${component}`);
  return selector.split(',')[0]!.trim();
}

/** A component's demo state as plain data, without the fixture's `id`. */
function demoOf(slug: string, state: string): Record<string, unknown> {
  const { id: _id, ...props } = UI_DEMOS[slug]?.[state] ?? { id: '' };
  return JSON.parse(JSON.stringify(props)) as Record<string, unknown>;
}

const REFLEX_PACKAGE = 'reflex_silverpoint_react';
const imports = (path: (adapter: string) => string): Imports => ({ react: path('react'), vue: path('vue'), angular: path('angular'), reflex: REFLEX_PACKAGE });

/** The catalog from this repository alone; Reflex names are joined by `joinReflex`. */
export async function baseCatalog(): Promise<AgentCatalog> {
  const reference = propsReference();
  const spec = specDefaults();
  const common = (props: readonly PropDoc[]) => props.map((p) => entry(p, spec.get(p.name)));

  const charts: ChartEntry[] = [];
  for (const row of CATALOG) {
    const meta = CHART_META[row.slug];
    if (!meta) throw new Error(`tools/agent-catalog/charts.meta.ts has no ${row.slug}`);
    const own = reference.charts.find((c) => c.chart === row.chart)!.own;
    const fallbacks = chartFallbacks(row.slug);
    const constant = constantCase(row.slug);
    const exported = demoExports(row.slug);
    const demo = exported.has(`${constant}_DEMO`) ? await demoModule(row.slug) : undefined;
    const rows = demo?.[`${constant}_DEMO`];
    charts.push({
      slug: row.slug,
      names: { react: row.chart, vue: `Sp${row.chart}`, angular: `sp-${row.slug}`, reflex: '' },
      imports: imports((adapter) => `@silverpoint/${adapter}/${row.slug}`),
      family: meta.family,
      summary: meta.summary,
      data: { shape: meta.shape, fields: meta.fields },
      intents: meta.intents,
      props: own.map((p) => entry(p, fallbacks.get(p.name))),
      ...(demo ? { demo: `${constant}_DEMO` } : {}),
      ...(demo?.[`${constant}_DEMO_KEYS`] ? { demoKeys: { ...(demo[`${constant}_DEMO_KEYS`] as object) } } : {}),
      ...(Array.isArray(rows) ? { demoSample: JSON.parse(JSON.stringify(rows.slice(0, 3))) as unknown[] } : {}),
      ...(own.some((p) => p.name === 'rootId') ? { drillable: true } : {}),
    });
  }

  const surfaces = componentSurfaces(UI_COMPONENTS);
  const components: ComponentEntry[] = UI_COMPONENTS.map((row) => {
    const surface = surfaces.get(row.slug)!;
    const summary = COMPONENT_SUMMARY[row.slug];
    if (!summary) throw new Error(`tools/agent-catalog/components.meta.ts has no ${row.slug}`);
    return {
      slug: row.slug,
      names: { react: row.component, vue: row.component, angular: surface.selector, reflex: '' },
      imports: imports((adapter) => `@silverpoint/${adapter}/ui/${row.slug}`),
      family: row.family,
      group: row.group,
      summary,
      props: reference.ui.components.find((c) => c.slug === row.slug)!.own.map((p) => entry(p)),
      ...(surface.binding ? { binding: surface.binding } : {}),
      events: surface.events,
      slots: surface.slots,
      states: [...row.states],
      demo: demoOf(row.slug, row.states[0]!),
    };
  });

  const ground = (g: typeof silverpoint, summary: string) => ({ name: g.name, substrates: Object.keys(g.substrates), summary });
  const peers = json<{ peerDependencies: Record<string, string> }>('packages/react/package.json').peerDependencies;
  const timelinePeer = '@knight-lab/timelinejs';

  return {
    schema: 1,
    version: json<{ version: string }>('packages/core/package.json').version,
    reflex: { version: '', wraps: '', stale: false },
    frameworks: ['react', 'vue', 'angular', 'reflex'],
    families: FAMILIES.map(({ slug, title }) => ({ slug, title })),
    common: { chart: common(reference.common), ui: common(reference.ui.common) },
    charts,
    components,
    dashboard: {
      props: reference.dashboard.props.map((p) => entry(p)),
      layout: reference.dashboard.layout.map((p) => entry(p)),
      cell: reference.dashboard.cell.map((p) => entry(p)),
      names: { react: 'Dashboard', vue: 'SpDashboard', angular: angularSelector('dashboard', 'SpDashboard'), reflex: '' },
      imports: imports((adapter) => `@silverpoint/${adapter}/dashboard`),
    },
    grounds: [
      ground(silverpoint, 'Metal point on prepared paper: hatched tone, a hand-inked line, cream and other prepared substrates.'),
      ground(cyanotype, 'A contact print: a white, exact line on Prussian blue; tone is line weight, nothing is hatched.'),
    ],
    palettes: {
      fields: reference.palette.map((p) => entry(p)),
      presets: Object.fromEntries(PALETTE_NAMES.map((name) => [name, { ...(PALETTES[name] as Record<string, string>) }])),
    },
    timeline: {
      props: reference.timeline.map((p) => entry(p)),
      names: { react: 'SpTimeline', vue: 'SpTimeline', angular: angularSelector('timeline', 'SpTimeline'), reflex: '' },
      imports: imports((adapter) => `@silverpoint/${adapter}/timeline`),
      peer: `${timelinePeer}@${peers[timelinePeer]}`,
    },
    diagnostics: diagnostics(),
    recommend: RECOMMEND_RULES,
    stylesheets: {
      always: ['@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css'],
      ui: ['@silverpoint/grounds/ui.css'],
      timeline: [`${timelinePeer}/dist/css/timeline.css`, '@silverpoint/grounds/timeline.css'],
    },
  };
}

/** Python names joined by slug and JS prop name (DD-049); stale when it wraps another version (REQ-556). */
export function joinReflex(catalog: AgentCatalog, reflex: ReflexCatalog): AgentCatalog {
  const stale = reflex.wraps !== catalog.version;
  const mark = stale ? { stale: reflex.wraps } : {};
  const snake = (props: readonly PropEntry[], python: readonly ReflexProp[] = []) =>
    props.map((p) => {
      const found = python.find((q) => q.js === p.name);
      const { name, ...rest } = p;
      return found ? { name, reflex: found.name, ...rest } : p;
    });
  const named = (names: Names, builder?: string): Names => ({ ...names, reflex: builder ?? '' });
  const byBuilder = (slug: string) => reflex.components.find((c) => c.slug === slug);
  return {
    ...catalog,
    reflex: { version: reflex.version, wraps: reflex.wraps, stale },
    common: { chart: snake(catalog.common.chart, reflex.common?.chart), ui: snake(catalog.common.ui, reflex.common?.ui) },
    charts: catalog.charts.map((c) => {
      const python = reflex.charts.find((r) => r.slug === c.slug);
      return { ...c, names: named(c.names, python?.builder), props: snake(c.props, python?.props), ...mark };
    }),
    components: catalog.components.map((c) => {
      const python = byBuilder(c.slug);
      return { ...c, names: named(c.names, python?.builder), props: snake(c.props, python?.props), ...mark };
    }),
    dashboard: { ...catalog.dashboard, names: named(catalog.dashboard.names, byBuilder('dashboard')?.builder), props: snake(catalog.dashboard.props, byBuilder('dashboard')?.props) },
    timeline: { ...catalog.timeline, names: named(catalog.timeline.names, byBuilder('timeline')?.builder), props: snake(catalog.timeline.props, byBuilder('timeline')?.props) },
  };
}

export const pinnedReflex = (): ReflexCatalog => JSON.parse(readFileSync(REFLEX_FILE, 'utf8')) as ReflexCatalog;

export async function buildAgentCatalog(): Promise<AgentCatalog> {
  return joinReflex(await baseCatalog(), pinnedReflex());
}
