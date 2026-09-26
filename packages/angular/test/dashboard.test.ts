import { Component, type ApplicationRef, type EnvironmentProviders, type Provider } from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { provideSilverpoint } from '@silverpoint/angular';
import { SpDashboard, SpDashboardCell } from '@silverpoint/angular/dashboard';
import { SpKpiCard } from '@silverpoint/angular/kpi-card';
import { SpLineChart } from '@silverpoint/angular/line-chart';
import { __setDiagnosticSink, dashboardView, type SpCode } from '@silverpoint/core';
import { Window } from 'happy-dom';
import { afterEach, describe, expect, test } from 'vitest';

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

function capture(): SpCode[] {
  const seen: SpCode[] = [];
  cleanup.push(__setDiagnosticSink((code) => seen.push(code)));
  return seen;
}

const LAYOUT = { cells: [{ id: 'revenue' }, { id: 'traffic', colSpan: { md: 2, lg: 3 } }] };

/** Server-renders a page template with the dashboard components and two charts. */
function ssr(template: string, providers: (Provider | EnvironmentProviders)[] = []): Promise<string> {
  const Page = Component({ selector: 'app-root', imports: [SpDashboard, SpDashboardCell, SpLineChart, SpKpiCard], template })(
    class Page {
      layout = LAYOUT;
      single = { cells: [{ id: 'a' }] };
    },
  );
  return renderApplication(
    (context: BootstrapContext): Promise<ApplicationRef> => bootstrapApplication(Page, { providers: [provideServerRendering(), ...providers] }, context),
    { document: '<html><head></head><body><app-root></app-root></body></html>' },
  );
}

function parse(html: string): Document {
  const window = new Window();
  window.document.write(html);
  return window.document as unknown as Document;
}

/** Two cells, given out of reading order, as in the React and Vue tests. */
const OPS = `
  <sp-dashboard id="ops" title="Operations" description="Service health." [layout]="layout">
    <sp-dashboard-cell cell="traffic"><sp-line-chart title="Traffic" /></sp-dashboard-cell>
    <sp-dashboard-cell cell="revenue"><sp-kpi-card title="Revenue" /></sp-dashboard-cell>
  </sp-dashboard>`;

describe('sp-dashboard under @angular/platform-server (T-113)', () => {
  test('REQ-200 · REQ-214 · a section labelled by its heading and described, with a grid of articles', async () => {
    capture();
    const doc = parse(await ssr(OPS));
    const section = doc.querySelector('section')!;
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
    expect([...grid.querySelectorAll(':scope > article')].map((c) => [c.getAttribute('part'), c.className])).toEqual([
      ['dashboard-cell', 'sp-dashboard-cell'],
      ['dashboard-cell', 'sp-dashboard-cell'],
    ]);
  });

  test('REQ-203 · REQ-209 · REQ-214 · cells in reading order, each labelled by its chart’s title', async () => {
    capture();
    const doc = parse(await ssr(OPS));
    const cells = [...doc.querySelectorAll('article')];
    expect(cells.map((c) => c.getAttribute('aria-labelledby'))).toEqual(['ops--revenue-title', 'ops--traffic-title']);
    expect(cells.map((c) => c.querySelector('svg title')?.textContent)).toEqual(['Revenue', 'Traffic']);
    for (const cell of cells) expect(cell.querySelector(`[id="${cell.getAttribute('aria-labelledby')}"]`)).not.toBeNull();
  });

  test('REQ-202 · the wrapper and each cell carry the model’s variables', async () => {
    capture();
    const doc = parse(await ssr(OPS));
    const view = dashboardView({ id: 'ops', title: 'Operations', layout: LAYOUT }, [{ cell: 'traffic' }, { cell: 'revenue' }]);
    const declarations = (el: Element) => Object.fromEntries((el.getAttribute('style') ?? '').split(';').filter(Boolean).map((d) => d.split(':').map((p) => p.trim())));
    expect(declarations(doc.querySelector('section')!)).toEqual(view.model.style);
    expect([...doc.querySelectorAll('article')].map(declarations)).toEqual(view.cells.map((c) => c.style));
  });

  test('REQ-206 · every chart fills its nominal box', async () => {
    capture();
    const boxes = [...parse(await ssr(OPS)).querySelectorAll('article svg.sp-chart')].map((svg) => svg.getAttribute('viewBox'));
    expect(boxes).toEqual(['0 0 288 240', '0 0 896 240']);
  });

  test('REQ-206 · REQ-209 · a chart’s own height and id win over the cell’s', async () => {
    capture();
    const doc = parse(await ssr(`<sp-dashboard id="ops" title="Ops"><sp-dashboard-cell><sp-line-chart id="mine" [height]="90" title="Mine" /></sp-dashboard-cell></sp-dashboard>`));
    expect(doc.querySelector('article')?.getAttribute('aria-labelledby')).toBe('mine-title');
    expect(doc.querySelector('svg.sp-chart')?.getAttribute('viewBox')).toMatch(/^0 0 288 /);
    expect(doc.querySelector('svg.sp-chart')?.getAttribute('viewBox')).not.toBe('0 0 288 240');
  });

  test('REQ-214 · headingLevel sets the heading; a label alone names the section without one', async () => {
    capture();
    expect(parse(await ssr(`<sp-dashboard id="d" title="T" [headingLevel]="3" />`)).querySelector('h3#d-title')).not.toBeNull();
    const labelled = parse(await ssr(`<sp-dashboard id="d" label="Only a label" />`)).querySelector('section')!;
    expect(labelled.getAttribute('aria-label')).toBe('Only a label');
    expect(labelled.hasAttribute('aria-labelledby')).toBe(false);
    expect(labelled.querySelector('h2, h3, h4, h5, h6')).toBeNull();
  });

  test('REQ-205 · a mismatch between layout and children warns SP015 and never throws', async () => {
    const seen = capture();
    const doc = parse(await ssr(`<sp-dashboard id="ops" title="Ops" [layout]="single"><sp-dashboard-cell cell="nope"><sp-line-chart title="Lost" /></sp-dashboard-cell></sp-dashboard>`));
    expect(doc.querySelectorAll('article')).toHaveLength(1);
    expect(seen).toContain('SP015');
  });

  test('REQ-212 · the dashboard’s substrate and mode reach its charts; a chart’s own input wins', async () => {
    capture();
    const doc = parse(
      await ssr(`<sp-dashboard id="ops" title="Ops" substrate="green" mode="precision">
        <sp-dashboard-cell><sp-line-chart title="Inherits" /></sp-dashboard-cell>
        <sp-dashboard-cell><sp-line-chart title="Own" substrate="ochre" /></sp-dashboard-cell>
      </sp-dashboard>`),
    );
    const [first, second] = doc.querySelectorAll('svg.sp-chart');
    expect(first?.getAttribute('data-substrate')).toBe('green');
    expect(first?.getAttribute('data-mode')).toBe('precision');
    expect(second?.getAttribute('data-substrate')).toBe('ochre');
  });

  test('REQ-212 · precedence: chart → dashboard → provider', async () => {
    capture();
    const doc = parse(
      await ssr(
        `<sp-dashboard id="a" title="A"><sp-dashboard-cell><sp-line-chart title="From the provider" /></sp-dashboard-cell></sp-dashboard>
         <sp-dashboard id="b" title="B" substrate="green"><sp-dashboard-cell><sp-line-chart title="From the dashboard" /></sp-dashboard-cell></sp-dashboard>`,
        [provideSilverpoint({ substrate: 'blue', mode: 'precision' })],
      ),
    );
    const [provided, dashboarded] = doc.querySelectorAll('svg.sp-chart');
    expect(provided?.getAttribute('data-substrate')).toBe('blue');
    expect(dashboarded?.getAttribute('data-substrate')).toBe('green');
    expect(dashboarded?.getAttribute('data-mode')).toBe('precision');
  });

  test('REQ-214 · Angular cannot require “title or label” by type: a dashboard with neither warns SP002', async () => {
    const seen = capture();
    await ssr(`<sp-dashboard id="ops" />`);
    expect(seen).toContain('SP002');
  });
});
