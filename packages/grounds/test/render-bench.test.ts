import { __setDiagnosticSink, type SpCode } from '@silverpoint/core';
import { afterEach, describe, expect, test } from 'vitest';
import { CATALOG } from '../../../tools/visual-gate/catalog';
import { RENDER_CARDS, renderCard } from '../bench/cards';

let restore: () => void = () => {};
afterEach(() => restore());

/**
 * The 16 ms benchmark of TD §2 times the full initial render of a card, inking included (T-093).
 * These tests keep its inputs honest: every catalog chart has a card, and each one renders a
 * ready, inked chart without a diagnostic — so the benchmark never times an empty state.
 */
describe('render benchmark cards', () => {
  test('TD §2 · every catalog chart has a card', () => {
    expect(RENDER_CARDS.map((c) => c.chart).sort()).toEqual(CATALOG.map((c) => c.chart).sort());
  });

  test.each(RENDER_CARDS.map((c) => [c.chart, c] as const))('TD §2 · %s: an inked, ready card at md, no diagnostic', (_chart, card) => {
    const seen: SpCode[] = [];
    restore = __setDiagnosticSink((code) => seen.push(code));
    const { status, svg } = renderCard(card);
    expect(status).toBe('ready');
    expect(svg).toContain('data-mode="ink"');
    expect(seen).toEqual([]);
  });
});
