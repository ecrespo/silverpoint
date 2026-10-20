/**
 * The read-only tools of `@silverpoint/mcp` (API delta §3): pure functions of their input and the
 * catalog, with the error contract of REQ-549.
 */
import { describe, expect, test } from 'vitest';
import { AGENT_CATALOG, Catalog } from '../src/catalog';
import { ToolError } from '../src/errors';
import { getChart, getComponent, listCharts, listComponents } from '../src/tools/entries';
import { getVersion } from '../src/tools/version';
import { searchCatalog } from '../src/tools/search';
import core from '../../core/package.json' with { type: 'json' };

const catalog = new Catalog(AGENT_CATALOG);

/** The tool error a call raises, or a failure when it raises none. */
function errorOf(call: () => unknown): ToolError {
  try {
    call();
  } catch (error) {
    if (error instanceof ToolError) return error;
    throw error;
  }
  throw new Error('expected a tool error');
}

describe('names (REQ-549)', () => {
  test('REQ-549 · a chart is found by its slug or by its name in any framework', () => {
    for (const name of ['sankey-chart', 'SankeyChart', 'SpSankeyChart', 'sp-sankey-chart', 'sankey_chart', 'sankeychart']) {
      expect(catalog.chart(name).slug, name).toBe('sankey-chart');
    }
    expect(catalog.component('sp_select').slug).toBe('select');
    expect(catalog.component('button[spButton]').slug).toBe('button');
  });

  test('REQ-549 · an unknown chart is a tool error naming the closest valid names, never an exception', () => {
    const error = errorOf(() => catalog.chart('sankie'));
    expect(error.code).toBe('unknown_name');
    expect(error.suggestions[0]).toBe('sankey-chart');
    expect(error.suggestions.length).toBeLessThanOrEqual(3);
    expect(errorOf(() => catalog.chart('pie')).suggestions.length).toBeGreaterThan(0);
  });

  test('REQ-549 · unknown frameworks, components, grounds, substrates and palettes are tool errors with suggestions', () => {
    expect(errorOf(() => catalog.framework('svelte')).suggestions).toEqual(expect.arrayContaining(['react', 'vue', 'angular', 'reflex']));
    expect(errorOf(() => catalog.framework('reactjs')).suggestions[0]).toBe('react');
    expect(errorOf(() => catalog.component('Selekt')).suggestions[0]).toBe('select');
    expect(errorOf(() => catalog.ground('cyanotipe')).suggestions[0]).toBe('cyanotype');
    expect(errorOf(() => catalog.substrate('silverpoint', 'creme')).suggestions[0]).toBe('cream');
    expect(errorOf(() => catalog.palette('sanguin')).suggestions[0]).toBe('sanguine');
  });
});

describe('get_version (REQ-550)', () => {
  test('REQ-550 · the library version, the Reflex wrapper it is joined with, and the MCP protocol', () => {
    const version = getVersion(catalog);
    expect(version.version).toBe(core.version);
    expect(version.reflex).toEqual(AGENT_CATALOG.reflex);
    expect(version.protocol).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('list_charts and get_chart (REQ-539)', () => {
  test('REQ-539 · every chart, filterable by family, intent and shape', () => {
    expect(listCharts(catalog, {}).charts).toHaveLength(60);
    const flows = listCharts(catalog, { family: 'flows' }).charts;
    expect(flows.map((c) => c.slug)).toEqual(['sankey-chart', 'chord-ring']);
    expect(flows[0]).toEqual({ slug: 'sankey-chart', family: 'flows', summary: expect.any(String), intents: ['flow', 'part-to-whole'], shape: 'links' });
    expect(listCharts(catalog, { intent: 'uncertainty', shape: 'intervals' }).charts.map((c) => c.slug)).toEqual(['range-band-chart', 'error-bar-chart']);
  });

  test('REQ-549 · an unknown family, intent or shape is a tool error with suggestions', () => {
    expect(errorOf(() => listCharts(catalog, { family: 'flow' })).suggestions[0]).toBe('flows');
    expect(errorOf(() => listCharts(catalog, { intent: 'trends' })).suggestions[0]).toBe('trend');
    expect(errorOf(() => listCharts(catalog, { shape: 'tree' })).code).toBe('unknown_name');
  });

  test('REQ-539 · a chart’s whole entry, or one framework’s names, import and prop spelling', () => {
    expect(getChart(catalog, { slug: 'SankeyChart' }).chart.slug).toBe('sankey-chart');
    const reflex = getChart(catalog, { slug: 'sankey-chart', framework: 'reflex' }).chart;
    expect(reflex).toMatchObject({ slug: 'sankey-chart', framework: 'reflex', name: 'sankey_chart', import: 'reflex_silverpoint_react' });
    expect(reflex.props.map((p: { name: string }) => p.name)).toContain('source_key');
    expect(reflex.common.map((p: { name: string }) => p.name)).toContain('hatch_fill');
    const vue = getChart(catalog, { slug: 'sankey-chart', framework: 'vue' }).chart;
    expect(vue).toMatchObject({ name: 'SpSankeyChart', import: '@silverpoint/vue/sankey-chart' });
    expect(vue.props.map((p: { name: string }) => p.name)).toContain('sourceKey');
  });
});

describe('list_components and get_component (REQ-539)', () => {
  test('REQ-539 · every component, filterable by family and group', () => {
    expect(listComponents(catalog, {}).components).toHaveLength(38);
    expect(listComponents(catalog, { family: 'overlay' }).components.map((c) => c.slug)).toEqual(['modal', 'drawer', 'popover', 'tooltip', 'select', 'dropdown-menu', 'toast']);
    expect(listComponents(catalog, { group: 'navigation' }).components.map((c) => c.slug)).toEqual(['tabs', 'steps', 'pagination', 'breadcrumb']);
    expect(errorOf(() => listComponents(catalog, { group: 'navigaton' })).suggestions[0]).toBe('navigation');
  });

  test('REQ-539 · a component’s entry for one framework carries its binding, events and slots in that framework’s terms', () => {
    const angular = getComponent(catalog, { slug: 'select', framework: 'angular' }).component;
    expect(angular).toMatchObject({ name: 'sp-select', import: '@silverpoint/angular/ui/select', binding: { value: '[(value)]', open: '[(open)]' } });
    const vue = getComponent(catalog, { slug: 'modal', framework: 'vue' }).component;
    expect(vue.slots).toEqual(['default', 'footer', 'trigger']);
    expect(getComponent(catalog, { slug: 'modal' }).component.slots).toEqual(AGENT_CATALOG.components.find((c) => c.slug === 'modal')!.slots);

    // Reflex wraps React: its components bind, emit and take content as the React ones, spelled in Python.
    const reflex = getComponent(catalog, { slug: 'select', framework: 'reflex' }).component;
    expect(reflex).toMatchObject({ name: 'sp_select', binding: { value: 'value + onChange' }, events: ['onChange', 'onOpenChange'] });
    expect(getComponent(catalog, { slug: 'card', framework: 'reflex' }).component.props.map((p: { name: string }) => p.name)).toContain('heading_level');
  });
});

describe('search_catalog (REQ-539)', () => {
  test('REQ-539 · a token match over names, summaries, docs and diagnostics, best first', () => {
    const hits = searchCatalog(catalog, { query: 'sankey flow' }).hits;
    expect(hits[0]).toMatchObject({ kind: 'chart', slug: 'sankey-chart' });
    expect(searchCatalog(catalog, { query: 'SP009' }).hits[0]).toMatchObject({ kind: 'diagnostic', slug: 'SP009' });
    expect(searchCatalog(catalog, { query: 'sourceKey' }).hits.some((h) => h.kind === 'prop' && h.slug === 'sankey-chart.sourceKey')).toBe(true);
    expect(searchCatalog(catalog, { query: 'dialog' }).hits.some((h) => h.kind === 'component' && h.slug === 'modal')).toBe(true);
  });

  test('REQ-539 · at most 20 hits; deterministic for identical input (Art. 4)', () => {
    expect(searchCatalog(catalog, { query: 'chart', limit: 500 }).hits).toHaveLength(20);
    expect(searchCatalog(catalog, { query: 'chart' }).hits).toHaveLength(10);
    expect(searchCatalog(catalog, { query: 'value' })).toEqual(searchCatalog(catalog, { query: 'value' }));
    expect(searchCatalog(catalog, { query: 'zzzz' }).hits).toEqual([]);
  });
});
