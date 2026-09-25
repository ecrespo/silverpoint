/**
 * TD §9: the release commit's step — `changeset version` over the workspace. Changesets 3 reads
 * `.changeset/` from its working directory, not from the workspace root, so `pnpm --filter … exec`
 * (which runs in `tools/release`) cannot call it directly; this script runs it from the root.
 *
 * Usage: pnpm --filter @silverpoint/release run version-packages [root] — `root` defaults to this
 * repository (the tests pass a scratch copy).
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = new URL('.', import.meta.url);
const BIN = fileURLToPath(new URL('node_modules/.bin/changeset', HERE));

/** Versions the packages and writes their changelogs from the pending changesets under `root`. */
export function versionPackages(root = fileURLToPath(new URL('../..', HERE))) {
  execFileSync(BIN, ['version'], { cwd: root, stdio: 'inherit' });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) versionPackages(process.argv[2]);
