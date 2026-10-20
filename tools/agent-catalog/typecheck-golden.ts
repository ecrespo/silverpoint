/**
 * REQ-557 · `generate_code`'s golden files compile: each framework's goldens are copied into its
 * example app (`src/__agent__/`, git-ignored) and checked with that app's own compiler — `tsc` for
 * React, `vue-tsc` for Vue, `ngc` with `strictTemplates` for Angular. Reflex goldens are parsed and
 * every builder and keyword is checked against the pinned Reflex catalog. Runs after `pnpm build`:
 * the example apps resolve the packages' built output.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const GOLDEN = join(ROOT, 'packages/mcp/test/golden');
const AGENT_DIR = '__agent__';

const failures: string[] = [];

function run(label: string, command: string, args: readonly string[], cwd: string): void {
  try {
    execFileSync(command, args, { cwd, stdio: 'pipe', encoding: 'utf8' });
    console.log(`ok  ${label}`);
  } catch (error) {
    const { stdout = '', stderr = '' } = error as { stdout?: string; stderr?: string };
    failures.push(`${label}\n${stdout}${stderr}`);
    console.log(`FAIL ${label}`);
  }
}

/** Copies a framework's goldens into an example app, runs `check`, and always removes the copy. */
function within(app: string, framework: string, check: (dir: string, files: string[]) => void): void {
  const dir = join(ROOT, 'examples', app, 'src', AGENT_DIR);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const files = readdirSync(join(GOLDEN, framework));
  for (const file of files) cpSync(join(GOLDEN, framework, file), join(dir, file));
  try {
    check(dir, files);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

within('vite-react', 'react', () => run('react · tsc', 'pnpm', ['exec', 'tsc', '--noEmit', '-p', 'examples/vite-react/tsconfig.json'], ROOT));

within('vite-vue', 'vue', () => run('vue · vue-tsc', 'pnpm', ['exec', 'vue-tsc', '--noEmit', '-p', 'tsconfig.json'], join(ROOT, 'examples/vite-vue')));

within('angular', 'angular', (dir, files) => {
  const config = join(ROOT, 'examples/angular', `tsconfig.${AGENT_DIR}.json`);
  writeFileSync(
    config,
    JSON.stringify({
      extends: './tsconfig.json',
      compilerOptions: { outDir: join(dir, 'out'), noEmit: false },
      angularCompilerOptions: { strictTemplates: true, strictInjectionParameters: true },
      files: files.map((f) => `src/${AGENT_DIR}/${f}`),
    }),
  );
  try {
    run('angular · ngc strictTemplates', 'pnpm', ['exec', 'ngc', '-p', config], join(ROOT, 'examples/angular'));
  } finally {
    rmSync(config, { force: true });
  }
});

run('reflex · builders and keywords', 'python3', ['-I', join(ROOT, 'tools/agent-catalog/reflex/check_golden.py'), join(GOLDEN, 'reflex'), join(ROOT, 'tools/agent-catalog/reflex/reflex-catalog.json')], ROOT);

if (failures.length > 0) {
  console.error(`\n${failures.join('\n\n')}`);
  process.exit(1);
}
