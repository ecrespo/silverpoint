/**
 * feature-007 step 11f · agent access: `render_chart` through the embed (REQ-660, T-318), the
 * catalog's hosts (REQ-661, T-319), `generate_code` for plain HTML (REQ-662, T-320).
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { renderToSVG, validateSpec } from '@silverpoint/embed';
import { AGENT_CATALOG, Catalog } from '../src/catalog';
import { generateCode } from '../src/codegen';
import { ToolError } from '../src/errors';
import { renderChart } from '../src/tools/render';
import { searchCatalog } from '../src/tools/search';

const catalog = new Catalog(AGENT_CATALOG);
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

describe('render_chart through the embed (REQ-660, DD-061)', () => {
  test('REQ-660 · the server depends on @silverpoint/embed and keeps no recipe map of its own', () => {
    expect(manifest.dependencies['@silverpoint/embed']).toBe('workspace:*');
    expect(existsSync(new URL('../src/recipes.ts', import.meta.url))).toBe(false);
  });

  test.each([
    [{ chart: 'bar-chart' }],
    [{ chart: 'sankey-chart', width: 640, height: 300, id: 'flow', ground: 'silverpoint', substrate: 'ochre', mode: 'precision' }],
    [{ chart: 'line-chart', props: { title: 'Hits' }, data: [{ x: 'a', value: 1 }, { x: 'b', value: 3 }], palette: 'sepia' }],
    [{ chart: 'donut-chart', embedFonts: true }],
  ])('REQ-660 · render_chart writes renderToSVG’s bytes: %o', (input) => {
    const { embedFonts, ...spec } = input as Record<string, unknown> & { embedFonts?: boolean };
    const embed = renderToSVG(spec as never, { embedFonts });
    expect(embed.ok).toBe(true);
    expect(renderChart(catalog, input as never).svg).toBe(embed.ok ? embed.value.svg : '');
  });
});

describe('hosts (REQ-661)', () => {
  test('REQ-661 · the agent catalog lists the host integrations with their fields', () => {
    const hosts = AGENT_CATALOG.hosts;
    expect(hosts.map((h) => h.id)).toEqual(['powerbi', 'tableau', 'knime', 'n8n', 'superset', 'volto', 'plone-classic', 'python', 'flask', 'django', 'jupyter', 'databricks']);
    for (const h of hosts) {
      expect(['embed', 'react', 'python']).toContain(h.via);
      expect(['planned', 'preview', 'released']).toContain(h.status);
      expect(['npm', 'pypi', 'github-release', 'github-pages', 'knime-hub', 'none']).toContain(h.registry);
      if (h.repository !== null) expect(h.repository).toMatch(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/);
    }
    expect(AGENT_CATALOG.frameworks).toEqual(['react', 'vue', 'angular', 'reflex']);
  });

  test('REQ-661 · search_catalog returns host hits', () => {
    const [first] = searchCatalog(catalog, { query: 'power bi' }).hits;
    expect(first).toMatchObject({ kind: 'host', slug: 'powerbi', title: 'Power BI' });
    expect(searchCatalog(catalog, { query: 'tableau extension' }).hits.some((h) => h.kind === 'host' && h.slug === 'tableau')).toBe(true);
  });
});

describe('generate_code { framework: "html" } (REQ-662)', () => {
  test('REQ-662 · the fragment holds a <silverpoint-chart> whose spec validates, and one script tag with its integrity', () => {
    const out = generateCode(catalog, { target: { chart: 'bar-chart' }, framework: 'html', fields: { x: 'team', value: 'wins' }, props: { title: 'Wins' }, ground: 'silverpoint', palette: 'sepia' });
    expect(out.code.startsWith('<silverpoint-chart>')).toBe(true);
    const json = /<script type="application\/json">([\s\S]*?)<\/script>/.exec(out.code)![1]!;
    const spec = JSON.parse(json);
    expect(spec).toMatchObject({ chart: 'bar-chart', props: { xKey: 'team', valueKey: 'wins', title: 'Wins' }, ground: 'silverpoint', palette: 'sepia' });
    expect(validateSpec(spec).ok).toBe(true);
    expect(out.imports).toHaveLength(1);
    expect(out.imports[0]).toMatch(/^<script src="silverpoint-embed\.full\.js"( integrity="sha384-[A-Za-z0-9+/=]+" crossorigin="anonymous")?><\/script>$/);
    expect(out.stylesheets).toEqual([]);
    expect(out.notes.join(' ')).toMatch(/@silverpoint\/embed/);
    expect(out.notes.join(' ')).not.toMatch(/https?:\/\//);
  });

  test('REQ-662 · a component or a deck with html is invalid_input', () => {
    for (const target of [{ component: 'button' }, { deck: {} }]) {
      expect(() => generateCode(catalog, { target, framework: 'html' } as never)).toThrow(ToolError);
    }
  });

  test('REQ-662 · the integrity is the embed’s own for the full file; read from the sources, before a build, the tag says where to find it', async () => {
    const { STANDALONE_INTEGRITY } = await import('@silverpoint/embed');
    const out = generateCode(catalog, { target: { chart: 'line-chart' }, framework: 'html' });
    const known = STANDALONE_INTEGRITY['silverpoint-embed.full.js'];
    if (known) expect(out.imports[0]).toContain(known);
    else expect(out.notes.join(' ')).toMatch(/integrity\.json/);
  });
});
