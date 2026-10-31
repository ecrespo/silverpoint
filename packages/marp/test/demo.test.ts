/**
 * `DECK_DEMO` (T-286, REQ-626): a deck presenting silverpoint itself, on its own subpath so no other
 * entry carries it — charts, fragments, a split background, notes, a `precision` slide and a
 * `cyanotype` slide — that renders with no diagnostic. The example apps' `/deck` page draws it, so
 * its first two slides keep the bench's contract: a donut on slide 1, three fragments on slide 2.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { createDeckEngine } from '../src';
import { DECK_DEMO } from '../src/demo';

const deck = createDeckEngine({ id: 'demo-deck' }).render(DECK_DEMO);
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { exports: Record<string, unknown> };

describe('DECK_DEMO (REQ-626)', () => {
  test('REQ-626 · it renders with no diagnostic', () => {
    expect(deck.diagnostics).toEqual([]);
    expect(deck.total).toBeGreaterThanOrEqual(6);
  });

  test('REQ-626 · charts, fragments, notes, a split background, a precision slide and a cyanotype slide', () => {
    expect(deck.slots.length).toBeGreaterThanOrEqual(3);
    expect(deck.slots.every((s) => s.error === undefined)).toBe(true);
    expect(deck.slides.some((s) => s.fragments > 0)).toBe(true);
    expect(deck.slides.some((s) => s.notes.length > 0)).toBe(true);
    expect(deck.slides.some((s) => /data-marpit-advanced-background="background"[^>]*data-marpit-advanced-background-split="right"/.test(s.html))).toBe(true);
    expect(deck.slides.some((s) => s.mode === 'precision' && deck.slots.some((c) => c.slide === s.index))).toBe(true);
    expect(deck.slides.some((s) => s.ground === 'cyanotype' && deck.slots.some((c) => c.slide === s.index))).toBe(true);
  });

  test('REQ-626 · the bench contract of the /deck page: a donut on slide 1, three fragments on slide 2', () => {
    expect(deck.slots.find((s) => s.slotId === 's1-c1')?.spec?.chart).toBe('donut-chart');
    expect(deck.slides[1]!.fragments).toBe(3);
  });

  test('REQ-626 · on its own subpath, `@silverpoint/marp/demo`', () => {
    expect(pkg.exports['./demo']).toMatchObject({ types: './dist/demo.d.ts', import: './dist/demo.js' });
    expect(readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')).not.toContain('demo');
  });
});
