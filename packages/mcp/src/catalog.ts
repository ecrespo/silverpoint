/**
 * The agent catalog the server ships (REQ-537, REQ-550), loaded once per instance and indexed by
 * every name an agent may use: slug, React, Vue, Angular and Reflex names, case and separators
 * ignored. A name it does not hold is a tool error with the closest ones (REQ-549).
 */
import data from '../agent-catalog.json' with { type: 'json' };
import { closest, ToolError, unknownName } from './errors';
import type { AgentCatalog, ChartEntry, ComponentEntry, DataShape, Family, Framework, Intent } from './types';

export const AGENT_CATALOG = data as unknown as AgentCatalog;

export const DATA_SHAPES: readonly DataShape[] = ['series', 'categories', 'parts', 'matrix', 'hierarchy', 'links', 'points', 'distribution', 'intervals', 'events', 'single', 'field'];
export const INTENTS: readonly Intent[] = [
  'trend',
  'compare',
  'rank',
  'part-to-whole',
  'distribution',
  'correlation',
  'flow',
  'hierarchy',
  'change',
  'uncertainty',
  'progress',
  'schedule',
  'kpi',
  'network',
];

/** `SpSankeyChart`, `sp-sankey-chart`, `sankey_chart` → one key: case and separators ignored. */
const key = (name: string) =>
  name
    .toLowerCase()
    .replace(/\[.*$/, '')
    .replace(/[^a-z0-9]/g, '');

function indexed<T extends { readonly slug: string; readonly names: Readonly<Record<string, string>> }>(entries: readonly T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const entry of entries) {
    for (const name of [entry.slug, ...Object.values(entry.names)]) if (name) index.set(key(name), entry);
    // Angular attribute selectors: `button[spButton]` and `[spSurface]` by their attribute too.
    for (const attribute of Object.values(entry.names).flatMap((n) => [...n.matchAll(/\[(\w+)\]/g)].map((m) => m[1]!))) index.set(key(attribute), entry);
  }
  return index;
}

export class Catalog {
  readonly data: AgentCatalog;
  private readonly charts: Map<string, ChartEntry>;
  private readonly components: Map<string, ComponentEntry>;

  constructor(data: AgentCatalog) {
    this.data = data;
    this.charts = indexed(data.charts);
    this.components = indexed(data.components);
  }

  get version(): string {
    return this.data.version;
  }

  chart(name: string): ChartEntry {
    const found = this.charts.get(key(name));
    if (!found) throw unknownName('chart', name, this.data.charts.map((c) => c.slug));
    return found;
  }

  component(name: string): ComponentEntry {
    const found = this.components.get(key(name));
    if (!found) throw unknownName('component', name, this.data.components.map((c) => c.slug));
    return found;
  }

  framework(name: string): Framework {
    const found = this.data.frameworks.find((f) => f === name.toLowerCase());
    // Four names: all of them, the closest first.
    if (!found) throw new ToolError('unknown_name', `No framework named "${name}".`, closest(name, this.data.frameworks, this.data.frameworks.length));
    return found;
  }

  family(name: string): Family {
    return this.oneOf('family', name, this.data.families.map((f) => f.slug));
  }

  shape(name: string): DataShape {
    return this.oneOf('data shape', name, DATA_SHAPES);
  }

  intent(name: string): Intent {
    return this.oneOf('intent', name, INTENTS);
  }

  ground(name: string): string {
    return this.oneOf('ground', name, this.data.grounds.map((g) => g.name));
  }

  substrate(ground: string, name: string): string {
    return this.oneOf(`substrate of ${ground}`, name, this.data.grounds.find((g) => g.name === this.ground(ground))!.substrates);
  }

  palette(name: string): string {
    return this.oneOf('palette', name, Object.keys(this.data.palettes.presets));
  }

  /** `name` when it is one of `allowed`, else a tool error naming the closest. */
  oneOf<T extends string>(kind: string, name: string, allowed: readonly T[]): T {
    const found = allowed.find((a) => a === name);
    if (found === undefined) throw unknownName(kind, name, allowed);
    return found;
  }
}

export const CATALOG = new Catalog(AGENT_CATALOG);
