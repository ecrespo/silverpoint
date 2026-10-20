/**
 * `generate_code` (API delta §3, REQ-541, REQ-547): code from the catalog's names, paths and props
 * alone, the user's field names as accessors. The golden files under `golden/` are the reviewable
 * contract, and `tools/agent-catalog/typecheck-golden.ts` compiles them in the example apps (REQ-557).
 */
import { describe, expect, test } from 'vitest';
import { AGENT_CATALOG, Catalog } from '../src/catalog';
import { ToolError } from '../src/errors';
import { generateCode, type GenerateInput } from '../src/codegen';
import { GOLDEN_CASES } from './golden-cases';

const catalog = new Catalog(AGENT_CATALOG);
const generate = (input: GenerateInput) => generateCode(catalog, input);

function errorOf(call: () => unknown): ToolError {
  try {
    call();
  } catch (error) {
    if (error instanceof ToolError) return error;
    throw error;
  }
  throw new Error('expected a tool error');
}

describe('generate_code goldens (REQ-541, REQ-566)', () => {
  test.each(GOLDEN_CASES.map((c) => [c.file, c] as const))('REQ-541 · golden/%s', async (file, { input }) => {
    await expect(generate(input).code).toMatchFileSnapshot(`golden/${file}`);
  });
});

describe('generate_code (REQ-541)', () => {
  const sankey = (framework: string) =>
    generate({ target: { chart: 'sankey-chart' }, framework, fields: { source: 'from', target: 'to', value: 'count' }, props: { title: 'Signup flow' } });

  test.each(['react', 'vue', 'angular'])('REQ-541 · %s: the chart’s own import, the stylesheets, the user’s fields as accessors', (framework) => {
    const result = sankey(framework);
    const chart = catalog.chart('sankey-chart');
    expect(result.imports).toContain(chart.imports[framework as 'react']);
    expect(result.stylesheets).toEqual(AGENT_CATALOG.stylesheets.always);
    for (const sheet of result.stylesheets) expect(result.code).toContain(sheet);
    for (const field of ['from', 'to', 'count']) expect(result.code).toContain(field);
    expect(result.code).toContain('Signup flow');
  });

  test('REQ-541 · reflex: snake_case props from the Reflex catalog, one import, rows from State', () => {
    const result = sankey('reflex');
    expect(result.imports).toEqual(['reflex', 'reflex_silverpoint_react']);
    expect(result.code).toContain('source_key="from"');
    expect(result.code).toContain('data=State.rows');
    expect(result.notes.join(' ')).toMatch(/State\.rows/);
  });

  test('REQ-541 · every import the code names is one the catalog holds', () => {
    const known = new Set([
      ...AGENT_CATALOG.charts.flatMap((c) => Object.values(c.imports)),
      ...AGENT_CATALOG.components.flatMap((c) => Object.values(c.imports)),
      '@silverpoint/core/palettes',
      'react',
      'vue',
      '@angular/core',
      'reflex',
    ]);
    for (const { input } of GOLDEN_CASES) for (const path of generate(input).imports) expect(known.has(path), path).toBe(true);
  });

  test('REQ-541 · a title is given when neither title nor label is', () => {
    expect(generate({ target: { chart: 'bar-chart' }, framework: 'react' }).code).toContain('title="Bar chart"');
    expect(generate({ target: { chart: 'bar-chart' }, framework: 'react', props: { label: 'Visits' } }).code).not.toContain('title=');
  });

  test('REQ-541 · a field holding several columns takes a list', () => {
    const code = generate({ target: { chart: 'stream-chart' }, framework: 'react', fields: { x: 'day', values: ['hits', 'misses'] } }).code;
    expect(code).toContain("keys={['hits', 'misses']}");
  });

  test('REQ-541 · a palette preset is imported from the core in React, Vue and Angular, named in Reflex', () => {
    const react = generate({ target: { chart: 'line-chart' }, framework: 'react', palette: 'sanguine' });
    expect(react.imports).toContain('@silverpoint/core/palettes');
    expect(react.code).toContain('palette={sanguine}');
    const reflex = generate({ target: { chart: 'line-chart' }, framework: 'reflex', palette: 'ironGall' });
    expect(reflex.code).toContain('palette="iron_gall"');
  });

  test('REQ-541 · a component starts from its catalog demo, its value bound to state', () => {
    const select = generate({ target: { component: 'select' }, framework: 'react' });
    expect(select.stylesheets).toEqual([...AGENT_CATALOG.stylesheets.always, ...AGENT_CATALOG.stylesheets.ui]);
    expect(select.code).toMatch(/useState/);
    expect(select.code).toContain('onChange={setValue}');
    expect(generate({ target: { component: 'select' }, framework: 'vue' }).code).toContain('v-model="value"');
    expect(generate({ target: { component: 'select' }, framework: 'angular' }).code).toContain('[(value)]="value"');
  });
});

describe('REQ-547 · no pattern the example apps do not run', () => {
  test.each(['react', 'vue', 'angular', 'reflex'])('REQ-547 · %s overlays take a native button as their trigger, never SpButton', (framework) => {
    for (const slug of ['modal', 'drawer', 'popover', 'tooltip']) {
      const code = generate({ target: { component: slug }, framework }).code;
      expect(code, slug).not.toMatch(/SpButton|spButton|sp_button/);
      if (framework === 'reflex') expect(code, slug).toMatch(/trigger="/);
      else expect(code, slug).toMatch(/<button type="button"/);
    }
  });
});

describe('generate_code errors (REQ-549)', () => {
  test('REQ-549 · an unknown role, prop, ground, substrate, mode or palette names the closest', () => {
    expect(errorOf(() => generate({ target: { chart: 'sankey-chart' }, framework: 'react', fields: { sorce: 'from' } })).suggestions[0]).toBe('source');
    expect(errorOf(() => generate({ target: { chart: 'sankey-chart' }, framework: 'react', props: { sourceKye: 'from' } })).suggestions[0]).toBe('sourceKey');
    expect(errorOf(() => generate({ target: { chart: 'bar-chart' }, framework: 'react', ground: 'cyanotipe' })).suggestions[0]).toBe('cyanotype');
    expect(errorOf(() => generate({ target: { chart: 'bar-chart' }, framework: 'react', ground: 'cyanotype', substrate: 'cream' })).code).toBe('unknown_name');
    expect(errorOf(() => generate({ target: { chart: 'bar-chart' }, framework: 'react', mode: 'pencil' })).suggestions).toContain('precision');
    expect(errorOf(() => generate({ target: { chart: 'bar-chart' }, framework: 'react', palette: 'sanguin' })).suggestions[0]).toBe('sanguine');
  });

  test('REQ-549 · a target names exactly one chart or one component; rows come from the code, not from props', () => {
    expect(errorOf(() => generate({ target: {}, framework: 'react' })).code).toBe('invalid_input');
    expect(errorOf(() => generate({ target: { chart: 'bar-chart', component: 'modal' }, framework: 'react' })).code).toBe('invalid_input');
    expect(errorOf(() => generate({ target: { chart: 'bar-chart' }, framework: 'react', props: { data: [] } })).code).toBe('invalid_input');
    expect(errorOf(() => generate({ target: { chart: 'bar-chart' }, framework: 'svelte' })).code).toBe('unknown_name');
  });
});
