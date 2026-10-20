/**
 * The agent catalog (feature-005 §6.14.1, Data Model §2.28): one document generated from the
 * published types, the chart and UI catalogs, the adapters, the demos and one metadata file.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { UI_COMPONENTS } from '../../packages/core/src/ui/catalog';
import type { AgentCatalog, ReflexCatalog } from '../../packages/mcp/src/types';
import { CATALOG } from '../visual-gate/catalog';
import { buildAgentCatalog, CATALOG_FILE, joinReflex, serialise } from './catalog';
import { checkCatalog } from './check';
import { CHART_META, FAMILIES } from './charts.meta';
import { propsReference } from './props';

const catalog = await buildAgentCatalog();
const reference = propsReference();
const SHAPES = ['series', 'categories', 'parts', 'matrix', 'hierarchy', 'links', 'points', 'distribution', 'intervals', 'events', 'single', 'field'];
const INTENTS = ['trend', 'compare', 'rank', 'part-to-whole', 'distribution', 'correlation', 'flow', 'hierarchy', 'change', 'uncertainty', 'progress', 'schedule', 'kpi', 'network'];
const chart = (slug: string) => catalog.charts.find((c) => c.slug === slug)!;
const component = (slug: string) => catalog.components.find((c) => c.slug === slug)!;

describe('the charts (REQ-531)', () => {
  test('REQ-531 · the 60 charts, in catalog order', () => {
    expect(catalog.charts.map((c) => c.slug)).toEqual(CATALOG.map((c) => c.slug));
    expect(catalog.charts).toHaveLength(60);
  });

  test('REQ-531 · names and import paths in React, Vue, Angular and Reflex (API Spec §4)', () => {
    expect(chart('sankey-chart').names).toEqual({ react: 'SankeyChart', vue: 'SpSankeyChart', angular: 'sp-sankey-chart', reflex: 'sankey_chart' });
    expect(chart('sankey-chart').imports).toEqual({
      react: '@silverpoint/react/sankey-chart',
      vue: '@silverpoint/vue/sankey-chart',
      angular: '@silverpoint/angular/sankey-chart',
      reflex: 'reflex_silverpoint_react',
    });
  });

  test('REQ-531 · REQ-536 · every chart has a family, a summary, a data shape and an intent', () => {
    const families = FAMILIES.map((f) => f.slug);
    for (const c of catalog.charts) {
      expect(families, c.slug).toContain(c.family);
      expect(c.summary.length, c.slug).toBeGreaterThan(10);
      expect(SHAPES, c.slug).toContain(c.data.shape);
      expect(c.intents.length, c.slug).toBeGreaterThan(0);
      for (const intent of c.intents) expect(INTENTS, c.slug).toContain(intent);
    }
  });

  test('REQ-530 · I-38 · a chart’s props are the props reference’s, name, type, optionality and doc', () => {
    for (const { chart: name, own } of reference.charts) {
      const entry = catalog.charts.find((c) => c.names.react === name)!;
      expect(entry.props.map(({ name: n, type, optional, doc }) => ({ name: n, type, optional, doc })), name).toEqual(own);
    }
    expect(catalog.common.chart.map((p) => p.name)).toEqual(reference.common.map((p) => p.name));
  });

  test('REQ-530 · defaults come from the core’s own fallbacks and API Spec §5.1, never typed by hand', () => {
    expect(chart('sankey-chart').props.find((p) => p.name === 'sourceKey')?.default).toBe("'source'");
    expect(chart('line-chart').props.find((p) => p.name === 'curve')?.default).toBe("'monotone'");
    expect(chart('donut-chart').props.find((p) => p.name === 'legend')?.default).toBe('true');
    expect(catalog.common.chart.find((p) => p.name === 'ground')?.default).toBe("'silverpoint'");
    expect(catalog.common.chart.find((p) => p.name === 'hatchFill')?.default).toBe("'tile'");
    expect(catalog.common.chart.find((p) => p.name === 'height')?.default).toBe('160');
  });

  test('REQ-541 · I-41 · every data field names an accessor prop of its chart', () => {
    for (const c of catalog.charts) {
      for (const field of c.data.fields) expect(c.props.map((p) => p.name), `${c.slug}.${field.role}`).toContain(field.prop);
    }
  });

  test('REQ-531 · each chart names its demo dataset and the keys the demo reads', () => {
    expect(chart('beeswarm-chart').demo).toBe('BEESWARM_CHART_DEMO');
    expect(chart('beeswarm-chart').demoKeys).toEqual({ valueKey: 'minutes', labelKey: 'reader' });
    expect(chart('beeswarm-chart').demoSample).toHaveLength(3);
    expect(Object.keys(chart('beeswarm-chart').demoSample![0] as object)).toEqual(expect.arrayContaining(['minutes', 'reader']));
    expect(chart('gauge-arc').demo).toBeUndefined();
    expect(catalog.charts.filter((c) => !c.demo).map((c) => c.slug)).toEqual(['gauge-arc', 'meter-chart']);
  });

  test('REQ-439 · the drillable charts are the two that take `rootId`', () => {
    expect(catalog.charts.filter((c) => c.drillable).map((c) => c.slug)).toEqual(['squarified-treemap', 'sunburst-chart']);
  });
});

describe('the components (REQ-532)', () => {
  test('REQ-532 · the 38 components, in UI_COMPONENTS order, with family, group and states', () => {
    expect(catalog.components.map((c) => c.slug)).toEqual(UI_COMPONENTS.map((c) => c.slug));
    for (const row of UI_COMPONENTS) {
      expect(component(row.slug), row.slug).toMatchObject({ family: row.family, group: row.group, states: row.states });
      expect(component(row.slug).summary.length, row.slug).toBeGreaterThan(10);
    }
  });

  test('REQ-532 · names and imports per framework, the Angular names read from the selectors', () => {
    expect(component('select').names).toEqual({ react: 'SpSelect', vue: 'SpSelect', angular: 'sp-select', reflex: 'sp_select' });
    expect(component('select').imports.angular).toBe('@silverpoint/angular/ui/select');
    expect(component('button').names.angular).toBe('button[spButton]');
    expect(component('surface').names.angular).toBe('[spSurface]');
  });

  test('REQ-532 · I-38 · a component’s props are the props reference’s', () => {
    for (const { slug, own } of reference.ui.components) {
      expect(component(slug).props.map(({ name, type, optional, doc }) => ({ name, type, optional, doc })), slug).toEqual(own);
    }
    expect(catalog.common.ui.map((p) => p.name)).toEqual(reference.ui.common.map((p) => p.name));
  });

  test('REQ-532 · value and open bindings per framework, read from the adapters', () => {
    expect(component('select').binding).toEqual({
      value: { react: 'value + onChange', vue: 'v-model', angular: '[(value)]' },
      open: { react: 'open + onOpenChange', vue: 'v-model:open', angular: '[(open)]' },
    });
    expect(component('checkbox').binding?.value).toEqual({ react: 'checked + onChange', vue: 'v-model', angular: '[(value)]' });
    expect(component('pagination').binding?.value).toEqual({ react: 'current + onChange', vue: 'v-model:current', angular: '[(current)]' });
    expect(component('card').binding).toBeUndefined();
  });

  test('REQ-532 · events and slots per framework, read from the adapters', () => {
    expect(component('table').events).toEqual({ react: ['onSort'], vue: ['sort'], angular: ['sort'] });
    expect(component('modal').slots.vue).toEqual(['default', 'footer', 'trigger']);
    expect(component('modal').slots.react).toEqual(['children', 'footer', 'trigger']);
    expect(component('modal').slots.angular).toEqual(['content', 'spFooter', 'spTrigger']);
  });
});

describe('the rest of the API (REQ-533)', () => {
  test('REQ-533 · the dashboard, with its layout and cell, named per framework', () => {
    expect(catalog.dashboard.names).toEqual({ react: 'Dashboard', vue: 'SpDashboard', angular: 'sp-dashboard', reflex: 'dashboard' });
    expect(catalog.dashboard.layout.map((p) => p.name)).toEqual(['columns', 'rowHeight', 'gap', 'cells']);
  });

  test('REQ-533 · the two grounds and their substrates', () => {
    expect(catalog.grounds.map((g) => g.name)).toEqual(['silverpoint', 'cyanotype']);
    expect(catalog.grounds[0]!.substrates).toContain('cream');
    expect(catalog.grounds[1]!.substrates).toEqual(['prussian']);
  });

  test('REQ-533 · the six palette presets and the palette fields', () => {
    expect(Object.keys(catalog.palettes.presets)).toEqual(['silverpoint', 'sanguine', 'sepia', 'ironGall', 'verdigris', 'indigo']);
    expect(catalog.palettes.fields.map((p) => p.name)).toEqual(reference.palette.map((p) => p.name));
  });

  test('REQ-533 · the timeline and its optional peer', () => {
    expect(catalog.timeline.names.react).toBe('SpTimeline');
    expect(catalog.timeline.imports.vue).toBe('@silverpoint/vue/timeline');
    expect(catalog.timeline.peer).toBe('@knight-lab/timelinejs@^3.9.13');
  });

  test('REQ-533 · the 25 diagnostic codes with their requirement, severity, condition and remedy', () => {
    expect(catalog.diagnostics.map((d) => d.code)).toEqual(Array.from({ length: 25 }, (_, i) => `SP${String(i + 1).padStart(3, '0')}`));
    expect(catalog.diagnostics.find((d) => d.code === 'SP009')).toMatchObject({ severity: 'error', req: 'REQ-097' });
    expect(catalog.diagnostics.find((d) => d.code === 'SP001')).toMatchObject({ severity: 'warn', req: 'REQ-007' });
    for (const d of catalog.diagnostics) expect(d.what.length * d.todo.length, d.code).toBeGreaterThan(0);
  });

  test('REQ-533 · the stylesheets a page imports', () => {
    expect(catalog.stylesheets.always).toEqual(['@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css']);
    expect(catalog.stylesheets.ui).toEqual(['@silverpoint/grounds/ui.css']);
  });
});

describe('versions (REQ-534, REQ-556)', () => {
  const core = JSON.parse(readFileSync(new URL('../../packages/core/package.json', import.meta.url), 'utf8')) as { version: string };

  test('REQ-534 · I-39 · the catalog carries the library version it describes', () => {
    expect(catalog.version).toBe(core.version);
    expect(catalog.reflex.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(catalog.reflex.stale).toBe(catalog.reflex.wraps !== catalog.version);
  });

  test('REQ-556 · I-40 · a Reflex catalog that wraps another version marks every Reflex entry stale', () => {
    const reflex: ReflexCatalog = { schema: 1, package: 'reflex-silverpoint-react', version: '9.9.9', wraps: '0.0.1', charts: [], components: [], helpers: [] };
    const joined = joinReflex(catalog, reflex);
    expect(joined.reflex).toEqual({ version: '9.9.9', wraps: '0.0.1', stale: true });
    expect(joined.charts.every((c) => c.stale === '0.0.1')).toBe(true);
    expect(joined.components.every((c) => c.stale === '0.0.1')).toBe(true);
  });

  test('REQ-556 · a release build fails on a stale Reflex catalog; an ordinary build only reports it', () => {
    const stale: AgentCatalog = { ...catalog, reflex: { ...catalog.reflex, wraps: '0.0.1', stale: true } };
    expect(checkCatalog(stale, { release: false }).errors.filter((e) => e.includes('REQ-556'))).toEqual([]);
    expect(checkCatalog(stale, { release: true }).errors.join('\n')).toMatch(/REQ-556/);
  });

  test('REQ-553 · Reflex names and snake_case props are joined by slug', () => {
    expect(chart('sankey-chart').props.find((p) => p.name === 'sourceKey')?.reflex).toBe('source_key');
    expect(catalog.common.chart.find((p) => p.name === 'hatchFill')?.reflex).toBe('hatch_fill');
    expect(component('input-number').names.reflex).toBe('sp_input_number');
  });
});

describe('drift (REQ-535, REQ-536)', () => {
  test('REQ-535 · Art. 4 · generation is stable', async () => {
    expect(serialise(await buildAgentCatalog())).toBe(serialise(catalog));
  });

  test('REQ-535 · the committed catalog is current', () => {
    expect(readFileSync(CATALOG_FILE, 'utf8')).toBe(serialise(catalog));
  });

  test('REQ-536 · I-37 · the catalog and the adapters’ exports name the same charts and components', () => {
    expect(checkCatalog(catalog, { release: false }).errors).toEqual([]);
  });

  test('REQ-536 · a chart the adapters export but the catalog lacks, or a chart without an intent, fails the check', () => {
    const missing: AgentCatalog = { ...catalog, charts: catalog.charts.slice(1) };
    expect(checkCatalog(missing, { release: false }).errors.join('\n')).toMatch(/line-chart/);
    const vague: AgentCatalog = { ...catalog, charts: catalog.charts.map((c, i) => (i === 0 ? { ...c, intents: [] } : c)) };
    expect(checkCatalog(vague, { release: false }).errors.join('\n')).toMatch(/line-chart.*intent/);
  });

  test('REQ-536 · a chart the catalog names but no adapter exports fails the check', () => {
    const imaginary: AgentCatalog = { ...catalog, charts: [...catalog.charts, { ...catalog.charts[0]!, slug: 'imaginary-chart' }] };
    expect(checkCatalog(imaginary, { release: false }).errors.join('\n')).toMatch(/imaginary-chart, which @silverpoint\/react does not export/);
  });

  test('REQ-541 · I-41 · a data field naming a prop its chart lacks fails the check', () => {
    const wrong: AgentCatalog = {
      ...catalog,
      charts: catalog.charts.map((c, i) => (i === 0 ? { ...c, data: { ...c.data, fields: [{ role: 'x', prop: 'notAProp', type: 'string' as const, required: true }] } } : c)),
    };
    expect(checkCatalog(wrong, { release: false }).errors.join('\n')).toMatch(/I-41 · line-chart.*notAProp/);
  });

  test('REQ-536 · every metadata row is a catalog chart', () => {
    expect(Object.keys(CHART_META).sort()).toEqual(CATALOG.map((c) => c.slug).sort());
  });
});
