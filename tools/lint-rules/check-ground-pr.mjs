/**
 * REQ-044, Art. 7: adding or changing a ground must not require touching any chart. Verified
 * on the files a pull request touches.
 *
 * Usage: node tools/lint-rules/check-ground-pr.mjs <base-ref> — diffs `<base-ref>...HEAD`.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** A ground lives in its own directory under grounds/src; `ink/` houses the inkers, not a ground. */
const GROUND = /^packages\/grounds\/src\/(?!ink\/)([^/]+)\//;
const CHARTS = /^packages\/core\/src\/charts\//;

/** Returns one line per violation; empty when the change set is acceptable. */
export function checkGroundChange(files) {
  const grounds = [...new Set(files.flatMap((file) => GROUND.exec(file)?.[1] ?? []))];
  const charts = files.filter((file) => CHARTS.test(file));
  if (grounds.length === 0 || charts.length === 0) return [];
  return charts.map(
    (file) => `REQ-044 · this change touches the ground(s) ${grounds.join(', ')} and also ${file}; a ground may not require chart changes.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const base = process.argv[2] ?? 'origin/develop';
  const files = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const problems = checkGroundChange(files);
  for (const problem of problems) console.error(`error  ${problem}`);
  console.log(`check-ground-pr · ${files.length} file(s) · ${problems.length} problem(s)`);
  process.exit(problems.length === 0 ? 0 : 1);
}
