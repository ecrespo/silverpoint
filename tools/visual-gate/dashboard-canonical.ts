/**
 * The canonical render of a dashboard fixture (DD-017, REQ-210): the markup every adapter must
 * produce, drawn from the core alone — `dashboardView` for the wrapper, `inCell` and the render
 * pipeline for each chart — and serialised here by a reference writer, never by an adapter.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate dashboard-canonical   (writes fixtures/dashboard)
 *
 * Regenerating a canonical file changes the normalised output, which is never a patch
 * (API Spec §13): commit it deliberately, with a changeset that says so.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dashboardView, inCell, type DataTable } from '@silverpoint/core';
import { renderChart, toSVGString, type RenderedChart } from '@silverpoint/grounds';
import { normalizeDashboard } from '../svg-normalizer/normalize';
import { dashboardFixtureProps, dashboardMatrix, type DashboardFixture } from './dashboard-fixtures';
import { FIXTURES_DIR, RECIPES } from './fixtures';

const text = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrs = (pairs: Readonly<Record<string, string | undefined>>) =>
  Object.entries(pairs)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => ` ${name}="${(value as string).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
    .join('');
const style = (vars: Readonly<Record<string, string>>) => Object.entries(vars).map(([name, value]) => `${name}:${value}`).join(';');

function table(t: DataTable, id: string, visibility: string): string {
  const head = t.columns.map((c) => `<th scope="col">${text(String(c))}</th>`).join('');
  const rows = t.rows.map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${text(String(cell))}</th>` : `<td>${text(String(cell))}</td>`)).join('')}</tr>`).join('');
  return `<div class="sp-table-box" data-visibility="${visibility}"><table class="sp-table" id="${id}" data-visibility="${visibility}"><caption>${text(t.caption)}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** A client chart's DOM (API Spec §10): the focusable root, its SVG, the live region, the table. */
function chart(rendered: RenderedChart): string {
  const root = attrs({
    class: `sp-root sp-ground-${rendered.ground}`,
    'data-substrate': rendered.substrate,
    'data-chrome': rendered.chrome,
    'data-status': rendered.status,
    tabindex: '0',
    role: 'group',
    'aria-label': rendered.name,
  });
  const data = rendered.dataTable === 'none' ? '' : table(rendered.table, rendered.ids.table, rendered.dataTable);
  return `<div${root}>${toSVGString(rendered)}<div class="sp-live" aria-live="polite"></div>${data}</div>`;
}

/** The fixture's markup, from the core. */
export function canonicalDashboardMarkup(fixture: DashboardFixture): string {
  const { props, children } = dashboardFixtureProps(fixture);
  const view = dashboardView(props, children.map((child) => ({ cell: child.cell, id: child.props.id as string | undefined })));
  const { section, heading, description } = view;
  const cells = view.cells.map((cell) => {
    const child = children[cell.child]!;
    const recipe = RECIPES[child.chart];
    if (!recipe) throw new Error(`No recipe for ${child.chart}`);
    const fitted = inCell(child.props, cell.context, recipe);
    const rendered = renderChart(recipe, fitted.props, { id: cell.context.chartId, width: fitted.width });
    return `<article${attrs({ class: 'sp-dashboard-cell', part: 'dashboard-cell', 'aria-labelledby': cell.labelledby, style: style(cell.style) })}>${chart(rendered)}</article>`;
  });
  return (
    `<section${attrs({ class: section.className, part: 'dashboard', 'data-substrate': section.substrate, 'aria-labelledby': section.labelledby, 'aria-describedby': section.describedby, 'aria-label': section.label, style: style(section.style) })}>` +
    (heading ? `<h${heading.level}${attrs({ class: 'sp-dashboard-title', part: 'dashboard-title', id: heading.id })}>${text(heading.text)}</h${heading.level}>` : '') +
    (description ? `<p${attrs({ class: 'sp-dashboard-description', part: 'dashboard-description', id: description.id })}>${text(description.text)}</p>` : '') +
    `<div class="sp-dashboard-grid" part="dashboard-grid">${cells.join('')}</div></section>`
  );
}

/** The committed form: the normalised tree, one node per line. */
export function canonicalDashboardFor(fixture: DashboardFixture): string {
  return normalizeDashboard(canonicalDashboardMarkup(fixture));
}

if (process.argv[1]?.endsWith('dashboard-canonical.ts')) {
  const dir = join(FIXTURES_DIR, 'dashboard');
  mkdirSync(dir, { recursive: true });
  for (const fixture of dashboardMatrix()) {
    writeFileSync(join(dir, `${fixture.id}.dashboard.json`), `${JSON.stringify(fixture, null, 2)}\n`);
    writeFileSync(join(FIXTURES_DIR, fixture.canonical), canonicalDashboardFor(fixture));
    console.log(`wrote ${fixture.id}`);
  }
}
