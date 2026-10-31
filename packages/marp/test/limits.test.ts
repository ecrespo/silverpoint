import { __setDiagnosticSink } from '@silverpoint/core';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createDeckEngine, DECK_LIMITS } from '../src';

/* REQ-576 (T-261): past a limit the deck renders up to it and raises SP029 naming the limit. */

let sunk: string[] = [];
let restore: () => void;
beforeEach(() => {
  sunk = [];
  restore = __setDiagnosticSink((code, message) => sunk.push(`${code} ${message}`));
});
afterEach(() => restore());

const slides = (n: number) => Array.from({ length: n }, (_, i) => `# S${i + 1}`).join('\n\n---\n\n');
const donut = '```silverpoint\n{"chart":"donut-chart","width":200,"height":120}\n```';
const sp029 = (out: { diagnostics: readonly { code: string; message: string }[] }) => out.diagnostics.filter((d) => d.code === 'SP029');

describe('deck limits (T-261)', () => {
  test('REQ-576 · the limits are 512 KB, 300 slides and 60 fences', () => {
    expect(DECK_LIMITS).toEqual({ bytes: 512 * 1024, slides: 300, fences: 60 });
  });

  test('REQ-576 · at the limits nothing is dropped and nothing is raised', () => {
    const out = createDeckEngine({ id: 'l0' }).render(slides(300));
    expect(out.total).toBe(300);
    expect(sp029(out)).toEqual([]);
  });

  test('REQ-576 · 301 slides: the first 300, counted as 300, and SP029', () => {
    const out = createDeckEngine({ id: 'l1' }).render(`${slides(301)}\n\n${donut}`);
    expect(out.total).toBe(300);
    expect(out.slides).toHaveLength(300);
    expect(out.slides[299]!.html).toContain('aria-label="Slide 300 of 300"');
    expect(out.slots).toEqual([]);   // the fence was on slide 301
    expect(sp029(out)).toEqual([{ code: 'SP029', severity: 'warn', message: expect.stringContaining('300 slides'), }]);
    expect(sunk.filter((s) => s.startsWith('SP029'))).toHaveLength(1);
  });

  test('REQ-576 · 61 fences: the first 60 render, the 61st is left out, SP029', () => {
    const out = createDeckEngine({ id: 'l2' }).render(Array.from({ length: 61 }, () => donut).join('\n\n'));
    expect(out.slots).toHaveLength(60);
    expect(out.slides[0]!.html.split('data-sp-slot=')).toHaveLength(61);
    expect(out.slides[0]!.html).not.toContain('s1-c61');
    expect(sp029(out)).toEqual([{ code: 'SP029', severity: 'warn', message: expect.stringContaining('60 chart fences'), slide: 1 }]);
  });

  test('REQ-576 · over 512 KB: cut at the last line break inside the limit, SP029', () => {
    const line = 'A line of prose that fills the deck, with an é to count bytes, not characters.\n';
    const md = `# Big\n\n${line.repeat(Math.ceil((DECK_LIMITS.bytes + 10_000) / new TextEncoder().encode(line).length))}`;
    const out = createDeckEngine({ id: 'l3' }).render(md);
    expect(out.total).toBe(1);
    expect(out.slides[0]!.html).toMatch(/characters\.<\/p>/);
    expect(sp029(out)).toEqual([{ code: 'SP029', severity: 'warn', message: expect.stringContaining('512 KB') }]);
  });
});
