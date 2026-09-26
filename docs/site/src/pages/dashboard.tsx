import { DASHBOARD_DEFAULTS } from '@silverpoint/core';
import { DASHBOARD_DEMOS } from '@silverpoint/core/dashboard-demos';
import * as Charts from '@silverpoint/react';
import { Dashboard, DashboardCell } from '@silverpoint/react/dashboard';
import type { ComponentType } from 'react';
import reference from '../../generated/props.json';

interface PropDoc {
  readonly name: string;
  readonly type: string;
  readonly optional: boolean;
  readonly doc: string;
}

/** A props table read from the core's types, never retyped (REQ-200, PRD §5.1). */
function PropsTable({ caption, props }: { caption: string; props: readonly PropDoc[] }) {
  return (
    <div className="table-scroll">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Type</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name}>
              <th scope="row">
                <code>{p.optional ? `${p.name}?` : p.name}</code>
              </th>
              <td>
                <code>{p.type}</code>
              </td>
              <td>{p.doc || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const EXAMPLES = [
  [
    'React',
    `import { Dashboard, DashboardCell } from '@silverpoint/react/dashboard';
import { KpiCard } from '@silverpoint/react/kpi-card';
import { LineChart } from '@silverpoint/react/line-chart';

const layout = { cells: [{ id: 'revenue' }, { id: 'trend', colSpan: { md: 2, lg: 3 } }] };

<Dashboard id="ops" title="Operations" layout={layout}>
  <DashboardCell cell="revenue"><KpiCard title="Revenue" /></DashboardCell>
  <DashboardCell cell="trend"><LineChart title="Traffic" data={rows} xKey="hour" valueKey="hits" /></DashboardCell>
</Dashboard>`,
  ],
  [
    'Vue',
    `<SpDashboard id="ops" title="Operations" :layout="layout">
  <SpDashboardCell cell="revenue"><SpKpiCard title="Revenue" /></SpDashboardCell>
  <SpDashboardCell cell="trend"><SpLineChart title="Traffic" :data="rows" x-key="hour" value-key="hits" /></SpDashboardCell>
</SpDashboard>`,
  ],
  [
    'Angular',
    `<sp-dashboard id="ops" title="Operations" [layout]="layout">
  <sp-dashboard-cell cell="revenue"><sp-kpi-card title="Revenue" /></sp-dashboard-cell>
  <sp-dashboard-cell cell="trend"><sp-line-chart title="Traffic" [data]="rows" xKey="hour" valueKey="hits" /></sp-dashboard-cell>
</sp-dashboard>`,
  ],
] as const;

const CHARTS = Charts as unknown as Readonly<Record<string, ComponentType<Record<string, unknown>>>>;

/** The Dashboard composition (API Spec §7.1): a live example, the code per adapter, and its reference. */
export function DashboardPage() {
  const demo = DASHBOARD_DEMOS['kpi-strip'];
  const { columns } = DASHBOARD_DEFAULTS;
  return (
    <>
      <h2>Dashboard</h2>
      <p>
        A declarative grid of cards. The charts are children; the layout is plain data matched to them by cell id, and the
        core resolves it — columns, spans, reading order and each card's size — so the three adapters write the same
        markup. Cards in a row share one outer height, whatever their titles and footers.
      </p>
      <Dashboard {...demo.props}>
        {demo.children.map((child) => {
          const Chart = CHARTS[child.chart]!;
          return (
            <DashboardCell key={child.cell} cell={child.cell}>
              <Chart {...child.props} />
            </DashboardCell>
          );
        })}
      </Dashboard>

      <h3>In each adapter</h3>
      {EXAMPLES.map(([adapter, code]) => (
        <section key={adapter} aria-labelledby={`dashboard-${adapter}`}>
          <h4 id={`dashboard-${adapter}`}>{adapter}</h4>
          <pre>
            <code>{code}</code>
          </pre>
        </section>
      ))}

      <h3>Breakpoints</h3>
      <p>
        The dashboard measures itself, not the viewport: a dashboard in a sidebar is narrow on a wide screen. The widths
        are fixed; the columns and spans per breakpoint are yours.
      </p>
      <div className="table-scroll">
        <table>
          <caption>Breakpoints of the dashboard's own width</caption>
          <thead>
            <tr>
              <th scope="col">Breakpoint</th>
              <th scope="col">Width</th>
              <th scope="col">Default columns</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">sm</th>
              <td>below 640 px</td>
              <td>{columns.sm}</td>
            </tr>
            <tr>
              <th scope="row">md</th>
              <td>640 px to 1023 px</td>
              <td>{columns.md}</td>
            </tr>
            <tr>
              <th scope="row">lg</th>
              <td>1024 px and wider</td>
              <td>{columns.lg}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Ordering cells</h3>
      <p>
        Cells are never reordered: the order of <code>layout.cells</code> is the reading order and the keyboard order at
        every width. A wide cell that does not fit what is left of a row moves to the next one and leaves a gap at the row
        end. To avoid it, follow a wide cell with narrow ones that fill the row, or give the wide cell a span per
        breakpoint. A bare <code>colSpan: 2</code> also applies at <code>sm</code>, which has one column, and warns{' '}
        <code>SP014</code>; write <code>{'{ md: 2, lg: 2 }'}</code> instead.
      </p>

      <h3>Server rendering</h3>
      <p>
        On the server nothing can be measured, so each card is drawn at a nominal size computed from{' '}
        <code>ssrWidth</code> (1200 by default, the <code>lg</code> design width). The page hydrates at that size, then
        every chart follows its card. A mobile-first app should pass <code>ssrWidth={'{360}'}</code>, so phones see no
        re-render after hydration.
      </p>

      <h3>Linked charts</h3>
      <p>
        With <code>{"link={{ key: 'hour' }}"}</code>, exploring one chart marks, in the others, the items whose datum
        carries the same <code>hour</code>. A chart whose data has no such field shows no mark and warns{' '}
        <code>SP016</code>. Linked marks exist only in the browser and are not announced; the chart being explored
        announces its own item.
      </p>

      <h3>Reference</h3>
      <PropsTable caption="Dashboard props" props={reference.dashboard.props} />
      <PropsTable caption="Layout (DashboardLayout)" props={reference.dashboard.layout} />
      <PropsTable caption="Layout cell (DashboardCellLayout)" props={reference.dashboard.cell} />
    </>
  );
}
