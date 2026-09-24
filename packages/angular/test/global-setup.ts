import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * The tests exercise the published artefact: the partial-compiled APF bundle ng-packagr emits,
 * linked at runtime by @angular/compiler. Build it once, with its dependencies, before the suite.
 */
export default function setup(): void {
  const repo = fileURLToPath(new URL('../../..', import.meta.url));
  // `@silverpoint/angular...` builds the package and, first, the workspace packages it imports.
  execFileSync('pnpm', ['--filter', '@silverpoint/angular...', 'run', 'build'], { cwd: repo, stdio: 'pipe' });
}
