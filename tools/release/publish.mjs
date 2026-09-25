/**
 * TD §9, REQ-160: the publish step of `release.yml`. For every public package under `packages/`
 * whose version npm does not have yet, in dependency order: `pnpm pack` (which honours
 * `publishConfig.directory` and rewrites `workspace:` ranges), then `npm publish` of the tarball,
 * which authenticates through npm Trusted Publishing (GitHub's OIDC token) and signs provenance.
 * Versions already on npm are skipped, so re-running a release publishes nothing twice.
 *
 * Usage (after `pnpm build`): node tools/release/publish.mjs [--dry-run]
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCOPE = '@silverpoint/';

/** The public packages under `root/packages`, each after the `@silverpoint` packages it depends on. */
export function publishablePackages(root) {
  const found = [];
  for (const entry of readdirSync(join(root, 'packages'))) {
    const dir = join(root, 'packages', entry);
    const manifestPath = join(dir, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (manifest.private) continue;
    const deps = Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies }).filter((d) => d.startsWith(SCOPE));
    const packDir = manifest.publishConfig?.directory ? join(dir, manifest.publishConfig.directory) : dir;
    found.push({ name: manifest.name, version: manifest.version, dir, packDir, deps });
  }
  found.sort((a, b) => a.name.localeCompare(b.name));
  const ordered = [];
  const visit = (pkg, trail) => {
    if (ordered.includes(pkg)) return;
    if (trail.includes(pkg.name)) throw new Error(`dependency cycle: ${[...trail, pkg.name].join(' → ')}`);
    for (const dep of pkg.deps) {
      const target = found.find((p) => p.name === dep);
      if (target) visit(target, [...trail, pkg.name]);
    }
    ordered.push(pkg);
  };
  for (const pkg of found) visit(pkg, []);
  return ordered;
}

/** The packages whose version `isPublished(name, version)` says npm does not have. */
export function planPublish(packages, isPublished) {
  return packages.filter((pkg) => !isPublished(pkg.name, pkg.version));
}

/** What would make the packed folder a broken npm page or package; one line per problem. */
export function packProblems(pkg) {
  const problems = [];
  if (!existsSync(join(pkg.packDir, 'package.json'))) problems.push(`${pkg.name}: no package.json in ${pkg.packDir} (was it built?)`);
  if (!existsSync(join(pkg.packDir, 'README.md'))) problems.push(`${pkg.name}: no README.md in ${pkg.packDir}; npm would show an empty page`);
  return problems;
}

/** Whether npm has `name@version`; a 404 means no, any other failure stops the release. */
function onNpm(name, version) {
  try {
    return execFileSync('npm', ['view', `${name}@${version}`, 'version'], { encoding: 'utf8', stdio: 'pipe' }).trim() === version;
  } catch (error) {
    if (/E404|404 Not Found/.test(String(error.stderr ?? ''))) return false;
    throw error;
  }
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const plan = planPublish(publishablePackages(root), onNpm);
  const problems = plan.flatMap(packProblems);
  for (const problem of problems) console.error(`error  ${problem}`);
  if (problems.length > 0) process.exit(1);

  const out = mkdtempSync(join(tmpdir(), 'sp-publish-'));
  for (const pkg of plan) {
    const packed = JSON.parse(execFileSync('pnpm', ['pack', '--pack-destination', out, '--json'], { cwd: pkg.dir, encoding: 'utf8' }));
    const args = ['publish', packed.filename, '--access', 'public'];
    // Provenance needs the CI's OIDC token; Trusted Publishing adds it there on its own as well.
    if (process.env.GITHUB_ACTIONS === 'true') args.push('--provenance');
    if (dryRun) args.push('--dry-run');
    execFileSync('npm', args, { stdio: 'inherit' });
    console.log(`${dryRun ? 'would publish' : 'published'}  ${pkg.name}@${pkg.version}`);
  }
  console.log(`publish · ${plan.length} package(s)${dryRun ? ' (dry run)' : ''}`);

  if (process.env.GITHUB_OUTPUT) {
    const version = plan[0]?.version ?? '';
    appendFileSync(process.env.GITHUB_OUTPUT, `published=${dryRun ? 0 : plan.length}\nversion=${version}\n`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
