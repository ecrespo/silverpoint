/**
 * `list_charts`, `get_chart`, `list_components`, `get_component` (API delta §3, REQ-539): the
 * catalog's entries, whole or as one framework spells them.
 */
import type { Catalog } from '../catalog';
import type { ChartEntry, ComponentEntry, Framework, PropEntry } from '../types';

export interface ListChartsInput {
  readonly family?: string;
  readonly intent?: string;
  readonly shape?: string;
}

export function listCharts(catalog: Catalog, input: ListChartsInput) {
  const family = input.family === undefined ? undefined : catalog.family(input.family);
  const intent = input.intent === undefined ? undefined : catalog.intent(input.intent);
  const shape = input.shape === undefined ? undefined : catalog.shape(input.shape);
  const charts = catalog.data.charts
    .filter((c) => (family === undefined || c.family === family) && (intent === undefined || c.intents.includes(intent)) && (shape === undefined || c.data.shape === shape))
    .map((c) => ({ slug: c.slug, family: c.family, summary: c.summary, intents: c.intents, shape: c.data.shape }));
  return { charts };
}

/** The props as `framework` spells them: Python names for Reflex, the types' names elsewhere. */
function spelled(props: readonly PropEntry[], framework: Framework) {
  return props
    .filter((p) => framework !== 'reflex' || p.reflex !== undefined)
    .map(({ reflex, ...p }) => (framework === 'reflex' ? { ...p, name: reflex!, js: p.name } : p));
}

function inFramework<T extends ChartEntry | ComponentEntry>(entry: T, framework: Framework) {
  const { names, imports, props, ...rest } = entry;
  return { ...rest, framework, name: names[framework], import: imports[framework], props: spelled(props, framework) };
}

export interface GetInput {
  readonly slug: string;
  readonly framework?: string;
}

export function getChart(catalog: Catalog, input: GetInput) {
  const chart = catalog.chart(input.slug);
  if (input.framework === undefined) return { chart: chart as Record<string, unknown> & ChartEntry };
  const framework = catalog.framework(input.framework);
  return { chart: { ...inFramework(chart, framework), common: spelled(catalog.data.common.chart, framework) } as Record<string, unknown> & { props: PropEntry[]; common: PropEntry[] } };
}

export interface ListComponentsInput {
  readonly family?: string;
  readonly group?: string;
}

export function listComponents(catalog: Catalog, input: ListComponentsInput) {
  const all = catalog.data.components;
  const family = input.family === undefined ? undefined : catalog.oneOf('component family', input.family, ['ui', 'composed', 'overlay'] as const);
  const group = input.group === undefined ? undefined : catalog.oneOf('component group', input.group, [...new Set(all.map((c) => c.group))]);
  const components = all
    .filter((c) => (family === undefined || c.family === family) && (group === undefined || c.group === group))
    .map((c) => ({ slug: c.slug, family: c.family, group: c.group, summary: c.summary }));
  return { components };
}

export function getComponent(catalog: Catalog, input: GetInput) {
  const component = catalog.component(input.slug);
  if (input.framework === undefined) return { component: component as Record<string, unknown> & ComponentEntry };
  const framework = catalog.framework(input.framework);
  const { binding, events, slots, ...rest } = inFramework(component, framework);
  // Reflex wraps React: its components bind, emit and take content as the React ones do.
  const adapter = framework === 'reflex' ? 'react' : framework;
  const pick = <T>(byFramework: Readonly<Record<string, T>> | undefined) => byFramework?.[adapter];
  return {
    component: {
      ...rest,
      binding: binding ? { value: pick(binding.value), open: pick(binding.open) } : undefined,
      events: events[adapter],
      slots: slots[adapter],
      common: spelled(catalog.data.common.ui, framework),
    } as Record<string, unknown> & { slots: readonly string[]; props: PropEntry[] },
  };
}
