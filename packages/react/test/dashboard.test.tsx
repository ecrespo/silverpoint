import { act } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { __setDiagnosticSink, dashboardView, type SpCode } from '@silverpoint/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SilverpointProvider } from '../src';
import { Dashboard, DashboardCell } from '../src/dashboard';
import { KpiCard } from '../src/kpi-card';
import { LineChart } from '../src/line-chart';
import { Dashboard as ServerDashboard, DashboardCell as ServerDashboardCell } from '../src/server/dashboard';
import { KpiCard as ServerKpiCard } from '../src/server/kpi-card';
import { LineChart as ServerLineChart } from '../src/server/line-chart';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

function mount(element: React.ReactElement): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(element));
  cleanup.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  return host;
}

const LAYOUT = { cells: [{ id: 'revenue' }, { id: 'traffic', colSpan: { md: 2, lg: 3 } }] };

/** The same dashboard in both entries: two cells, given out of reading order. */
const serverOps = (extra: Record<string, unknown> = {}) => (
  <ServerDashboard id="ops" title="Operations" description="Service health." layout={LAYOUT} {...extra}>
    <ServerDashboardCell cell="traffic">
      <ServerLineChart title="Traffic" />
    </ServerDashboardCell>
    <ServerDashboardCell cell="revenue">
      <ServerKpiCard title="Revenue" />
    </ServerDashboardCell>
  </ServerDashboard>
);
const clientOps = (extra: Record<string, unknown> = {}) => (
  <Dashboard id="ops" title="Operations" description="Service health." layout={LAYOUT} {...extra}>
    <DashboardCell cell="traffic">
      <LineChart title="Traffic" />
    </DashboardCell>
    <DashboardCell cell="revenue">
      <KpiCard title="Revenue" />
    </DashboardCell>
  </Dashboard>
);

describe('React Dashboard: markup contract (T-111)', () => {
  test.each([
    ['server', serverOps],
    ['client', clientOps],
  ] as const)('REQ-200 · REQ-214 · %s: a section labelled by its heading and described, with a grid of articles', (_entry, ops) => {
    capture();
    const host = parse(renderToString(ops()));
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
    const cells = [...grid.children];
    expect(cells.map((c) => [c.tagName, c.getAttribute('part'), c.className])).toEqual([
      ['ARTICLE', 'dashboard-cell', 'sp-dashboard-cell'],
      ['ARTICLE', 'dashboard-cell', 'sp-dashboard-cell'],
    ]);
  });

  test.each([
    ['server', serverOps],
    ['client', clientOps],
  ] as const)('REQ-203 · REQ-209 · REQ-214 · %s: cells in reading order, each labelled by its chart’s title', (_entry, ops) => {
    capture();
    const host = parse(renderToString(ops()));
    const cells = [...host.querySelectorAll('article')];
    expect(cells.map((c) => c.getAttribute('aria-labelledby'))).toEqual(['ops--revenue-title', 'ops--traffic-title']);
    // The chart each cell holds, by its title: the layout's order, not the source order.
    expect(cells.map((c) => c.querySelector('svg title')?.textContent)).toEqual(['Revenue', 'Traffic']);
    for (const cell of cells) expect(cell.querySelector(`#${cell.getAttribute('aria-labelledby')}`)).not.toBeNull();
    expect(cells[0]!.querySelector('svg')?.getAttribute('aria-labelledby')).toMatch(/^ops--revenue-title /);
  });

  test('REQ-202 · the wrapper and each cell carry the model’s variables', () => {
    capture();
    const host = parse(renderToStaticMarkup(serverOps()));
    const view = dashboardView({ id: 'ops', title: 'Operations', layout: LAYOUT }, [{ cell: 'traffic' }, { cell: 'revenue' }]);
    const style = (el: Element) => el.getAttribute('style');
    const css = (vars: Readonly<Record<string, string>>) => Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');
    expect(style(host.querySelector('section')!)).toBe(css(view.model.style));
    expect([...host.querySelectorAll('article')].map(style)).toEqual(view.cells.map((c) => css(c.style)));
  });

  test.each([
    ['server', serverOps],
    ['client', clientOps],
  ] as const)('REQ-206 · %s: every chart fills its nominal box; a row of cards shares one outer height', (_entry, ops) => {
    capture();
    const host = parse(renderToString(ops()));
    const boxes = [...host.querySelectorAll('article svg.sp-chart')].map((svg) => svg.getAttribute('viewBox'));
    // At ssrWidth 1200 (lg, 4 columns, gap 16): one column is 288 wide, three are 896; rows are 240.
    expect(boxes).toEqual(['0 0 288 240', '0 0 896 240']);
  });

  test('REQ-206 · a chart’s own height and id win over the cell’s', () => {
    capture();
    const host = parse(
      renderToStaticMarkup(
        <ServerDashboard id="ops" title="Ops">
          <ServerDashboardCell>
            <ServerLineChart id="mine" height={90} title="Mine" />
          </ServerDashboardCell>
        </ServerDashboard>,
      ),
    );
    expect(host.querySelector('article')?.getAttribute('aria-labelledby')).toBe('mine-title');
    expect(host.querySelector('svg.sp-chart')?.getAttribute('viewBox')).toMatch(/^0 0 288 /);
    expect(host.querySelector('svg.sp-chart')?.getAttribute('viewBox')).not.toBe('0 0 288 240');
  });

  test('REQ-214 · headingLevel sets the heading; a label alone names the section without one', () => {
    capture();
    expect(parse(renderToStaticMarkup(<ServerDashboard id="d" title="T" headingLevel={3} />)).querySelector('h3#d-title')).not.toBeNull();
    const labelled = parse(renderToStaticMarkup(<ServerDashboard id="d" label="Only a label" />)).querySelector('section')!;
    expect(labelled.getAttribute('aria-label')).toBe('Only a label');
    expect(labelled.hasAttribute('aria-labelledby')).toBe(false);
    expect(labelled.querySelector('h2, h3, h4, h5, h6')).toBeNull();
  });

  test('REQ-205 · a mismatch between layout and children warns SP015 and never throws', () => {
    const seen = capture();
    const host = parse(
      renderToStaticMarkup(
        <ServerDashboard id="ops" title="Ops" layout={{ cells: [{ id: 'a' }] }}>
          <ServerDashboardCell cell="nope">
            <ServerLineChart title="Lost" />
          </ServerDashboardCell>
        </ServerDashboard>,
      ),
    );
    expect(host.querySelectorAll('article')).toHaveLength(1);
    expect(seen).toContain('SP015');
  });

  test('DD-017 · the wrapper emits no comments and no whitespace text nodes', () => {
    capture();
    const markup = renderToStaticMarkup(serverOps());
    expect(markup).not.toMatch(/<!--/);
    expect(markup).not.toMatch(/>\s+</);
  });
});

describe('React Dashboard: inherited configuration (T-111)', () => {
  test('REQ-212 · the dashboard’s substrate and mode reach its charts; a chart’s own prop wins', () => {
    capture();
    const host = mount(
      <Dashboard id="ops" title="Ops" substrate="green" mode="precision">
        <DashboardCell>
          <LineChart title="Inherits" />
        </DashboardCell>
        <DashboardCell>
          <LineChart title="Own" substrate="ochre" />
        </DashboardCell>
      </Dashboard>,
    );
    const [first, second] = host.querySelectorAll('svg.sp-chart');
    expect(first?.getAttribute('data-substrate')).toBe('green');
    expect(first?.getAttribute('data-mode')).toBe('precision');
    expect(second?.getAttribute('data-substrate')).toBe('ochre');
    expect(host.querySelector('section')?.getAttribute('data-substrate')).toBe('green');
  });

  test('REQ-212 · precedence: chart → dashboard → provider', () => {
    capture();
    const host = mount(
      <SilverpointProvider substrate="blue" mode="precision">
        <Dashboard id="a" title="A">
          <DashboardCell>
            <LineChart title="From the provider" />
          </DashboardCell>
        </Dashboard>
        <Dashboard id="b" title="B" substrate="green">
          <DashboardCell>
            <LineChart title="From the dashboard" />
          </DashboardCell>
        </Dashboard>
      </SilverpointProvider>,
    );
    const [provided, dashboarded] = host.querySelectorAll('svg.sp-chart');
    expect(provided?.getAttribute('data-substrate')).toBe('blue');
    expect(dashboarded?.getAttribute('data-substrate')).toBe('green');
    expect(dashboarded?.getAttribute('data-mode')).toBe('precision');
  });

  test('REQ-212 · REQ-123 · the media query forcing precision still wins over a dashboard’s mode', () => {
    capture();
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-contrast: more'), media: query, addEventListener() {}, removeEventListener() {} }));
    const host = mount(
      <Dashboard id="ops" title="Ops" mode="ink">
        <DashboardCell>
          <LineChart title="Forced" />
        </DashboardCell>
      </Dashboard>,
    );
    expect(host.querySelector('svg.sp-chart')?.getAttribute('data-mode')).toBe('precision');
  });
});

describe('React Dashboard: hydration (T-111)', () => {
  test('REQ-207 · hydrates at the nominal width with no mismatch, then re-renders at the measured width', () => {
    capture();
    const observers: ((width: number) => void)[] = [];
    const notify = (width: number) => observers.forEach((callback) => callback(width));
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
    const page = clientOps();
    const host = document.createElement('div');
    host.innerHTML = renderToString(page);
    document.body.append(host);
    const recoverable = vi.fn();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;
    act(() => {
      root = hydrateRoot(host, page, { onRecoverableError: recoverable });
    });
    cleanup.push(() => {
      act(() => root?.unmount());
      host.remove();
      errors.mockRestore();
    });
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/hydrat|did not match/i);
    const boxes = () => [...host.querySelectorAll('svg.sp-chart')].map((svg) => svg.getAttribute('viewBox'));
    expect(boxes()).toEqual(['0 0 288 240', '0 0 896 240']);
    act(() => notify(300));
    // Measured: the width follows the container; the height stays the cell's.
    expect(boxes()).toEqual(['0 0 300 240', '0 0 300 240']);
  });
});

describe('React Dashboard: entry points (T-111)', () => {
  test('REQ-104 · the server Dashboard is a plain function: no hooks, no client state', () => {
    capture();
    expect(() => ServerDashboard({ id: 'ops', title: 'Ops' })).not.toThrow();
  });

  test('TD §6 · outside a dashboard, a server chart without an id warns SP002 and still renders', () => {
    const seen = capture();
    const markup = renderToStaticMarkup(<ServerLineChart width={320} height={160} title="Alone" />);
    expect(seen).toContain('SP002');
    expect(markup).toContain('data-status="ready"');
  });

  test('REQ-009 · outside a dashboard, a server chart without a width is deferred with SP003, never NaN', () => {
    const seen = capture();
    const markup = renderToStaticMarkup(<ServerLineChart id="sp-alone" title="Alone" />);
    expect(markup).toContain('data-status="deferred"');
    expect(markup).not.toMatch(/NaN/);
    expect(seen).toContain('SP003');
  });
});

describe('React Dashboard: linked interaction (T-121)', () => {
  const rows = (offset: number) => ['10', '11', '12'].map((hour, i) => ({ hour, hits: i + offset }));
  const linked = (onLinkChange?: (link: { key: string; value: unknown } | null) => void, onActiveChange?: () => void) => (
    <Dashboard id="lk" title="Linked" link={{ key: 'hour' }} onLinkChange={onLinkChange}>
      <DashboardCell cell="a">
        <LineChart title="Source" data={rows(1)} xKey="hour" valueKey="hits" />
      </DashboardCell>
      <DashboardCell cell="b">
        <LineChart title="Follower" data={rows(5)} xKey="hour" valueKey="hits" onActiveChange={onActiveChange} />
      </DashboardCell>
    </Dashboard>
  );

  test('REQ-216 · REQ-218 · the source’s active item marks the same hour in the other chart, hidden from assistive technology; it clears with the source', () => {
    capture();
    const changes: unknown[] = [];
    const follower = vi.fn();
    const host = mount(linked((link) => changes.push(link), follower));
    const [source, other] = host.querySelectorAll<HTMLElement>('.sp-root');
    act(() => source!.focus());
    const marks = other!.querySelectorAll('svg[part="linked"] path');
    expect(marks).toHaveLength(1);
    expect(other!.querySelector('svg[part="linked"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(source!.querySelector('svg[part="linked"]')).toBeNull();
    expect(changes).toEqual([{ key: 'hour', value: '10' }]);
    expect(follower).not.toHaveBeenCalled();
    act(() => source!.blur());
    expect(host.querySelectorAll('svg[part="linked"]')).toHaveLength(0);
    expect(changes).toEqual([{ key: 'hour', value: '10' }, null]);
  });

  test('REQ-219 · I-15 · linked state lives on the client only: the server render has no linked mark', () => {
    capture();
    expect(renderToString(linked())).not.toMatch(/part="linked"/);
  });
});
