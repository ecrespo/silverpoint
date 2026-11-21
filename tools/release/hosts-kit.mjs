// The hosts kit (TD delta §6, feature-007): one zip per GitHub release, holding what host repositories
// vendor — the four standalone files, host-catalog.json, conformance.json, integrity.json, the
// renderToHTML goldens and the table fixtures — all taken from packages/embed/dist, which the npm
// tarball carries too. `node tools/release/hosts-kit.mjs <version>` writes the zip at the repo root.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const TOP = ['silverpoint-embed.js', 'silverpoint-embed.mjs', 'silverpoint-embed.full.js', 'silverpoint-embed.full.mjs', 'host-catalog.json', 'conformance.json', 'integrity.json'];
const FOLDERS = ['html-goldens', 'tables'];

export const hostsKitName = (version) => `silverpoint-hosts-kit-${version}.zip`;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** The kit's files, relative to `dist`, in a stable order. */
export function hostsKitFiles(dist) {
  const folders = FOLDERS.flatMap((f) => (existsSync(join(dist, f)) ? walk(join(dist, f)) : [])).map((p) => relative(dist, p).split('\\').join('/'));
  return [...TOP, ...folders.sort()];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = join(ROOT, 'packages/embed/dist');
  const { version } = JSON.parse(readFileSync(join(ROOT, 'packages/embed/package.json'), 'utf8'));
  if (process.argv[2] && process.argv[2] !== version) throw new Error(`hosts kit: asked for ${process.argv[2]}, dist holds ${version}`);
  const files = hostsKitFiles(dist);
  for (const f of files) if (!existsSync(join(dist, f))) throw new Error(`hosts kit: ${f} is missing from packages/embed/dist (run pnpm build)`);
  const out = join(ROOT, hostsKitName(version));
  execFileSync('zip', ['-q', '-X', out, ...files], { cwd: dist, stdio: 'inherit' });
  console.log(`${hostsKitName(version)}: ${files.length} files`);
}
