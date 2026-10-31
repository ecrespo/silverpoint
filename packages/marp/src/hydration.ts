/**
 * What each adapter mounts in a deck's chart slots (REQ-593, DD-053): the slot, the chart's slug —the
 * key of the adapter's generated `CHART_LOADERS`— and its props, from the same function the static
 * render used, so the framework chart draws the tree the slide already carries (Art. 3).
 */
import type { Palette } from '@silverpoint/core/palettes';
import { CONTENT_INSET } from './engine';
import { fenceChartProps } from './fence/render';
import type { DeckRender } from './types';

export interface HydrationEntry {
  readonly slotId: string;
  /** The catalog slug: the key of the adapter's `CHART_LOADERS`. */
  readonly chart: string;
  readonly props: Readonly<Record<string, unknown>> & { readonly id: string; readonly width: number };
}

/** One entry per slot with a spec, in document order; `palette` is the deck's, as given to the engine. */
export function hydrationPlan(render: DeckRender, palette?: string | Palette): HydrationEntry[] {
  const width = render.size.width - 2 * CONTENT_INSET;
  const plan: HydrationEntry[] = [];
  for (const slot of render.slots) {
    const slide = render.slides[slot.slide - 1];
    if (!slot.spec || !slide) continue;
    const props = fenceChartProps(slot.spec, {
      chartId: slot.chartId,
      width,
      ground: slide.ground,
      substrate: slide.substrate,
      mode: slide.mode,
      ...(palette === undefined ? {} : { palette }),
    });
    plan.push({ slotId: slot.slotId, chart: slot.spec.chart, props });
  }
  return plan;
}
