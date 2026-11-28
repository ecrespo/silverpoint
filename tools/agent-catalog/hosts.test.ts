/**
 * T-313 · the host catalog, a projection of the agent catalog computed by rules (REQ-653..REQ-655,
 * DD-066; I-58). Hand-written expectations for four representative charts come first: the oracle is
 * this file, not the generator.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { buildAgentCatalog } from './catalog';
import { buildHostCatalog, HOST_CATALOG_FILE, hostCatalogSource } from './hosts';
import { HOSTS } from './hosts.meta';

const agent = await buildAgentCatalog();
const hosts = await buildHostCatalog(agent);
const chart = (slug: string) => hosts.charts.find((c) => c.slug === slug)!;

describe('the host catalog (REQ-654)', () => {
  test('REQ-658 · schema 1 and the library version', () => {
    expect(hosts.schema).toBe(1);
    expect(hosts.version).toBe(agent.version);
  });

  test("REQ-654 · 60 charts, in the agent catalog's order", () => {
    expect(hosts.charts.map((c) => c.slug)).toEqual(agent.charts.map((c) => c.slug));
  });

  test('REQ-654 · bar-chart: rows, three roles, one enum option, the demo with its keys', () => {
    const bar = chart('bar-chart');
    expect(bar).toMatchObject({ slug: 'bar-chart', title: 'Bar chart', family: 'bars', shape: 'categories', binding: 'rows' });
    expect(bar.roles).toEqual([
      { id: 'x', prop: 'xKey', label: 'X', kind: 'dimension', dataType: 'string', required: true, multiple: false },
      { id: 'value', prop: 'valueKey', label: 'Value', kind: 'measure', dataType: 'number', required: true, multiple: false },
      { id: 'secondary', prop: 'secondaryKey', label: 'Secondary', kind: 'measure', dataType: 'number', required: false, multiple: false },
    ]);
    expect(bar.options).toEqual([expect.objectContaining({ name: 'orientation', kind: 'enum', values: ['columns', 'rows'], label: 'Orientation' })]);
    expect(bar.demo!.roles).toEqual({ x: 'x', value: 'value', secondary: 'previous' });
    expect(bar.demo!.rows.length).toBeGreaterThan(2);
  });

  test('REQ-657 · heatmap-chart: pivot to a matrix from row, column and value', () => {
    const heat = chart('heatmap-chart');
    expect(heat).toMatchObject({ binding: 'pivot', reshape: 'matrix' });
    expect(heat.roles.map((r) => [r.id, r.prop, r.kind])).toEqual([
      ['row', null, 'dimension'],
      ['column', null, 'dimension'],
      ['value', null, 'measure'],
    ]);
    expect(heat.options.map((o) => o.name)).toEqual(['scaleMax']);
    expect(heat.demo!.rows[0]).toEqual({ row: 'Mon', column: 'C1', value: 12 });
  });

  test('REQ-657 · gauge-arc: scalar from the first row; percent is the role, not an option', () => {
    const gauge = chart('gauge-arc');
    expect(gauge).toMatchObject({ binding: 'scalar', reshape: 'first-row' });
    expect(gauge.roles.map((r) => r.id)).toEqual(['percent']);
    expect(gauge.options.map((o) => o.name)).toEqual(['caption', 'readout']);
    expect(gauge.demo).toEqual({ roles: { percent: 'percent' }, rows: [{ percent: 72 }] });
  });

  test('OQ-H3 · orbit-chart: none, with its reason, no roles, no demo', () => {
    const orbit = chart('orbit-chart');
    expect(orbit.binding).toBe('none');
    expect(orbit.reason).toMatch(/markers/);
    expect(orbit.roles).toEqual([]);
    expect(orbit.demo).toBeUndefined();
  });

  test('REQ-654 · a role whose prop takes a list of names is multiple (stacked-bar-chart keys)', () => {
    expect(chart('stacked-bar-chart').roles.find((r) => r.id === 'values')).toMatchObject({ prop: 'keys', multiple: true, kind: 'measure' });
    expect(chart('stacked-bar-chart').demo!.roles.values).toEqual(['free', 'pro', 'team']);
  });

  test('REQ-654 · aliased unions are enums (ChartOrientation, LineCurve)', () => {
    expect(chart('box-plot-chart').options.find((o) => o.name === 'orientation')).toMatchObject({ kind: 'enum', values: ['columns', 'rows'] });
    expect(chart('line-chart').options.find((o) => o.name === 'curve')).toMatchObject({ kind: 'enum' });
  });

  test('I-58 · every role prop and option name is a declared prop of its chart, and none is both', () => {
    for (const c of hosts.charts) {
      const declared = agent.charts.find((a) => a.slug === c.slug)!.props.map((p) => p.name);
      const roles = c.roles.map((r) => r.prop).filter((p): p is string => p !== null);
      for (const name of [...roles, ...c.options.map((o) => o.name)]) expect(declared, `${c.slug}.${name}`).toContain(name);
      expect(roles.filter((r) => c.options.some((o) => o.name === r)), c.slug).toEqual([]);
    }
  });

  test('REQ-654 · options are boolean, number, string or enum only; accessors, arrays and objects are out', () => {
    for (const c of hosts.charts) for (const o of c.options) expect(['boolean', 'number', 'string', 'enum'], `${c.slug}.${o.name}`).toContain(o.kind);
    expect(chart('scatter-chart').options.map((o) => o.name)).not.toContain('sizeRange');
  });

  test('REQ-655 · grounds with substrates, modes, palettes and common options, each labelled', () => {
    expect(hosts.appearance.grounds).toEqual([
      { name: 'silverpoint', label: 'Silverpoint', substrates: [{ name: 'cream', label: 'Cream' }, { name: 'green', label: 'Green' }, { name: 'blue', label: 'Blue' }, { name: 'ochre', label: 'Ochre' }] },
      { name: 'cyanotype', label: 'Cyanotype', substrates: [{ name: 'prussian', label: 'Prussian' }] },
    ]);
    expect(hosts.appearance.modes).toEqual([{ name: 'ink', label: 'Ink' }, { name: 'precision', label: 'Precision' }]);
    expect(hosts.appearance.palettes.find((p) => p.name === 'ironGall')).toEqual({ name: 'ironGall', label: 'Iron gall' });
    expect(hosts.common.map((o) => o.name)).toEqual(['title', 'badge', 'value', 'unit', 'footerLeft', 'footerRight', 'label', 'description', 'dataTable', 'chrome', 'hatchFill', 'locale']);
    expect(hosts.common.find((o) => o.name === 'dataTable')).toMatchObject({ kind: 'enum', values: ['visible', 'hidden', 'none'], default: 'hidden' });
  });

  test('REQ-653 · a chart with an array field or no field, and no binding rule, fails generation', async () => {
    const unbound = { ...agent, charts: [{ ...agent.charts.find((c) => c.slug === 'orbit-chart')!, slug: 'new-chart' }] };
    await expect(buildHostCatalog(unbound)).rejects.toThrow(/new-chart/);
  });

  test('REQ-653 · the committed host-catalog.json is the generator’s output', () => {
    expect(existsSync(HOST_CATALOG_FILE)).toBe(true);
    expect(readFileSync(HOST_CATALOG_FILE, 'utf8')).toBe(hostCatalogSource(hosts));
  });
});

describe('the host integrations (REQ-661)', () => {
  // Each one checked on its registry 2026-11-28: the PyPI `silverpoint` 0.11.0.post1 (the [flask] and
  // [django] extras, Jupyter and Databricks outputs), collective.silverpoint 0.1.0 on PyPI,
  // n8n-nodes-silverpoint 0.1.3, superset-plugin-chart-silverpoint 0.1.0 and volto-silverpoint 0.1.0 on
  // npm, the .pbiviz and the KNIME update site on GitHub Releases v0.1.0, the Tableau extensions on Pages.
  test('REQ-661 · every host is published, so every host is released', () => {
    expect(Object.fromEntries(HOSTS.map((h) => [h.id, h.status]))).toEqual({
      powerbi: 'released',
      tableau: 'released',
      knime: 'released',
      n8n: 'released',
      superset: 'released',
      volto: 'released',
      'plone-classic': 'released',
      python: 'released',
      flask: 'released',
      django: 'released',
      jupyter: 'released',
      databricks: 'released',
    });
  });
});
