/**
 * `validate_deck` and `render_deck` (feature-006, API delta §11, REQ-620) and the deck resource,
 * through a real MCP client: the engine's diagnostics per slide and per fence, and a standalone,
 * deterministic HTML document of the deck or of one slide, within REQ-560's limits.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { AGENT_CATALOG, createServer } from '../src';
import { STANDALONE_STYLE } from '../src/tools/render';

const client = new Client({ name: 'deck-test', version: '0.0.0' });

beforeAll(async () => {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverSide);
  await client.connect(clientSide);
});

afterAll(async () => {
  await client.close();
});

type Structured = Record<string, unknown>;
const call = async (name: string, args: Record<string, unknown>) => {
  const result = await client.callTool({ name, arguments: args });
  return { isError: result.isError === true, data: result.structuredContent as Structured };
};

const DECK = [
  '---',
  'ground: silverpoint',
  '---',
  '',
  '# Quarterly review',
  '',
  '```silverpoint',
  '{"chart":"bar-chart","props":{"title":"Visits"}}',
  '```',
  '',
  '---',
  '',
  '## Three points',
  '',
  '* Direct grew',
  '* Search fell',
  '',
  '<!-- Pause here. -->',
  '',
  '---',
  '',
  '# Thank you',
].join('\n');

const BROKEN = ['# One', '', '```silverpoint', '{"chart":"bar-chrat"}', '```', '', '---', '', '<!-- _mode: blotted -->', '', '## Two'].join('\n');

describe('validate_deck (REQ-620)', () => {
  test('REQ-620 · a clean deck is valid: its slide count and no diagnostics', async () => {
    const { isError, data } = await call('validate_deck', { markdown: DECK });
    expect(isError).toBe(false);
    expect(data).toMatchObject({ version: AGENT_CATALOG.version, valid: true, total: 3, diagnostics: [] });
  });

  test('REQ-620 · each diagnostic names its slide and fence, with its requirement and remedy', async () => {
    const { data } = await call('validate_deck', { markdown: BROKEN });
    expect(data.valid).toBe(false);
    expect(data.total).toBe(2);
    const diagnostics = data.diagnostics as { code: string; severity: string; req: string; todo: string; slide?: number; slot?: string; message: string }[];
    expect(diagnostics.map((d) => [d.code, d.slide, d.slot ?? null])).toEqual([
      ['SP026', 1, 's1-c1'],
      ['SP027', 2, null],
    ]);
    for (const d of diagnostics) {
      const known = AGENT_CATALOG.diagnostics.find((k) => k.code === d.code)!;
      expect([d.severity, d.req, d.todo]).toEqual([known.severity, known.req, known.todo]);
    }
    expect(diagnostics[0]!.message).toContain('bar-chart');
  });

  test('REQ-620 · REQ-560 · Markdown is not held to the 1,000-character string limit, only to the body’s', async () => {
    const long = `${DECK}\n\n${'A sentence that keeps going. '.repeat(100)}`;
    expect(long.length).toBeGreaterThan(1_000);
    expect((await call('validate_deck', { markdown: long })).isError).toBe(false);
    const huge = await call('validate_deck', { markdown: 'x'.repeat(300 * 1024) });
    expect(huge.isError).toBe(true);
    expect(huge.data.code).toBe('limit_exceeded');
  });
});

describe('render_deck (REQ-620)', () => {
  test('REQ-620 · a standalone document: every slide shown, static charts, the theme, ground and deck CSS inlined, no controls', async () => {
    const { isError, data } = await call('render_deck', { markdown: DECK });
    expect(isError).toBe(false);
    const html = data.html as string;
    expect(data.total).toBe(3);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<title>Quarterly review</title>');
    expect(html.match(/data-sp-slide="\d"/g)).toEqual(['data-sp-slide="1"', 'data-sp-slide="2"', 'data-sp-slide="3"']);
    expect(html).not.toMatch(/<div[^>]*class="sp-deck-slide"[^>]*\s(hidden|inert)[\s=>]/);
    expect(html).toMatch(/data-sp-slot="s1-c1"[\s\S]*?<svg[^>]*class="sp-chart/);
    // Every fragment shown, as in print (REQ-597): a document has no step to reveal them by.
    expect(html.match(/<li data-marpit-fragment="\d"/g)).toHaveLength(2);
    expect(html).not.toContain('data-sp-pending=""');
    expect(html).not.toMatch(/class="sp-deck-controls"|aria-label="Next slide"/);
    expect(html).toContain(STANDALONE_STYLE.slice(0, 80));
    expect(html).toContain('.sp-deck-slide');
    expect(html).toContain(`.sp-deck-deck`);
    expect(html).not.toContain('@font-face');
    expect(data.diagnostics).toEqual([]);
  });

  test('REQ-620 · Art. 4 · the same input renders the same document', async () => {
    const [a, b] = [await call('render_deck', { markdown: DECK, ground: 'cyanotype' }), await call('render_deck', { markdown: DECK, ground: 'cyanotype' })];
    expect(a.data.html).toBe(b.data.html);
    expect(a.data.html).toContain('sp-ground-cyanotype');
  });

  test('REQ-620 · with `slide`, that slide alone', async () => {
    const { data } = await call('render_deck', { markdown: DECK, slide: 2 });
    const html = data.html as string;
    expect(data.total).toBe(3);
    expect(html.match(/data-sp-slide="\d"/g)).toEqual(['data-sp-slide="2"']);
    expect(html).toContain('Three points');
    expect(html).not.toContain('Quarterly review</h1>');
  });

  test('REQ-620 · embedFonts inlines EB Garamond; the options are checked like render_chart’s', async () => {
    expect((await call('render_deck', { markdown: DECK, embedFonts: true })).data.html).toContain("@font-face{font-family:'EB Garamond'");
    const typo = await call('render_deck', { markdown: DECK, ground: 'cyanotipe' });
    expect([typo.isError, typo.data.code, typo.data.suggestions]).toEqual([true, 'unknown_name', expect.arrayContaining(['cyanotype'])]);
    const page = await call('render_deck', { markdown: DECK, slide: 4 });
    expect([page.isError, page.data.code]).toEqual([true, 'invalid_input']);
    const size = await call('render_deck', { markdown: DECK, size: '21:9' });
    expect([size.isError, size.data.code]).toEqual([true, 'unknown_name']);
  });

  test('REQ-620 · a 4:3 deck renders at 960×720', async () => {
    const html = (await call('render_deck', { markdown: DECK, size: '4:3' })).data.html as string;
    expect(html).toContain('viewBox="0 0 960 720"');
  });
});

describe('the deck resource (REQ-546)', () => {
  test('REQ-546 · silverpoint://deck is the catalog’s deck section', async () => {
    const { resources } = await client.listResources();
    expect(resources.map((r) => r.uri)).toContain('silverpoint://deck');
    const read = await client.readResource({ uri: 'silverpoint://deck' });
    expect(JSON.parse((read.contents[0] as { text: string }).text)).toEqual(AGENT_CATALOG.deck);
  });
});

describe('the skill’s deck reference (REQ-622)', () => {
  const reference = readFileSync(new URL('../../../skills/silverpoint/references/deck.md', import.meta.url), 'utf8');
  const decks = [...reference.matchAll(/^~~~markdown\n([\s\S]*?)^~~~$/gm)].map((m) => m[1]!);

  test('REQ-622 · REQ-557 · every deck it shows renders with no diagnostic', async () => {
    expect(decks.length).toBeGreaterThanOrEqual(3);
    for (const markdown of decks) {
      const { data } = await call('validate_deck', { markdown });
      expect(data.diagnostics, markdown.slice(0, 80)).toEqual([]);
    }
  });
});
