/**
 * The fence core rule, pushed after `sp_annotate` (DD-053, DD-054): each ```` ```silverpoint ````
 * fence token becomes an `html_block` holding its slot, recorded in `DeckRender.slots`. A bad fence
 * becomes an error figure and an `SP026`; nothing throws, and every other fence renders (REQ-591).
 */
import { diagnose } from '@silverpoint/core';
import type { Palette } from '@silverpoint/core/palettes';
import type { AnnotateEnv } from '../engine/annotate';
import { isContentSection } from '../engine/annotate';
import type { ChartFenceSpec, ChartSlot, FenceError } from '../types';
import { parseChartFence } from './parse';
import { errorMarkup, fenceErrorMessage, renderFenceChart, slotMarkup } from './render';

interface Token {
  type: string;
  info: string;
  content: string;
  readonly meta?: { readonly marpitSlide?: number } | null;
  attrGet(name: string): string | number | null;
}

/** What the fence rule needs, carried on markdown-it's `env` next to the annotation's. */
export interface FenceEnv {
  readonly deckId: string;
  readonly contentWidth: number;
  readonly palette?: string | Palette;
  readonly slots: ChartSlot[];
}

const chartOf = (body: string): string | undefined => {
  try {
    const value = JSON.parse(body) as { chart?: unknown };
    return typeof value.chart === 'string' ? value.chart : undefined;
  } catch {
    return undefined;
  }
};

export function renderFences(state: { tokens: Token[]; env: { sp?: AnnotateEnv; spFence?: FenceEnv } }): void {
  const { sp, spFence: env } = state.env;
  if (!sp || !env) return;
  const used = new Map<string, number>();   // chart id → the slide that took it (I-47)
  let slide = 0;
  let ordinal = 0;

  for (const token of state.tokens) {
    if (isContentSection(token)) {
      slide = (token.meta?.marpitSlide ?? slide) + 1;
      ordinal = 0;
      continue;
    }
    if (token.type !== 'fence' || token.info.trim() !== 'silverpoint') continue;
    ordinal += 1;
    const slotId = `s${slide}-c${ordinal}`;
    const resolved = sp.slides[slide - 1] ?? sp.defaults;
    const parsed = parseChartFence(token.content);
    const chartId = parsed.spec?.id ?? `${env.deckId}-${slotId}`;
    let spec: ChartFenceSpec | undefined = parsed.spec;
    let error: FenceError | undefined = parsed.error;
    let html = '';

    if (spec && used.has(chartId)) {
      error = { kind: 'shape', message: `\`id\` "${chartId}" is already used on slide ${used.get(chartId)}; chart ids are unique in a deck.` };
      spec = undefined;
    }
    if (spec) {
      const out = renderFenceChart(spec, { chartId, width: env.contentWidth, ...resolved, ...(env.palette === undefined ? {} : { palette: env.palette }) });
      if ('error' in out) {
        error = out.error;
        spec = undefined;
      } else {
        html = slotMarkup(slotId, spec, out.html);
        used.set(chartId, slide);
      }
    }
    if (error) {
      const message = `Chart fence on slide ${slide}: ${fenceErrorMessage(error, chartOf(token.content))}`;
      html = errorMarkup(slotId, message);
      diagnose('SP026', 'SpDeck', { property: 'chart', message });
      sp.diagnostics.push({ code: 'SP026', severity: 'warn', message, slide, slot: slotId });
    }
    env.slots.push({ slotId, slide, ordinal, chartId, ...(spec ? { spec } : { error: error! }) });
    token.type = 'html_block';
    token.info = '';
    token.content = html;
  }
}
