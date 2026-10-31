/**
 * The package's README (T-287, REQ-627): every entry point, the install with its peers, usage in the
 * three adapters, the authoring guide, the theme in Marp CLI and VS Code with what degrades there, and
 * SSR — so the page npm shows is the package's documentation.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { DECK_DIRECTIVES, THEME_CLASSES } from '../src';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { exports: Record<string, unknown> };

describe('README (REQ-627)', () => {
  test('REQ-627 · every entry point of the package is documented', () => {
    for (const entry of Object.keys(pkg.exports).filter((e) => e !== './package.json')) {
      const name = entry === '.' ? '`@silverpoint/marp`' : `\`@silverpoint/marp/${entry.slice(2)}\``;
      expect(readme, entry).toContain(name);
    }
  });

  test('REQ-627 · install, usage in React, Vue and Angular, and SSR', () => {
    for (const text of ['npm install', '@silverpoint/react/deck', '@silverpoint/vue/deck', '@silverpoint/angular/deck', 'createDeckEngine', 'Next.js', "'use client'", '@vue/server-renderer', '@angular/ssr', '(pageChange)="page.set($event.page)"']) expect(readme, text).toContain(text);
    expect(readme).not.toContain('[(page)]');
  });

  test('REQ-627 · the authoring guide: directives, classes, the fence and its diagnostics', () => {
    for (const d of DECK_DIRECTIVES) expect(readme, d.name).toContain(`\`${d.name}\``);
    for (const c of THEME_CLASSES) expect(readme, c).toContain(`\`${c}\``);
    for (const text of ['```silverpoint', 'SP026', 'SP027', 'SP029']) expect(readme, text).toContain(text);
  });

  test('REQ-627 · REQ-582 · the theme in Marp CLI and VS Code, and what degrades there', () => {
    for (const text of ['--theme', 'markdown.marp.themes', '--engine @silverpoint/marp/cli', 'no generated backdrops', 'shown as code', 'no controller']) expect(readme, text).toContain(text);
  });
});
