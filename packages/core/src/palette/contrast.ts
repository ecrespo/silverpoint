import { round2 } from '../render/round';
import type { Palette } from './palette';

/** One pair of a palette below its threshold (REQ-465). */
export interface PaletteFinding {
  /** The pair's name in Data Model §3.9. */
  readonly pair: string;
  readonly foreground: string;
  readonly background: string;
  /** 2 decimals. */
  readonly ratio: number;
  readonly threshold: number;
}

interface Pair {
  readonly pair: string;
  readonly threshold: number;
  readonly foreground: (p: Palette) => string | undefined;
  /** `undefined` measures against the substrate. */
  readonly background?: (p: Palette) => string | undefined;
}

/** The pairs `checkPalette` and the contrast gate measure (Data Model §3.9), in that order. */
export const PALETTE_PAIRS: readonly Pair[] = /* @__PURE__ */ Object.freeze([
  { pair: 'ink', threshold: 4.5, foreground: (p) => p.ink },
  { pair: 'ink-secondary', threshold: 4.5, foreground: (p) => p.inkSecondary },
  { pair: 'text', threshold: 4.5, foreground: (p) => p.text },
  { pair: 'text-muted', threshold: 4.5, foreground: (p) => p.textMuted },
  { pair: 'rule', threshold: 3, foreground: (p) => p.rule },
  { pair: 'grid', threshold: 3, foreground: (p) => p.grid },
  { pair: 'focus', threshold: 3, foreground: (p) => p.focus ?? p.ink },
  { pair: 'heighten-outline', threshold: 3, foreground: (p) => p.ink, background: (p) => p.heighten },
  { pair: 'heighten-text', threshold: 4.5, foreground: (p) => p.text, background: (p) => p.heighten },
]);

/** The cream substrate of the silverpoint ground: what a palette without one is measured on. */
const CREAM = '#EDE7DA';

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function luminance(hex: string): number {
  let value = hex.slice(1);
  if (value.length === 3) value = [...value].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio of two hex colours (`#rgb` or `#rrggbb`), from 1 to 21. */
export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * Every pair of Data Model §3.9 whose two colours are hex and whose ratio is below its threshold.
 * The substrate is the palette's, else `substrate`, else cream (REQ-465).
 */
export function checkPalette(palette: Palette, substrate?: string): readonly PaletteFinding[] {
  const ground = palette.substrate ?? substrate ?? CREAM;
  const findings: PaletteFinding[] = [];
  for (const { pair, threshold, foreground, background } of PALETTE_PAIRS) {
    const fg = foreground(palette);
    const bg = background ? background(palette) : ground;
    if (!fg || !bg || !HEX.test(fg) || !HEX.test(bg)) continue;
    const ratio = contrastRatio(fg, bg);
    if (ratio < threshold) findings.push({ pair, foreground: fg, background: bg, ratio: round2(ratio), threshold });
  }
  return findings;
}
