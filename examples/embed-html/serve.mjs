/**
 * Serves examples/embed-html for the `browser-embed` job (REQ-665, T-324) — static files only, and
 * the standalone files from packages/embed/dist at the site root, as a host would vendor them.
 * Pages whose name contains `csp` carry `script-src 'self'; style-src 'self'`.
 *
 * Usage: node examples/embed-html/serve.mjs [--port 4106]
 */
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const dist = fileURLToPath(new URL('../../packages/embed/dist/', import.meta.url));
const port = Number(process.argv[process.argv.indexOf('--port') + 1] || 4106);
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src data:; font-src data:; frame-src 'self'";
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css' };

createServer((request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname)).replace(/^\/+/, '') || 'index.html';
  const file = path.startsWith('silverpoint-embed') || path === 'integrity.json' ? join(dist, path) : join(here, path);
  if ((!file.startsWith(here) && !file.startsWith(dist)) || !existsSync(file) || file.endsWith('.mjs') && file.startsWith(here)) {
    response.writeHead(404).end();
    return;
  }
  const headers = { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' };
  if (path.includes('csp')) headers['content-security-policy'] = CSP;
  response.writeHead(200, headers).end(readFileSync(file));
}).listen(port, () => console.log(`embed-html on http://localhost:${port}/`));
