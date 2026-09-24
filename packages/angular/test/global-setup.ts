import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * The tests exercise the published artefact: the partial-compiled APF bundle ng-packagr emits,
 * linked at runtime by @angular/compiler. Build it once before the suite.
 */
export default function setup(): void {
  const root = fileURLToPath(new URL('..', import.meta.url));
  execFileSync('pnpm', ['run', 'build'], { cwd: root, stdio: 'pipe' });
}
