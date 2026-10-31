/**
 * The agent catalog's `deck` section (feature-006, Data Model §2.37, DD-060, REQ-619), read from the
 * sources, never retyped: `SpDeck`'s props from the React adapter's published interface (the three
 * adapters take the same, REQ-608), the events from the controller's `DeckEvents`, the directives and
 * classes from the engine, the fence schema from `ChartFenceSpec` and the fence parser, and the
 * diagnostic codes from the engine's own string literals.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { PALETTE_NAMES } from '../../packages/core/src/palettes';
import { listGrounds } from '../../packages/grounds/src/index';
import { DECK_DIRECTIVES, MODES } from '../../packages/marp/src/engine/directives';
import { FENCE_ID, FENCE_KEYS, FENCE_OWN, HEIGHT, WIDTH } from '../../packages/marp/src/fence/parse';
import { THEME_CLASSES } from '../../packages/marp/src/theme/silverpoint.css';
import type { DeckEventEntry, DeckSection, Imports, PropEntry } from '../../packages/mcp/src/types';
import { CATALOG } from '../visual-gate/catalog';
import { interfacesIn, type PropDoc } from './props';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8');

const REACT_DECK = 'packages/react/src/deck/index.tsx';
const VUE_DECK = 'packages/vue/src/deck/index.ts';
const ANGULAR_DECK = 'packages/angular/deck/sp-deck.ts';

const kebab = (name: string) => name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const capital = (name: string) => name[0]!.toUpperCase() + name.slice(1);

/** One working fence: a chart with its demo data and a title. */
const FENCE_EXAMPLE = ['```silverpoint', JSON.stringify({ chart: 'bar-chart', props: { title: 'Visits by quarter' } }), '```'].join('\n');

/** `SpDeckComponent`'s selector, as its decorator declares it. */
function angularSelector(): string {
  const source = read(ANGULAR_DECK);
  const at = source.search(/export class SpDeckComponent\b/);
  const selector = [...source.slice(0, Math.max(at, 0)).matchAll(/selector: '([^']+)'/g)].at(-1)?.[1];
  if (at < 0 || !selector) throw new Error(`${ANGULAR_DECK} has no SpDeckComponent`);
  return selector;
}

/** Each event of `DeckEvents` but the adapters' internal `state`, with the binding each framework declares. */
function events(): DeckEventEntry[] {
  const declared = interfacesIn(read('packages/marp/src/controller/reduce.ts')).get('DeckEvents') ?? [];
  const react = interfacesIn(read(REACT_DECK), 'deck.tsx').get('SpDeckProps') ?? [];
  const vue = read(VUE_DECK);
  const angular = read(ANGULAR_DECK);
  return declared
    .filter((e) => e.name !== 'state')
    .map((e) => {
      const bindings = { react: `on${capital(e.name)}`, vue: `@${kebab(e.name)}`, angular: `(${e.name})` };
      if (!react.some((p) => p.name === bindings.react)) throw new Error(`${REACT_DECK} has no ${bindings.react}`);
      if (!new RegExp(`emits: \\[[^\\]]*'${e.name}'`).test(vue)) throw new Error(`${VUE_DECK} does not emit ${e.name}`);
      if (!new RegExp(`readonly ${e.name} = output`).test(angular)) throw new Error(`${ANGULAR_DECK} has no ${e.name} output`);
      return { name: e.name, payload: e.type, bindings, doc: e.doc };
    });
}

/** The fence's JSON Schema: `ChartFenceSpec`'s fields and docs, the parser's rules and ranges. */
function fenceSchema(): Record<string, unknown> {
  const spec = interfacesIn(read('packages/marp/src/types.ts')).get('ChartFenceSpec') ?? [];
  const fields = spec.map((f) => f.name);
  if (JSON.stringify(fields) !== JSON.stringify(FENCE_KEYS)) throw new Error(`ChartFenceSpec (${fields.join(', ')}) and the parser's FENCE_KEYS disagree`);
  const doc = (name: string) => ({ description: spec.find((f) => f.name === name)!.doc });
  const rules: Record<(typeof FENCE_KEYS)[number], Record<string, unknown>> = {
    chart: { type: 'string', enum: CATALOG.map((c) => c.slug).sort() },
    data: {},
    props: { type: 'object', propertyNames: { not: { enum: [...FENCE_OWN] } } },
    width: { type: 'number', minimum: WIDTH.min, maximum: WIDTH.max },
    height: { type: 'number', minimum: HEIGHT.min, maximum: HEIGHT.max },
    id: { type: 'string', pattern: FENCE_ID.source },
    ground: { type: 'string', enum: listGrounds().map((g) => g.name) },
    substrate: { type: 'string' },
    mode: { enum: [...MODES] },
    palette: { anyOf: [{ type: 'string', enum: [...PALETTE_NAMES] }, { type: 'object' }] },
  };
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'silverpoint fence',
    type: 'object',
    required: spec.filter((f) => !f.optional).map((f) => f.name),
    additionalProperties: false,
    properties: Object.fromEntries(FENCE_KEYS.map((key) => [key, { ...rules[key], ...doc(key) }])),
  };
}

/** Every `SPnnn` string literal of `@silverpoint/marp`'s sources: the codes a deck raises. */
function deckCodes(): string[] {
  const codes = new Set<string>();
  const walk = (dir: string): void => {
    for (const name of readdirSync(join(ROOT, dir))) {
      const path = `${dir}/${name}`;
      if (statSync(join(ROOT, path)).isDirectory()) walk(path);
      else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) {
        const file = ts.createSourceFile(name, read(path), ts.ScriptTarget.Latest, true);
        const visit = (node: ts.Node): void => {
          if (ts.isStringLiteralLike(node) && /^SP\d{3}$/.test(node.text)) codes.add(node.text);
          node.forEachChild(visit);
        };
        visit(file);
      }
    }
  };
  walk('packages/marp/src');
  return [...codes].sort();
}

export function deckSection(entry: (prop: PropDoc) => PropEntry): DeckSection {
  const props = (interfacesIn(read(REACT_DECK), 'deck.tsx').get('SpDeckProps') ?? []).filter((p) => !/^on[A-Z]/.test(p.name));
  const imports: Imports = { react: '@silverpoint/react/deck', vue: '@silverpoint/vue/deck', angular: '@silverpoint/angular/deck', reflex: '' };
  return {
    names: { react: 'SpDeck', vue: 'SpDeck', angular: angularSelector(), reflex: '' },
    imports,
    peer: '@silverpoint/marp',
    props: props.map(entry),
    events: events(),
    directives: JSON.parse(JSON.stringify(DECK_DIRECTIVES)) as DeckSection['directives'],
    classes: [...THEME_CLASSES],
    fence: { schema: fenceSchema(), example: FENCE_EXAMPLE },
    diagnostics: deckCodes(),
    stylesheets: ['@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css', '@silverpoint/grounds/ui.css', '@silverpoint/marp/deck.css'],
  };
}
