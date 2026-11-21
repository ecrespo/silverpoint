/** T-290: the module build renders every chart in plain Node, touching no DOM global on import or render. */
import { readFileSync, writeFileSync } from 'node:fs';
for (const name of ['document', 'window', 'customElements', 'matchMedia', 'ResizeObserver']) {
  Object.defineProperty(globalThis, name, { get() { throw new Error(`DOM global "${name}" touched`); }, configurable: true });
}
const embed = await import('./dist/silverpoint-embed.mjs');
const out = { version: embed.VERSION, slugs: embed.CHART_SLUGS.length, ok: [], failed: [], timingsMs: {} };
const t0 = performance.now();
for (const chart of embed.CHART_SLUGS) {
  try {
    const a = embed.renderToSVG({ chart, width: 480 });
    const b = embed.renderToSVG({ chart, width: 480 });
    if (a !== b) throw new Error('not deterministic');
    if (!a.startsWith('<svg') || !a.includes('<style>')) throw new Error('unexpected markup');
    out.ok.push(chart);
  } catch (e) { out.failed.push({ chart, error: String(e.message ?? e) }); }
}
out.timingsMs.all60twice = Math.round(performance.now() - t0);
writeFileSync('results/node.json', JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ ...out, ok: out.ok.length }, null, 2));
writeFileSync('results/bar-chart.svg', embed.renderToSVG({ chart: 'bar-chart', width: 480 }));
