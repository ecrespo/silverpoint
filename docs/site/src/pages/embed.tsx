import { mount } from '@silverpoint/embed/client';
import { useEffect, useRef } from 'react';
import catalog from '../../../../packages/mcp/agent-catalog.json';

/** What a host is built on, in the words of the hosts reference (REQ-663). */
const VIA = { embed: 'the standalone file of @silverpoint/embed', react: '@silverpoint/react', python: 'the silverpoint Python package' } as const;

const SPEC = {
  chart: 'bar-chart',
  id: 'embed-demo',
  data: [
    { quarter: 'Q1', orders: 120 },
    { quarter: 'Q2', orders: 168 },
    { quarter: 'Q3', orders: 141 },
    { quarter: 'Q4', orders: 190 },
  ],
  props: { xKey: 'quarter', valueKey: 'orders', title: 'Orders per quarter' },
} as const;

const PAGE = `<script src="silverpoint-embed.full.js"></script>
<silverpoint-chart>
  <script type="application/json">${JSON.stringify(SPEC)}</script>
</silverpoint-chart>`;

const NODE = `import { renderToSVG, renderToHTML } from '@silverpoint/embed';

const svg = renderToSVG(spec);                  // a standalone SVG, in Node, with no DOM
const page = renderToHTML(spec, { interactive: true, script: { src: '/silverpoint-embed.full.js' } });`;

const TABLE = `import { specFromTable } from '@silverpoint/embed/hosts';

const spec = specFromTable({
  chart: 'heatmap-chart',
  table: { rows },                                  // what the host's query returned
  roles: { row: 'day', column: 'hour', value: 'load' },
  options: { scaleMax: 100 },
});`;

/** The live example: the embed client, not the React adapter (REQ-667). */
function Live() {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!box.current) return undefined;
    const handle = mount(box.current, SPEC);
    return () => handle.destroy();
  }, []);
  return <div ref={box} id="embed-live" />;
}

/** "BI tools and plain pages" (REQ-667): the embed, its three ways in, and the host list from the agent catalog (REQ-661). */
export function EmbedPage() {
  return (
    <>
      <h2>BI tools and plain pages</h2>
      <p>
        Outside React, Vue, Angular and Reflex a chart is a JSON spec, drawn by <code>@silverpoint/embed</code>: the same
        engine as the adapters, so the same picture, keyboard reading and precision mode. One script and one element are the
        whole integration of a page.
      </p>
      <h3 id="embed-page">In a page, with one file</h3>
      <pre>
        <code>{PAGE}</code>
      </pre>
      <Live />
      <h3 id="embed-server">On a server or in a flow</h3>
      <pre>
        <code>{NODE}</code>
      </pre>
      <h3 id="embed-table">From a table, in a BI tool</h3>
      <pre>
        <code>{TABLE}</code>
      </pre>
      <p>
        The roles, options and appearance values a host offers come from <code>@silverpoint/embed/host-catalog.json</code>, and
        a host proves it draws correctly with the conformance kit, <code>@silverpoint/embed/conformance</code>.
      </p>
      <h3 id="embed-hosts">Hosts</h3>
      {/* Four columns are wider than a phone: the table scrolls in its own region (WCAG 1.4.10). */}
      <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="embed-hosts">
        <table id="embed-host-list">
          <thead>
            <tr>
              <th scope="col">Host</th>
              <th scope="col">Built on</th>
              <th scope="col">Status</th>
              <th scope="col">What it is</th>
            </tr>
          </thead>
          <tbody>
            {catalog.hosts.map((host) => (
              <tr key={host.id}>
                <th scope="row">{host.repository ? <a href={host.repository}>{host.name}</a> : host.name}</th>
                <td>{VIA[host.via as keyof typeof VIA]}</td>
                <td>{host.status}</td>
                <td>{host.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
