/**
 * REQ-565 · REQ-569 · The "Use with AI" page: the MCP URL, the configuration of the common clients,
 * the plugin, the local `npx` alternative, and the server's tools as the server defines them (T-249).
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { toolList } from '../../../tools/agent-catalog/agent-tools';
import tools from '../generated/agent-tools.json';
import { AgentPage, MCP_URL } from '../src/pages/agent';

describe('Use with AI (REQ-565, REQ-569)', () => {
  test('REQ-569 · the generated tool list is the running server’s', async () => {
    expect(tools).toEqual(await toolList());
  });

  test('REQ-565 · the page gives the URL, the clients’ configuration, the plugin and npx', () => {
    const html = renderToStaticMarkup(createElement(AgentPage));
    expect(MCP_URL).toBe('https://silverpointweb.vercel.app/mcp');
    expect(html).toContain(MCP_URL);
    expect(html).toContain('claude mcp add --transport http silverpoint');
    for (const client of ['Claude Code', 'Claude', 'Cursor', 'VS Code']) expect(html, client).toContain(client);
    expect(html).toContain('/plugin marketplace add ecrespo/silverpoint');
    expect(html).toContain('/plugin install silverpoint@silverpoint');
    expect(html).toContain('npx -y @silverpoint/mcp');
  });

  test('REQ-569 · every tool is listed with its description', () => {
    const html = renderToStaticMarkup(createElement(AgentPage));
    for (const tool of tools) {
      expect(html, tool.name).toContain(tool.name);
      expect(html, tool.name).toContain(tool.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;'));
    }
  });
});
