/**
 * The 10-minute quickstart, followed literally (PRD §4.2, T-098): for each framework, the site's
 * own steps (`docs/site/src/quickstart.ts`) — create a fresh app, install silverpoint, replace the
 * files — then build it, open it in Chromium and check the chart is drawn, timing it all.
 *
 * The one substitution: until `1.0.0` is on npm, `@silverpoint/<pkg>` installs from the tarballs
 * `pnpm pack` makes of this checkout, core included (the registry has no copy for it to resolve).
 *
 * Usage (after `pnpm build`; needs the network): pnpm exec tsx tools/quickstart/quickstart.ts [React|Vue|Angular]
 */
import { execSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { QUICKSTARTS, type Quickstart } from '../../docs/site/src/quickstart';

const repo = fileURLToPath(new URL('../..', import.meta.url));
/** PRD §4.2: from `install` to first render in under ten minutes. */
export const BUDGET_MS = 10 * 60 * 1000;
const PACKAGES = ['core', 'grounds', 'fonts', 'react', 'vue', 'angular'];

const run = (command: string, cwd: string) => execSync(command, { cwd, stdio: 'pipe', env: { ...process.env, CI: '1', NG_CLI_ANALYTICS: 'false' }, maxBuffer: 64 * 1024 * 1024 });

/** `npm install @silverpoint/a @silverpoint/b` → the same command over local tarballs, plus core. */
export function withTarballs(install: string, tarball: (pkg: string) => string): string {
  const named = [...install.matchAll(/@silverpoint\/([\w-]+)/g)].map((m) => m[1] as string);
  const all = [...new Set([...named, 'core', ...(named.some((p) => ['react', 'vue', 'angular'].includes(p)) ? ['grounds'] : [])])];
  return `${install.replace(/\s@silverpoint\/[\w-]+/g, '')} ${all.map(tarball).join(' ')}`;
}

/** A static server for a built app's folder, with a fallback to its index. */
function serve(root: string): Promise<{ server: Server; url: string }> {
  const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const server = createServer((request, response) => {
    let path = join(root, decodeURIComponent((request.url ?? '/').split('?')[0] ?? '/'));
    if (!existsSync(path) || statSync(path).isDirectory()) path = join(root, 'index.html');
    response.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
    createReadStream(path).pipe(response);
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, url: `http://localhost:${(server.address() as { port: number }).port}/` })));
}

export interface QuickstartResult {
  readonly framework: string;
  readonly ms: number;
  readonly inkedPaths: number;
  readonly errors: readonly string[];
}

export async function followQuickstart(q: Quickstart, tarballs: string): Promise<QuickstartResult> {
  const started = Date.now();
  const work = mkdtempSync(join(tmpdir(), `sp-quickstart-${q.framework.toLowerCase()}-`));
  try {
    run(q.create, work);
    const app = join(work, 'my-charts');
    if (q.framework !== 'Angular') run('npm install', app);
    run(withTarballs(q.install, (pkg) => join(tarballs, readdirSync(tarballs).find((f) => f.startsWith(`silverpoint-${pkg}-`)) ?? '')), app);
    for (const file of q.files) writeFileSync(join(app, file.path), file.code);
    run(q.framework === 'Angular' ? 'npx ng build' : 'npm run build', app);
    const dist = q.framework === 'Angular' ? join(app, 'dist/my-charts/browser') : join(app, 'dist');
    const { server, url } = await serve(dist);
    const browser = await chromium.launch({ channel: 'chromium' });
    try {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.goto(url);
      await page.locator('.sp-root[data-status="ready"] svg.sp-chart').waitFor({ timeout: 30_000 });
      const inkedPaths = await page.locator('svg.sp-chart path[part="sp-ink"]').count();
      return { framework: q.framework, ms: Date.now() - started, inkedPaths, errors };
    } finally {
      await browser.close();
      server.close();
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const only = process.argv[2];
  const tarballs = mkdtempSync(join(tmpdir(), 'sp-tarballs-'));
  mkdirSync(tarballs, { recursive: true });
  for (const pkg of PACKAGES) run(`pnpm pack --pack-destination ${tarballs}`, join(repo, 'packages', pkg));
  let failed = 0;
  for (const q of QUICKSTARTS.filter((q) => !only || q.framework === only)) {
    try {
      const result = await followQuickstart(q, tarballs);
      const ok = result.ms < BUDGET_MS && result.inkedPaths > 0 && result.errors.length === 0;
      if (!ok) failed += 1;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${q.framework.padEnd(8)} ${(result.ms / 1000).toFixed(0)} s, ${result.inkedPaths} inked paths${result.errors.length ? `, errors: ${result.errors.join(' | ')}` : ''}`);
    } catch (error) {
      failed += 1;
      const e = error as { message: string; stdout?: Buffer; stderr?: Buffer };
      console.log(`FAIL ${q.framework.padEnd(8)} ${e.message.split('\n')[0]}\n${e.stdout?.toString().slice(-2000) ?? ''}${e.stderr?.toString().slice(-2000) ?? ''}`);
    }
  }
  rmSync(tarballs, { recursive: true, force: true });
  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv[1]?.endsWith('quickstart.ts')) void main();
