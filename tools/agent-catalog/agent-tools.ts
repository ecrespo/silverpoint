/**
 * REQ-569: the server's tools as the server defines them, read from a running server over an
 * in-memory transport, for the `@silverpoint/mcp` README (between its `tools` markers) and the
 * documentation site's "Use with AI" page (`docs/site/generated/agent-tools.json`).
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../../packages/mcp/src';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const README_FILE = join(ROOT, 'packages/mcp/README.md');
export const DOCS_TOOLS_FILE = join(ROOT, 'docs/site/generated/agent-tools.json');

export interface ToolDoc {
  readonly name: string;
  readonly title: string;
  readonly description: string;
}

export async function toolList(): Promise<ToolDoc[]> {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(serverSide);
  const client = new Client({ name: 'agent-tools', version: '0.0.0' });
  await client.connect(clientSide);
  try {
    const { tools } = await client.listTools();
    return tools.map((t) => ({ name: t.name, title: t.title ?? t.name, description: t.description ?? '' }));
  } finally {
    await client.close();
    await server.close();
  }
}

export function toolsTable(tools: readonly ToolDoc[]): string {
  const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
  return ['| Tool | What it answers |', '|---|---|', ...tools.map((t) => `| \`${t.name}\` | ${cell(t.description)} |`)].join('\n');
}

const START = '<!-- tools:start -->';
const END = '<!-- tools:end -->';

/** The README with the table between its markers replaced. */
export function withTools(readme: string, tools: readonly ToolDoc[]): string {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < start) throw new Error(`the README has no ${START} … ${END} block`);
  return `${readme.slice(0, start + START.length)}\n${toolsTable(tools)}\n${readme.slice(end)}`;
}

export const toolsJson = (tools: readonly ToolDoc[]): string => `${JSON.stringify(tools, null, 2)}\n`;
