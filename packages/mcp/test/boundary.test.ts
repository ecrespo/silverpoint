/**
 * What the server is not (PRD §6.14): it ships its catalog as a file of its own package (REQ-537),
 * has no capability to write, connect, read the environment or evaluate code (REQ-551), answers
 * with the catalog's data and nothing addressed to the agent (REQ-563), and every tool has a
 * contract test of its schema and its errors (REQ-566).
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import manifest from '../package.json' with { type: 'json' };
import { AGENT_CATALOG, createServer } from '../src';

const PACKAGE = join(import.meta.dirname, '..');
const SOURCES = readdirSync(join(PACKAGE, 'src'), { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.ts'))
  .map((file) => ({ file, text: readFileSync(join(PACKAGE, 'src', file), 'utf8') }));

const client = new Client({ name: 'boundary-test', version: '0.0.0' });

beforeAll(async () => {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverSide);
  await client.connect(clientSide);
});

afterAll(async () => {
  await client.close();
});

const call = async (name: string, args: Record<string, unknown> = {}) => client.callTool({ name, arguments: args });

describe('the catalog ships inside the package (REQ-537)', () => {
  test('REQ-537 · agent-catalog.json is published and exported, and it is the catalog the server serves', () => {
    expect(manifest.files).toContain('agent-catalog.json');
    expect(manifest.exports['./agent-catalog.json']).toBe('./agent-catalog.json');
    expect(JSON.parse(readFileSync(join(PACKAGE, 'agent-catalog.json'), 'utf8'))).toEqual(AGENT_CATALOG);
  });
});

describe('no capability beyond answering (REQ-551)', () => {
  /** The modules the server may import: its own, the library, the SDK's server side and the schema library. */
  const ALLOWED = /^(\.{1,2}\/|@silverpoint\/(core(\/palettes|\/catalog)?|grounds)$|zod$|@modelcontextprotocol\/sdk\/(server\/|types\.js$))/;

  test('REQ-551 · the sources import nothing that writes, connects or spawns: no Node built-in, no other package', () => {
    const imports = SOURCES.flatMap(({ file, text }) =>
      [...text.matchAll(/^(?:import|export)\b[^'"\n]*?from\s+'([^']+)'/gm)].map((m) => ({ file, module: m[1]! })),
    );
    expect(imports.length).toBeGreaterThan(20);
    expect(imports.filter(({ module }) => !ALLOWED.test(module))).toEqual([]);
  });

  test('REQ-551 · no network call, no code evaluation, no dynamic import, and the environment read is NODE_ENV only', () => {
    const forbidden = /\bfetch\s*\(|\beval\s*\(|\bnew\s+Function\b|\bimport\s*\(|\brequire\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/;
    expect(SOURCES.filter(({ text }) => forbidden.test(text)).map(({ file }) => file)).toEqual([]);
    const environment = SOURCES.flatMap(({ text }) => [...text.matchAll(/process\.env\.?(\w*)/g)].map((m) => m[1]));
    expect(new Set(environment)).toEqual(new Set(['NODE_ENV']));
  });
});

describe('data, never instructions (REQ-563)', () => {
  test('REQ-563 · a chart and a component are answered as their catalog entries, unchanged', async () => {
    const chart = (await call('get_chart', { slug: 'sankey-chart' })).structuredContent as { chart: unknown };
    expect(chart.chart).toEqual(AGENT_CATALOG.charts.find((c) => c.slug === 'sankey-chart'));
    const component = (await call('get_component', { slug: 'modal' })).structuredContent as { component: unknown };
    expect(component.component).toEqual(AGENT_CATALOG.components.find((c) => c.slug === 'modal'));
    const list = (await call('list_charts')).structuredContent as { charts: { slug: string; summary: string }[] };
    expect(list.charts.map((c) => [c.slug, c.summary])).toEqual(AGENT_CATALOG.charts.map((c) => [c.slug, c.summary]));
  });

  test('REQ-563 · a result’s text is its structured content and a header, nothing more', async () => {
    const result = await call('get_chart', { slug: 'line-chart' });
    const [header, ...rest] = (result.content as { text: string }[])[0]!.text.split('\n');
    expect(header).toBe(`get_chart · silverpoint ${AGENT_CATALOG.version}`);
    expect(JSON.parse(rest.join('\n'))).toEqual(result.structuredContent);
  });

  test('REQ-563 · no tool description or parameter description addresses the agent beyond the tool', async () => {
    const { tools } = await client.listTools();
    const texts = tools.flatMap((tool) => [
      tool.description ?? '',
      ...Object.values((tool.inputSchema.properties ?? {}) as Record<string, { description?: string }>).map((p) => p.description ?? ''),
    ]);
    const addressed = /\b(ignore|disregard|system prompt|you are|you must|always (call|use)|never (call|use)|instead of the user)\b|https?:\/\//i;
    expect(texts.filter((text) => addressed.test(text))).toEqual([]);
  });
});

describe('every tool’s contract (REQ-566)', () => {
  /** One input per tool its contract refuses: a wrong type, a name no catalog holds, or a size out of range. */
  const INVALID: Readonly<Record<string, Record<string, unknown>>> = {
    list_charts: { family: 'flowz' },
    get_chart: { slug: 42 },
    list_components: { family: 'widget' },
    get_component: { slug: 'modl' },
    recommend_chart: { shape: 'seriess', intent: 'trend' },
    generate_code: { target: {}, framework: 'react' },
    search_catalog: { query: 42 },
    validate_props: { chart: 'line-chart', props: 'xKey' },
    render_chart: { chart: 'line-chart', width: 10 },
    check_palette: { palette: 'sangine' },
  };

  test('REQ-566 · every tool with an input has an object schema and a refused input in this contract', async () => {
    const { tools } = await client.listTools();
    const withInput = tools.filter((t) => Object.keys(t.inputSchema.properties ?? {}).length > 0).map((t) => t.name);
    expect(withInput.sort()).toEqual(Object.keys(INVALID).sort());
  });

  test.each(Object.entries(INVALID))('REQ-566 · %s refuses an invalid input as a tool error, never an exception', async (name, args) => {
    const result = await call(name, args);
    expect(result.isError, JSON.stringify(result.content)).toBe(true);
  });
});
