/**
 * Compiled by `palette.test.ts`, never run. Every `@ts-expect-error` must be consumed: an unused
 * one is itself an error, so widening the preset names back to `string` turns the test red (#20).
 */
import { PALETTE_NAMES, PALETTES, type Palette, type PaletteName } from '../../src/palettes';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export const names: Equal<PaletteName, 'silverpoint' | 'sanguine' | 'sepia' | 'ironGall' | 'verdigris' | 'indigo'> = true;
export const keys: Equal<keyof typeof PALETTES, PaletteName> = true;
export const listed: Equal<(typeof PALETTE_NAMES)[number], PaletteName> = true;

/** A preset read by its name is a palette, with no `undefined` to rule out. */
export const preset: Palette = PALETTES.sanguine;
export const picked: Palette[] = PALETTE_NAMES.map((name) => PALETTES[name]);

// @ts-expect-error — not a preset.
export const unknown = PALETTES.crimson;
// @ts-expect-error — a picker typed with the names takes no other string.
export const picker: PaletteName = 'crimson';
