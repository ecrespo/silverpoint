import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { CHART_PROPS, COMMON_PROPS } from '../src/fence/charts.generated';
import { parseChartFence } from '../src/fence/parse';
import { CHART_SLUGS, recipeOfSlug } from '../src/fence/recipes';

const catalog = JSON.parse(readFileSync(join(__dirname, '../../mcp/agent-catalog.json'), 'utf8')) as {
  charts: { slug: string; props: { name: string }[] }[];
  common: { chart: { name: string }[] };
};

const parse = (body: unknown) => parseChartFence(typeof body === 'string' ? body : JSON.stringify(body));

describe('the slug table (T-258)', () => {
  test('REQ-589 · 60 slugs, kebab of the recipe names, equal to the agent catalog’s', () => {
    expect(CHART_SLUGS).toHaveLength(60);
    expect([...CHART_SLUGS].sort()).toEqual(catalog.charts.map((c) => c.slug).sort());
    expect(recipeOfSlug('bar-chart')?.name).toBe('BarChart');
    expect(recipeOfSlug('sankey-chart')?.name).toBe('SankeyChart');
    expect(recipeOfSlug('nope')).toBeUndefined();
  });

  test('REQ-591 · the generated prop table is the catalog’s declared props', () => {
    expect(Object.keys(CHART_PROPS).sort()).toEqual([...CHART_SLUGS].sort());
    for (const chart of catalog.charts) expect(CHART_PROPS[chart.slug]).toEqual(chart.props.map((p) => p.name));
    expect(COMMON_PROPS).toEqual(catalog.common.chart.map((p) => p.name));
  });
});

describe('parseChartFence (T-258)', () => {
  test('REQ-589 · a valid body parses to its spec, unchanged', () => {
    const body = { chart: 'bar-chart', data: [{ x: 'a', value: 1 }], props: { xKey: 'x', title: 'T' }, width: 800, height: 360, id: 'q3', ground: 'cyanotype', substrate: 'prussian', mode: 'precision', palette: 'sepia' };
    expect(parse(body)).toEqual({ spec: body });
    expect(parse({ chart: 'donut-chart' })).toEqual({ spec: { chart: 'donut-chart' } });
  });

  test('REQ-591 · kind json: not JSON', () => {
    const r = parse('{ chart: bar-chart }');
    expect(r.error?.kind).toBe('json');
    expect((r.error as { message: string }).message).toMatch(/JSON/);
  });

  test.each([
    ['an array', [1, 2], /object/],
    ['null', null, /object/],
    ['no chart', { props: {} }, /`chart`/],
    ['a non-string chart', { chart: 3 }, /`chart`/],
    ['an unknown top-level key', { chart: 'bar-chart', format: 'svg' }, /`format`/],
    ['props not an object', { chart: 'bar-chart', props: [1] }, /`props`/],
    ['a non-number width', { chart: 'bar-chart', width: '800' }, /`width`/],
    ['an unsafe id', { chart: 'bar-chart', id: 'a b"' }, /`id`/],
    ['an unknown mode', { chart: 'bar-chart', mode: 'pencil' }, /`mode`/],
    ['a non-string ground', { chart: 'bar-chart', ground: {} }, /`ground`/],
    ['a palette neither name nor object', { chart: 'bar-chart', palette: 4 }, /`palette`/],
  ])('REQ-591 · kind shape: %s', (_, body, message) => {
    const r = parse(body);
    expect(r.error?.kind).toBe('shape');
    expect((r.error as { message: string }).message).toMatch(message);
  });

  test.each(['ground', 'substrate', 'mode', 'palette', 'id', 'data', 'width', 'height'])('REQ-591 · kind shape: `%s` inside props is a top-level field', (key) => {
    const r = parse({ chart: 'bar-chart', props: { [key]: 'x' } });
    expect(r.error).toEqual({ kind: 'shape', message: `Give \`${key}\` as a field of the fence, not in \`props\`.` });
  });

  test('REQ-591 · kind chart: unknown slug, with the closest slugs', () => {
    expect(parse({ chart: 'bar-chrt' }).error).toEqual({ kind: 'chart', chart: 'bar-chrt', suggestions: ['bar-chart'] });
    expect(parse({ chart: 'zzz' }).error).toEqual({ kind: 'chart', chart: 'zzz', suggestions: [] });
  });

  test('REQ-591 · kind prop: every undeclared prop, in order; common props are declared', () => {
    expect(parse({ chart: 'bar-chart', props: { xKey: 'x', title: 'T', colour: 'red', sizee: 2 } }).error).toEqual({ kind: 'prop', props: ['colour', 'sizee'] });
    expect(parse({ chart: 'bar-chart', props: { badge: 'B', locale: 'es' } }).error).toBeUndefined();
  });

  test.each([
    [{ width: 159 }, { width: 159 }],
    [{ width: 1281 }, { width: 1281 }],
    [{ height: 89 }, { height: 89 }],
    [{ height: 721, width: 100 }, { width: 100, height: 721 }],
  ])('REQ-591 · kind size: %j', (size, error) => {
    expect(parse({ chart: 'bar-chart', ...size }).error).toEqual({ kind: 'size', ...error });
  });

  test('REQ-591 · the bounds are inclusive', () => {
    expect(parse({ chart: 'bar-chart', width: 160, height: 90 }).spec).toBeDefined();
    expect(parse({ chart: 'bar-chart', width: 1280, height: 720 }).spec).toBeDefined();
  });

  test('REQ-591 · never throws, whatever the body', () => {
    for (const body of ['', ' ', '"x"', '1', 'true', '{"chart":"bar-chart","props":null}', '{"__proto__":{"chart":"x"}}']) {
      expect(() => parseChartFence(body)).not.toThrow();
      expect(parseChartFence(body).error).toBeDefined();
    }
  });
});
