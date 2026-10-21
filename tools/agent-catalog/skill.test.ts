/**
 * The `silverpoint` skill (API delta §6, DD-050, T-245, T-247): hand-written templates plus
 * references generated from the agent catalog, committed under `skills/silverpoint/` and held to
 * the generator; its code examples are extracted for the example apps' compilers.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, test } from 'vitest';
import data from '../../packages/mcp/agent-catalog.json' with { type: 'json' };
import type { AgentCatalog } from '../../packages/mcp/src/types';
import { extractExamples, GUIDE_FILES, marketplaceManifest, pluginManifest, SKILL_DIR, skillFiles } from './skill';

const catalog = data as unknown as AgentCatalog;
const files = skillFiles(catalog);
const file = (path: string): string => {
  const content = files.get(path);
  if (content === undefined) throw new Error(`the skill has no ${path}`);
  return content;
};
const DESCRIPTION =
  'Build charts, dashboards and UI with the silverpoint library (React, Vue, Angular): choose the chart, write correct props, grounds and palettes. Use whenever code imports @silverpoint/* or the user mentions silverpoint charts.';

/** Every file under the committed skill, templates aside. */
function committed(dir = SKILL_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'templates' && dir === SKILL_DIR ? [] : committed(path);
    return [relative(SKILL_DIR, path)];
  });
}

describe('SKILL.md (REQ-552, REQ-554)', () => {
  const skill = file('SKILL.md');

  test('REQ-552 · frontmatter: the name and the description of API delta §6, verbatim', () => {
    const front = skill.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '';
    expect(front).toContain('name: silverpoint');
    expect(front).toContain(`description: ${DESCRIPTION}`);
  });

  test('REQ-554 · it names the version it describes', () => {
    expect(skill).toContain(`silverpoint ${catalog.version}`);
    expect(skill).toContain(`@silverpoint/*@${catalog.version}`);
  });

  test('REQ-554 · it tells the agent to prefer the MCP tools when they are connected', () => {
    expect(skill).toMatch(/prefer (?:its|the MCP) tools/i);
    for (const tool of ['recommend_chart', 'get_chart', 'generate_code', 'validate_props', 'render_chart']) expect(skill).toContain(`\`${tool}\``);
  });

  test('REQ-554 · under 500 lines, the rest in references', () => {
    expect(skill.split('\n').length).toBeLessThan(500);
  });

  test('REQ-552 · every chart and every component is named, and every reference it links exists', () => {
    for (const c of [...catalog.charts, ...catalog.components]) expect(skill, c.slug).toContain(`\`${c.slug}\``);
    const links = [...skill.matchAll(/\]\((references\/[^)#]+)\)/g)].map((m) => m[1]!);
    expect(links.length).toBeGreaterThan(10);
    for (const link of links) expect(files.has(link), link).toBe(true);
  });
});

describe('references (REQ-552)', () => {
  test('REQ-552 · one file per topic API delta §6 names, and one per chart family', () => {
    const topics = ['choosing-charts', 'components', 'overlays', 'grounds-and-palettes', 'dashboard', 'timeline', 'react', 'vue', 'angular', 'pitfalls'];
    for (const topic of topics) expect(files.has(`references/${topic}.md`), topic).toBe(true);
    for (const family of catalog.families) expect(files.has(`references/charts/${family.slug}.md`), family.slug).toBe(true);
  });

  test('REQ-552 · a chart’s reference holds its summary, its data shape, every own prop and an example per framework', () => {
    for (const chart of catalog.charts) {
      const text = file(`references/charts/${chart.family}.md`);
      const section = text.slice(text.indexOf(`## ${chart.names.react}`));
      const own = section.slice(0, section.indexOf('\n## ', 1) === -1 ? undefined : section.indexOf('\n## ', 1));
      expect(own, chart.slug).toContain(chart.summary);
      expect(own, chart.slug).toContain(`\`${chart.data.shape}\``);
      for (const prop of chart.props) expect(own, `${chart.slug}.${prop.name}`).toContain(`\`${prop.name}\``);
      for (const fence of ['```tsx', '```vue', '```ts angular']) expect(own, `${chart.slug} ${fence}`).toContain(fence);
    }
  });

  test('REQ-552 · the props tables are the catalog’s: types and defaults as generated', () => {
    const line = file('references/charts/lines.md').split('\n').find((l) => l.startsWith('| `curve` |'));
    expect(line).toBe("| `curve` | `LineCurve` | `'monotone'` |  |");
    const series = file('references/charts/lines.md').split('\n').find((l) => l.startsWith('| `series` |'));
    expect(series).toContain("`'all' \\| 'primary'`");
  });

  test('REQ-552 · the common chart props, the components and the overlays, each with its binding and events', () => {
    const common = file('references/choosing-charts.md');
    for (const prop of catalog.common.chart) expect(common, prop.name).toContain(`\`${prop.name}\``);
    for (const c of catalog.components) {
      const text = file(c.family === 'overlay' ? 'references/overlays.md' : 'references/components.md');
      expect(text, c.slug).toContain(`## ${c.names.react}`);
      for (const prop of c.props) expect(text, `${c.slug}.${prop.name}`).toContain(`\`${prop.name}\``);
    }
    expect(file('references/overlays.md')).toContain('`v-model:open`');
  });

  test('REQ-552 · grounds, palettes, the dashboard and the timeline from the catalog', () => {
    const grounds = file('references/grounds-and-palettes.md');
    for (const g of catalog.grounds) for (const s of g.substrates) expect(grounds).toContain(`\`${s}\``);
    for (const [name, palette] of Object.entries(catalog.palettes.presets)) {
      expect(grounds).toContain(`\`${name}\``);
      for (const colour of Object.values(palette)) expect(grounds).toContain(colour);
    }
    for (const prop of [...catalog.dashboard.props, ...catalog.dashboard.layout, ...catalog.dashboard.cell]) expect(file('references/dashboard.md')).toContain(`\`${prop.name}\``);
    expect(file('references/timeline.md')).toContain(catalog.timeline.peer);
  });

  test('REQ-554 · every reference names the version it describes', () => {
    for (const [path, content] of files) if (path.startsWith('references/')) expect(content, path).toContain(`silverpoint ${catalog.version}`);
  });
});

describe('the committed skill (DD-050)', () => {
  test('DD-050 · the files on disk are the generator’s, and nothing else is there', () => {
    expect(committed().sort()).toEqual([...files.keys()].sort());
    for (const [path, content] of files) expect(readFileSync(join(SKILL_DIR, path), 'utf8'), path).toBe(content);
  });

  test('DD-050 · the templates exist for every hand-written part', () => {
    for (const name of ['SKILL.md', 'react.md', 'vue.md', 'angular.md', 'pitfalls.md']) expect(existsSync(join(SKILL_DIR, 'templates', name)), name).toBe(true);
  });

  test('API delta §4 · the guides the server serves are files of the skill', () => {
    // Each topic is the reference of the same name; `ui-components` is components.md.
    expect(GUIDE_FILES).toEqual({
      'choosing-charts': 'references/choosing-charts.md',
      'grounds-and-palettes': 'references/grounds-and-palettes.md',
      dashboard: 'references/dashboard.md',
      'ui-components': 'references/components.md',
      overlays: 'references/overlays.md',
      timeline: 'references/timeline.md',
      react: 'references/react.md',
      vue: 'references/vue.md',
      angular: 'references/angular.md',
      reflex: 'references/reflex.md',
    });
    for (const path of Object.values(GUIDE_FILES)) expect(files.has(path), path).toBe(true);
  });
});

describe('the Claude plugin (REQ-555)', () => {
  const json = (path: string) => JSON.parse(readFileSync(join(SKILL_DIR, '../..', path), 'utf8')) as Record<string, any>;

  test('REQ-555 · the marketplace lists one plugin, `silverpoint`, from this repository, at the version described', () => {
    const marketplace = json('.claude-plugin/marketplace.json');
    expect(marketplace.name).toBe('silverpoint');
    expect(marketplace.owner?.name).toBeTruthy();
    expect(marketplace.plugins).toEqual([expect.objectContaining({ name: 'silverpoint', source: './', version: catalog.version })]);
  });

  test('REQ-555 · the plugin installs the skill and the hosted MCP server', () => {
    const plugin = json('.claude-plugin/plugin.json');
    expect(plugin).toMatchObject({ name: 'silverpoint', version: catalog.version, skills: ['./skills/silverpoint'] });
    expect(plugin.mcpServers).toEqual({ silverpoint: { type: 'http', url: 'https://silverpointweb.vercel.app/mcp' } });
  });

  test('REQ-555 · `generate` keeps both versions on the catalog’s', () => {
    const plugin = readFileSync(join(SKILL_DIR, '../../.claude-plugin/plugin.json'), 'utf8');
    expect(pluginManifest(plugin, '9.9.9')).toContain('"version": "9.9.9"');
    expect(JSON.parse(pluginManifest(plugin, '9.9.9'))).toEqual({ ...JSON.parse(plugin), version: '9.9.9' });
    const marketplace = readFileSync(join(SKILL_DIR, '../../.claude-plugin/marketplace.json'), 'utf8');
    expect(JSON.parse(marketplaceManifest(marketplace, '9.9.9')).plugins[0].version).toBe('9.9.9');
  });
});

describe('example extraction (REQ-557)', () => {
  const md = (body: string) => new Map([['references/x.md', body]]);

  test('REQ-557 · tsx is React, vue is Vue, `ts <framework>` names its app, python is Reflex', () => {
    const found = extractExamples(md('```tsx\nA\n```\n\n```vue\nB\n```\n\n```ts angular\nC\n```\n\n```ts vue\nD\n```\n\n```python\nE\n```\n'));
    expect(found.map((e) => [e.framework, e.ext, e.code])).toEqual([
      ['react', 'tsx', 'A\n'],
      ['vue', 'vue', 'B\n'],
      ['angular', 'ts', 'C\n'],
      ['vue', 'ts', 'D\n'],
      ['reflex', 'py', 'E\n'],
    ]);
    expect(new Set(found.map((e) => e.name)).size).toBe(5);
  });

  test('REQ-557 · shell, CSS, JSON and text are not code to compile; any other fence is refused', () => {
    expect(extractExamples(md('```sh\nnpm i\n```\n```css\na{}\n```\n```json\n{}\n```\n```text\nx\n```\n'))).toEqual([]);
    expect(() => extractExamples(md('```ts\nconst a = 1;\n```\n'))).toThrow(/references\/x\.md.*ts/);
    expect(() => extractExamples(md('```html\n<sp-line-chart />\n```\n'))).toThrow(/html/);
    expect(() => extractExamples(md('```js react\nconst a = 1;\n```\n'))).toThrow(/js react/);
    expect(() => extractExamples(md('```tsx vue\nconst a = 1;\n```\n'))).toThrow(/tsx vue/);
    expect(() => extractExamples(md('```ts svelte\nconst a = 1;\n```\n'))).toThrow(/ts svelte/);
    expect(() => extractExamples(md('```\nbare\n```\n'))).toThrow(/language/);
  });

  test('REQ-557 · every example of the skill is extracted: one per fence, none refused', () => {
    const examples = extractExamples(files);
    const fences = [...files.values()].join('\n').match(/^```(?:tsx|vue|ts \w+|python)$/gm) ?? [];
    expect(examples).toHaveLength(fences.length);
    expect(examples.filter((e) => e.framework === 'react').length).toBeGreaterThanOrEqual(catalog.charts.length);
    expect(examples.filter((e) => e.framework === 'reflex').length).toBeGreaterThan(0);
  });

  test('REQ-557 · an example is named after its file, so a failure points at it', () => {
    const [example] = extractExamples(new Map([['references/charts/flows.md', '```tsx\nA\n```\n']]));
    expect(example!.name).toMatch(/^references-charts-flows-\d+$/);
  });
});
