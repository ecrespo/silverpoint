import { renderChart, toChartRootString } from '@silverpoint/grounds';
import { describe, expect, test } from 'vitest';
import { createDeckEngine, hydrationPlan } from '../src';
import { recipeOfSlug } from '../src/fence/recipes';

/* What each adapter mounts in a slot (T-273..T-275, REQ-593, DD-053, Art. 3). */

const fence = (body: object) => ['```silverpoint', JSON.stringify(body), '```'].join('\n');
const md = [
  `<!-- _ground: cyanotype -->\n${fence({ chart: 'donut-chart', props: { title: 'Share' } })}`,
  `${fence({ chart: 'bar-chart', data: [{ x: 'a', value: 1 }], width: 400, height: 200, id: 'mine', mode: 'precision' })}\n\n${fence({ chart: 'nope' })}`,
  fence({ chart: 'line-chart', palette: 'sepia' }),
].join('\n\n---\n\n');

describe('hydrationPlan', () => {
  const render = createDeckEngine({ id: 'h1', palette: 'sanguine' }).render(md);
  const plan = hydrationPlan(render, 'sanguine');

  test('REQ-593 · one entry per slot with a spec, in order; error slots are not hydrated', () => {
    expect(plan.map((p) => [p.slotId, p.chart, p.props.id])).toEqual([
      ['s1-c1', 'donut-chart', 'h1-s1-c1'],
      ['s2-c1', 'bar-chart', 'mine'],
      ['s3-c1', 'line-chart', 'h1-s3-c1'],
    ]);
  });

  test('Art. 3 · REQ-593 · the props, through the static pipeline, give back the chart the slide carries', () => {
    for (const entry of plan) {
      const { id, width, ...props } = entry.props as Record<string, unknown> & { id: string; width: number };
      const html = toChartRootString(renderChart(recipeOfSlug(entry.chart)!, props as never, { id, width }));
      const slide = render.slides[render.slots.find((s) => s.slotId === entry.slotId)!.slide - 1]!.html;
      expect(slide, entry.slotId).toContain(`>${html}</figure>`);
    }
  });

  test('REQ-585 · the slide’s ground and substrate, the fence’s own size and mode; width defaults to the content width', () => {
    expect(plan[0]!.props).toMatchObject({ ground: 'cyanotype', substrate: 'prussian', mode: 'ink', height: 360, width: 1120, title: 'Share' });
    expect(plan[1]!.props).toMatchObject({ ground: 'silverpoint', substrate: 'cream', mode: 'precision', height: 200, width: 400, data: [{ x: 'a', value: 1 }] });
  });

  test('REQ-461 · the deck’s palette, or the fence’s, as the preset object', () => {
    expect((plan[0]!.props.palette as { name?: string }) ?? null).not.toBeNull();
    expect(plan[0]!.props.palette).not.toEqual(plan[2]!.props.palette);
    expect(hydrationPlan(render).at(0)!.props.palette).toBeUndefined();
  });
});

describe('hydrationPlan — what reaches a framework chart (REQ-591, REQ-572)', () => {
  // A fence's props are the author's; the adapters spread them onto a component, where a Vue root
  // would take `innerHTML` as a DOM property and React would honour `dangerouslySetInnerHTML`.
  const hostile = ['innerHTML', 'outerHTML', 'textContent', 'dangerouslySetInnerHTML', 'onClick', 'onMouseover', 'ref', 'key', 'style', 'is'];

  test.each(hostile)('REQ-591 · a fence carrying `%s` renders an error figure and is never hydrated', (name) => {
    const render = createDeckEngine({ id: 'x1' }).render(fence({ chart: 'donut-chart', props: { [name]: '<img src=x onerror=alert(1)>' } }));
    expect(hydrationPlan(render)).toEqual([]);
    expect(render.slides[0]!.html).not.toContain('<img');
    // The error figure names the prop, as text.
    expect(render.slides[0]!.html).toMatch(new RegExp(`does not declare (&quot;|")${name}(&quot;|")`));
  });

  test('REQ-591 · every prop a hydrated chart gets is declared: the chart’s own, the common ones, or set by the deck', async () => {
    const { CHART_PROPS, COMMON_PROPS } = await import('../src/fence/charts.generated');
    const render = createDeckEngine({ id: 'x2' }).render(md);
    for (const entry of hydrationPlan(render)) {
      const allowed = new Set([...(CHART_PROPS[entry.chart] ?? []), ...COMMON_PROPS]);
      expect(Object.keys(entry.props).filter((k) => !allowed.has(k)), entry.chart).toEqual([]);
    }
  });
});
