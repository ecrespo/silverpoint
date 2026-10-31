import { __setDiagnosticSink, barChart, donutChart } from '@silverpoint/core';
import { paletteStyle, sanguine } from '@silverpoint/core/palettes';
import { renderChart, toChartRootString } from '@silverpoint/grounds';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createDeckEngine } from '../src';

const fence = (body: unknown) => ['```silverpoint', typeof body === 'string' ? body : JSON.stringify(body), '```'].join('\n');
const deck = (...slides: string[]) => slides.join('\n\n---\n\n');
const decode = (value: string) => value.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const specOf = (html: string, slot: string) => {
  const m = new RegExp(`data-sp-slot="${slot}"[^>]*data-sp-spec="([^"]*)"`).exec(html);
  return m ? JSON.parse(decode(m[1]!)) : undefined;
};

let sunk: string[] = [];
let restore: () => void;
beforeEach(() => {
  sunk = [];
  restore = __setDiagnosticSink((code, message) => sunk.push(`${code} ${message}`));
});
afterEach(() => restore());

const BAR = { chart: 'bar-chart', data: [{ x: 'Florence', value: 42 }, { x: 'Siena', value: 27 }], props: { title: 'Workshops' } };

describe('chart fences — render (T-259)', () => {
  test('REQ-589 · REQ-590 · a fence becomes a slot holding the chart root grounds writes, same as render_chart', () => {
    const out = createDeckEngine({ id: 'd1' }).render(deck('# One', `## Two\n\n${fence(BAR)}`));
    expect(out.slots).toEqual([{ slotId: 's2-c1', slide: 2, ordinal: 1, chartId: 'd1-s2-c1', spec: BAR }]);
    const expected = toChartRootString(
      renderChart(barChart, { ...BAR.props, data: BAR.data, ground: 'silverpoint', substrate: 'cream', mode: 'ink', height: 360 }, { id: 'd1-s2-c1', width: 1120 }),
    );
    const html = out.slides[1]!.html;
    expect(html).toContain(`<figure class="sp-deck-chart" data-sp-slot="s2-c1" part="sp-deck-chart" data-sp-spec="`);
    expect(html).toContain(`">${expected}</figure>`);
    expect(specOf(html, 's2-c1')).toEqual(BAR);
    expect(out.slides[0]!.html).not.toContain('sp-deck-chart');
    expect(out.diagnostics).toEqual([]);
  });

  test('REQ-585 · the chart takes the slide’s ground, substrate and mode; the fence’s own win', () => {
    const md = deck(`<!-- _ground: cyanotype -->\n<!-- _mode: precision -->\n\n${fence({ chart: 'donut-chart' })}`, fence({ chart: 'donut-chart', ground: 'cyanotype', mode: 'precision' }));
    const out = createDeckEngine({ id: 'd2' }).render(md);
    const slide1 = toChartRootString(renderChart(donutChart, { ground: 'cyanotype', substrate: 'prussian' as never, mode: 'precision', height: 360 }, { id: 'd2-s1-c1', width: 1120 }));
    expect(out.slides[0]!.html).toContain(slide1);
    expect(out.slides[1]!.html).toContain('class="sp-root sp-ground-cyanotype" data-substrate="prussian"');
    expect(out.slides[1]!.html).toContain('data-mode="precision"');
    const own = toChartRootString(renderChart(donutChart, { ground: 'cyanotype', substrate: 'prussian' as never, mode: 'precision', height: 360 }, { id: 'd2-s2-c1', width: 1120 }));
    expect(out.slides[1]!.html).toContain(own);
  });

  test('REQ-589 · width defaults to the content width (800 at 4:3), height to 360; both can be set', () => {
    const narrow = createDeckEngine({ id: 'd3', size: '4:3' }).render(fence({ chart: 'donut-chart' }));
    expect(narrow.slides[0]!.html).toContain(toChartRootString(renderChart(donutChart, { ground: 'silverpoint', substrate: 'cream', mode: 'ink', height: 360 }, { id: 'd3-s1-c1', width: 800 })));
    const sized = createDeckEngine({ id: 'd3' }).render(fence({ chart: 'donut-chart', width: 400, height: 200 }));
    expect(sized.slides[0]!.html).toContain(toChartRootString(renderChart(donutChart, { ground: 'silverpoint', substrate: 'cream', mode: 'ink', height: 200 }, { id: 'd3-s1-c1', width: 400 })));
  });

  test('REQ-461 · the deck’s palette reaches the chart; the fence’s palette wins', () => {
    const out = createDeckEngine({ id: 'd4', palette: 'sanguine' }).render(deck(fence({ chart: 'donut-chart' }), fence({ chart: 'donut-chart', palette: { ink: '#202020' } })));
    expect(out.slides[0]!.html).toContain(`style="${paletteStyle(sanguine)}" tabindex="0"`);
    expect(out.slides[1]!.html).toContain('style="--sp-ink:#202020" tabindex="0"');
    expect(sunk.filter((m) => m.startsWith('SP024'))).toEqual([]);
  });

  test('REQ-590 · I-46 · I-47 · ordinals per slide, the spec’s id when given, every slot once in its slide', () => {
    const out = createDeckEngine({ id: 'd5' }).render(deck(`${fence({ chart: 'donut-chart' })}\n\n${fence({ chart: 'donut-chart', id: 'mine' })}`, fence({ chart: 'donut-chart' })));
    expect(out.slots.map((s) => [s.slotId, s.chartId])).toEqual([['s1-c1', 'd5-s1-c1'], ['s1-c2', 'mine'], ['s2-c1', 'd5-s2-c1']]);
    for (const slot of out.slots) {
      const html = out.slides[slot.slide - 1]!.html;
      expect(html.split(`data-sp-slot="${slot.slotId}"`)).toHaveLength(2);
      expect(html).toContain(`id="${slot.chartId}-`);
    }
  });

  test('REQ-590 · I-47 · a repeated id is an error, so chart ids stay unique in the deck', () => {
    const out = createDeckEngine({ id: 'd6' }).render(deck(fence({ chart: 'donut-chart', id: 'x' }), fence({ chart: 'donut-chart', id: 'x' })));
    expect(out.slots[0]!.spec).toBeDefined();
    expect(out.slots[1]).toMatchObject({ slotId: 's2-c1', chartId: 'x', error: { kind: 'shape' } });
    expect((out.slots[1]!.error as { message: string }).message).toMatch(/"x".*slide 1/);
  });

  test('REQ-589 · an info string other than silverpoint is a normal code block', () => {
    const out = createDeckEngine({ id: 'd7' }).render('```js\nconst a = 1;\n```');
    expect(out.slots).toEqual([]);
    expect(out.slides[0]!.html).toContain('<pre><code class="language-js">const a = 1;\n</code></pre>');
  });

  test('REQ-574 · I-44 · the same Markdown renders the same slots, byte for byte', () => {
    const md = deck(fence(BAR), fence({ chart: 'line-chart' }));
    expect(createDeckEngine({ id: 'd8' }).render(md)).toEqual(createDeckEngine({ id: 'd8' }).render(md));
  });
});

describe('chart fences — the error figure and SP026 (T-259)', () => {
  const cases: [string, unknown, RegExp][] = [
    ['json', '{ chart: bar }', /not JSON/],
    ['shape', { chart: 'bar-chart', format: 'svg' }, /`format` is not a field/],
    ['chart', { chart: 'barchart' }, /unknown chart "barchart"\. Did you mean "bar-chart"\?/],
    ['prop', { chart: 'bar-chart', props: { xKy: 'x' } }, /bar-chart does not declare "xKy"\. Did you mean "xKey"\?/],
    ['size', { chart: 'bar-chart', width: 2000 }, /width 2000 is outside 160\.\.1280/],
    ['diagnostic', { chart: 'candlestick-chart', data: [{ time: 1, open: 'x' }] }, /\[SP009\]/],
  ];

  test.each(cases)('REQ-591 · kind %s: a visible figure naming the problem; SP026; the other fence renders', (kind, body, message) => {
    const out = createDeckEngine({ id: 'e1' }).render(deck('# Intro', `${fence(body)}\n\n${fence({ chart: 'donut-chart' })}`));
    const [bad, good] = out.slots;
    expect(bad).toMatchObject({ slotId: 's2-c1', slide: 2, ordinal: 1, chartId: 'e1-s2-c1', error: { kind } });
    expect(bad!.spec).toBeUndefined();
    expect(good!.spec).toEqual({ chart: 'donut-chart' });
    const html = out.slides[1]!.html;
    const figure = /<figure class="sp-deck-chart sp-deck-chart--error" data-sp-slot="s2-c1" role="note" part="sp-deck-chart-error"><figcaption>([^<]*)<\/figcaption><\/figure>/.exec(html);
    expect(figure).not.toBeNull();
    expect(decode(figure![1]!)).toMatch(/^Chart fence on slide 2: /);
    expect(decode(figure![1]!)).toMatch(message);
    expect(html).toContain('data-sp-slot="s2-c2" part="sp-deck-chart"');
    expect(out.diagnostics).toEqual([{ code: 'SP026', severity: 'warn', message: expect.stringMatching(message), slide: 2, slot: 's2-c1' }]);
    expect(sunk.filter((s) => s.startsWith('SP026'))).toHaveLength(1);
  });

  test('REQ-591 · REQ-575 · an error figure escapes what the author wrote', () => {
    const out = createDeckEngine({ id: 'e2' }).render(fence({ chart: '<img src=x onerror=alert(1)>' }));
    expect(out.slides[0]!.html).not.toContain('<img');
    expect(out.slides[0]!.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});
