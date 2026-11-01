/**
 * The agent catalog's `deck` section (feature-006, Data Model §2.37, REQ-619): generated from
 * `SpDeck`'s published props, the controller's events, the engine's directives and classes, the
 * fence parser and the diagnostics — never retyped.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { DECK_DIRECTIVES } from '../../packages/marp/src/engine/directives';
import { THEME_CLASSES } from '../../packages/marp/src/theme/silverpoint.css';
import { FENCE_KEYS, FENCE_OWN, HEIGHT, parseChartFence, WIDTH } from '../../packages/marp/src/fence/parse';
import { PALETTE_NAMES } from '../../packages/core/src/palettes';
import { CATALOG } from '../visual-gate/catalog';
import { buildAgentCatalog } from './catalog';

const catalog = await buildAgentCatalog();
const deck = catalog.deck;
const read = (file: string) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

const PROPS = ['markdown', 'page', 'defaultPage', 'id', 'label', 'theme', 'ground', 'substrate', 'mode', 'palette', 'size', 'showNotes', 'showControls', 'keyboard', 'swipe', 'hash', 'interactive'];

describe('the deck section (REQ-619)', () => {
  test('REQ-619 · names, imports and the optional peer; Reflex’s `sp_deck` joined from reflex-silverpoint-react (#10)', () => {
    expect(deck.names).toEqual({ react: 'SpDeck', vue: 'SpDeck', angular: 'sp-deck', reflex: 'sp_deck' });
    expect(deck.imports).toEqual({ react: '@silverpoint/react/deck', vue: '@silverpoint/vue/deck', angular: '@silverpoint/angular/deck', reflex: 'reflex_silverpoint_react' });
    expect(deck.peer).toBe('@silverpoint/marp');
  });

  test('REQ-553 · REQ-619 · SpDeck’s props carry their Python names', () => {
    expect(deck.props.find((p) => p.name === 'showNotes')?.reflex).toBe('show_notes');
    expect(deck.props.find((p) => p.name === 'defaultPage')?.reflex).toBe('default_page');
    expect(deck.props.find((p) => p.name === 'markdown')?.reflex).toBe('markdown');
  });

  test('REQ-619 · REQ-608 · the props are SpDeck’s, in order, the callbacks left to `events`', () => {
    expect(deck.props.map((p) => p.name)).toEqual(PROPS);
    expect(deck.props.filter((p) => !p.optional).map((p) => p.name)).toEqual(['markdown']);
    expect(deck.props.find((p) => p.name === 'mode')?.type).toBe('DeckMode');
    expect(Object.fromEntries(deck.props.filter((p) => p.default !== undefined).map((p) => [p.name, p.default]))).toEqual({
      defaultPage: '1',
      theme: "'silverpoint'",
      ground: "'silverpoint'",
      mode: "'ink'",
      size: "'16:9'",
      showNotes: 'false',
      showControls: 'true',
      keyboard: 'true',
      swipe: 'true',
      hash: 'false',
      interactive: 'true',
    });
  });

  test('REQ-608 · Vue and Angular take the same props as React', () => {
    const vue = [...read('packages/vue/src/deck/index.ts').split('props: {')[1]!.split('},\n  emits')[0]!.matchAll(/^ {4}(\w+):/gm)].map((m) => m[1]);
    const angular = [...read('packages/angular/deck/sp-deck.ts').matchAll(/^ {2}readonly (\w+) = input(?:\.required)?[<(]/gm)].map((m) => m[1]).filter((name) => !name!.startsWith('spDeck'));
    expect(vue).toEqual(PROPS);
    expect(angular).toEqual(PROPS);
  });

  test('REQ-619 · REQ-606 · the three events, their payloads and each framework’s binding', () => {
    expect(deck.events).toEqual([
      { name: 'pageChange', payload: '{ readonly page: number; readonly total: number }', bindings: { react: 'onPageChange', vue: '@page-change', angular: '(pageChange)' }, doc: expect.any(String) },
      { name: 'fragmentChange', payload: '{ readonly page: number; readonly step: number; readonly steps: number }', bindings: { react: 'onFragmentChange', vue: '@fragment-change', angular: '(fragmentChange)' }, doc: expect.any(String) },
      { name: 'ready', payload: '{ readonly total: number }', bindings: { react: 'onReady', vue: '@ready', angular: '(ready)' }, doc: expect.any(String) },
    ]);
    expect(deck.events.every((e) => e.doc.length > 0)).toBe(true);
  });

  test('REQ-619 · the directives and the theme classes are the engine’s', () => {
    expect(deck.directives).toEqual(JSON.parse(JSON.stringify(DECK_DIRECTIVES)));
    expect(deck.classes).toEqual([...THEME_CLASSES]);
  });

  test('REQ-619 · the fence schema is the parser’s: its fields, the charts, the sizes, the modes, the presets', () => {
    const schema = deck.fence.schema as {
      type: string;
      required: string[];
      additionalProperties: boolean;
      properties: Record<string, { enum?: string[]; minimum?: number; maximum?: number; pattern?: string; propertyNames?: { not: { enum: string[] } }; anyOf?: unknown[] }>;
    };
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(['chart']);
    expect(Object.keys(schema.properties)).toEqual([...FENCE_KEYS]);
    expect(schema.properties.chart?.enum).toEqual(CATALOG.map((c) => c.slug).sort());
    expect([schema.properties.width?.minimum, schema.properties.width?.maximum]).toEqual([WIDTH.min, WIDTH.max]);
    expect([schema.properties.height?.minimum, schema.properties.height?.maximum]).toEqual([HEIGHT.min, HEIGHT.max]);
    expect(schema.properties.mode?.enum).toEqual(['ink', 'precision']);
    expect(schema.properties.props?.propertyNames?.not.enum).toEqual([...FENCE_OWN]);
    expect(JSON.stringify(schema.properties.palette?.anyOf)).toContain(JSON.stringify(PALETTE_NAMES));
    expect(schema.properties.id?.pattern).toBe('^[A-Za-z0-9_.:-]+$');
  });

  test('REQ-619 · the fence example is a fence the parser accepts', () => {
    const body = deck.fence.example.match(/^```silverpoint\n([\s\S]*)\n```$/)?.[1];
    expect(body).toBeDefined();
    expect(parseChartFence(body!).error).toBeUndefined();
  });

  test('REQ-619 · the deck’s diagnostic codes, each one in the catalog’s table', () => {
    expect(deck.diagnostics).toEqual(['SP018', 'SP026', 'SP027', 'SP028', 'SP029']);
    const known = new Set(catalog.diagnostics.map((d) => d.code));
    expect(deck.diagnostics.filter((code) => !known.has(code))).toEqual([]);
  });

  test('REQ-619 · the stylesheets a deck page imports (API delta §1)', () => {
    expect(deck.stylesheets).toEqual(['@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css', '@silverpoint/grounds/ui.css', '@silverpoint/marp/deck.css']);
  });
});
