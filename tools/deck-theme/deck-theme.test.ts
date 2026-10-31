import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { THEME_FILE, themeCss } from './theme-file';

test('REQ-582 · T-264 · the published theme.css is the one the grounds and the rules give', () => {
  expect(readFileSync(THEME_FILE, 'utf8')).toBe(themeCss());
});

test('REQ-582 · it carries the two built-in grounds and no other', () => {
  const css = themeCss();
  expect(css).toContain('section.cyanotype {');
  expect([...css.matchAll(/data-sp-ground="([a-z-]+)"/g)].map((m) => m[1]).filter((g, i, all) => all.indexOf(g) === i)).toEqual(['silverpoint', 'cyanotype']);
});
