// Writes the server-rendered home page into the client build, so the browser hydrates it.
import { readFileSync, writeFileSync } from 'node:fs';
import { render } from './dist-server/entry-server.js';

const page = readFileSync('dist/index.html', 'utf8');
writeFileSync('dist/index.html', page.replace('<!--app-->', await render()));
console.log('prerendered dist/index.html');
