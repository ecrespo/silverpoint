import type { InkOptions, TonalRamp } from './ink';

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
}

/** Name of a registered ground, or a complete ground. */
export type GroundRef = GroundName | Ground;
