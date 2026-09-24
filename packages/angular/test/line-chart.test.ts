import { describe, expect, test } from 'vitest';
import { compareSvg } from '../../../tools/svg-normalizer/normalize';
import { Component, type ApplicationRef } from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { provideSilverpoint, SpChartFrame } from '@silverpoint/angular';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { tonedRecipe } from '../../../tools/visual-gate/toned-recipe';
import { SpLineChart } from '@silverpoint/angular/line-chart';
import { canonical, ssr } from './harness';

const fixed = { id: 'sp-fixture', width: 320, height: 160 } as const;

describe('sp-line-chart under @angular/platform-server', () => {
  test.each(['ink', 'precision'] as const)('REQ-100 · %s mode renders identically to the canonical render', async (mode) => {
    const props = { ...fixed, mode, title: 'Throughput', unit: 'requests' };
    expect(compareSvg(await ssr(props), canonical(props))).toEqual({ equal: true });
  });

  test.each(['cream', 'green', 'blue', 'ochre'] as const)('REQ-046 · substrate %s reaches the markup', async (substrate) => {
    const html = await ssr({ ...fixed, substrate });
    expect(compareSvg(html, canonical({ ...fixed, substrate })).equal).toBe(true);
    expect(html).toContain(`data-substrate="${substrate}"`);
  });

  test("REQ-095 · chrome: 'bare' renders only the drawing area", async () => {
    const props = { ...fixed, chrome: 'bare', title: 'Hidden' } as const;
    const html = await ssr(props);
    expect(compareSvg(html, canonical(props)).equal).toBe(true);
    expect(html).not.toMatch(/data-kind="title"/);
  });

  test('REQ-121 · the tabular alternative is rendered, hidden for sight by default', async () => {
    const html = await ssr({ ...fixed, title: 'Hits' });
    expect(html).toMatch(/<table class="sp-table" id="sp-fixture-table" data-visibility="hidden"/);
    expect(html).toMatch(/<caption>Hits<\/caption>/);
    expect(html.match(/<tr>/g)).toHaveLength(13);
  });

  test("REQ-121 · dataTable: 'none' omits the table and 'visible' shows it", async () => {
    expect(await ssr({ ...fixed, dataTable: 'none' })).not.toMatch(/<table/);
    expect(await ssr({ ...fixed, dataTable: 'visible' })).toMatch(/data-visibility="visible"/);
  });

  test('REQ-041 · the root carries the ground class and substrate for the stylesheet', async () => {
    expect(await ssr({ ...fixed, className: 'mine' })).toMatch(/<div class="sp-root sp-ground-silverpoint mine" data-substrate="cream"/);
  });

  test('REQ-060 · consumer data is drawn through accessor keys', async () => {
    const data = [
      { day: 'Mon', hits: 3 },
      { day: 'Tue', hits: 5 },
    ];
    const props = { ...fixed, data, xKey: 'day', valueKey: 'hits' };
    expect(compareSvg(await ssr(props), canonical(props)).equal).toBe(true);
  });

  test('REQ-009 · without a width it renders deferred on the server, with no NaN', async () => {
    const html = await ssr({ id: 'sp-deferred' });
    expect(html).toMatch(/data-status="deferred"/);
    expect(html).not.toMatch(/NaN/);
  });

  test('API §8.2 · provideSilverpoint supplies ground, substrate and mode; a prop wins over it', async () => {
    const provided = await ssr(fixed, [provideSilverpoint({ substrate: 'ochre', mode: 'precision' })]);
    expect(provided).toMatch(/<svg[^>]*data-substrate="ochre"/);
    expect(provided).toMatch(/<svg[^>]*data-mode="precision"/);
    const overridden = await ssr({ ...fixed, substrate: 'blue' }, [provideSilverpoint({ substrate: 'ochre' })]);
    expect(overridden).toMatch(/<svg[^>]*data-substrate="blue"/);
  });
});

describe('tile-filled shapes', () => {
  test('REQ-029 · REQ-100 · <defs>, <pattern> and tile fills render identically to the canonical render', async () => {
    const rendered = renderChart(tonedRecipe, { hatchFill: 'tile' }, { id: 'sp-toned', width: 200 });
    expect(rendered.view.patterns.length).toBe(2);
    const Host = Component({
      selector: 'app-root',
      imports: [SpChartFrame],
      template: '<sp-chart-frame [rendered]="rendered" rootClass="sp-root" />',
    })(
      class {
        rendered = rendered;
      },
    );
    const html = await renderApplication(
      (context: BootstrapContext): Promise<ApplicationRef> => bootstrapApplication(Host, { providers: [provideServerRendering()] }, context),
      { document: '<html><head></head><body><app-root></app-root></body></html>' },
    );
    expect(compareSvg(html, toSVGString(rendered))).toEqual({ equal: true });
  });
});

describe('sp-line-chart component contract', () => {
  const definition = (SpLineChart as unknown as { ɵcmp: Record<string, unknown> }).ɵcmp;

  test('REQ-101 · standalone, OnPush, selector sp-line-chart', () => {
    expect(definition.standalone).toBe(true);
    expect(definition.onPush).toBe(true);
    expect(definition.selectors).toEqual([['sp-line-chart']]);
  });

  test('REQ-101 · every input is a signal input, named as LineChartProps', () => {
    const inputs = definition.inputs as Record<string, [string, number]>;
    const names = Object.keys(inputs).sort();
    expect(names).toEqual(
      [
        'badge', 'chrome', 'className', 'connectNulls', 'curve', 'data', 'dataTable', 'description', 'footerLeft',
        'footerRight', 'ground', 'hatchFill', 'height', 'id', 'label', 'locale', 'mode', 'numberFormat', 'secondaryKey',
        'seed', 'series', 'substrate', 'title', 'unit', 'value', 'valueKey', 'width', 'xKey',
      ].sort(),
    );
    // InputFlags.SignalBased = 1 (Angular's input metadata encoding).
    for (const name of names) expect((inputs[name]?.[1] ?? 0) & 1, name).toBe(1);
  });

  test('API §9 · emits activeChange and select', () => {
    expect(Object.keys(definition.outputs as object).sort()).toEqual(['activeChange', 'select']);
  });

  test('API §8.2 · exposes getGeometry() and toSVGString() and no other public method', () => {
    const methods = Object.getOwnPropertyNames(SpLineChart.prototype).filter(
      (name) => name !== 'constructor' && !name.startsWith('ng'),
    );
    expect(methods.sort()).toEqual(['getGeometry', 'toSVGString']);
  });
});
