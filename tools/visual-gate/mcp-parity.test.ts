/**
 * REQ-567 · `render_chart` over every chart fixture of the PR matrix, each result compared — as a
 * parsed, normalised tree, the root's inlined `<style>` set aside — with the fixture's committed
 * canonical render (REQ-543, Art. 3, DD-047).
 */
import { describe, expect, test } from 'vitest';
import { parseSvg } from '../svg-normalizer/normalize';
import { loadFixtures } from './fixtures';
import { mcpRenderFor, runMcpParity } from './mcp-parity';

const fixtures = loadFixtures('pr');

describe('render_chart parity (REQ-567)', () => {
  test('REQ-567 · REQ-543 · every PR-matrix chart fixture renders through render_chart as its canonical render', () => {
    expect(fixtures.length).toBeGreaterThan(300);
    const failed = runMcpParity(fixtures).filter((r) => !r.equal);
    expect(failed, failed.slice(0, 8).map((r) => `${r.fixture}: ${r.difference}`).join('\n')).toEqual([]);
    // ~3 s alone; beside every other project in one CI run it passes the default 5 s.
  }, 60_000);

  test('REQ-567 · only the root’s stylesheet is set aside: any other difference fails', () => {
    const [fixture] = fixtures;
    const svg = mcpRenderFor(fixture!);
    expect(parseSvg(svg).children[0]).toMatchObject({ tag: 'style' });
    const other = runMcpParity([fixture!], () => svg.replace('<style>', '<g></g><style>'));
    expect(other[0]?.equal).toBe(false);
    const moved = runMcpParity([fixture!], () => svg.replace(/(<style>[\s\S]*?<\/style>)([\s\S]*)(<\/svg>)$/, '$2$1$3'));
    expect(moved[0]?.equal).toBe(false);
    // Without a stylesheet nothing is set aside: the canonical markup itself is equal.
    expect(runMcpParity([fixture!], () => svg.replace(/<style>[\s\S]*?<\/style>/, ''))[0]?.equal).toBe(true);
  });
});
