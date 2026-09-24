import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';
import { describe, expect, test } from 'vitest';

const here = (path: string) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const css = () => readFileSync(here('fonts.css'), 'utf8');

const CUTS = [
  { file: 'eb-garamond-latin-400-normal.woff2', weight: '400', style: 'normal' },
  { file: 'eb-garamond-latin-500-normal.woff2', weight: '500', style: 'normal' },
  { file: 'eb-garamond-latin-400-italic.woff2', weight: '400', style: 'italic' },
];

function faces(): string[] {
  return css().match(/@font-face\s*{[^}]*}/g) ?? [];
}

describe('@silverpoint/fonts', () => {
  test('REQ-032 · declares exactly the three cuts of DD-010, and no monospace family', () => {
    expect(faces()).toHaveLength(3);
    for (const cut of CUTS) {
      const face = faces().find((f) => f.includes(cut.file));
      expect(face, cut.file).toBeDefined();
      expect(face).toMatch(/font-family:\s*'EB Garamond'/);
      expect(face).toMatch(new RegExp(`font-weight:\\s*${cut.weight}`));
      expect(face).toMatch(new RegExp(`font-style:\\s*${cut.style}`));
      expect(face).toMatch(/format\('woff2'\)/);
    }
    expect(css()).not.toMatch(/mono/i);
  });

  test('REQ-032 · every url() in the stylesheet points at a shipped file', () => {
    const urls = [...css().matchAll(/url\('\.\/([^']+)'\)/g)].map((m) => m[1] as string);
    expect(urls).toHaveLength(3);
    for (const url of urls) expect(existsSync(here(url)), url).toBe(true);
  });

  test('REQ-032 · faces block briefly instead of swapping, so golden images never capture the fallback', () => {
    for (const face of faces()) expect(face).toMatch(/font-display:\s*block/);
  });

  test.each(CUTS)('DD-010 · $file carries tnum: tabular 1 and 8 share an advance width', ({ file }) => {
    const font = fontkit.create(readFileSync(here(`files/${file}`))) as fontkit.Font;
    expect(font.availableFeatures).toContain('tnum');
    const one = font.layout('1', ['tnum']).advanceWidth;
    const eight = font.layout('8', ['tnum']).advanceWidth;
    expect(one).toBe(eight);
  });

  test('DD-010 · the NOTICE names the authors and the licence', () => {
    const notice = readFileSync(here('NOTICE'), 'utf8');
    expect(notice).toMatch(/EB Garamond Project Authors/);
    expect(notice).toMatch(/Georg Duffner/);
    expect(notice).toMatch(/SIL Open Font License, Version 1\.1/);
    expect(readFileSync(here('OFL.txt'), 'utf8')).toMatch(/SIL OPEN FONT LICENSE Version 1\.1/i);
  });
});
