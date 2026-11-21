/** T-297 · byte-identical output (REQ-634), in one process and across two. */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { CHART_SLUGS, renderToHTML, renderToSVG } from '../src/index';

const svg = (chart: string) => {
  const r = renderToSVG({ chart, width: 320, height: 150 });
  return r.ok ? r.value.svg : `error ${JSON.stringify(r.error)}`;
};

describe('determinism', () => {
  test('REQ-634 · each of the 60 charts renders byte-identically twice in one process', () => {
    for (const chart of CHART_SLUGS) expect(svg(chart), chart).toBe(svg(chart));
  });

  test('REQ-634 · renderToHTML is byte-identical for the same spec and options', () => {
    const once = renderToHTML({ chart: 'sankey-chart' }, { interactive: true, as: 'fragment' });
    const twice = renderToHTML({ chart: 'sankey-chart' }, { interactive: true, as: 'fragment' });
    expect(once).toEqual(twice);
  });

  test('REQ-634 · another process writes the same bytes', () => {
    const root = fileURLToPath(new URL('../../..', import.meta.url));
    const script = "import('./packages/embed/src/index.ts').then((m) => { process.stdout.write(JSON.stringify(['line-chart','donut-chart','network-chart'].map((c) => { const r = m.renderToSVG({ chart: c, width: 320, height: 150 }); return r.ok ? r.value.svg : 'error'; }))); })";
    const out = execFileSync(process.execPath, ['--import', 'tsx', '--conditions=@silverpoint/source', '-e', script], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
    expect(JSON.parse(out)).toEqual(['line-chart', 'donut-chart', 'network-chart'].map(svg));
  });
});
