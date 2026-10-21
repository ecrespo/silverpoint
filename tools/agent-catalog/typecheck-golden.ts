/**
 * REQ-557 · Every example an agent is given compiles: `generate_code`'s golden files and every code
 * fence of the `silverpoint` skill (`extractExamples`). Each framework's sources are copied into its
 * example app (`src/__agent__/`, git-ignored) and checked with that app's own compiler — `tsc` for
 * React, `vue-tsc` for Vue, `ngc` with `strictTemplates` for Angular. Reflex sources are parsed and
 * every builder and keyword is checked against the pinned Reflex catalog. Runs after `pnpm build`:
 * the example apps resolve the packages' built output.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractExamples, SKILL_DIR } from './skill';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const GOLDEN = join(ROOT, 'packages/mcp/test/golden');
const AGENT_DIR = '__agent__';

type Framework = 'react' | 'vue' | 'angular' | 'reflex';

interface Source {
  readonly file: string;
  readonly code: string;
}

/** The committed skill, templates aside: what an agent reads. */
function skill(dir = SKILL_DIR): Map<string, string> {
  const files = new Map<string, string>();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!(entry.name === 'templates' && dir === SKILL_DIR)) for (const [k, v] of skill(path)) files.set(k, v);
    } else if (entry.name.endsWith('.md')) files.set(relative(SKILL_DIR, path), readFileSync(path, 'utf8'));
  }
  return files;
}

const examples = extractExamples(skill());

function sources(framework: Framework): Source[] {
  const golden = readdirSync(join(GOLDEN, framework)).map((file) => ({ file, code: readFileSync(join(GOLDEN, framework, file), 'utf8') }));
  const fenced = examples.filter((e) => e.framework === framework).map((e) => ({ file: `skill-${e.name}.${e.ext}`, code: e.code }));
  return [...golden, ...fenced];
}

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

/** Writes a framework's sources into an example app, runs `check`, and always removes the copy. */
function within(app: string, framework: Framework, check: (dir: string, files: string[]) => void): void {
  const dir = join(ROOT, 'examples', app, 'src', AGENT_DIR);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const files = sources(framework);
  for (const { file, code } of files) writeFileSync(join(dir, file), code);
  try {
    check(
      dir,
      files.map((f) => f.file),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

within('vite-react', 'react', (_, files) => run(`react · tsc (${files.length} files)`, 'pnpm', ['exec', 'tsc', '--noEmit', '-p', 'examples/vite-react/tsconfig.json'], ROOT));

within('vite-vue', 'vue', (_, files) => run(`vue · vue-tsc (${files.length} files)`, 'pnpm', ['exec', 'vue-tsc', '--noEmit', '-p', 'tsconfig.json'], join(ROOT, 'examples/vite-vue')));

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
    run(`angular · ngc strictTemplates (${files.length} files)`, 'pnpm', ['exec', 'ngc', '-p', config], join(ROOT, 'examples/angular'));
  } finally {
    rmSync(config, { force: true });
  }
});

const reflex = mkdtempSync(join(tmpdir(), 'silverpoint-reflex-'));
try {
  const files = sources('reflex');
  for (const { file, code } of files) writeFileSync(join(reflex, file), code);
  run(`reflex · builders and keywords (${files.length} files)`, 'python3', ['-I', join(ROOT, 'tools/agent-catalog/reflex/check_golden.py'), reflex, join(ROOT, 'tools/agent-catalog/reflex/reflex-catalog.json')], ROOT);
} finally {
  rmSync(reflex, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n${failures.join('\n\n')}`);
  process.exit(1);
}
