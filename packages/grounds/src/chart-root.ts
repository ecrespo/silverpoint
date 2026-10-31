/**
 * The client chart's DOM as a string (API Spec §10, Analyze A-03): the focusable `.sp-root` with
 * its palette `style`, the canonical SVG, the live region and the tabular alternative — the tree the
 * three adapters render. The dashboard gate's reference writer, moved here so a deck's chart fence
 * (and the MCP `render_deck`) writes the same markup without depending on a tool.
 */
import type { DataTable } from '@silverpoint/core';
import { toSVGString, type RenderedChart } from './render';

const text = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrs = (pairs: Readonly<Record<string, string | undefined>>): string =>
  Object.entries(pairs)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => ` ${name}="${(value as string).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`)
    .join('');

function table(t: DataTable, id: string, visibility: string): string {
  const head = t.columns.map((c) => `<th scope="col">${text(String(c))}</th>`).join('');
  const rows = t.rows
    .map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${text(String(cell))}</th>` : `<td>${text(String(cell))}</td>`)).join('')}</tr>`)
    .join('');
  return `<div class="sp-table-box" data-visibility="${visibility}"><table class="sp-table" id="${id}" data-visibility="${visibility}"><caption>${text(t.caption)}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** The chart's root markup, as the adapters' client components render it. */
export function toChartRootString(rendered: RenderedChart): string {
  const root = attrs({
    class: `sp-root sp-ground-${rendered.ground}`,
    'data-substrate': rendered.substrate,
    'data-chrome': rendered.chrome,
    'data-status': rendered.status,
    style: rendered.style === '' ? undefined : rendered.style,
    tabindex: '0',
    role: 'group',
    'aria-label': rendered.name,
  });
  const data = rendered.dataTable === 'none' ? '' : table(rendered.table, rendered.ids.table, rendered.dataTable);
  return `<div${root}>${toSVGString(rendered)}<div class="sp-live" aria-live="polite"></div>${data}</div>`;
}
