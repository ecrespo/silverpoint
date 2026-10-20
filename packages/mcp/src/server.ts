/**
 * `createServer` (API delta §1, REQ-538): an `McpServer` holding every tool, resource and prompt of
 * the agent catalog. Each tool is a pure function of its input and the catalog (Art. 4); every
 * result carries the catalog's version (REQ-550); a `ToolError` becomes a tool error the client
 * reads as data (REQ-549).
 */
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { AGENT_CATALOG, Catalog, DATA_SHAPES, INTENTS } from './catalog';
import { generateCode } from './codegen';
import { ToolError } from './errors';
import { getChart, getComponent, listCharts, listComponents } from './tools/entries';
import { recommendChart } from './tools/recommend';
import { SEARCH_LIMIT, searchCatalog } from './tools/search';
import { checkPaletteTool } from './tools/palette';
import { renderChart } from './tools/render';
import { validateProps } from './tools/validate';
import { getVersion } from './tools/version';
import { checkPayload } from './limits';
import type { AgentCatalog } from './types';

export interface ServerOptions {
  /** The catalog to serve; the one this package ships by default. */
  readonly catalog?: AgentCatalog;
}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

/**
 * Enum-like inputs are strings the tools check themselves, so a typo gets suggestions (REQ-549);
 * lengths and row counts are `checkPayload`'s, so an oversized input is `limit_exceeded` (REQ-560).
 */
const name = (what: string) => z.string().describe(what);
const versioned = <T extends z.ZodRawShape>(shape: T) => z.looseObject({ version: z.string(), ...shape });
const ERROR_SHAPE = { code: z.string().optional(), message: z.string().optional(), suggestions: z.array(z.string()).optional() };

function summary(tool: string, result: Record<string, unknown>): string {
  return `${tool} · silverpoint ${String(result.version)}\n${JSON.stringify(result, null, 2)}`;
}

export function createServer(options: ServerOptions = {}): McpServer {
  const catalog = new Catalog(options.catalog ?? AGENT_CATALOG);
  const version = catalog.version;
  const server = new McpServer({ name: 'silverpoint', title: 'silverpoint', version }, { capabilities: { logging: {} } });

  /** Runs a tool body; its result or its error, as structured content with the version. */
  const answer =
    <I>(tool: string, body: (input: I) => object) =>
    async (input: I): Promise<CallToolResult> => {
      try {
        checkPayload(input);
        const result = { version, ...body(input) };
        return { structuredContent: result, content: [{ type: 'text', text: summary(tool, result) }] };
      } catch (error) {
        if (!(error instanceof ToolError)) throw error;
        const result = { version, code: error.code, message: error.message, suggestions: [...error.suggestions] };
        return { isError: true, structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    };

  server.registerTool(
    'get_version',
    {
      title: 'Version',
      description: 'The silverpoint version this server describes, the Reflex wrapper it is joined with, and the MCP protocol version.',
      inputSchema: {},
      outputSchema: versioned({ reflex: z.looseObject({}).optional(), protocol: z.string().optional(), ...ERROR_SHAPE }),
      annotations: READ_ONLY,
    },
    answer('get_version', () => getVersion(catalog)),
  );

  server.registerTool(
    'list_charts',
    {
      title: 'List charts',
      description: `Every chart, optionally filtered by family, intent (${INTENTS.join(', ')}) or data shape (${DATA_SHAPES.join(', ')}).`,
      inputSchema: { family: name('A chart family slug, e.g. `flows`.').optional(), intent: name('What the reader should see.').optional(), shape: name('What the rows hold.').optional() },
      outputSchema: versioned({ charts: z.array(z.looseObject({})).optional(), ...ERROR_SHAPE }),
      annotations: READ_ONLY,
    },
    answer('list_charts', (input: { family?: string; intent?: string; shape?: string }) => listCharts(catalog, input)),
  );

  server.registerTool(
    'get_chart',
    {
      title: 'Get chart',
      description: 'One chart’s catalog entry: data shape, fields, props with defaults, names and imports. With `framework`, only that framework’s name, import and prop spelling.',
      inputSchema: { slug: name('The chart, by slug or by any framework’s name.'), framework: name('react, vue, angular or reflex.').optional() },
      outputSchema: versioned({ chart: z.looseObject({}).optional(), ...ERROR_SHAPE }),
      annotations: READ_ONLY,
    },
    answer('get_chart', (input: { slug: string; framework?: string }) => getChart(catalog, input)),
  );

  server.registerTool(
    'list_components',
    {
      title: 'List components',
      description: 'Every UI component, optionally filtered by family (ui, composed, overlay) or group.',
      inputSchema: { family: name('ui, composed or overlay.').optional(), group: name('A component group, e.g. `navigation`.').optional() },
      outputSchema: versioned({ components: z.array(z.looseObject({})).optional(), ...ERROR_SHAPE }),
      annotations: READ_ONLY,
    },
    answer('list_components', (input: { family?: string; group?: string }) => listComponents(catalog, input)),
  );

  server.registerTool(
    'get_component',
    {
      title: 'Get component',
      description: 'One component’s catalog entry: props, binding, events, slots and states. With `framework`, in that framework’s terms.',
      inputSchema: { slug: name('The component, by slug or by any framework’s name.'), framework: name('react, vue, angular or reflex.').optional() },
      outputSchema: versioned({ component: z.looseObject({}).optional(), ...ERROR_SHAPE }),
      annotations: READ_ONLY,
    },
    answer('get_component', (input: { slug: string; framework?: string }) => getComponent(catalog, input)),
  );

  server.registerTool(
    'recommend_chart',
    {
      title: 'Recommend a chart',
      description: 'Up to five charts for a data shape and an intent, ranked by a reviewed table, with the reasons. Deterministic: no model involved.',
      inputSchema: {
        shape: name(`What the rows hold: ${DATA_SHAPES.join(', ')}.`),
        intent: name(`What the reader should see: ${INTENTS.join(', ')}.`),
        rows: z.number().int().min(0).max(1_000_000).optional().describe('How many rows the data holds.'),
        fields: z
          .array(z.object({ name: z.string(), type: z.enum(['string', 'number', 'date', 'boolean']) }))
          
          .optional()
          .describe('The fields of a row; numeric ones count as value fields.'),
      },
      outputSchema: versioned({ recommendations: z.array(z.looseObject({})).optional(), ...ERROR_SHAPE }),
      annotations: READ_ONLY,
    },
    answer('recommend_chart', (input: Parameters<typeof recommendChart>[1]) => recommendChart(catalog, input)),
  );

  server.registerTool(
    'generate_code',
    {
      title: 'Generate code',
      description:
        'The imports, stylesheets and code that draw one chart or one component in React, Vue, Angular or Reflex, using only names, paths and props the catalog holds. `fields` maps the chart’s data roles to your field names.',
      inputSchema: {
        target: z.object({ chart: z.string().optional(), component: z.string().optional() }).describe('Exactly one of `chart` or `component`.'),
        framework: name('react, vue, angular or reflex.'),
        fields: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional().describe('Data role → field name in your rows.'),
        props: z.record(z.string(), z.unknown()).optional().describe('Props, by their camelCase or Python name.'),
        ground: name('silverpoint or cyanotype.').optional(),
        substrate: name('A substrate of the ground.').optional(),
        mode: name('ink or precision.').optional(),
        palette: name('A preset of @silverpoint/core/palettes.').optional(),
      },
      outputSchema: versioned({
        imports: z.array(z.string()).optional(),
        stylesheets: z.array(z.string()).optional(),
        // The source on success; the error code on a tool error (REQ-549).
        code: z.string().optional(),
        notes: z.array(z.string()).optional(),
        message: ERROR_SHAPE.message,
        suggestions: ERROR_SHAPE.suggestions,
      }),
      annotations: READ_ONLY,
    },
    answer('generate_code', (input: Parameters<typeof generateCode>[1]) => generateCode(catalog, input)),
  );

  server.registerTool(
    'search_catalog',
    {
      title: 'Search the catalog',
      description: `A token search over chart and component names, summaries, prop docs and diagnostic codes, best first; at most ${SEARCH_LIMIT.max} hits.`,
      inputSchema: { query: z.string(), limit: z.number().int().min(1).optional().describe(`At most ${SEARCH_LIMIT.max}; ${SEARCH_LIMIT.default} by default.`) },
      outputSchema: versioned({ hits: z.array(z.looseObject({})).optional(), ...ERROR_SHAPE }),
      annotations: READ_ONLY,
    },
    answer('search_catalog', (input: { query: string; limit?: number }) => searchCatalog(catalog, input)),
  );

  const palette = z.union([z.string(), z.record(z.string(), z.string())]);

  server.registerTool(
    'validate_props',
    {
      title: 'Validate props',
      description: 'Builds the chart with the core and returns every diagnostic it raises (code, severity, requirement, message, remedy) and the props it does not declare.',
      inputSchema: {
        chart: name('The chart, by slug or by any framework’s name.'),
        props: z.record(z.string(), z.unknown()).describe('The props, `data` included; without `data` the demo dataset is used.'),
        width: z.number().optional().describe('320..1600 px; 480 by default.'),
        height: z.number().optional().describe('120..1200 px.'),
      },
      outputSchema: versioned({ valid: z.boolean().optional(), diagnostics: z.array(z.looseObject({})).optional(), unknownProps: z.array(z.string()).optional(), ...ERROR_SHAPE }),
      annotations: READ_ONLY,
    },
    answer('validate_props', (input: Parameters<typeof validateProps>[1]) => validateProps(catalog, input)),
  );

  server.registerTool(
    'render_chart',
    {
      title: 'Render a chart',
      description:
        'The canonical render of one chart as a standalone SVG, the ground’s stylesheet inlined: what every adapter draws for the same props, data, size and id. Without `data`, the demo dataset.',
      inputSchema: {
        chart: name('The chart, by slug or by any framework’s name.'),
        props: z.record(z.string(), z.unknown()).optional().describe('The chart’s own props; data, size, id and appearance are inputs of their own.'),
        data: z.array(z.record(z.string(), z.unknown())).optional().describe('At most 5,000 rows.'),
        width: z.number().optional().describe('320..1600 px; 480 by default.'),
        height: z.number().optional().describe('120..1200 px.'),
        id: name('Stems the SVG’s ids; the slug by default.').optional(),
        ground: name('silverpoint or cyanotype.').optional(),
        substrate: name('A substrate of the ground.').optional(),
        mode: name('ink or precision.').optional(),
        palette: palette.optional().describe('A preset name, or a palette’s fields.'),
        embedFonts: z.boolean().optional().describe('Inline EB Garamond; otherwise the face is referenced with a serif fallback.'),
      },
      outputSchema: versioned({ svg: z.string().optional(), width: z.number().optional(), height: z.number().optional(), diagnostics: z.array(z.looseObject({})).optional(), ...ERROR_SHAPE }),
      annotations: READ_ONLY,
    },
    answer('render_chart', (input: Parameters<typeof renderChart>[1]) => renderChart(catalog, input)),
  );

  server.registerTool(
    'check_palette',
    {
      title: 'Check a palette',
      description: 'The contrast findings of the core’s checkPalette for a preset or a palette of fields, over a substrate given as a hex or by name.',
      inputSchema: { palette: palette.describe('A preset name, or a palette’s fields.'), substrate: name('A hex, or a substrate name such as cream or prussian.').optional() },
      outputSchema: versioned({ findings: z.array(z.looseObject({})).optional(), substrate: z.string().optional(), ...ERROR_SHAPE }),
      annotations: READ_ONLY,
    },
    answer('check_palette', (input: Parameters<typeof checkPaletteTool>[1]) => checkPaletteTool(catalog, input)),
  );

  const json = (uri: string, value: unknown) => ({ contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(value, null, 2) }] });

  server.registerResource('catalog', 'silverpoint://catalog', { title: 'Agent catalog', description: `The whole agent catalog of silverpoint ${version}.`, mimeType: 'application/json' }, (uri) =>
    json(uri.href, catalog.data),
  );
  server.registerResource('diagnostics', 'silverpoint://diagnostics', { title: 'Diagnostic codes', description: 'Every SP diagnostic: severity, requirement, what it means and what to do.', mimeType: 'application/json' }, (uri) =>
    json(uri.href, catalog.data.diagnostics),
  );
  server.registerResource(
    'chart',
    new ResourceTemplate('silverpoint://charts/{slug}', {
      list: () => ({ resources: catalog.data.charts.map((c) => ({ uri: `silverpoint://charts/${c.slug}`, name: c.slug, title: c.names.react, description: c.summary, mimeType: 'application/json' })) }),
    }),
    { title: 'Chart', description: 'One chart’s catalog entry.', mimeType: 'application/json' },
    (uri, { slug }) => json(uri.href, catalog.chart(String(slug))),
  );
  server.registerResource(
    'component',
    new ResourceTemplate('silverpoint://components/{slug}', {
      list: () => ({ resources: catalog.data.components.map((c) => ({ uri: `silverpoint://components/${c.slug}`, name: c.slug, title: c.names.react, description: c.summary, mimeType: 'application/json' })) }),
    }),
    { title: 'Component', description: 'One component’s catalog entry.', mimeType: 'application/json' },
    (uri, { slug }) => json(uri.href, catalog.component(String(slug))),
  );

  server.registerPrompt(
    'choose-chart',
    { title: 'Choose a chart', description: 'From a description of the data and the question, pick a chart, look at it, and write its code.', argsSchema: { description: z.string() } },
    ({ description }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `The data and the question: ${description}`,
              '',
              '1. Describe the rows as a data shape and the question as an intent, then call `recommend_chart`.',
              '2. Call `render_chart` for the top two recommendations, with a few representative rows, and compare them.',
              '3. Call `generate_code` for the better one, mapping its data roles to the real field names with `fields`.',
              'Use only names, props and imports the tools return.',
            ].join('\n'),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'build-dashboard',
    {
      title: 'Build a dashboard',
      description: 'From a list of needs, one chart per need laid out as a silverpoint dashboard.',
      argsSchema: { framework: z.string(), charts: z.string().describe('The needs, separated by semicolons.') },
    },
    ({ framework, charts }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `Framework: ${framework}. Needs: ${charts}`,
              '',
              '1. For each need, call `recommend_chart` and keep the top recommendation.',
              '2. Read the dashboard layout from `silverpoint://catalog` (`dashboard`): one cell per chart.',
              `3. Call \`generate_code\` with \`framework: "${framework}"\` for each cell's chart, then place them in the dashboard.`,
            ].join('\n'),
          },
        },
      ],
    }),
  );

  return server;
}
