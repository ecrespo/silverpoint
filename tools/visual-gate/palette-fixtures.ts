/**
 * The palette fixtures (T-217, Data Model §5, DD-043): each of the six presets on a `LineChart`, an
 * `SpCard` and an `SpTable`, in both modes, on silverpoint/cream — 36, every one on every PR. Each
 * target is an ordinary fixture with the preset added: the chart's `md` cell, the card's `titled`
 * state, the table's `plain` one. Their canonical renders are the core's, as every other fixture's.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate palette-canonical   (writes fixtures/palette)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PALETTE_NAMES, PALETTES } from '@silverpoint/core/palettes';
import { canonicalFor, FIXTURES_DIR, loadFixtures, type Fixture } from './fixtures';
import { canonicalUiFor } from './ui-canonical';
import { uiMatrix, type UiFixture } from './ui-matrix';

export type PaletteTarget = 'line-chart' | 'card' | 'table';

export interface PaletteFixture {
  /** `palette--<preset>--<target>--<mode>`: its files' name. */
  readonly id: string;
  readonly preset: string;
  readonly target: PaletteTarget;
  readonly mode: 'ink' | 'precision';
  readonly req: 'REQ-468';
  /** Every palette fixture is compared on every PR (Data Model §5). */
  readonly scope: 'pr';
  readonly canonical: string;
}

const TARGETS: readonly PaletteTarget[] = ['line-chart', 'card', 'table'];
/** The state each UI target draws. */
const UI_STATES: Readonly<Record<Exclude<PaletteTarget, 'line-chart'>, string>> = { card: 'titled', table: 'plain' };

export function paletteMatrix(): PaletteFixture[] {
  return PALETTE_NAMES.flatMap((preset) =>
    TARGETS.flatMap((target) =>
      (['ink', 'precision'] as const).map((mode) => {
        const id = `palette--${preset}--${target}--${mode}`;
        return { id, preset, target, mode, req: 'REQ-468' as const, scope: 'pr' as const, canonical: `palette/${id}.canonical.txt` };
      }),
    ),
  );
}

/** A UI target: the component fixture on silverpoint/cream, with the preset as its `palette`. */
export function paletteUiFixture(fixture: PaletteFixture): UiFixture {
  if (fixture.target === 'line-chart') throw new Error(`${fixture.id} is a chart`);
  const id = `${fixture.target}--${UI_STATES[fixture.target]}--silverpoint--cream--${fixture.mode}`;
  const base = uiMatrix().find((f) => f.id === id);
  if (!base) throw new Error(`No UI fixture ${id}`);
  return { ...base, palette: fixture.preset };
}

/** The chart target: the committed `md` LineChart cell on silverpoint/cream, with the preset in its props. */
export function paletteChartFixture(fixture: PaletteFixture): Fixture {
  if (fixture.target !== 'line-chart') throw new Error(`${fixture.id} is not a chart`);
  const id = `line-chart--silverpoint--cream--${fixture.mode}--md`;
  const base = loadFixtures('pr').find((f) => f.id === id);
  if (!base) throw new Error(`No chart fixture ${id}`);
  return { ...base, id: fixture.id, props: { ...base.props, palette: PALETTES[fixture.preset] }, canonical: fixture.canonical };
}

/** The canonical render, in the committed form of its kind: a normalised SVG or a normalised UI tree. */
export const paletteCanonicalFor = (fixture: PaletteFixture): string =>
  fixture.target === 'line-chart' ? canonicalFor(paletteChartFixture(fixture)) : canonicalUiFor(paletteUiFixture(fixture));

/** The committed palette fixtures, sorted by id. */
export function loadPaletteFixtures(): PaletteFixture[] {
  const dir = join(FIXTURES_DIR, 'palette');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.palette.json'))
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')) as PaletteFixture)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

if (process.argv[1]?.endsWith('palette-fixtures.ts')) {
  const dir = join(FIXTURES_DIR, 'palette');
  mkdirSync(dir, { recursive: true });
  const matrix = paletteMatrix();
  for (const fixture of matrix) {
    writeFileSync(join(dir, `${fixture.id}.palette.json`), `${JSON.stringify(fixture, null, 2)}\n`);
    writeFileSync(join(FIXTURES_DIR, fixture.canonical), paletteCanonicalFor(fixture));
  }
  console.log(`palette-fixtures · wrote ${matrix.length} fixtures`);
}
