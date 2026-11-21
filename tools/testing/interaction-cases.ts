/**
 * The interaction every client chart shares (REQ-122, REQ-141..REQ-143, API §9), as one table the
 * three adapters and the embed client are tested against (feature-007 tdd-plan F-06, DD-064): a
 * bare LineChart at a fixed size, and what pointer, keyboard and selection must produce.
 */
export const INTERACTION_CHART = { id: 'sp-interactive', width: 320, height: 160, chrome: 'bare' } as const;

export const INTERACTION_CASES = {
  /** Hovering the heightened live point (the primary series' last value). */
  hover: { active: { seriesKey: 'hits', index: 11, value: 41 }, readout: '22hits: 41' },
  /** Focusing the root activates the first item and announces it politely. */
  focus: { live: 'hour 00, hits 18' },
  /** Enter selects the active item. */
  select: { item: { index: 0 } },
} as const;

/** Coordinates of the heightened live point in an SVG: its path's first move, nudged onto the mark. */
export function livePoint(scope: ParentNode): { x: number; y: number } {
  const d = scope.querySelector('[part="sp-heighten"]')?.getAttribute('d') ?? '';
  const [mx, my] = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  return { x: (mx ?? 0) + 3.5, y: my ?? 0 };
}
