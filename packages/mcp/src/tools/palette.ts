/**
 * `check_palette` (API delta §3, REQ-545): the core's `checkPalette` findings (REQ-465) for a
 * preset or a palette of fields, over a substrate given as a hex or by name.
 */
import { checkPalette, PALETTES, type PaletteFinding } from '@silverpoint/core/palettes';
import type { Palette } from '@silverpoint/core';
import { cyanotype, silverpoint } from '@silverpoint/grounds';
import type { Catalog } from '../catalog';
import { unknownName } from '../errors';
import { checkPayload } from '../limits';

export interface PaletteInput {
  readonly palette: string | Readonly<Record<string, string>>;
  /** A hex, or a substrate of a built-in ground (`cream`, `prussian`…). */
  readonly substrate?: string;
}

/** What `checkPalette` measures a palette without a substrate on: silverpoint's cream. */
const CREAM = silverpoint.substrates.cream!;
const SUBSTRATES: Readonly<Record<string, string>> = { ...silverpoint.substrates, ...cyanotype.substrates };
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function checkPaletteTool(catalog: Catalog, input: PaletteInput): { findings: readonly PaletteFinding[]; substrate: string } {
  checkPayload(input);
  let palette: Palette;
  if (typeof input.palette === 'string') palette = PALETTES[catalog.palette(input.palette)]!;
  else {
    const fields = catalog.data.palettes.fields.map((f) => f.name);
    for (const key of Object.keys(input.palette)) if (!fields.includes(key)) throw unknownName('palette field', key, fields);
    palette = input.palette as Palette;
  }
  let substrate: string | undefined;
  if (input.substrate !== undefined) {
    substrate = HEX.test(input.substrate) ? input.substrate : SUBSTRATES[input.substrate];
    if (substrate === undefined) throw unknownName('substrate', input.substrate, Object.keys(SUBSTRATES));
  }
  return { findings: checkPalette(palette, substrate), substrate: palette.substrate ?? substrate ?? CREAM };
}
