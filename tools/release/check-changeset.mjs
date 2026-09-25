/**
 * TD §9, REQ-160: every pull request that touches `packages/` carries a changeset, so the six
 * packages' shared version and changelog account for it. A change with nothing to release adds an
 * empty one (`changeset --empty`).
 *
 * Usage: node tools/release/check-changeset.mjs <base-ref> — diffs `<base-ref>...HEAD`.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PACKAGES = /^packages\//;
/** A changeset is a Markdown file directly under `.changeset/`; its README is not one. */
const CHANGESET = /^\.changeset\/(?!README\.md$)[^/]+\.md$/;

/** `entries` are `git diff --name-status` rows; returns one line per violation. */
export function checkChangeset(entries) {
  const touched = entries.filter((entry) => PACKAGES.test(entry.file)).map((entry) => entry.file);
  if (touched.length === 0) return [];
  if (entries.some((entry) => entry.status === 'A' && CHANGESET.test(entry.file))) return [];
  return [
    `REQ-160 · TD §9 · this change touches packages/ (${touched.join(', ')}) and adds no changeset; run \`pnpm --filter @silverpoint/release exec changeset\` (or \`changeset --empty\` when nothing is released).`,
  ];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const base = process.argv[2] ?? 'origin/develop';
  const entries = execFileSync('git', ['diff', '--name-status', '--no-renames', `${base}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, file] = line.split('\t');
      return { status: status[0], file };
    });
  const problems = checkChangeset(entries);
  for (const problem of problems) console.error(`error  ${problem}`);
  console.log(`check-changeset · ${entries.length} file(s) · ${problems.length} problem(s)`);
  process.exit(problems.length === 0 ? 0 : 1);
}
