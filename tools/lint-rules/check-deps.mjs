/**
 * Checks the published metadata of every package (REQ-034, REQ-160 to REQ-163). Metadata is
 * where a library looks broken while the code is fine, so it gets a gate of its own (DD-011).
 *
 * Usage: node tools/lint-rules/check-deps.mjs — exits non-zero on any problem.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Runtime dependency allowlist per package (TD §5.3). */
const ALLOWLIST = {
  '@silverpoint/core': ['d3-scale', 'd3-shape', 'd3-chord'],
  '@silverpoint/grounds': ['@silverpoint/core', 'roughjs'],
  '@silverpoint/react': ['@silverpoint/core', '@silverpoint/grounds'],
  '@silverpoint/vue': ['@silverpoint/core', '@silverpoint/grounds'],
  // tslib is the runtime helper every Angular Package Format library ships with.
  '@silverpoint/angular': ['@silverpoint/core', '@silverpoint/grounds', 'tslib'],
  '@silverpoint/fonts': [],
};

/** Frameworks each adapter must declare as peers, and nobody may declare as dependencies. */
const PEERS = {
  '@silverpoint/react': ['react', 'react-dom'],
  '@silverpoint/vue': ['vue'],
  '@silverpoint/angular': ['@angular/core', '@angular/common'],
};
const FRAMEWORKS = Object.values(PEERS).flat();

/** Packages that ship a stylesheet and must keep it as a side effect (REQ-034). */
const STYLESHEETS = ['@silverpoint/grounds', '@silverpoint/fonts'];

function checkConditionOrder(name, exports, problems) {
  if (typeof exports !== 'object' || exports === null) return;
  for (const [subpath, target] of Object.entries(exports)) {
    if (typeof target !== 'object' || target === null) continue;
    const keys = Object.keys(target);
    const position = keys.indexOf('default');
    if (position !== -1 && position !== keys.length - 1) {
      problems.push(
        `REQ-163 · ${name}: in exports "${subpath}" the "default" condition shadows ${keys.slice(position + 1).map((k) => `"${k}"`).join(', ')}; it must come last.`,
      );
    }
  }
}

/** Returns one line per problem found across the manifests; empty when all pass. */
export function checkManifests(manifests) {
  const problems = [];
  const byName = new Map(manifests.map((manifest) => [manifest.name, manifest]));

  for (const name of Object.keys(ALLOWLIST)) {
    if (!byName.has(name)) problems.push(`REQ-160 · ${name} is missing from the workspace.`);
  }

  for (const [name, manifest] of byName) {
    const allowed = ALLOWLIST[name];
    if (!allowed) continue;
    const dependencies = Object.keys(manifest.dependencies ?? {});

    for (const dependency of dependencies) {
      if (FRAMEWORKS.includes(dependency)) {
        problems.push(`REQ-161 · ${name} declares ${dependency} as a dependency; frameworks are peerDependencies only.`);
      } else if (!allowed.includes(dependency)) {
        problems.push(`REQ-162 · ${name} depends on ${dependency}, which is outside its allowlist (${allowed.join(', ') || 'none'}).`);
      }
    }
    for (const peer of PEERS[name] ?? []) {
      if (!(peer in (manifest.peerDependencies ?? {}))) {
        problems.push(`REQ-161 · ${name} must declare ${peer} in peerDependencies.`);
      }
    }

    const generated = manifest.publishConfig?.linkDirectory === true;
    if (!generated && manifest.exports === undefined) {
      problems.push(`REQ-163 · ${name} publishes no exports map.`);
    }
    checkConditionOrder(name, manifest.exports, problems);

    if (STYLESHEETS.includes(name)) {
      const effects = manifest.sideEffects;
      if (!Array.isArray(effects) || !effects.includes('*.css')) {
        problems.push(`REQ-034 · ${name} ships a stylesheet, so sideEffects must be ["*.css"] or bundlers drop the import.`);
      }
    } else if (manifest.sideEffects !== false) {
      problems.push(`REQ-163 · ${name} must declare sideEffects: false.`);
    }
  }
  return problems;
}

/** Reads `packages/<dir>/package.json` for every package directory under `root`. */
export function readWorkspaceManifests(root) {
  const packages = join(root, 'packages');
  return readdirSync(packages, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(packages, entry.name, 'package.json')))
    .map((entry) => JSON.parse(readFileSync(join(packages, entry.name, 'package.json'), 'utf8')));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const problems = checkManifests(readWorkspaceManifests(root));
  for (const problem of problems) console.error(`error  ${problem}`);
  console.log(`check-deps · ${problems.length} problem(s)`);
  process.exit(problems.length === 0 ? 0 : 1);
}
