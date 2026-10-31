/**
 * `generate_code { deck }` (feature-006, API delta §11, REQ-621): the imports, the four stylesheets
 * and the code of an `SpDeck` in React, Vue and Angular, from the catalog's deck section alone; the
 * Markdown embedded verbatim. Reflex has no deck until `reflex-silverpoint-marp` exports a catalog.
 */
import { describe, expect, test } from 'vitest';
import { AGENT_CATALOG, Catalog } from '../src/catalog';
import { generateCode, type GenerateInput } from '../src/codegen';
import { ToolError } from '../src/errors';
import { validateDeck } from '../src/tools/deck';

const catalog = new Catalog(AGENT_CATALOG);
const generate = (input: GenerateInput) => generateCode(catalog, input);
const deck = AGENT_CATALOG.deck;

function errorOf(call: () => unknown): ToolError {
  try {
    call();
  } catch (error) {
    if (error instanceof ToolError) return error;
    throw error;
  }
  throw new Error('expected a tool error');
}

/** The Markdown literal the code holds, evaluated back: the first template literal of the code. */
function embedded(code: string): string {
  const literal = code.match(/`(?:\\[\s\S]|[^`\\])*`/)?.[0];
  if (!literal) throw new Error('no template literal');
  return new Function(`return ${literal};`)() as string;
}

const TRICKY = ['# Costs in `USD`', '', 'A ${placeholder} and a \\ backslash.', '', '```silverpoint', '{"chart":"donut-chart"}', '```'].join('\n');

describe('generate_code { deck } (REQ-621)', () => {
  test.each(['react', 'vue', 'angular'] as const)('REQ-621 · %s: the deck’s import, the four stylesheets, the page bound', (framework) => {
    const result = generate({ target: { deck: { markdown: TRICKY } }, framework });
    expect(result.imports).toContain(deck.imports[framework]);
    expect(result.stylesheets).toEqual(deck.stylesheets);
    for (const sheet of result.stylesheets) expect(result.code).toContain(sheet);
    const binding = { react: 'onPageChange={({ page }) => setPage(page)}', vue: 'v-model:page="page"', angular: '(pageChange)="page.set($event.page)"' }[framework];
    expect(result.code).toContain(binding);
  });

  test.each(['react', 'vue', 'angular'] as const)('REQ-621 · %s: the Markdown is embedded verbatim, backticks, `${` and backslashes included', (framework) => {
    expect(embedded(generate({ target: { deck: { markdown: TRICKY } }, framework }).code)).toBe(TRICKY);
  });

  test('REQ-621 · without Markdown, a starter deck the engine renders with no diagnostic, its fence the catalog’s example', () => {
    const markdown = embedded(generate({ target: { deck: {} }, framework: 'react' }).code);
    expect(markdown).toContain(deck.fence.example);
    expect(validateDeck(catalog, { markdown })).toMatchObject({ valid: true, diagnostics: [] });
  });

  test('REQ-621 · appearance and SpDeck’s own props, checked against the catalog', () => {
    const code = generate({ target: { deck: {} }, framework: 'vue', ground: 'cyanotype', mode: 'precision', palette: 'sanguine', props: { showNotes: true, hash: true } }).code;
    for (const attr of ['ground="cyanotype"', 'mode="precision"', 'palette="sanguine"', ':show-notes="true"', ':hash="true"']) expect(code).toContain(attr);
    const typo = errorOf(() => generate({ target: { deck: {} }, framework: 'react', props: { shwoNotes: true } }));
    expect([typo.code, typo.suggestions[0]]).toEqual(['unknown_name', 'showNotes']);
    expect(errorOf(() => generate({ target: { deck: {} }, framework: 'react', props: { markdown: '# x' } })).code).toBe('invalid_input');
    expect(errorOf(() => generate({ target: { deck: {} }, framework: 'react', props: { ground: 'cyanotype' } })).code).toBe('invalid_input');
  });

  test('REQ-621 · reflex: a tool error naming reflex-silverpoint-marp as pending', () => {
    const error = errorOf(() => generate({ target: { deck: {} }, framework: 'reflex' }));
    expect(error.code).toBe('unknown_name');
    expect(error.message).toContain('reflex-silverpoint-marp');
  });

  test('REQ-621 · exactly one target', () => {
    expect(errorOf(() => generate({ target: { chart: 'bar-chart', deck: {} }, framework: 'react' })).code).toBe('invalid_input');
  });
});
