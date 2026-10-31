/**
 * The deck's local directives `ground`, `substrate` and `mode` (REQ-584..586, DD-054). Marpit stores
 * them raw, with its own inheritance and `_` spot form; `resolveSlide` validates them per slide.
 */
import { diagnose, type Ground } from '@silverpoint/core';
import { listGrounds } from '@silverpoint/grounds';
import type { DeckDiagnostic, DeckMode } from '../types';
import { didYouMean } from '../util/closest';

export const MODES: readonly DeckMode[] = ['ink', 'precision'];

/** The directives as data, for the agent catalog and the docs (Data Model §2.34). */
export const DECK_DIRECTIVES = [
  { name: 'ground', values: listGrounds().map((g) => g.name), default: 'silverpoint', attribute: 'data-sp-ground' },
  { name: 'substrate', values: 'per-ground', default: Object.keys(listGrounds()[0]!.substrates)[0]!, attribute: 'data-sp-substrate' },
  { name: 'mode', values: MODES, default: 'ink', attribute: 'data-sp-mode' },
] as const satisfies readonly {
  readonly name: 'ground' | 'substrate' | 'mode';
  readonly values: readonly string[] | 'per-ground';
  readonly default: string;
  readonly attribute: string;
}[];

export interface Resolved {
  readonly ground: string;
  readonly substrate: string;
  readonly mode: DeckMode;
}

/** Registers the three as Marpit local directives that store their raw value. */
export function registerDirectives(marpit: { customDirectives: { local: Record<string, (value: string) => Record<string, string>> } }): void {
  for (const name of ['ground', 'substrate', 'mode']) marpit.customDirectives.local[name] = (value) => ({ [name]: value });
}

/**
 * Resolves one slide's directives (REQ-584..586, Art. 7). Marpit has already merged inheritance
 * and the spot form into `raw`, so a directive absent from `raw` takes the deck default. An unknown
 * value keeps the inherited one: the value the previous slide resolved for that directive, when the
 * previous slide carried one (`carried`), else the default. (A spot value followed by an unknown
 * local one therefore carries the spot value: Marpit does not tell the two apart.) Each distinct
 * unknown value is reported once, on the first slide it reaches.
 */
export function resolveSlide(
  raw: Readonly<Record<string, unknown>>,
  defaults: Resolved,
  carried: Partial<Resolved>,
  slide: number,
  reported: Set<string>,
  diagnostics: DeckDiagnostic[],
): Resolved {
  const grounds = listGrounds();
  const report = (name: string, value: string, candidates: readonly string[], why: string) => {
    const key = `${name}=${value}`;
    if (reported.has(key)) return;
    reported.add(key);
    const message = `Slide ${slide}: ${name} "${value}" ${why}; the inherited value holds.${didYouMean(value, candidates)}`;
    diagnostics.push({ code: 'SP027', severity: 'warn', message, slide });
    diagnose('SP027', 'SpDeck', { property: name, message });
  };

  const byName = (name: string | undefined) => grounds.find((g) => g.name === name);
  let ground: Ground = byName(defaults.ground) ?? grounds[0]!;
  if (typeof raw['ground'] === 'string') {
    const found = byName(raw['ground']);
    if (found) ground = found;
    else {
      ground = byName(carried.ground) ?? ground;
      report('ground', raw['ground'], grounds.map((g) => g.name), 'is not a registered ground');
    }
  }

  const allSubstrates = [...new Set(grounds.flatMap((g) => Object.keys(g.substrates)))];
  let substrate = defaults.substrate;
  if (typeof raw['substrate'] === 'string') {
    if (allSubstrates.includes(raw['substrate'])) substrate = raw['substrate'];
    else {
      substrate = carried.substrate ?? substrate;
      report('substrate', raw['substrate'], allSubstrates, 'is not a substrate of any registered ground');
    }
  }
  // Data Model §2.34: a substrate the slide's ground lacks falls back to the ground's first, silently.
  if (!(substrate in ground.substrates)) substrate = Object.keys(ground.substrates)[0]!;

  let mode = defaults.mode;
  if (typeof raw['mode'] === 'string') {
    if ((MODES as readonly string[]).includes(raw['mode'])) mode = raw['mode'] as DeckMode;
    else {
      mode = carried.mode ?? mode;
      report('mode', raw['mode'], MODES, 'is not a mode');
    }
  }
  return { ground: ground.name, substrate, mode };
}
