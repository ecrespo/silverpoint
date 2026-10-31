import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { silverpoint, cyanotype } from '../../packages/grounds/src';
import { THEME_FILE } from './theme-file';

/* REQ-582 (T-266): Marp CLI 4.x, pinned here, loads theme.css with `--theme` and the theme applies. */

const HERE = dirname(fileURLToPath(import.meta.url));
const MARP = join(HERE, 'node_modules/.bin/marp');

function render(markdown: string): string {
  const out = join(mkdtempSync(join(tmpdir(), 'sp-marp-cli-')), 'deck.html');
  // `--no-stdin`: with a piped stdin, Marp CLI would wait for Markdown on it.
  execFileSync(MARP, ['--no-config-file', '--no-stdin', '--template', 'bare', '--theme', THEME_FILE, markdown, '-o', out], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000 });
  return readFileSync(out, 'utf8');
}

test('REQ-582 · Marp CLI renders a deck with theme.css: the silverpoint rules and colours, not Marp’s default theme', () => {
  const html = render(join(HERE, 'fixture/marp-cli.deck.md'));
  expect(html).toContain('font-family:var(--sp-font-display)');
  expect(html).toContain(`--sp-substrate: ${silverpoint.substrates.cream}`);
  expect(html).toContain(`--sp-substrate: ${cyanotype.substrates.prussian}`);
  expect(html).not.toContain('--color-fg-default');
  expect(html.match(/<section [^>]*class="cyanotype"/g)).toHaveLength(1);
  expect(html).toMatch(/data-marpit-pagination="3"/);
}, 60_000);

test('REQ-582 · what degrades there: a silverpoint fence is shown as code', () => {
  const html = render(join(HERE, 'fixture/marp-cli.deck.md'));
  expect(html).toMatch(/<pre[^>]*><code[^>]*>\{(?:&quot;|")chart(?:&quot;|"):(?:&quot;|")bar-chart(?:&quot;|")\}/);
  expect(html).not.toContain('data-sp-slot');
}, 60_000);

function renderWithEngine(markdown: string): string {
  const out = join(mkdtempSync(join(tmpdir(), 'sp-marp-engine-')), 'deck.html');
  execFileSync(MARP, ['--no-config-file', '--no-stdin', '--template', 'bare', '--engine', '@silverpoint/marp/cli', markdown, '-o', out], { cwd: HERE, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000 });
  return readFileSync(out, 'utf8');
}

test('REQ-583 · --engine @silverpoint/marp/cli renders the directives, the backdrops and the fences as static SVG, with no --theme', () => {
  const html = renderWithEngine(join(HERE, 'fixture/engine.deck.md'));
  expect(html).toContain('data-sp-ground="cyanotype" data-sp-substrate="prussian"');
  expect(html).toContain('--sp-deck-backdrop:url(');
  expect(html).toMatch(/<figure class="sp-deck-chart" data-sp-slot="s2-c1"[^>]*><div class="sp-root sp-ground-silverpoint"/);
  expect(html).toContain(`--sp-substrate: ${cyanotype.substrates.prussian}`);
  expect(html).toContain(".sp-chart [part='sp-rule']{stroke:var(--sp-rule)}");
}, 60_000);
