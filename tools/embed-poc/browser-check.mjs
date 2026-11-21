/**
 * T-290 browser half (DD-062 protocol). Generates the pages, serves them (the strict-CSP ones with
 * the header), and records per engine and scenario: charts drawn, keyboard reading, requests,
 * console errors and CSP violations, adopted stylesheets, the face loaded, time to the last chart.
 * Usage: PLAYWRIGHT=<path to the playwright package> [CHROMIUM=<executable>] node browser-check.mjs [engines]
 */
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pw = createRequire(import.meta.url)(process.env.PLAYWRIGHT ?? 'playwright');
const engines = (process.argv[2] ?? 'chromium,firefox,webkit').split(',');
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src data:; font-src data:; frame-src 'self'";
const SLUGS = JSON.parse(readFileSync(join(here, 'results', 'node.json'), 'utf8')).ok;

const host = (spec, attr = 'element') =>
  attr === 'element'
    ? `<silverpoint-chart><script type="application/json">${JSON.stringify(spec).replace(/</g, '\\u003c')}</script></silverpoint-chart>`
    : `<div data-sp-embed><script type="application/json">${JSON.stringify(spec).replace(/</g, '\\u003c')}</script></div>`;
const page = (title, body, script = '../dist/silverpoint-embed.full.js') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="icon" href="data:,"><script src="${script}"></script></head><body>${body}<script src="probe.js"></script></body></html>`;

const gen = join(here, 'pages', 'generated');
mkdirSync(gen, { recursive: true });
const write = (name, html) => writeFileSync(join(gen, name), html);
write('one.html', page('one chart', host({ chart: 'bar-chart' })).replaceAll('../dist', '../../dist').replace('probe.js', '../probe.js'));
const twenty = SLUGS.slice(0, 20).map((chart) => host({ chart })).join('\n');
write('twenty.html', page('twenty charts', twenty).replaceAll('../dist', '../../dist').replace('probe.js', '../probe.js'));
write('mountall.html', page('mountAll', SLUGS.slice(20, 25).map((chart) => host({ chart }, 'data')).join('\n')).replaceAll('../dist', '../../dist').replace('probe.js', '../probe.js'));
write('csp.html', page('strict CSP', host({ chart: 'line-chart' }) + host({ chart: 'donut-chart' }, 'data')).replaceAll('../dist', '../../dist').replace('probe.js', '../probe.js'));
// PY-DD-04's shape: the whole document, script inlined, in a sandboxed srcdoc frame.
const inline = readFileSync(join(here, 'dist', 'silverpoint-embed.full.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const inner = `<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><script>${inline}</script></head><body>${host({ chart: 'heatmap-chart' })}<script>window.__drawnAt=performance.now()</script></body></html>`;
const srcdoc = inner.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
write('sandbox-srcdoc.html', `<!doctype html><html><head><meta charset="utf-8"><title>sandboxed srcdoc</title><link rel="icon" href="data:,"></head><body><iframe sandbox="allow-scripts" width="720" height="520" srcdoc="${srcdoc}"></iframe></body></html>`);
write('sandbox-csp.html', `<!doctype html><html><head><meta charset="utf-8"><title>sandboxed frame under CSP</title><link rel="icon" href="data:,"></head><body><iframe sandbox="allow-scripts" width="720" height="900" src="csp.html"></iframe></body></html>`);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const server = createServer((req, res) => {
  const path = join(here, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!path.startsWith(here) || !existsSync(path)) { res.writeHead(404).end(); return; }
  const headers = { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' };
  if (/csp/.test(path)) headers['content-security-policy'] = CSP;
  res.writeHead(200, headers).end(readFileSync(path));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const scenarios = [
  { name: 'file://, one chart', url: pathToFileURL(join(gen, 'one.html')).href, charts: 1 },
  { name: 'file://, twenty charts', url: pathToFileURL(join(gen, 'twenty.html')).href, charts: 20 },
  { name: 'file://, mountAll over five hosts', url: pathToFileURL(join(gen, 'mountall.html')).href, charts: 5 },
  { name: 'strict CSP page (element + mountAll)', url: `${origin}/pages/generated/csp.html`, charts: 2 },
  { name: 'sandbox="allow-scripts" srcdoc, script inlined', url: `${origin}/pages/generated/sandbox-srcdoc.html`, charts: 1, frame: true },
  { name: 'sandbox="allow-scripts" frame of the strict CSP page', url: `${origin}/pages/generated/sandbox-csp.html`, charts: 2, frame: true },
];
// nbconvert's own template loads require.js and MathJax from a CDN: the host's requests, not the chart's.
if (process.env.NOTEBOOK_HTML) scenarios.push({ name: 'Jupyter: executed notebook exported to HTML (srcdoc output)', url: pathToFileURL(process.env.NOTEBOOK_HTML).href, charts: 1, frame: true, hostNoise: /cdnjs\.cloudflare\.com|ERR_TUNNEL_CONNECTION_FAILED/ });

const probe = async (frame) =>
  frame.evaluate(async () => {
    await document.fonts.ready;
    const roots = [...document.querySelectorAll('.sp-root')];
    const first = roots[0];
    let live = '';
    if (first) {
      first.focus();
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      live = first.querySelector('.sp-live')?.textContent ?? '';
    }
    return {
      roots: roots.length,
      svgs: document.querySelectorAll('.sp-root svg.sp-chart').length,
      tables: document.querySelectorAll('.sp-root table.sp-table').length,
      adoptedSheets: document.adoptedStyleSheets.length,
      styleElements: document.querySelectorAll('style').length,
      faces: [...document.fonts].filter((f) => f.family.replace(/["']/g, '') === 'EB Garamond').map((f) => `${f.weight} ${f.style} ${f.status}`),
      // I-56's feasibility: the first mounted SVG against the canonical root string, as trees.
      parity: (() => {
        const svg = first?.querySelector('svg.sp-chart');
        if (!svg || !window.Silverpoint) return null;
        const id = svg.querySelector('title').id.replace(/-title$/, '');
        const spec = JSON.parse(first.parentElement.querySelector(':scope > script[type="application/json"]').textContent);
        const markup = window.Silverpoint.toChartRootString(window.Silverpoint.renderSpec({ ...spec, id, width: Number(svg.getAttribute('width')) }));
        const ref = new DOMParser().parseFromString(markup, 'text/html').querySelector('svg');
        const same = (a, b) => {
          if (a.tagName.toLowerCase() !== b.tagName.toLowerCase()) return false;
          const names = (n) => [...n.attributes].map((x) => x.name).filter((x) => x !== 'style' && x !== 'xmlns').sort();
          const an = names(a), bn = names(b);
          if (an.join() !== bn.join() || an.some((x) => a.getAttribute(x) !== b.getAttribute(x))) return false;
          if (a.children.length !== b.children.length) return false;
          if (a.children.length === 0 && a.textContent !== b.textContent) return false;
          return [...a.children].every((c, i) => same(c, b.children[i]));
        };
        return same(svg, ref);
      })(),
      keyboardLive: live,
      drawnAtMs: Math.round(window.__drawnAt ?? -1),
      version: window.Silverpoint?.version ?? null,
    };
  });

const results = { csp: CSP, engines: {} };
for (const engine of engines) {
  let browser;
  try {
    browser = await pw[engine].launch(engine === 'chromium' && process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  } catch (e) { results.engines[engine] = { launched: false, error: String(e.message).split('\n')[0] }; continue; }
  results.engines[engine] = { launched: true, version: browser.version(), scenarios: [] };
  for (const s of scenarios) {
    const context = await browser.newContext();
    const tab = await context.newPage();
    const requests = [], errors = [];
    tab.on('request', (r) => requests.push(r.url().startsWith('data:') ? 'data:…' : r.url().replace(origin, '').replace(pathToFileURL(here).href, '')));
    tab.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    tab.on('pageerror', (e) => errors.push(String(e)));
    await tab.goto(s.url, { waitUntil: 'load' });
    await tab.waitForTimeout(400);
    const frame = s.frame ? tab.frames().find((f) => f !== tab.mainFrame() && f.childFrames().length === 0) : tab.mainFrame();
    let measured;
    try { measured = await probe(frame); } catch (e) { measured = { error: String(e.message).split('\n')[0] }; }
    const noise = s.hostNoise ? [...requests, ...errors].filter((x) => s.hostNoise.test(x)) : [];
    const own = (list) => (s.hostNoise ? list.filter((x) => !s.hostNoise.test(x)) : list);
    results.engines[engine].scenarios.push({ ...s, url: undefined, hostNoise: undefined, ...measured, ok: measured.roots === s.charts && measured.svgs === s.charts && measured.parity !== false && Boolean(measured.keyboardLive) && own(errors).length === 0, requests: own(requests), errors: own(errors), hostRequestsAndErrors: noise });
    await context.close();
  }
  await browser.close();
}
server.close();
writeFileSync(join(here, 'results', 'browsers.json'), JSON.stringify(results, null, 2) + '\n');
for (const [engine, r] of Object.entries(results.engines)) {
  console.log(`${engine}: ${r.launched ? r.version : 'not launched — ' + r.error}`);
  for (const s of r.scenarios ?? []) console.log(`  ${s.ok ? 'PASS' : 'FAIL'} ${s.name} | roots ${s.roots} svgs ${s.svgs} tables ${s.tables} sheets ${s.adoptedSheets} styleEls ${s.styleElements} faces ${JSON.stringify(s.faces)} parity ${s.parity} drawn ${s.drawnAtMs} ms | live "${(s.keyboardLive ?? '').slice(0, 60)}" | requests ${JSON.stringify(s.requests)} | errors ${JSON.stringify(s.errors).slice(0, 300)}`);
}
