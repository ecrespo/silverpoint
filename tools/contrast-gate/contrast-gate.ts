/**
 * Contrast gate (REQ-126, REQ-127, Data Model I-7): computes the WCAG 2.1 ratio of every ink
 * of every registered ground against every one of its substrates, and fails with SP012 when
 * one misses its threshold. The palette is computed, never chosen by eye.
 *
 * Usage: pnpm exec tsx tools/contrast-gate/contrast-gate.ts
 */
import type { Ground } from '@silverpoint/core';
import { cyanotype, silverpoint } from '../../packages/grounds/src';

type InkToken = keyof Ground['ink'];

/** Minimum ratio per token: 4.5:1 for text, 3:1 for graphical objects (REQ-126). */
const THRESHOLDS: Readonly<Record<Exclude<InkToken, 'heighten'>, number>> = {
  text: 4.5,
  textMuted: 4.5,
  primary: 4.5,
  secondary: 4.5,
  rule: 3,
  grid: 3,
};

export interface AuditRow {
  readonly ground: string;
  /** An ink token, or a UI pair of Data Model §3.8 (`ui.…`). */
  readonly token: InkToken | `ui.${string}`;
  /** Worst ratio rounded to 2 decimals, as Data Model §3.2 reports it; `pass` uses the exact value. */
  readonly min: number;
  /** Substrate (or outline) on which the worst ratio falls. */
  readonly worst: string;
  readonly threshold: number;
  readonly pass: boolean;
  readonly against: 'substrate' | 'ink outline' | 'heightening';
}

function channels(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) throw new Error(`Not a #RRGGBB colour: ${hex}`);
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio between two colours, order-independent. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** Mixes a colour toward white by `amount` (0-1) in sRGB. Used to prove the gate bites. */
export function lighten(hex: string, amount: number): string {
  const mixed = channels(hex).map((channel) => Math.round(channel + (255 - channel) * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Audits one ground: one row per ink token, with its worst case across the substrates. */
export function auditGround(ground: Ground): AuditRow[] {
  const rows: AuditRow[] = [];
  for (const [token, threshold] of Object.entries(THRESHOLDS) as [Exclude<InkToken, 'heighten'>, number][]) {
    let worst = { ratio: Number.POSITIVE_INFINITY, substrate: '' };
    for (const [substrate, colour] of Object.entries(ground.substrates)) {
      const ratio = contrastRatio(ground.ink[token], colour);
      if (ratio < worst.ratio) worst = { ratio, substrate };
    }
    rows.push({
      ground: ground.name,
      token,
      min: round2(worst.ratio),
      worst: worst.substrate,
      threshold,
      pass: worst.ratio >= threshold,
      against: 'substrate',
    });
  }
  // White heightening never reaches 3:1 on a light substrate; its boundary is the ink
  // outline every heightened element carries (REQ-031, Data Model §3.3).
  const outline = contrastRatio(ground.ink.heighten, ground.ink.primary);
  rows.push({
    ground: ground.name,
    token: 'heighten',
    min: round2(outline),
    worst: 'primary',
    threshold: 3,
    pass: outline >= 3,
    against: 'ink outline',
  });
  return rows;
}

/** A colour pair a UI component relies on: a foreground against the substrates, or against one ink. */
export interface UiContrastPair {
  readonly name: `ui.${string}`;
  readonly fg: (ground: Ground) => string;
  /** Omitted: every substrate of the ground, the worst reported. */
  readonly bg?: { readonly label: 'ink outline' | 'heightening'; readonly colour: (ground: Ground) => string };
  /** 4.5 for text, 3 for a graphical object needed to identify a control or its state. */
  readonly threshold: number;
}

/**
 * The UI contrast pairs of Data Model §3.8, the normative list REQ-313 cites. Text over a tone
 * stands on a plate of the substrate (ui.css `.sp-ui-plate`), so it is measured against the
 * substrate; the tone itself is a graphical object (the hatch line, or the weighted line).
 */
export const UI_CONTRAST_PAIRS: readonly UiContrastPair[] = [
  { name: 'ui.text', fg: (g) => g.ink.text, threshold: 4.5 },
  { name: 'ui.frame', fg: (g) => g.ink.primary, threshold: 3 },
  { name: 'ui.mark', fg: (g) => g.ink.primary, threshold: 3 },
  { name: 'ui.focus', fg: (g) => g.ink.primary, threshold: 3 },
  { name: 'ui.precision-frame', fg: (g) => g.ink.rule, threshold: 3 },
  { name: 'ui.tone', fg: (g) => (g.tonalMechanism === 'weight' ? g.ink.primary : g.ink.secondary), threshold: 3 },
  { name: 'ui.tone-text', fg: (g) => g.ink.text, threshold: 4.5 },
  { name: 'ui.alert-error-text', fg: (g) => g.ink.text, threshold: 4.5 },
  { name: 'ui.heighten-outline', fg: (g) => g.ink.primary, bg: { label: 'heightening', colour: (g) => g.ink.heighten }, threshold: 3 },
  { name: 'ui.heighten-text', fg: (g) => g.ink.text, bg: { label: 'heightening', colour: (g) => g.ink.heighten }, threshold: 4.5 },
  // WCAG 1.4.3 exempts disabled text; silverpoint still keeps it legible (Data Model §3.8).
  { name: 'ui.disabled-text', fg: (g) => g.ink.textMuted, threshold: 3 },
];

/** Audits one ground's UI pairs: one row per pair, with its worst case. */
export function auditUi(ground: Ground): AuditRow[] {
  return UI_CONTRAST_PAIRS.map((pair) => {
    const backgrounds: [string, string][] = pair.bg ? [[pair.bg.label, pair.bg.colour(ground)]] : Object.entries(ground.substrates);
    let worst = { ratio: Number.POSITIVE_INFINITY, on: '' };
    for (const [on, colour] of backgrounds) {
      const ratio = contrastRatio(pair.fg(ground), colour);
      if (ratio < worst.ratio) worst = { ratio, on };
    }
    return {
      ground: ground.name,
      token: pair.name,
      min: round2(worst.ratio),
      worst: worst.on,
      threshold: pair.threshold,
      pass: worst.ratio >= pair.threshold,
      against: pair.bg ? pair.bg.label : 'substrate',
    };
  });
}

/** Audits every ground `@silverpoint/grounds` registers by default, charts and UI (REQ-127, REQ-313). */
export function auditBuiltins(): AuditRow[] {
  return [silverpoint, cyanotype].flatMap((ground) => [...auditGround(ground), ...auditUi(ground)]);
}

function main(): void {
  const rows = auditBuiltins();
  for (const row of rows) {
    const status = row.pass ? 'ok   ' : 'error';
    console.log(`${status} ${row.ground}.${row.token.padEnd(22)} ${row.min.toFixed(2)} ≥ ${row.threshold} (worst: ${row.worst}, vs ${row.against})`);
  }
  const failing = rows.filter((row) => !row.pass);
  if (failing.length > 0) {
    for (const row of failing) {
      console.error(`[SP012] ${row.ground}: the ground does not reach the minimum contrast (\`${row.token}\`). ${row.min} < ${row.threshold}. (REQ-127)`);
    }
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('contrast-gate.ts')) main();
