/**
 * REQ-644, I-57: no `@silverpoint/embed` build output opens a connection, evaluates a string as
 * code, imports dynamically, or reads or writes cookies or web storage. A token scan over the built
 * files: the identifiers are forbidden wherever they appear, comments included, because a minifier
 * can make any of them reachable.
 *
 * Usage: node tools/lint-rules/no-network.mjs [dir] — exits non-zero on a hit.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FORBIDDEN = [
  ['fetch', /(?<![\w$.])fetch\s*\(|\.fetch\s*\(/],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['WebSocket', /\bWebSocket\b/],
  ['EventSource', /\bEventSource\b/],
  ['sendBeacon', /\bsendBeacon\b/],
  ['dynamic import', /(?<![\w$.])import\s*\(/],
  ['eval', /(?<![\w$.])eval\s*\(|\.eval\s*\(/],
  ['new Function', /\bnew\s+Function\s*\(/],
  ['document.cookie', /\.cookie\b/],
  ['localStorage', /\blocalStorage\b/],
  ['sessionStorage', /\bsessionStorage\b/],
  ['indexedDB', /\bindexedDB\b/],
  ['importScripts', /\bimportScripts\b/],
];

/** The forbidden names found in one file's text. */
export function scan(text) {
  return FORBIDDEN.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

export function scanDirectory(dir) {
  const hits = [];
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(m?js)$/.test(name)) for (const found of scan(readFileSync(path, 'utf8'))) hits.push(`${path}: ${found}`);
    }
  };
  walk(dir);
  return hits;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = process.argv[2] ?? fileURLToPath(new URL('../../packages/embed/dist', import.meta.url));
  const hits = scanDirectory(dir);
  for (const hit of hits) console.error(`error  REQ-644 · ${hit}`);
  console.log(`no-network · ${hits.length} hit(s) in ${dir}`);
  process.exit(hits.length === 0 ? 0 : 1);
}
