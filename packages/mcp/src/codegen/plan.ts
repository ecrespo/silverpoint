/**
 * What `generate_code` will write, resolved from its input against the catalog before any framework
 * is spelled (REQ-541): every name checked, the demo props merged, the bindings found. A name the
 * catalog does not hold stops here with the closest ones (REQ-549).
 */
import type { Catalog } from '../catalog';
import { ToolError, unknownName } from '../errors';
import type { ChartEntry, ComponentEntry, Framework, PropEntry } from '../types';
import { humanised } from './literals';

export interface GenerateInput {
  readonly target: { readonly chart?: string; readonly component?: string };
  readonly framework: string;
  /** Role → the field name in the user's rows; a role taking several columns takes a list. */
  readonly fields?: Readonly<Record<string, string | readonly string[]>>;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly ground?: string;
  readonly substrate?: string;
  readonly mode?: string;
  /** A preset name of `@silverpoint/core/palettes`. */
  readonly palette?: string;
}

/** A prop written as a literal: its catalog name and, for Reflex, its Python name. */
export interface Attr {
  readonly name: string;
  readonly reflex: string;
  readonly value: unknown;
}

/** A value the generated code keeps in state and the component writes back. */
export interface Bound {
  /** `value` or `open`: the state's name. */
  readonly state: 'value' | 'open';
  /** The React prop and handler (`checked` + `onChange`). */
  readonly prop: string;
  readonly handler: string;
  /** `v-model`, `v-model:open`. */
  readonly vue: string;
  /** `[(value)]`, `[(open)]`. */
  readonly angular: string;
  readonly initial: unknown;
}

export interface Plan {
  readonly kind: 'chart' | 'component';
  readonly slug: string;
  readonly framework: Framework;
  readonly names: ChartEntry['names'];
  readonly import: string;
  readonly attrs: readonly Attr[];
  /** The preset's key in `@silverpoint/core/palettes` (`ironGall`). */
  readonly palette?: string;
  readonly bound: readonly Bound[];
  readonly content?: string;
  /** An overlay's trigger text, drawn on a native `<button>` (REQ-547). */
  readonly trigger?: string;
  /** Named content beside the default one (`footer`, `extra`), as text. */
  readonly slots: readonly { readonly name: string; readonly text: string }[];
  readonly stylesheets: readonly string[];
  readonly notes: string[];
}

const MODES = ['ink', 'precision'] as const;
/** Draws its own trigger button; the example apps give it none (REQ-547). */
const OWN_TRIGGER = new Set(['dropdown-menu']);

function target(input: GenerateInput): { chart: string } | { component: string } {
  const { chart, component } = input.target ?? {};
  if ((chart === undefined) === (component === undefined)) throw new ToolError('invalid_input', 'Name exactly one of `target.chart` or `target.component`.');
  return chart !== undefined ? { chart } : { component: component! };
}

/** The catalog prop a user key names: its camelCase name, or its Python one. */
function propNamed(key: string, props: readonly PropEntry[], what: string): PropEntry {
  const found = props.find((p) => p.name === key || p.reflex === key);
  if (!found) throw unknownName(`prop of ${what}`, key, props.map((p) => p.name));
  return found;
}

function reflexName(prop: PropEntry, framework: Framework, what: string): string {
  if (framework === 'reflex' && prop.reflex === undefined) throw new ToolError('invalid_input', `The Reflex wrapper of ${what} has no \`${prop.name}\`.`);
  return prop.reflex ?? prop.name;
}

/** `ground`, `substrate`, `mode` and `palette`, checked against the catalog. */
function appearance(catalog: Catalog, input: GenerateInput, common: readonly PropEntry[], framework: Framework, what: string) {
  const attrs: Attr[] = [];
  const add = (name: string, value: string) => attrs.push({ name, reflex: reflexName(common.find((p) => p.name === name)!, framework, what), value });
  if (input.ground !== undefined) add('ground', catalog.ground(input.ground));
  const notes: string[] = [];
  if (input.substrate !== undefined) {
    const ground = input.ground ?? 'silverpoint';
    const substrate = catalog.substrate(ground, input.substrate);
    // A ground with one substrate paints it whatever `substrate` says (cyanotype, Data Model §3.7).
    if (catalog.data.grounds.find((g) => g.name === catalog.ground(ground))!.substrates.length > 1) add('substrate', substrate);
    else notes.push(`\`${ground}\` has one substrate, \`${substrate}\`, painted whatever \`substrate\` says: none is written.`);
  }
  if (input.mode !== undefined) add('mode', catalog.oneOf('mode', input.mode, MODES));
  const palette = input.palette === undefined ? undefined : catalog.palette(input.palette);
  if (palette !== undefined) {
    reflexName(common.find((p) => p.name === 'palette')!, framework, what);
    if (framework !== 'reflex') notes.push(`\`${palette}\` comes from \`@silverpoint/core/palettes\`: install \`@silverpoint/core\` beside the adapter.`);
  }
  return { attrs, palette, notes };
}

function chartPlan(catalog: Catalog, chart: ChartEntry, framework: Framework, input: GenerateInput): Plan {
  const all = [...chart.props, ...catalog.data.common.chart];
  const attrs: Attr[] = [];
  const roles = chart.data.fields;
  for (const [role, field] of Object.entries(input.fields ?? {})) {
    const spec = roles.find((r) => r.role === role);
    if (!spec) throw unknownName(`data role of ${chart.slug}`, role, roles.map((r) => r.role));
    const prop = all.find((p) => p.name === spec.prop)!;
    if (Array.isArray(field) && !prop.type.includes('[]')) throw new ToolError('invalid_input', `\`${role}\` names one field of the rows, not a list.`);
    if (!Array.isArray(field) && prop.type.includes('[]') && !prop.type.includes('Accessor')) {
      attrs.push({ name: prop.name, reflex: reflexName(prop, framework, chart.slug), value: [field] });
      continue;
    }
    attrs.push({ name: prop.name, reflex: reflexName(prop, framework, chart.slug), value: field });
  }
  const given = input.props ?? {};
  if (!('title' in given) && !('label' in given)) attrs.push({ name: 'title', reflex: 'title', value: humanised(chart.slug) });
  for (const [key, value] of Object.entries(given)) {
    const prop = propNamed(key, all, chart.slug);
    if (prop.name === 'data') throw new ToolError('invalid_input', 'The rows are the generated code’s own `rows`; pass only props here.');
    if (['ground', 'substrate', 'mode', 'palette'].includes(prop.name)) throw new ToolError('invalid_input', `Give \`${prop.name}\` as its own input, not in \`props\`.`);
    attrs.push({ name: prop.name, reflex: reflexName(prop, framework, chart.slug), value });
  }
  const look = appearance(catalog, input, catalog.data.common.chart, framework, chart.slug);
  const missing = roles.filter((r) => r.required && !(input.fields && r.role in input.fields));
  const notes: string[] = [];
  if (missing.length > 0) {
    const defaults = missing.map((r) => `\`${r.role}\` (\`${r.prop}\`, default ${all.find((p) => p.name === r.prop)?.default ?? 'none'})`);
    notes.push(`Fields read through their defaults: ${defaults.join(', ')}. Pass \`fields\` to name your own.`);
  }
  notes.push(
    framework === 'reflex'
      ? 'Fill `State.rows` with the rows, a list of dicts, from an event handler.'
      : 'The rows are the `rows` prop: plain objects, one per datum, read through the accessor props.',
  );
  return {
    kind: 'chart',
    slug: chart.slug,
    framework,
    names: chart.names,
    import: chart.imports[framework],
    attrs: [...attrs, ...look.attrs],
    palette: look.palette,
    bound: [],
    slots: [],
    stylesheets: catalog.data.stylesheets.always,
    notes: [...look.notes, ...notes],
  };
}

/** `checked + onChange` → `checked`, `onChange`. */
const reactBinding = (binding: string) => binding.split(' + ') as [string, string];

function componentPlan(catalog: Catalog, component: ComponentEntry, framework: Framework, input: GenerateInput): Plan {
  const all = [...component.props, ...catalog.data.common.ui];
  const reactSlots = component.slots.react;
  const given = input.props ?? {};
  const values: Record<string, unknown> = { ...component.demo, ...given };
  for (const key of Object.keys(given)) {
    if (['content', 'trigger', 'value', 'open', ...reactSlots].includes(key)) continue;
    const prop = propNamed(key, all, component.slug);
    if (['ground', 'substrate', 'mode', 'palette'].includes(prop.name)) throw new ToolError('invalid_input', `Give \`${prop.name}\` as its own input, not in \`props\`.`);
  }
  const notes: string[] = [];
  const bound: Bound[] = [];
  const binding = component.binding;
  if (binding?.value) {
    const [prop, handler] = reactBinding(binding.value.react);
    bound.push({ state: 'value', prop, handler, vue: binding.value.vue, angular: binding.value.angular, initial: values.value ?? values[prop] ?? null });
  }
  const hasTrigger = reactSlots.includes('trigger');
  const trigger = hasTrigger && !OWN_TRIGGER.has(component.slug) && typeof values.trigger === 'string' ? values.trigger : undefined;
  if (binding?.open) {
    if (!hasTrigger && values.open !== undefined) {
      const [prop, handler] = reactBinding(binding.open.react);
      bound.push({ state: 'open', prop, handler, vue: binding.open.vue, angular: binding.open.angular, initial: values.open });
    } else if (hasTrigger) {
      notes.push('Its trigger opens and closes it; bind `open` as well to control it from your own state.');
    }
  }
  if (component.family === 'overlay' && trigger !== undefined) notes.push('The trigger is a native `<button type="button">`: an `SpButton` there is not supported yet (delta-014).');
  if (component.slug === 'toast') notes.push('Place toasts inside an `SpToaster`, which stacks them and announces them.');

  const attrs: Attr[] = [];
  const slots: { name: string; text: string }[] = [];
  const skipped = new Set(['content', 'trigger', 'value', 'open', ...bound.map((b) => b.prop)]);
  for (const [key, value] of Object.entries(values)) {
    if (skipped.has(key) || value === null || value === undefined) continue;
    const prop = all.find((p) => p.name === key || p.reflex === key);
    if (!prop) {
      if (reactSlots.includes(key) && typeof value === 'string') slots.push({ name: key, text: value });
      continue;
    }
    if (framework === 'reflex' && prop.reflex === undefined) {
      if (key in given) reflexName(prop, framework, component.slug);
      continue;
    }
    attrs.push({ name: prop.name, reflex: prop.reflex ?? prop.name, value });
  }
  const look = appearance(catalog, input, catalog.data.common.ui, framework, component.slug);
  return {
    kind: 'component',
    slug: component.slug,
    framework,
    names: component.names,
    import: component.imports[framework],
    attrs: [...attrs, ...look.attrs],
    palette: look.palette,
    bound,
    content: typeof values.content === 'string' ? values.content : undefined,
    trigger: framework === 'reflex' && OWN_TRIGGER.has(component.slug) && typeof values.trigger === 'string' ? values.trigger : trigger,
    slots,
    stylesheets: [...catalog.data.stylesheets.always, ...catalog.data.stylesheets.ui],
    notes: [...look.notes, ...notes],
  };
}

export function plan(catalog: Catalog, input: GenerateInput): Plan {
  const what = target(input);
  const framework = catalog.framework(input.framework);
  return 'chart' in what
    ? chartPlan(catalog, catalog.chart(what.chart), framework, input)
    : componentPlan(catalog, catalog.component(what.component), framework, input);
}
