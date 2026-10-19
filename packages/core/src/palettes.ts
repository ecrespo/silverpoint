/**
 * The palette presets (REQ-463, Data Model §2.26): named after historical drawing media, each
 * passing every pair of Data Model §3.9 (REQ-464, verified by the contrast gate). A subpath of its
 * own, with the palette API (resolution, declarations, contrast), so the main entry stays inside its
 * 45 kB budget (REQ-164) and an application ships only the presets it imports.
 */
import type { Palette } from './palette/palette';

export { nestProvider, PALETTE_PROPERTIES, paletteStyle, resolvePalette } from './palette/palette';
export { checkPalette, contrastRatio, PALETTE_PAIRS, type PaletteFinding } from './palette/contrast';

const preset = (palette: Required<Omit<Palette, 'focus'>>): Palette => Object.freeze({ ...palette });

/** The silverpoint ground's own inks on cream: what a chart draws with no palette. */
export const silverpoint = /* @__PURE__ */ preset({
  substrate: '#EDE7DA',
  ink: '#5A5E65',
  inkSecondary: '#685C4D',
  heighten: '#FFFFFF',
  rule: '#737A82',
  grid: '#737A82',
  text: '#3F4348',
  textMuted: '#5A5E65',
});

/** Red chalk, as in Leonardo's and Andrea del Sarto's studies. */
export const sanguine = /* @__PURE__ */ preset({
  substrate: '#F2E8DC',
  ink: '#8A3A24',
  inkSecondary: '#6A4A3A',
  heighten: '#FFFFFF',
  rule: '#9A6450',
  grid: '#9A6450',
  text: '#4A2216',
  textMuted: '#7A3E2C',
});

/** Sepia wash and bistre. */
export const sepia = /* @__PURE__ */ preset({
  substrate: '#F0E6D2',
  ink: '#6B4C2C',
  inkSecondary: '#5A5148',
  heighten: '#FFFFFF',
  rule: '#8A6E52',
  grid: '#8A6E52',
  text: '#3B2A18',
  textMuted: '#6B4C2C',
});

/** Iron-gall ink: the blue-black of manuscripts. */
export const ironGall = /* @__PURE__ */ preset({
  substrate: '#EEEAE0',
  ink: '#3C4858',
  inkSecondary: '#6A4E36',
  heighten: '#FFFFFF',
  rule: '#6C7584',
  grid: '#6C7584',
  text: '#232B36',
  textMuted: '#4A5566',
});

/** Verdigris, the copper green of illuminators. */
export const verdigris = /* @__PURE__ */ preset({
  substrate: '#E7EDE6',
  ink: '#2C6355',
  inkSecondary: '#65563F',
  heighten: '#FFFFFF',
  rule: '#5C7B71',
  grid: '#5C7B71',
  text: '#1F3D36',
  textMuted: '#3E6A5E',
});

/** Indigo, the dyers' and printers' blue. */
export const indigo = /* @__PURE__ */ preset({
  substrate: '#E9EAF1',
  ink: '#3A4884',
  inkSecondary: '#675641',
  heighten: '#FFFFFF',
  rule: '#68709A',
  grid: '#68709A',
  text: '#232C52',
  textMuted: '#4A5590',
});

/** The six presets by name. */
export const PALETTES: Readonly<Record<string, Palette>> = /* @__PURE__ */ Object.freeze({
  silverpoint,
  sanguine,
  sepia,
  ironGall,
  verdigris,
  indigo,
});

/** Written out, not `Object.keys(PALETTES)`: a call the bundler cannot drop would keep every preset. */
export const PALETTE_NAMES: readonly string[] = /* @__PURE__ */ Object.freeze(['silverpoint', 'sanguine', 'sepia', 'ironGall', 'verdigris', 'indigo']);

export type { Palette } from './palette/palette';
