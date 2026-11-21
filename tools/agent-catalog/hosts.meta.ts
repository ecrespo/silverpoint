/**
 * Hand-written facts the host catalog cannot derive (feature-007, DD-066, Data Model §2.41, §2.43):
 * the charts a table does not feed row for row, labels that are not a name in sentence case, and
 * the host integrations themselves — facts about other repositories, edited by a one-line PR when
 * a host changes status (analyze A-06). Everything else in `host-catalog.json` is computed.
 */
import type { HostRole } from '../../packages/embed/src/hosts/types';
import type { HostEntry } from '../../packages/mcp/src/types';

export interface ChartBindingMeta {
  readonly binding: 'pivot' | 'scalar' | 'none';
  readonly reshape?: 'matrix' | 'dimensions' | 'first-row';
  readonly reason?: string;
  /** The roles a host is offered, when they are not the agent catalog's fields. */
  readonly roles?: readonly HostRole[];
  /** Props the reshape writes, never offered as options. */
  readonly writes?: readonly string[];
}

/** API delta §15.3, settled at gate 3 (OQ-H3: orbit stays `none`). */
export const BINDING_META: Readonly<Record<string, ChartBindingMeta>> = {
  'heatmap-chart': {
    binding: 'pivot',
    reshape: 'matrix',
    roles: [
      { id: 'row', prop: null, label: 'Row', kind: 'dimension', dataType: 'string', required: true, multiple: false },
      { id: 'column', prop: null, label: 'Column', kind: 'dimension', dataType: 'string', required: true, multiple: false },
      { id: 'value', prop: null, label: 'Value', kind: 'measure', dataType: 'number', required: true, multiple: false },
    ],
    writes: ['labelKey', 'valuesKey', 'columnLabels'],
  },
  'parallel-coordinates-chart': {
    binding: 'pivot',
    reshape: 'dimensions',
    roles: [
      { id: 'label', prop: 'labelKey', label: 'Label', kind: 'dimension', dataType: 'string', required: false, multiple: false },
      { id: 'dimensions', prop: 'dimensions', label: 'Dimensions', kind: 'measure', dataType: 'number', required: true, multiple: true },
    ],
  },
  'gauge-arc': {
    binding: 'scalar',
    reshape: 'first-row',
    roles: [{ id: 'percent', prop: null, label: 'Percent', kind: 'measure', dataType: 'number', required: true, multiple: false }],
    writes: ['percent'],
  },
  'meter-chart': {
    binding: 'scalar',
    reshape: 'first-row',
    roles: [{ id: 'percent', prop: null, label: 'Percent', kind: 'measure', dataType: 'number', required: true, multiple: false }],
    writes: ['percent'],
  },
  'orbit-chart': { binding: 'none', reason: 'Each row carries an array of markers, which no flat table states. A long form needs a `marker` reshape (OQ-H3, revisit in a delta).' },
  'sparkline-rows': { binding: 'none', reason: 'Each row carries an array of points, which no flat table states. A long form needs a reshape of its own (revisit in a delta).' },
  'volvelle-chart': { binding: 'none', reason: 'It draws from its props alone (rings, an index); no table feeds it.' },
  'treemap-chart': { binding: 'none', reason: 'Each tile carries its own grid span (`cols`, `rows`), which are not data fields; a table of parts binds to squarified-treemap.' },
};

/**
 * Demo props the core draws a chart's demo with that are not role names (`<CONSTANT>_DEMO_PROPS`
 * is read for every chart); here, exports with another name. They go to `demo.options` (I-59).
 */
export const DEMO_EXTRA: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'network-chart': { nodes: 'NETWORK_CHART_DEMO_NODES' },
};

/** Labels that are not the name in sentence case. */
export const TITLES: Readonly<Record<string, string>> = {
  'kpi-card': 'KPI card',
  'ecdf-chart': 'ECDF chart',
};
export const OPTION_LABELS: Readonly<Record<string, string>> = { dataTable: 'Data table', hatchFill: 'Hatch fill', footerLeft: 'Footer, left', footerRight: 'Footer, right' };
export const PALETTE_LABELS: Readonly<Record<string, string>> = { ironGall: 'Iron gall' };

/** The common view options a host offers (Data Model §2.40). */
export const COMMON_OPTIONS = ['title', 'badge', 'value', 'unit', 'footerLeft', 'footerRight', 'label', 'description', 'dataTable', 'chrome', 'hatchFill', 'locale'] as const;

/** The host integrations (Data Model §2.43; repositories/README.md §2). */
export const HOSTS: readonly HostEntry[] = [
  { id: 'powerbi', name: 'Power BI', kind: 'bi', via: 'embed', repository: 'https://github.com/ecrespo/silverpoint-powerbi', package: 'silverpoint-powerbi', registry: 'github-release', status: 'planned', summary: 'A custom visual: fields on roles, any of the tabular charts.' },
  { id: 'tableau', name: 'Tableau', kind: 'bi', via: 'embed', repository: 'https://github.com/ecrespo/silverpoint-tableau', package: 'silverpoint-tableau', registry: 'github-pages', status: 'planned', summary: 'Viz extensions, one manifest per chart, drawing on a worksheet.' },
  { id: 'knime', name: 'KNIME', kind: 'workflow', via: 'python', repository: 'https://github.com/ecrespo/silverpoint-knime', package: 'silverpoint-knime', registry: 'github-release', status: 'planned', summary: 'View nodes that draw a chart from a table, through the Python package.' },
  { id: 'n8n', name: 'n8n', kind: 'workflow', via: 'embed', repository: 'https://github.com/ecrespo/n8n-nodes-silverpoint', package: 'n8n-nodes-silverpoint', registry: 'npm', status: 'planned', summary: 'A community node that draws a chart from workflow items, as SVG or HTML.' },
  { id: 'superset', name: 'Apache Superset', kind: 'bi', via: 'react', repository: 'https://github.com/ecrespo/superset-plugin-chart-silverpoint', package: 'superset-plugin-chart-silverpoint', registry: 'npm', status: 'planned', summary: 'Visualization plugins, one per chart, drawn by the React adapter.' },
  { id: 'volto', name: 'Plone Volto', kind: 'cms', via: 'react', repository: 'https://github.com/ecrespo/volto-silverpoint', package: 'volto-silverpoint', registry: 'npm', status: 'planned', summary: 'A block that draws a chart from a table, server-rendered and hydrated.' },
  { id: 'plone-classic', name: 'Plone Classic UI', kind: 'cms', via: 'python', repository: 'https://github.com/ecrespo/collective.silverpoint', package: 'collective.silverpoint', registry: 'pypi', status: 'planned', summary: 'A Chart content type and a view for templates, through the Python package.' },
  { id: 'python', name: 'Python', kind: 'language', via: 'embed', repository: 'https://github.com/ecrespo/silverpoint-python', package: 'silverpoint', registry: 'pypi', status: 'planned', summary: 'A chart from a DataFrame as self-contained HTML; the standalone file vendored.' },
  { id: 'flask', name: 'Flask', kind: 'web', via: 'python', repository: null, package: 'silverpoint[flask]', registry: 'pypi', status: 'planned', summary: 'Jinja globals and a route for the script, inside the Python package.' },
  { id: 'django', name: 'Django', kind: 'web', via: 'python', repository: null, package: 'silverpoint[django]', registry: 'pypi', status: 'planned', summary: 'An installable app with template tags, inside the Python package.' },
  { id: 'jupyter', name: 'Jupyter', kind: 'notebook', via: 'python', repository: null, package: 'silverpoint', registry: 'pypi', status: 'planned', summary: 'A chart as a cell output, in a sandboxed frame.' },
  { id: 'databricks', name: 'Databricks notebooks', kind: 'notebook', via: 'python', repository: null, package: 'silverpoint', registry: 'pypi', status: 'planned', summary: 'A chart in a notebook cell with displayHTML; AI/BI dashboards are out (DD-072).' },
];
