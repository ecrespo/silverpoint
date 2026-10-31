import { barChart, lineChart } from '@silverpoint/core';
import { paletteStyle, sanguine } from '@silverpoint/core/palettes';
import { describe, expect, test } from 'vitest';
import { renderChart, toChartRootString, toSVGString } from '../src';

/*
 * The client chart's DOM as a string (Analyze A-03, T-259, API Spec §10): the reference writer the
 * dashboard gate used, moved here so `@silverpoint/marp` and `render_deck` can write a fence's
 * static chart. The dashboard and palette gates prove it equals the three adapters' trees.
 */

const env = { id: 'sp-c1', width: 320 };

describe('toChartRootString (T-259, A-03)', () => {
  test('REQ-589 · the focusable root, the SVG, the live region and the table, in that order', () => {
    const rendered = renderChart(barChart, { title: 'Sales' }, env);
    const html = toChartRootString(rendered);
    expect(html.startsWith(`<div class="sp-root sp-ground-silverpoint" data-substrate="${rendered.substrate}" data-chrome="${rendered.chrome}" data-status="${rendered.status}" tabindex="0" role="group" aria-label="${rendered.name}">`)).toBe(true);
    const svg = toSVGString(rendered);
    expect(html).toContain(`>${svg}<div class="sp-live" aria-live="polite"></div>`);
    expect(html).toMatch(/<div class="sp-table-box" data-visibility="[a-z-]+"><table class="sp-table" id="sp-c1-table" data-visibility="[a-z-]+"><caption>/);
    expect(html.endsWith('</tbody></table></div></div>')).toBe(true);
  });

  test('REQ-461 · a palette is the root’s style too, as the adapters write it', () => {
    const html = toChartRootString(renderChart(lineChart, { palette: sanguine }, env));
    expect(html).toMatch(new RegExp(`^<div class="sp-root sp-ground-silverpoint"[^>]* style="${paletteStyle(sanguine)}" tabindex="0"`));
    expect(toChartRootString(renderChart(lineChart, {}, env))).not.toMatch(/^<div[^>]* style=/);
  });

  test('REQ-589 · no table when dataTable is none', () => {
    const html = toChartRootString(renderChart(barChart, { dataTable: 'none' }, env));
    expect(html).not.toContain('sp-table');
    expect(html.endsWith('<div class="sp-live" aria-live="polite"></div></div>')).toBe(true);
  });

  test('REQ-589 · text and attributes are escaped', () => {
    const data = [{ x: '<b>&"', value: 1 }];
    const html = toChartRootString(renderChart(barChart, { data, title: 'A "<q>" & b' }, env));
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;&amp;');
    expect(html).toMatch(/aria-label="[^"]*&quot;&lt;q&gt;&quot; &amp; b/);
    expect(html).not.toMatch(/<[a-z][^>]*="[^"]*</);
  });
});
