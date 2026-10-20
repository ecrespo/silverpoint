// Writes the server-rendered home page into the client build, so the browser hydrates it.
import { readFileSync, writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { FIXTURES, REFERENCE_DASHBOARD, render } from './dist-server/entry-server.js';

const page = readFileSync('dist/index.html', 'utf8');
writeFileSync('dist/index.html', page.replace('<!--app-->', await render()));
console.log('prerendered dist/index.html');
// The reference dashboard page (REQ-221), server-rendered the same way.
// `vite preview` resolves `/dashboard` to `dashboard.html` before its single-page fallback.
writeFileSync('dist/dashboard.html', page.replace('<!--app-->', await render({ dashboard: REFERENCE_DASHBOARD })));
console.log('prerendered dist/dashboard.html');
// The UI reference page (T-157), server-rendered the same way.
writeFileSync('dist/ui.html', page.replace('<!--app-->', await render({ uiPage: true })));
console.log('prerendered dist/ui.html');
// The feature-004 pages (T-222), server-rendered the same way.
for (const name of ['composed', 'palettes', 'timeline']) {
  writeFileSync(`dist/${name}.html`, page.replace('<!--app-->', await render({ page: name })));
  console.log(`prerendered dist/${name}.html`);
}
// One fixture page per chart of the second catalog (REQ-400 on), server-rendered so the browser
// hydrates it (T-179, REQ-103, REQ-435): `/ssr/<fixture id>`, as `/dashboard` resolves.
mkdirSync('dist/ssr', { recursive: true });
const second = FIXTURES.filter((f) => Number(f.req.slice(4)) >= 400 && f.substrate === 'cream' && f.mode === 'ink');
for (const fixture of second) writeFileSync(`dist/ssr/${fixture.id}.html`, page.replace('<!--app-->', await render({ fixture })));
console.log(`prerendered ${second.length} fixture pages into dist/ssr`);
