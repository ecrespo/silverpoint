import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Builds every package, so the gate compares the artefacts that are published. */
export default function setup(): void {
  const repo = fileURLToPath(new URL('../..', import.meta.url));
  execFileSync('pnpm', ['--filter', './packages/**', 'run', 'build'], { cwd: repo, stdio: 'pipe' });
}
