/**
 * Outer test of step 11e (tdd-plan §2): for every chart a table can feed, `specFromTable` over the
 * host catalog's own demo renders the chart's canonical demo render, tree for tree (I-59, REQ-659).
 * The reference is the chart drawn with no data (its demo dataset); a matrix pivot adds the
 * `columnLabels` its reshape names, which the demo cannot carry (Data Model §2.41, amended).
 */
import { describe, expect, test } from 'vitest';
import { HOST_CATALOG, specFromTable } from '../../packages/embed/src/hosts/index';
import { renderToSVG } from '../../packages/embed/src/index';
import { compareSvgTrees, parseSvg } from '../svg-normalizer/normalize';

describe('embed demo gate (I-59)', () => {
  test('REQ-659 · specFromTable(demo) equals the canonical demo render for every bindable chart', () => {
    const differ: string[] = [];
    const bindable = HOST_CATALOG.charts.filter((c) => c.binding !== 'none');
    expect(bindable.length).toBe(56);
    for (const chart of bindable) {
      const bound = specFromTable({ chart: chart.slug, table: { rows: chart.demo!.rows }, roles: chart.demo!.roles, ...(chart.demo!.options ? { options: chart.demo!.options } : {}), id: chart.slug });
      if (!bound.ok) {
        differ.push(`${chart.slug}: ${JSON.stringify(bound.error)}`);
        continue;
      }
      const extra = chart.reshape === 'matrix' ? { columnLabels: (bound.value.props as { columnLabels: string[] }).columnLabels } : {};
      const actual = renderToSVG(bound.value);
      const reference = renderToSVG({ chart: chart.slug, id: chart.slug, props: extra });
      if (!actual.ok || !reference.ok) {
        differ.push(`${chart.slug}: render failed`);
        continue;
      }
      const comparison = compareSvgTrees(parseSvg(actual.value.svg), parseSvg(reference.value.svg));
      if (!comparison.equal) differ.push(`${chart.slug}: ${comparison.difference}`);
    }
    expect(differ).toEqual([]);
  });
});
