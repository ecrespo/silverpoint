/**
 * `packages/embed/src/hosts/host-catalog.json` (feature-007, DD-066, REQ-653..REQ-655): the agent
 * catalog projected by rules into the smaller, typed shape hosts bind to. Roles from the data
 * fields (number → measure, date → temporal, string → dimension; a list prop → multiple), options
 * from the props whose type a control can express, labels in sentence case, and what cannot be
 * derived from `hosts.meta.ts`. A chart that a table cannot feed row for row and that has no rule
 * there fails generation, so a new chart cannot slip in unbound.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AgentCatalog, ChartEntry, PropEntry } from '../../packages/mcp/src/types';
import type { HostCatalog, HostChart, HostOption, HostRole } from '../../packages/embed/src/hosts/types';
import { BINDING_META, COMMON_OPTIONS, DEMO_EXTRA, OPTION_LABELS, PALETTE_LABELS, TITLES } from './hosts.meta';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const HOST_CATALOG_FILE = join(ROOT, 'packages/embed/src/hosts/host-catalog.json');
export const BINDINGS_FILE = join(ROOT, 'packages/embed/src/hosts/bindings.generated.ts');

/** `footerLeft` → `Footer left`; `bar-chart` → `Bar chart`. */
export const sentence = (name: string): string => {
  const words = name.replace(/-/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** The core's string-literal unions by alias name (`ChartOrientation` → ['columns', 'rows']). */
function literalAliases(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
        for (const m of readFileSync(path, 'utf8').matchAll(/export type (\w+)\s*=\s*([^;]+);/g)) {
          const values = literals(m[2]!);
          if (values) out.set(m[1]!, values);
        }
      }
    }
  };
  walk(join(ROOT, 'packages/core/src'));
  return out;
}

/** `'a' | 'b'` → ['a', 'b']; anything else → undefined. */
function literals(type: string): string[] | undefined {
  const parts = type.split('|').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2 || !parts.every((p) => /^'[^']*'$/.test(p))) return undefined;
  return parts.map((p) => p.slice(1, -1));
}

/** A prop's control kind, or `undefined` when no control expresses it (Data Model §2.41). */
function optionKind(type: string, aliases: Map<string, string[]>): Pick<HostOption, 'kind' | 'values'> | undefined {
  const bare = type.replace(/\s*\|\s*(null|undefined)\b/g, '').trim();
  if (bare === 'boolean' || bare === 'number' || bare === 'string') return { kind: bare };
  if (bare === 'string | number' || bare === 'number | string') return { kind: 'string' };
  const values = literals(bare) ?? aliases.get(bare);
  return values ? { kind: 'enum', values } : undefined;
}

/** A default literal of the agent catalog (`'columns'`, `true`, `26`) as a value. */
function defaultOf(text: string | undefined, kind: HostOption['kind']): boolean | number | string | undefined {
  if (text === undefined) return undefined;
  const t = text.trim();
  if (kind === 'boolean') return t === 'true' ? true : t === 'false' ? false : undefined;
  if (kind === 'number') return Number.isFinite(Number(t)) ? Number(t) : undefined;
  if (/^'.*'$/.test(t)) return t.slice(1, -1);
  return kind === 'string' || kind === 'enum' ? (/^[\w-]+$/.test(t) && !/^\d/.test(t) && kind === 'enum' ? t : undefined) : undefined;
}

function option(p: PropEntry, aliases: Map<string, string[]>): HostOption | undefined {
  const kind = optionKind(p.type, aliases);
  if (!kind) return undefined;
  const value = defaultOf(p.default, kind.kind);
  const valid = value === undefined || kind.kind !== 'enum' || kind.values!.includes(String(value));
  return { name: p.name, label: OPTION_LABELS[p.name] ?? sentence(p.name), doc: p.doc, ...kind, ...(value !== undefined && valid ? { default: value } : {}) };
}

const KINDS = { number: 'measure', date: 'temporal', string: 'dimension' } as const;
const isList = (type: string): boolean => /^readonly string\[\]$/.test(type.trim());

async function demoRows(slug: string, constant: string | undefined): Promise<{ rows: unknown[] | undefined; keys: unknown; props: Record<string, unknown> }> {
  if (!constant) return { rows: undefined, keys: undefined, props: {} };
  const file = join(ROOT, 'packages/core/src/charts', slug, 'demo.ts');
  if (!existsSync(file)) return { rows: undefined, keys: undefined, props: {} };
  const module = (await import(file)) as Record<string, unknown>;
  const props: Record<string, unknown> = { ...((module[`${constant}_PROPS`] as Record<string, unknown> | undefined) ?? {}) };
  for (const [prop, name] of Object.entries(DEMO_EXTRA[slug] ?? {})) props[prop] = module[name];
  return { rows: module[constant] as unknown[] | undefined, keys: module[`${constant}_KEYS`], props };
}

async function scalarDemo(): Promise<number> {
  const module = (await import(join(ROOT, 'packages/core/src/charts/shared/scalar.ts'))) as { SCALAR_DEMO: number };
  return module.SCALAR_DEMO;
}

/** A row's JSON form: frozen arrays and objects copied, dates as written. */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

async function hostChart(c: ChartEntry, aliases: Map<string, string[]>): Promise<HostChart> {
  const meta = BINDING_META[c.slug];
  const base = { slug: c.slug, title: TITLES[c.slug] ?? sentence(c.slug), family: c.family, summary: c.summary, shape: c.data.shape };
  if (!meta) {
    const unbound = c.data.fields.length === 0 || c.data.fields.some((f) => f.type === 'array');
    if (unbound) throw new Error(`REQ-653 · ${c.slug} has an array field or no field and no rule in tools/agent-catalog/hosts.meta.ts; bind it (pivot, scalar) or mark it none with a reason.`);
  }
  if (meta?.binding === 'none') return { ...base, binding: 'none', reason: meta.reason ?? '', roles: [], options: [] };

  const propType = (name: string) => c.props.find((p) => p.name === name)?.type ?? '';
  const roles: HostRole[] = meta?.roles
    ? [...meta.roles]
    : c.data.fields.map((f) => ({
        id: f.role,
        prop: f.prop,
        label: sentence(f.role),
        kind: KINDS[f.type as keyof typeof KINDS] ?? 'any',
        dataType: (f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'string') as HostRole['dataType'],
        required: f.required ?? false,
        multiple: isList(propType(f.prop)),
      }));
  const taken = new Set([...roles.map((r) => r.prop).filter((p): p is string => p !== null), ...(meta?.writes ?? [])]);
  const options = c.props.filter((p) => !taken.has(p.name)).map((p) => option(p, aliases)).filter((o): o is HostOption => o !== undefined);

  const { rows, keys, props: demoProps } = await demoRows(c.slug, c.demo);
  const demoKeys = (c.demoKeys ?? {}) as Record<string, unknown>;
  let demo: HostChart['demo'];
  if (meta?.binding === 'scalar') {
    demo = { roles: { percent: 'percent' }, rows: [{ percent: await scalarDemo() }] };
  } else if (meta?.reshape === 'matrix' && rows) {
    // The long form whose matrix reshape gives the demo back: one row per cell, columns C1…Cn.
    const long = (rows as { label: string; values: readonly (number | null)[] }[]).flatMap((r) => r.values.map((value, j) => ({ row: r.label, column: `C${j + 1}`, value })));
    demo = { roles: { row: 'row', column: 'column', value: 'value' }, rows: long };
  } else if (rows) {
    const roleNames: Record<string, string | string[]> = {};
    for (const role of roles) {
      if (role.prop === null) continue;
      const given = demoKeys[role.prop];
      const fallback = c.props.find((p) => p.name === role.prop)?.default;
      if (role.multiple) {
        const list = Array.isArray(given) ? given : Array.isArray(keys) ? keys : Object.values(demoKeys).every((v) => typeof v === 'string') && Object.keys(demoKeys).every((k) => /^\d+$/.test(k)) ? Object.values(demoKeys) : [];
        roleNames[role.id] = list.map(String);
      } else {
        const name = typeof given === 'string' ? given : fallback && /^'.*'$/.test(fallback) ? fallback.slice(1, -1) : role.id;
        if (role.required || rows.some((r) => Object.hasOwn(r as object, name))) roleNames[role.id] = name;
      }
    }
    const extra = {
      ...demoProps,
      ...Object.fromEntries(Object.entries(demoKeys).filter(([k]) => !/^\d+$/.test(k) && !roles.some((r) => r.prop === k))),
    };
    demo = { roles: roleNames, rows: plain(rows) as Record<string, unknown>[], ...(Object.keys(extra).length > 0 ? { options: plain(extra) } : {}) };
  }
  return {
    ...base,
    binding: meta?.binding ?? 'rows',
    ...(meta?.reshape ? { reshape: meta.reshape } : {}),
    roles,
    options,
    ...(demo ? { demo } : {}),
  };
}

export async function buildHostCatalog(agent: Pick<AgentCatalog, 'version' | 'charts' | 'common' | 'grounds' | 'palettes'>): Promise<HostCatalog> {
  const aliases = literalAliases();
  const charts: HostChart[] = [];
  for (const c of agent.charts) charts.push(await hostChart(c, aliases));
  const common = COMMON_OPTIONS.map((name) => agent.common.chart.find((p) => p.name === name))
    .filter((p): p is PropEntry => p !== undefined)
    .map((p) => option(p, aliases))
    .filter((o): o is HostOption => o !== undefined);
  return {
    schema: 1,
    version: agent.version,
    appearance: {
      grounds: agent.grounds.map((g) => ({ name: g.name, label: sentence(g.name), substrates: g.substrates.map((s) => ({ name: s, label: sentence(s) })) })),
      modes: [
        { name: 'ink', label: 'Ink' },
        { name: 'precision', label: 'Precision' },
      ],
      palettes: Object.keys(agent.palettes.presets).map((name) => ({ name, label: PALETTE_LABELS[name] ?? sentence(name) })),
    },
    common,
    charts,
  };
}

export const hostCatalogSource = (catalog: HostCatalog): string => `${JSON.stringify(catalog, null, 2)}\n`;

/**
 * The binding table `specFromTable` reads (`hosts/bindings.generated.ts`): each chart's binding,
 * reshape and roles, without demos, labels or options — the host catalog itself is a file hosts pin,
 * and would make the standalone file four times its size (DD-062).
 */
export function bindingsSource(catalog: HostCatalog): string {
  const rows = catalog.charts.map((c) => {
    const roles = c.roles.map((r) => `{ id: '${r.id}', prop: ${r.prop === null ? 'null' : `'${r.prop}'`}, required: ${r.required}, multiple: ${r.multiple} }`).join(', ');
    const reshape = c.reshape ? `, reshape: '${c.reshape}'` : '';
    const reason = c.reason ? `, reason: ${JSON.stringify(c.reason)}` : '';
    return `  '${c.slug}': { binding: '${c.binding}'${reshape}${reason}, roles: [${roles}] },`;
  });
  return [
    '// Generated by `pnpm --filter @silverpoint/agent-catalog generate` (tools/agent-catalog/hosts.ts). Do not edit.',
    '',
    "import type { Binding } from './types';",
    '',
    '/** Each chart’s binding, reshape and roles, from the host catalog (REQ-656, REQ-657). */',
    'export const BINDINGS: Readonly<Record<string, Binding>> = {',
    ...rows,
    '};',
    '',
  ].join('\n');
}
