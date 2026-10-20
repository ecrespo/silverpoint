import { PALETTE_NAMES, PALETTES, paletteStyle } from '@silverpoint/core/palettes';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { normalizeUi, parseUi } from '../svg-normalizer/normalize';
import { FIXTURES_DIR } from './fixtures';
import { loadPaletteFixtures, paletteCanonicalFor, paletteChartFixture, paletteMatrix, paletteUiFixture } from './palette-fixtures';
import { canonicalUiMarkup } from './ui-canonical';
import { uiFixtureParts } from './ui-matrix';

/*
 * The palette fixtures (T-217, Data Model §5, DD-043): six presets × three targets (LineChart,
 * SpCard, SpTable) × two modes on silverpoint/cream, every one on every PR. A palette changes only
 * the root's `style` (I-33, REQ-468).
 */

const styleOf = (markup: string) => parseUi(markup).attrs.find(([name]) => name === 'style')?.[1];

describe('palette fixture matrix (T-217)', () => {
  test('REQ-516 · Data Model §5: 6 presets × 3 targets × 2 modes = 36, on silverpoint/cream, all on PR', () => {
    const matrix = paletteMatrix();
    expect(matrix).toHaveLength(36);
    expect(new Set(matrix.map((f) => f.id)).size).toBe(36);
    expect(new Set(matrix.map((f) => f.preset))).toEqual(new Set(PALETTE_NAMES));
    expect(new Set(matrix.map((f) => f.target))).toEqual(new Set(['line-chart', 'card', 'table']));
    expect(matrix.every((f) => f.scope === 'pr')).toBe(true);
    expect(matrix[0]).toMatchObject({ id: 'palette--silverpoint--line-chart--ink', canonical: 'palette/palette--silverpoint--line-chart--ink.canonical.txt' });
  });

  test('REQ-468 · a UI target is the demo fixture with the preset as its palette prop', () => {
    const fixture = paletteMatrix().find((f) => f.id === 'palette--sanguine--card--precision')!;
    const ui = paletteUiFixture(fixture);
    expect(ui).toMatchObject({ component: 'card', state: 'titled', ground: 'silverpoint', substrate: 'cream', mode: 'precision', palette: 'sanguine' });
    expect(uiFixtureParts(ui).props.palette).toBe(PALETTES.sanguine);
    expect(paletteUiFixture(paletteMatrix().find((f) => f.target === 'table')!).state).toBe('plain');
  });

  test('REQ-468 · I-33 · a UI target differs from the plain fixture only in its root style, which is the preset\'s', () => {
    for (const fixture of paletteMatrix().filter((f) => f.target !== 'line-chart')) {
      const ui = paletteUiFixture(fixture);
      const { palette: _palette, ...plain } = ui;
      const toned = canonicalUiMarkup(ui);
      expect(styleOf(toned), fixture.id).toContain(paletteStyle(PALETTES[fixture.preset]));
      // The preset's declarations come first in the root's style (T-212); without them, an empty style is no style.
      const strip = (markup: string) => normalizeUi(markup).replace(paletteStyle(PALETTES[fixture.preset]), '').replace(/ style="(?:;)?"/, '').replace('style=";', 'style="');
      expect(strip(toned), fixture.id).toBe(strip(canonicalUiMarkup(plain)));
    }
  });

  test('REQ-461 · the LineChart target is the md chart fixture with the preset; the core writes it on the <svg>', () => {
    const fixture = paletteMatrix().find((f) => f.id === 'palette--indigo--line-chart--ink')!;
    const chart = paletteChartFixture(fixture);
    expect(chart).toMatchObject({ chart: 'LineChart', ground: 'silverpoint', substrate: 'cream', mode: 'ink', hatchFill: 'tile', size: { width: 320, height: 150 } });
    expect(chart.props.palette).toEqual(PALETTES.indigo);
    expect(paletteCanonicalFor(fixture)).toContain(JSON.stringify(paletteStyle(PALETTES.indigo)).slice(1, 30));
  });

  test('REQ-516 · the committed palette fixtures are the matrix, and every canonical render is current', () => {
    const committed = loadPaletteFixtures();
    expect(committed.map((f) => f.id)).toEqual(paletteMatrix().map((f) => f.id).sort());
    for (const fixture of committed) expect(readFileSync(`${FIXTURES_DIR}/${fixture.canonical}`, 'utf8'), fixture.id).toBe(paletteCanonicalFor(fixture));
  });
});
