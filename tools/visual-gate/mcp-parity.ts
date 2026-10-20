/**
 * The `render_chart` parity job (REQ-567, T-239): the MCP server's render of each fixture against
 * the fixture's committed canonical render, as trees. The only node set aside is the first child
 * of the root, the `<style>` `render_chart` inlines (DD-047); nothing is normalised as a string.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AGENT_CATALOG, Catalog } from '../../packages/mcp/src/catalog';
import { renderChart } from '../../packages/mcp/src/tools/render';
import { compareSvgTrees, parseSvg, type NormalElement } from '../svg-normalizer/normalize';
import { FIXTURES_DIR, type Fixture } from './fixtures';
import { markupOf } from './string-gate';

const catalog = new Catalog(AGENT_CATALOG);

export interface ParityResult {
  readonly fixture: string;
  readonly equal: boolean;
  readonly difference?: string;
}

/** A fixture as an agent would ask for it: its props, data, size, id and appearance. */
export function mcpRenderFor(fixture: Fixture): string {
  // A state fixture may carry its rows among its props; `render_chart` takes them as `data`.
  const { data: inline, ...props } = fixture.props as { data?: Record<string, unknown>[] };
  const data = fixture.data === null ? inline : (JSON.parse(readFileSync(join(FIXTURES_DIR, fixture.data), 'utf8')) as Record<string, unknown>[]);
  return renderChart(catalog, {
    chart: fixture.chart,
    props: { ...props, seed: fixture.seed, hatchFill: fixture.hatchFill },
    ...(data === undefined ? {} : { data }),
    width: fixture.size.width,
    height: fixture.size.height,
    id: fixture.id,
    ground: fixture.ground,
    substrate: fixture.substrate,
    mode: fixture.mode,
  }).svg;
}

/** The render's tree with its root's leading `<style>` set aside, and only that. */
function withoutStyle(tree: NormalElement): NormalElement {
  const [first, ...rest] = tree.children;
  return first && 'tag' in first && first.tag === 'style' ? { ...tree, children: rest } : tree;
}

export function runMcpParity(fixtures: readonly Fixture[], render: (fixture: Fixture) => string = mcpRenderFor): ParityResult[] {
  return fixtures.map((fixture) => {
    try {
      const expected = parseSvg(markupOf(readFileSync(join(FIXTURES_DIR, fixture.canonical), 'utf8')));
      const comparison = compareSvgTrees(withoutStyle(parseSvg(render(fixture))), expected);
      return comparison.equal ? { fixture: fixture.id, equal: true } : { fixture: fixture.id, ...comparison };
    } catch (error) {
      return { fixture: fixture.id, equal: false, difference: `render failed: ${(error as Error).message}` };
    }
  });
}
