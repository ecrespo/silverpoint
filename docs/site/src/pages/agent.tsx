import tools from '../../generated/agent-tools.json';

/** The hosted server, behind the official site's `/mcp` (REQ-558). */
export const MCP_URL = 'https://silverpointweb.vercel.app/mcp';

const CLIENTS: readonly { readonly client: string; readonly where: string; readonly config: string }[] = [
  { client: 'Claude Code', where: 'in a terminal', config: `claude mcp add --transport http silverpoint ${MCP_URL}` },
  { client: 'Claude', where: 'Settings → Connectors → Add custom connector, with this URL', config: MCP_URL },
  {
    client: 'Cursor',
    where: 'in ~/.cursor/mcp.json, or .cursor/mcp.json in a project',
    config: JSON.stringify({ mcpServers: { silverpoint: { url: MCP_URL } } }, null, 2),
  },
  {
    client: 'VS Code',
    where: 'in .vscode/mcp.json',
    config: JSON.stringify({ servers: { silverpoint: { type: 'http', url: MCP_URL } } }, null, 2),
  },
];

const PLUGIN = `/plugin marketplace add ecrespo/silverpoint
/plugin install silverpoint@silverpoint`;

const LOCAL = `claude mcp add silverpoint -- npx -y @silverpoint/mcp`;

/** "Use with AI" (REQ-565): the MCP server, the plugin and the skill, and the tools as the server defines them (REQ-569). */
export function AgentPage() {
  return (
    <>
      <h2>Use with AI</h2>
      <p>
        An assistant that knows silverpoint writes it correctly: the right chart for the data, the props each chart declares,
        the imports and stylesheets of your framework. The silverpoint MCP server tells it all of that from the catalog of the
        version it ships with, and checks and draws what it writes. The silverpoint skill holds the same knowledge as files, for
        an assistant with no server connected.
      </p>
      <h3 id="agent-server">The MCP server</h3>
      <p>
        It is hosted at <code>{MCP_URL}</code>, over Streamable HTTP, read-only and without an account.
      </p>
      {CLIENTS.map(({ client, where, config }) => (
        <section key={client} aria-labelledby={`agent-${client.replace(/\W+/g, '-').toLowerCase()}`}>
          <h4 id={`agent-${client.replace(/\W+/g, '-').toLowerCase()}`}>{client}</h4>
          <p>{where[0]!.toUpperCase() + where.slice(1)}:</p>
          <pre>
            <code>{config}</code>
          </pre>
        </section>
      ))}
      <h3 id="agent-plugin">The plugin for Claude Code</h3>
      <p>
        The <code>silverpoint</code> plugin installs the skill and connects the hosted server in one step:
      </p>
      <pre>
        <code>{PLUGIN}</code>
      </pre>
      <h3 id="agent-local">Running it locally</h3>
      <p>
        The same server runs over stdio from npm, with no network access of its own. It answers for the version you install:
      </p>
      <pre>
        <code>{LOCAL}</code>
      </pre>
      <h3 id="agent-tools">Its tools</h3>
      <table className="props" aria-labelledby="agent-tools">
        <thead>
          <tr>
            <th scope="col">Tool</th>
            <th scope="col">What it answers</th>
          </tr>
        </thead>
        <tbody>
          {tools.map((tool) => (
            <tr key={tool.name}>
              <th scope="row">
                <code>{tool.name}</code>
              </th>
              <td>{tool.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Every result names the version it describes. The server also offers the catalog, each chart and component, the diagnostic
        codes and the skill's guides as resources, and two prompts, <code>choose-chart</code> and <code>build-dashboard</code>.
      </p>
    </>
  );
}
