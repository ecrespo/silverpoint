// Writes the server-rendered home page into the client build, so the browser hydrates it.
import { readFileSync, writeFileSync } from 'node:fs';
import { REFERENCE_DASHBOARD, render } from './dist-server/entry-server.js';

const page = readFileSync('dist/index.html', 'utf8');
writeFileSync('dist/index.html', page.replace('<!--app-->', await render()));
console.log('prerendered dist/index.html');
// The reference dashboard page (REQ-221), server-rendered the same way.
// `vite preview` resolves `/dashboard` to `dashboard.html` before its single-page fallback.
writeFileSync('dist/dashboard.html', page.replace('<!--app-->', await render({ dashboard: REFERENCE_DASHBOARD })));
console.log('prerendered dist/dashboard.html');
