/**
 * The MCP smoke test (REQ-568): initialise, list tools, resources and prompts, and call every tool
 * once with a valid input, through the SDK's own Streamable HTTP client. Each answer must carry the
 * version the server announced (REQ-550).
 *
 *   pnpm --filter @silverpoint/mcp-smoke smoke https://<deployment>/api/mcp
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { pathToFileURL } from 'node:url';

/** One valid call per tool; a tool the server lists without a call here fails the smoke test. */
export const CALLS: Readonly<Record<string, Record<string, unknown>>> = {
  get_version: {},
  list_charts: { family: 'flows' },
  get_chart: { slug: 'sankey-chart', framework: 'react' },
  list_components: { family: 'overlay' },
  get_component: { slug: 'modal', framework: 'vue' },
  recommend_chart: { shape: 'categories', intent: 'compare', rows: 8 },
  generate_code: { target: { chart: 'bar-chart' }, framework: 'angular' },
  search_catalog: { query: 'sankey flow' },
  validate_props: { chart: 'line-chart', props: { data: [] } },
  render_chart: { chart: 'donut-chart', width: 320 },
  check_palette: { palette: 'sanguine' },
};

export interface SmokeReport {
  readonly version: string;
  readonly tools: readonly string[];
  readonly resources: number;
  readonly templates: number;
  readonly prompts: readonly string[];
  readonly problems: readonly string[];
}

export async function smoke(url: string): Promise<SmokeReport> {
  const client = new Client({ name: 'silverpoint-smoke', version: '0.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(url)));
  const problems: string[] = [];
  try {
    const version = client.getServerVersion()?.version ?? '';
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    for (const name of names) if (!(name in CALLS)) problems.push(`${name}: listed but the smoke test has no call for it`);
    for (const name of Object.keys(CALLS)) if (!names.includes(name)) problems.push(`${name}: not listed`);
    for (const name of names.filter((n) => n in CALLS)) {
      const result = await client.callTool({ name, arguments: CALLS[name] });
      const structured = result.structuredContent as { version?: string } | undefined;
      if (result.isError) problems.push(`${name}: ${JSON.stringify(result.content).slice(0, 200)}`);
      else if (structured?.version !== version) problems.push(`${name}: answered for version ${structured?.version}, not ${version}`);
    }
    const { resources } = await client.listResources();
    const { resourceTemplates } = await client.listResourceTemplates();
    const catalog = await client.readResource({ uri: 'silverpoint://catalog' });
    if (!('text' in catalog.contents[0]!) || (JSON.parse(String(catalog.contents[0].text)) as { version: string }).version !== version) problems.push('silverpoint://catalog: not the announced version');
    const { prompts } = await client.listPrompts();
    return { version, tools: names, resources: resources.length, templates: resourceTemplates.length, prompts: prompts.map((p) => p.name), problems };
  } finally {
    await client.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const url = process.argv[2];
  if (!url) {
    console.error('usage: smoke <url of the MCP endpoint>');
    process.exit(2);
  }
  const report = await smoke(url);
  console.log(`silverpoint ${report.version}: ${report.tools.length} tools, ${report.resources} resources, ${report.templates} templates, prompts ${report.prompts.join(', ')}`);
  for (const problem of report.problems) console.error(problem);
  process.exit(report.problems.length > 0 ? 1 : 0);
}
