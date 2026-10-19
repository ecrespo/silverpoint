import { diagnose } from '../diagnostics/diagnose';
import { checkPalette } from './contrast';

/**
 * The colours of one ground's inks, for one element or one section (REQ-460, Data Model §2.26).
 * Every field is optional: an unset field keeps the ground's own. Values are any CSS colour;
 * `checkPalette` can only measure hex values.
 */
export interface Palette {
  /** The prepared ground the drawing sits on. */
  readonly substrate?: string;
  /** The main series and the frames of UI components. */
  readonly ink?: string;
  /** The second series and the hatch of tones. */
  readonly inkSecondary?: string;
  /** White heightening on the live value (always outlined with `ink`). */
  readonly heighten?: string;
  /** Rules and baselines. */
  readonly rule?: string;
  /** Grid lines. */
  readonly grid?: string;
  /** Large figures and primary labels. */
  readonly text?: string;
  /** Axis labels and secondary text. */
  readonly textMuted?: string;
  /** Focus ring of UI components; `ink` by default. */
  readonly focus?: string;
}

/** The fields, in the order of every emitted declaration (REQ-461). */
const FIELDS = ['substrate', 'ink', 'inkSecondary', 'heighten', 'rule', 'grid', 'text', 'textMuted', 'focus'] as const;

/** `inkSecondary` → `--sp-ink-secondary`; `focus` is the UI focus ring's own property. */
const property = (field: string): `--sp-${string}` =>
  field === 'focus' ? '--sp-ui-focus-color' : `--sp-${field.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;

/** Field → custom property, in the order of every emitted declaration (REQ-461). */
export const PALETTE_PROPERTIES: Readonly<Record<keyof Palette, `--sp-${string}`>> = /* @__PURE__ */ Object.freeze(
  Object.fromEntries(FIELDS.map((field) => [field, property(field)])) as Record<keyof Palette, `--sp-${string}`>,
);

/**
 * A CSS colour, by allowlist (REQ-467): a hex, a keyword, or a colour function (`var()` and
 * `color-mix()` included) over numbers, idents and `--custom` names. No quotes, escapes, `;`, `{`,
 * `<` or `:` can pass, and every function named must be a colour function, so a value can neither
 * end its declaration nor load a resource (`url()`, `image-set()`).
 */
const COLOUR_CHARS = /^[\w\s#%.,/()+-]+$/;
const COLOUR_FUNCTIONS = new Set(['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'color-mix', 'light-dark', 'var']);
const isColour = (value: string): boolean =>
  COLOUR_CHARS.test(value) && [...value.matchAll(/([\w-]*)\(/g)].every(([, name]) => COLOUR_FUNCTIONS.has(name!.toLowerCase()));

/**
 * The palettes of an element's layers merged field by field, a later layer winning: call it as
 * `resolvePalette(provider, cell, element)` (REQ-462). Unknown fields and unsafe values are dropped
 * with `SP024`; a weak hex pair is kept and warned `SP023` (REQ-466, REQ-467).
 */
export function resolvePalette(...layers: readonly (Palette | undefined)[]): Palette | undefined {
  const out: Record<string, string> = {};
  for (const layer of layers) {
    if (!layer) continue;
    for (const [field, value] of Object.entries(layer)) {
      const colour = typeof value === 'string' ? value.trim() : '';
      if (!(FIELDS as readonly string[]).includes(field) || !colour || !isColour(colour)) {
        // Dropped in every build; only the warning is development-only (REQ-467).
        if (process.env.NODE_ENV !== 'production') diagnose('SP024', 'Palette', { property: field, message: `${JSON.stringify(value)} is dropped.` });
        continue;
      }
      out[field] = colour;
    }
  }
  if (Object.keys(out).length === 0) return undefined;
  if (process.env.NODE_ENV !== 'production') {
    for (const finding of checkPalette(out)) {
      diagnose('SP023', 'Palette', {
        property: finding.pair,
        message: `${finding.foreground} on ${finding.background} is ${finding.ratio.toFixed(2)}:1, below ${finding.threshold}:1.`,
      });
    }
  }
  return out;
}

/** `--sp-ink:#8A3A24;--sp-text:#4A2216`: a palette's declarations, in PALETTE_PROPERTIES order; '' for none (REQ-461). */
export function paletteStyle(palette: Palette | undefined): string {
  if (!palette) return '';
  return FIELDS.filter((field) => typeof palette[field] === 'string' && isColour(palette[field].trim()))
    .map((field) => `${property(field)}:${palette[field]!.trim()}`)
    .join(';');
}
