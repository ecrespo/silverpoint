/**
 * The server's contract (API delta §3..§5, REQ-538, REQ-546, REQ-548, REQ-549, REQ-550, REQ-566):
 * a real MCP client over an in-memory transport, so the schemas, the error results and the
 * resources are what a client sees.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import core from '../../core/package.json' with { type: 'json' };
import { AGENT_CATALOG, createServer } from '../src';

const client = new Client({ name: 'contract-test', version: '0.0.0' });

beforeAll(async () => {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverSide);
  await client.connect(clientSide);
});

afterAll(async () => {
  await client.close();
});

type Structured = Record<string, unknown> & { version?: string };
const call = async (name: string, args: Record<string, unknown> = {}) => client.callTool({ name, arguments: args });

/** One valid call per tool: every tool of step 9c answers with the catalog's version. */
const VALID: Readonly<Record<string, Record<string, unknown>>> = {
  get_version: {},
  list_charts: { family: 'flows' },
  get_chart: { slug: 'sankey-chart', framework: 'vue' },
  list_components: { family: 'overlay' },
  get_component: { slug: 'select' },
  recommend_chart: { shape: 'series', intent: 'trend' },
  generate_code: { target: { chart: 'line-chart' }, framework: 'react' },
  search_catalog: { query: 'sankey' },
};

describe('tools (REQ-539, REQ-566)', () => {
  test('REQ-539 · the read-only tools, each with an input and an output schema and read-only annotations', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(Object.keys(VALID).sort());
    for (const tool of tools) {
      expect(tool.description, tool.name).toBeTruthy();
      expect(tool.inputSchema.type, tool.name).toBe('object');
      expect(tool.outputSchema?.type, tool.name).toBe('object');
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(true);
    }
  });

  test.each(Object.entries(VALID))('REQ-550 · %s answers with structured content carrying the catalog’s version', async (name, args) => {
    const result = await call(name, args);
    expect(result.isError, JSON.stringify(result.content)).toBeFalsy();
    expect((result.structuredContent as Structured).version).toBe(core.version);
    expect((result.content as { type: string }[])[0]?.type).toBe('text');
  });

  test('REQ-539 · get_version names the library, the Reflex wrapper and the protocol', async () => {
    const result = (await call('get_version')).structuredContent as Structured;
    expect(result).toMatchObject({ version: AGENT_CATALOG.version, reflex: AGENT_CATALOG.reflex });
  });

  test('REQ-541 · generate_code over the wire is the generator’s output', async () => {
    const result = (await call('generate_code', { target: { component: 'modal' }, framework: 'angular' })).structuredContent as Structured;
    expect(result.code).toContain('spTrigger');
    expect(result.imports).toContain('@silverpoint/angular/ui/modal');
  });
});

describe('errors (REQ-549)', () => {
  test('REQ-549 · an unknown name is a tool error, read as data: code, message and the closest names', async () => {
    const result = await call('get_chart', { slug: 'sankie' });
    expect(result.isError).toBe(true);
    const error = result.structuredContent as Structured;
    expect(error).toMatchObject({ code: 'unknown_name', suggestions: expect.arrayContaining(['sankey-chart']), version: core.version });
    expect(JSON.stringify(result.content)).toContain('sankey-chart');
  });

  test('REQ-549 · an input the schema refuses is a tool error too, never a thrown exception', async () => {
    const result = await call('search_catalog', { query: 42 });
    expect(result.isError).toBe(true);
  });

  test('REQ-549 · an unknown framework passed as a string reaches the tool and gets suggestions', async () => {
    const result = await call('generate_code', { target: { chart: 'line-chart' }, framework: 'reactjs' });
    expect(result.isError).toBe(true);
    expect((result.structuredContent as Structured).suggestions).toEqual(expect.arrayContaining(['react']));
  });
});

describe('resources (REQ-546)', () => {
  test('REQ-546 · the catalog and the diagnostics, as JSON', async () => {
    const { resources } = await client.listResources();
    const uris = resources.map((r) => r.uri);
    expect(uris).toEqual(expect.arrayContaining(['silverpoint://catalog', 'silverpoint://diagnostics']));
    const catalog = await client.readResource({ uri: 'silverpoint://catalog' });
    const content = catalog.contents[0] as { mimeType: string; text: string };
    expect(content.mimeType).toBe('application/json');
    expect(JSON.parse(content.text)).toEqual(AGENT_CATALOG);
    const diagnostics = await client.readResource({ uri: 'silverpoint://diagnostics' });
    expect(JSON.parse((diagnostics.contents[0] as { text: string }).text)).toHaveLength(AGENT_CATALOG.diagnostics.length);
  });

  test('REQ-546 · one resource per chart and per component, listable through their templates', async () => {
    const { resourceTemplates } = await client.listResourceTemplates();
    expect(resourceTemplates.map((t) => t.uriTemplate)).toEqual(expect.arrayContaining(['silverpoint://charts/{slug}', 'silverpoint://components/{slug}']));
    const { resources } = await client.listResources();
    expect(resources.filter((r) => r.uri.startsWith('silverpoint://charts/'))).toHaveLength(AGENT_CATALOG.charts.length);
    expect(resources.filter((r) => r.uri.startsWith('silverpoint://components/'))).toHaveLength(AGENT_CATALOG.components.length);
    const sankey = await client.readResource({ uri: 'silverpoint://charts/sankey-chart' });
    expect(JSON.parse((sankey.contents[0] as { text: string }).text).slug).toBe('sankey-chart');
  });
});

describe('prompts (REQ-548)', () => {
  test('REQ-548 · choose-chart and build-dashboard sequence the tools', async () => {
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name).sort()).toEqual(['build-dashboard', 'choose-chart']);
    const choose = await client.getPrompt({ name: 'choose-chart', arguments: { description: 'Weekly signups by channel' } });
    const text = (choose.messages[0]!.content as { text: string }).text;
    expect(text).toContain('Weekly signups by channel');
    for (const tool of ['recommend_chart', 'render_chart', 'generate_code']) expect(text).toContain(tool);
    const dashboard = await client.getPrompt({ name: 'build-dashboard', arguments: { framework: 'vue', charts: 'revenue trend; orders by status' } });
    expect((dashboard.messages[0]!.content as { text: string }).text).toMatch(/recommend_chart[\s\S]*generate_code/);
  });
});
