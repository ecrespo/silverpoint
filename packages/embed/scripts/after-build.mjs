/**
 * After tsup (REQ-649, REQ-651, REQ-653, REQ-666): the banner with the version on line 1 of each
 * standalone file, the two JSON files beside them, the goldens and table fixtures hosts check against,
 * and `integrity.json` with a SHA-384 per file.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
export const STANDALONE = ['silverpoint-embed.js', 'silverpoint-embed.mjs', 'silverpoint-embed.full.js', 'silverpoint-embed.full.mjs'];

const banner = `/*! @silverpoint/embed ${version} | MIT | EB Garamond (full files) OFL-1.1 | https://github.com/ecrespo/silverpoint */\n`;
const integrity = {};
for (const file of STANDALONE) {
  const path = join(dist, file);
  const code = readFileSync(path, 'utf8');
  const text = code.startsWith('/*! @silverpoint/embed') ? code : banner + code;
  writeFileSync(path, text);
  integrity[file] = `sha384-${createHash('sha384').update(text, 'utf8').digest('base64')}`;
}
copyFileSync(join(root, 'src/hosts/host-catalog.json'), join(dist, 'host-catalog.json'));
copyFileSync(join(root, 'src/conformance/conformance.json'), join(dist, 'conformance.json'));
// The hosts kit's fixtures travel in the tarball too (TD delta §6): the renderToHTML goldens and the
// table fixtures another language checks itself against.
for (const [from, to] of [['html', 'html-goldens'], ['tables', 'tables']]) {
  rmSync(join(dist, to), { recursive: true, force: true });
  cpSync(join(root, '../../fixtures/embed', from), join(dist, to), { recursive: true });
}
writeFileSync(join(dist, 'integrity.json'), `${JSON.stringify(integrity, null, 2)}\n`);
// The module entries' STANDALONE_INTEGRITY: the marker the sources hold, replaced by the digests.
const MARKER = /\{\s*"?__sp_integrity__"?\s*:\s*(""|'')\s*\}/;
let written = 0;
for (const file of readdirSync(dist).filter((f) => f.endsWith('.js') && !STANDALONE.includes(f))) {
  const code = readFileSync(join(dist, file), 'utf8');
  if (MARKER.test(code)) {
    writeFileSync(join(dist, file), code.replace(MARKER, JSON.stringify(integrity)));
    written++;
  }
}
if (written === 0) throw new Error('after-build · STANDALONE_INTEGRITY marker not found in the module entries');
console.log(`after-build · banner, host-catalog.json, conformance.json, html-goldens, tables, integrity.json (${STANDALONE.length} files) for ${version}`);
