import { test } from 'vitest';
import { createPrng } from '../src';
import { paletteStyle, resolvePalette } from '../src';
import { sanguine } from '../src/palettes';
import { uiListKey, uiNumberValue, uiPageWindow, uiPlace, uiSortRows, uiTypeahead } from '../src/ui';

/**
 * PRD delta §7, feature-004: `uiSortRows` sorts 10,000 rows in < 10 ms; `uiPlace`, `uiListKey` and
 * `uiTypeahead` < 0.05 ms per call. Reported nightly by `tools/bench-report`; nothing here fails on time.
 */
const next = createPrng(20261018);
const rows = Array.from({ length: 10_000 }, (_, i) => ({ i, v: next() < 0.1 ? null : next() < 0.5 ? Math.floor(next() * 1000) : `r${Math.floor(next() * 1000)}` }));
const disabled = Array.from({ length: 50 }, (_, i) => i % 7 === 3);
const labels = Array.from({ length: 50 }, (_, i) => `Option ${String.fromCharCode(65 + (i % 26))}${i}`);
const place = {
  anchor: { x: 700, y: 560, width: 80, height: 30 },
  floating: { width: 240, height: 320 },
  viewport: { width: 800, height: 600 },
  side: 'bottom',
  align: 'start',
  offset: 6,
  padding: 8,
  dir: 'rtl',
} as const;

const CASES: Record<string, () => unknown> = {
  'uiSortRows (10,000 rows)': () => uiSortRows(rows, 'v', 'desc'),
  uiPlace: () => uiPlace(place),
  uiListKey: () => uiListKey({ active: 48, count: 50, disabled, open: true }, 'ArrowDown', 'menu'),
  uiTypeahead: () => uiTypeahead(labels, disabled, 'opt', 30),
  uiPageWindow: () => uiPageWindow(400, 211, 2),
  uiNumberValue: () => uiNumberValue(3.14159, { min: 0, max: 10, precision: 2 }),
  'resolvePalette + paletteStyle': () => paletteStyle(resolvePalette(sanguine, { ink: '#3C4858' })),
};

for (const [name, run] of Object.entries(CASES)) {
  test(`feature-004 · ${name} per call`, async ({ bench }) => {
    await bench(`${name.startsWith('uiSortRows') ? 'sort' : 'ui'} · ${name}`, run).run();
  });
}
