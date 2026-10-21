/**
 * REQ-569 · Where the README and the documentation site list the server's tools, the list is the
 * server's own definitions, read from a running server, never written by hand (T-249).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { README_FILE, toolList, toolsTable, withTools } from './agent-tools';

const tools = await toolList();

describe('the tool list (REQ-569)', () => {
  test('REQ-569 · the server’s eleven tools, with their titles and descriptions, in registration order', () => {
    expect(tools.map((t) => t.name)).toEqual([
      'get_version',
      'list_charts',
      'get_chart',
      'list_components',
      'get_component',
      'recommend_chart',
      'generate_code',
      'search_catalog',
      'validate_props',
      'render_chart',
      'check_palette',
    ]);
    for (const tool of tools) {
      expect(tool.title, tool.name).toBeTruthy();
      expect(tool.description.length, tool.name).toBeGreaterThan(40);
    }
  });

  test('REQ-569 · as a Markdown table, a pipe in a description escaped', () => {
    const table = toolsTable([{ name: 'a_tool', title: 'A tool', description: 'Takes a | b.' }]);
    expect(table).toBe('| Tool | What it answers |\n|---|---|\n| `a_tool` | Takes a \\| b. |');
  });

  test('REQ-569 · written between the README’s markers, and nowhere else', () => {
    const readme = 'intro\n<!-- tools:start -->\nold\n<!-- tools:end -->\noutro\n';
    expect(withTools(readme, tools)).toBe(`intro\n<!-- tools:start -->\n${toolsTable(tools)}\n<!-- tools:end -->\noutro\n`);
    expect(() => withTools('no markers', tools)).toThrow(/tools:start/);
  });

  test('REQ-569 · the committed README of @silverpoint/mcp lists them', () => {
    const readme = readFileSync(README_FILE, 'utf8');
    expect(withTools(readme, tools)).toBe(readme);
  });
});
