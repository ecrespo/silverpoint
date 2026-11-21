/**
 * `generate_code { framework: 'html' }` (REQ-662, API delta §14.3): a page fragment with a
 * `<silverpoint-chart>` holding the spec in its JSON child — `fields` mapped to accessor props as for
 * the other frameworks — and one `<script>` tag for the standalone file with its integrity. The
 * emitted spec is validated before it is returned. No CDN URL is written (A-10).
 */
import { STANDALONE_INTEGRITY, validateSpec, type ChartSpec } from '@silverpoint/embed';
import type { Catalog } from '../catalog';
import { ToolError, unknownName } from '../errors';
import type { Generated } from './index';
import type { GenerateInput } from './plan';
import { humanised } from './literals';

const FILE = 'silverpoint-embed.full.js';
const SCRIPT_ESCAPES: Readonly<Record<string, string>> = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' };
const forScript = (value: unknown): string => JSON.stringify(value, null, 2).replace(/[<>&\u2028\u2029]/g, (c) => SCRIPT_ESCAPES[c] ?? c);

export function htmlCode(catalog: Catalog, input: GenerateInput): Generated {
  const { chart: name, component, deck } = input.target ?? {};
  if (component !== undefined || deck !== undefined || name === undefined) {
    throw new ToolError('invalid_input', '`framework: "html"` draws one chart: name `target.chart` (components and decks need a framework).');
  }
  const chart = catalog.chart(name);
  const all = [...chart.props, ...catalog.data.common.chart];
  const props: Record<string, unknown> = {};
  for (const [role, field] of Object.entries(input.fields ?? {})) {
    const spec = chart.data.fields.find((r) => r.role === role);
    if (!spec) throw unknownName(`data role of ${chart.slug}`, role, chart.data.fields.map((r) => r.role));
    const prop = all.find((p) => p.name === spec.prop)!;
    const list = prop.type.includes('[]') && !prop.type.includes('Accessor');
    if (Array.isArray(field) && !list) throw new ToolError('invalid_input', `\`${role}\` names one field of the rows, not a list.`);
    props[prop.name] = list && !Array.isArray(field) ? [field] : field;
  }
  const given = input.props ?? {};
  if (!('title' in given) && !('label' in given)) props.title = humanised(chart.slug);
  for (const [key, value] of Object.entries(given)) {
    const prop = all.find((p) => p.name === key || p.reflex === key);
    if (!prop) throw unknownName(`prop of ${chart.slug}`, key, all.map((p) => p.name));
    if (['data', 'ground', 'substrate', 'mode', 'palette', 'width', 'height', 'id'].includes(prop.name)) throw new ToolError('invalid_input', `Give \`${prop.name}\` as its own input, not in \`props\`.`);
    props[prop.name] = value;
  }
  const spec: Record<string, unknown> = { chart: chart.slug, props };
  if (input.ground !== undefined) spec.ground = catalog.ground(input.ground);
  if (input.substrate !== undefined) spec.substrate = catalog.substrate(input.ground ?? 'silverpoint', input.substrate);
  if (input.mode !== undefined) spec.mode = catalog.oneOf('mode', input.mode, ['ink', 'precision'] as const);
  if (input.palette !== undefined) spec.palette = catalog.palette(input.palette);
  const valid = validateSpec(spec as unknown as ChartSpec);
  if (!valid.ok) throw new ToolError('invalid_input', `The spec does not validate: ${JSON.stringify(valid.error)}`);

  const integrity = STANDALONE_INTEGRITY[FILE];
  const notes = [
    `${FILE} is in the @silverpoint/embed package (dist/${FILE}, or the hosts kit of its GitHub release): serve it from your own site or vendor it; set src to where you serve it.`,
    'Put your rows in the JSON as `"data": [...]`; without them the chart draws its demo dataset.',
  ];
  if (!integrity) notes.push(`The integrity of ${FILE} is in @silverpoint/embed/integrity.json; add it to the script tag.`);
  return {
    imports: [`<script src="${FILE}"${integrity ? ` integrity="${integrity}" crossorigin="anonymous"` : ''}></script>`],
    stylesheets: [],
    code: `<silverpoint-chart>\n  <script type="application/json">\n${forScript(spec)}\n  </script>\n</silverpoint-chart>`,
    notes,
  };
}
