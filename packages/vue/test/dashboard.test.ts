import { __setDiagnosticSink, dashboardView, type SpCode } from '@silverpoint/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp, createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { provideSilverpoint, SpKpiCard, SpLineChart } from '../src';
import { SpDashboard, SpDashboardCell } from '../src/dashboard';

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
  vi.unstubAllGlobals();
});

function capture(): SpCode[] {
  const seen: SpCode[] = [];
  cleanup.push(__setDiagnosticSink((code) => seen.push(code)));
  return seen;
}

function parse(markup: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = markup;
  return host;
}

function mount(render: () => ReturnType<typeof h>, plugin?: ReturnType<typeof provideSilverpoint>): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({ render });
  if (plugin) app.use(plugin);
  app.mount(host);
  cleanup.push(() => {
    app.unmount();
    host.remove();
  });
  return host;
}

const LAYOUT = { cells: [{ id: 'revenue' }, { id: 'traffic', colSpan: { md: 2, lg: 3 } }] };

/** Two cells, given out of reading order, as in the React tests. */
const ops = (extra: Record<string, unknown> = {}) => () =>
  h(SpDashboard, { id: 'ops', title: 'Operations', description: 'Service health.', layout: LAYOUT, ...extra }, () => [
    h(SpDashboardCell, { cell: 'traffic' }, () => [h(SpLineChart, { title: 'Traffic' })]),
    h(SpDashboardCell, { cell: 'revenue' }, () => [h(SpKpiCard, { title: 'Revenue' })]),
  ]);
const ssr = (render: () => ReturnType<typeof h>) => renderToString(createSSRApp({ render }));

describe('SpDashboard: markup contract (T-112)', () => {
  test('REQ-200 · REQ-214 · a section labelled by its heading and described, with a grid of articles', async () => {
    capture();
    const host = parse(await ssr(ops()));
    const section = host.querySelector('section')!;
    expect(section.getAttribute('part')).toBe('dashboard');
    expect(section.className).toBe('sp-dashboard sp-ground-silverpoint');
    expect(section.getAttribute('data-substrate')).toBe('cream');
    expect(section.getAttribute('aria-labelledby')).toBe('ops-title');
    expect(section.getAttribute('aria-describedby')).toBe('ops-desc');
    const heading = section.querySelector('h2')!;
    expect([heading.id, heading.getAttribute('part'), heading.className, heading.textContent]).toEqual(['ops-title', 'dashboard-title', 'sp-dashboard-title', 'Operations']);
    const description = section.querySelector('p')!;
    expect([description.id, description.getAttribute('part'), description.textContent]).toEqual(['ops-desc', 'dashboard-description', 'Service health.']);
    const grid = section.querySelector('div.sp-dashboard-grid')!;
    expect(grid.getAttribute('part')).toBe('dashboard-grid');
    expect([...grid.children].map((c) => [c.tagName, c.getAttribute('part'), c.className])).toEqual([
      ['ARTICLE', 'dashboard-cell', 'sp-dashboard-cell'],
      ['ARTICLE', 'dashboard-cell', 'sp-dashboard-cell'],
    ]);
  });

  test('REQ-203 · REQ-209 · REQ-214 · cells in reading order, each labelled by its chart’s title', async () => {
    capture();
    const cells = [...parse(await ssr(ops())).querySelectorAll('article')];
    expect(cells.map((c) => c.getAttribute('aria-labelledby'))).toEqual(['ops--revenue-title', 'ops--traffic-title']);
    expect(cells.map((c) => c.querySelector('svg title')?.textContent)).toEqual(['Revenue', 'Traffic']);
    for (const cell of cells) expect(cell.querySelector(`#${cell.getAttribute('aria-labelledby')}`)).not.toBeNull();
  });

  test('REQ-202 · the wrapper and each cell carry the model’s variables', async () => {
    capture();
    const host = parse(await ssr(ops()));
    const view = dashboardView({ id: 'ops', title: 'Operations', layout: LAYOUT }, [{ cell: 'traffic' }, { cell: 'revenue' }]);
    const declarations = (el: Element) => Object.fromEntries((el.getAttribute('style') ?? '').split(';').filter(Boolean).map((d) => d.split(':')));
    expect(declarations(host.querySelector('section')!)).toEqual(view.model.style);
    expect([...host.querySelectorAll('article')].map(declarations)).toEqual(view.cells.map((c) => c.style));
  });

  test('REQ-206 · every chart fills its nominal box', async () => {
    capture();
    const boxes = [...parse(await ssr(ops())).querySelectorAll('article svg.sp-chart')].map((svg) => svg.getAttribute('viewBox'));
    expect(boxes).toEqual(['0 0 288 240', '0 0 896 240']);
  });

  test('REQ-206 · a chart’s own height and id win over the cell’s', async () => {
    capture();
    const host = parse(await ssr(() => h(SpDashboard, { id: 'ops', title: 'Ops' }, () => [h(SpDashboardCell, null, () => [h(SpLineChart, { id: 'mine', height: 90, title: 'Mine' })])])));
    expect(host.querySelector('article')?.getAttribute('aria-labelledby')).toBe('mine-title');
    expect(host.querySelector('svg.sp-chart')?.getAttribute('viewBox')).toMatch(/^0 0 288 /);
    expect(host.querySelector('svg.sp-chart')?.getAttribute('viewBox')).not.toBe('0 0 288 240');
  });

  test('REQ-214 · headingLevel sets the heading; a label alone names the section without one', async () => {
    capture();
    expect(parse(await ssr(() => h(SpDashboard, { id: 'd', title: 'T', headingLevel: 3 }))).querySelector('h3#d-title')).not.toBeNull();
    const labelled = parse(await ssr(() => h(SpDashboard, { id: 'd', label: 'Only a label' }))).querySelector('section')!;
    expect(labelled.getAttribute('aria-label')).toBe('Only a label');
    expect(labelled.hasAttribute('aria-labelledby')).toBe(false);
    expect(labelled.querySelector('h2, h3, h4, h5, h6')).toBeNull();
  });

  test('REQ-205 · a mismatch between layout and children warns SP015 and never throws', async () => {
    const seen = capture();
    const host = parse(await ssr(() => h(SpDashboard, { id: 'ops', title: 'Ops', layout: { cells: [{ id: 'a' }] } }, () => [h(SpDashboardCell, { cell: 'nope' }, () => [h(SpLineChart, { title: 'Lost' })])])));
    expect(host.querySelectorAll('article')).toHaveLength(1);
    expect(seen).toContain('SP015');
  });

  test('DD-017 · the wrapper emits no fragment markers or comments of its own', async () => {
    capture();
    const html = await ssr(ops());
    const wrapper = html.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<div class="sp-root[\s\S]*?<\/table><\/div><\/div>/g, '');
    expect(wrapper).not.toMatch(/<!--/);
  });
});

describe('SpDashboard: inherited configuration (T-112)', () => {
  test('REQ-212 · the dashboard’s substrate and mode reach its charts; a chart’s own prop wins', async () => {
    capture();
    const host = mount(() =>
      h(SpDashboard, { id: 'ops', title: 'Ops', substrate: 'green', mode: 'precision' }, () => [
        h(SpDashboardCell, null, () => [h(SpLineChart, { title: 'Inherits' })]),
        h(SpDashboardCell, null, () => [h(SpLineChart, { title: 'Own', substrate: 'ochre' })]),
      ]),
    );
    await nextTick();
    const [first, second] = host.querySelectorAll('svg.sp-chart');
    expect(first?.getAttribute('data-substrate')).toBe('green');
    expect(first?.getAttribute('data-mode')).toBe('precision');
    expect(second?.getAttribute('data-substrate')).toBe('ochre');
  });

  test('REQ-212 · precedence: chart → dashboard → provider', async () => {
    capture();
    const host = mount(
      () =>
        h('div', [
          h(SpDashboard, { id: 'a', title: 'A' }, () => [h(SpDashboardCell, null, () => [h(SpLineChart, { title: 'From the provider' })])]),
          h(SpDashboard, { id: 'b', title: 'B', substrate: 'green' }, () => [h(SpDashboardCell, null, () => [h(SpLineChart, { title: 'From the dashboard' })])]),
        ]),
      provideSilverpoint({ substrate: 'blue', mode: 'precision' }),
    );
    await nextTick();
    const [provided, dashboarded] = host.querySelectorAll('svg.sp-chart');
    expect(provided?.getAttribute('data-substrate')).toBe('blue');
    expect(dashboarded?.getAttribute('data-substrate')).toBe('green');
    expect(dashboarded?.getAttribute('data-mode')).toBe('precision');
  });
});

describe('SpDashboard: hydration (T-112)', () => {
  test('REQ-207 · REQ-109 · hydrates at the nominal width with no mismatch, then re-renders at the measured width', async () => {
    capture();
    const observers: ((width: number) => void)[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: (entries: { contentRect: { width: number } }[]) => void) {
          observers.push((width) => callback([{ contentRect: { width } }]));
        }
        observe() {}
        disconnect() {}
      },
    );
    const render = ops();
    const host = document.createElement('div');
    host.innerHTML = await ssr(render);
    document.body.append(host);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const app = createSSRApp({ render });
    app.mount(host);
    cleanup.push(() => {
      app.unmount();
      host.remove();
      warn.mockRestore();
    });
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/hydration|mismatch/i);
    const boxes = () => [...host.querySelectorAll('svg.sp-chart')].map((svg) => svg.getAttribute('viewBox'));
    expect(boxes()).toEqual(['0 0 288 240', '0 0 896 240']);
    observers.forEach((notify) => notify(300));
    await nextTick();
    expect(boxes()).toEqual(['0 0 300 240', '0 0 300 240']);
  });
});

describe('SpDashboard: linked interaction (T-121)', () => {
  const rows = (offset: number) => ['10', '11', '12'].map((hour, i) => ({ hour, hits: i + offset }));
  const linked = (onLinkChange?: (link: unknown) => void) => () =>
    h(SpDashboard, { id: 'lk', title: 'Linked', link: { key: 'hour' }, onLinkChange }, () => [
      h(SpDashboardCell, { cell: 'a' }, () => [h(SpLineChart, { title: 'Source', data: rows(1), xKey: 'hour', valueKey: 'hits' })]),
      h(SpDashboardCell, { cell: 'b' }, () => [h(SpLineChart, { title: 'Follower', data: rows(5), xKey: 'hour', valueKey: 'hits' })]),
    ]);

  test('REQ-216 · REQ-218 · the source’s active item marks the same hour in the other chart; it clears with the source', async () => {
    capture();
    const changes: unknown[] = [];
    const host = mount(linked((link) => changes.push(link)));
    await nextTick();
    const [source, other] = host.querySelectorAll<HTMLElement>('.sp-root');
    source!.dispatchEvent(new FocusEvent('focus'));
    await nextTick();
    expect(other!.querySelectorAll('svg[part="linked"] path')).toHaveLength(1);
    expect(other!.querySelector('svg[part="linked"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(source!.querySelector('svg[part="linked"]')).toBeNull();
    expect(changes).toEqual([{ key: 'hour', value: '10' }]);
    source!.dispatchEvent(new FocusEvent('blur'));
    await nextTick();
    expect(host.querySelectorAll('svg[part="linked"]')).toHaveLength(0);
    expect(changes).toEqual([{ key: 'hour', value: '10' }, null]);
  });

  test('REQ-219 · I-15 · the server render has no linked mark', async () => {
    capture();
    expect(await ssr(linked())).not.toMatch(/part="linked"/);
  });
});
