import type { InkOptions, TonalRamp } from './ink';

type ToneStep = 1 | 2 | 3 | 4;

/**
 * The interface components' tokens of a ground (Data Model §3.8, REQ-312). Optional: a ground
 * without them takes the defaults, so grounds registered before `0.3.0` keep working.
 */
export interface UiTokens {
  /** `inked`: build-time pieces laid as masks (DD-022). `css`: an exact border. */
  readonly frame: 'inked' | 'css';
  /** Frame variants generated per kind, 1..6. */
  readonly frameVariants: number;
  /** Control heights in px per size, each ≥ 24 (REQ-317). */
  readonly controlHeight: Readonly<{ sm: number; md: number; lg: number }>;
  /** Corner radius of the exact frame (`precision`, `css`), px. */
  readonly radius: number;
  /** Focus indicator width, px, ≥ 2 (REQ-316). */
  readonly focusWidth: number;
  /** Tonal level per state (DD-026); `alertError` fills an error Alert's box (C-3). */
  readonly tone: Readonly<{ selected: ToneStep; primary: ToneStep; danger: ToneStep; disabled: ToneStep; alertError: ToneStep }>;
}

/** Name of a registered ground. */
export type GroundName = 'silverpoint' | (string & {});

/** Declarative token set of a style ground (API Spec §6, Art. 7). */
export interface Ground {
  readonly name: string;
  /** How it builds tonal value. `wash` is the anticipated exception to Art. 6. */
  readonly tonalMechanism: 'hatch' | 'weight' | 'wash';
  /** Name of the registered Inker that inks it. */
  readonly inker: string;

  readonly substrates: Readonly<Record<string, string>>;
  readonly ink: Readonly<{
    primary: string;
    secondary: string;
    heighten: string;
    rule: string;
    grid: string;
    text: string;
    textMuted: string;
  }>;

  readonly inkOptions: Omit<InkOptions, 'seed' | 'nodeBudget' | 'hatchFill' | 'tonalRamp' | 'scope'>;
  /** Hatch density bound, to stay within the node budget. */
  readonly maxHatchDensity: number;
  /** Tonal levels 1-4 (Data Model §3.4). */
  readonly tonalRamp: TonalRamp;

  readonly typography: Readonly<{ display: string; scale: number }>;
  /** What to draw when there is no data (REQ-007). */
  readonly emptyState: Readonly<{ text: string; rule: boolean }>;
  /** Expansion of degenerate domains (REQ-010). */
  readonly domainPadding: number;
  /** Interface components' tokens (Data Model §3.8); defaults when absent. */
  readonly ui?: UiTokens;
}

/** Name of a registered ground, or a complete ground. */
export type GroundRef = GroundName | Ground;
