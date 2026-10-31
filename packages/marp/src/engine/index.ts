import { resolveGround } from '@silverpoint/grounds';
import { themeSource } from '../theme/source';
import type { FenceEnv } from '../fence/rule';
import type { ChartSlot, DeckDiagnostic, DeckEngine, DeckEngineOptions, DeckMode, DeckRender, SlideRender } from '../types';
import type { AnnotateEnv } from './annotate';
import { DECK_LIMITS, raiseLimit, withinBytes } from './limits';
import { createMarpitEngine, SLIDE_BOX } from './marpit';

const SIZES = { '16:9': { width: 1280, height: 720 }, '4:3': { width: 960, height: 720 } } as const;
/** The slide's content box, 80 px inside each side edge: a fence's default width (Analyze A-07). */
/** The slide padding either side of a fence chart: its default width is the slide width less twice this. */
export const CONTENT_INSET = 80;

/** `[a-z0-9-]`, no leading/trailing or doubled dashes (REQ-571). Throws when nothing is left. */
export function sanitiseDeckId(id: string): string {
  const clean = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (clean === '') throw new Error(`silverpoint: the deck id ${JSON.stringify(id)} has no [a-z0-9] character.`);
  return clean;
}

/** A render's state, carried on markdown-it's `env`: the annotation's and the fences' (DD-053, DD-054). */
export function createDeckEnv(deck: {
  readonly id: string;
  readonly size: { readonly width: number; readonly height: number };
  readonly defaults: AnnotateEnv['defaults'];
  readonly palette?: DeckEngineOptions['palette'];
}): { readonly sp: AnnotateEnv; readonly spFence: FenceEnv } {
  return {
    sp: { defaults: deck.defaults, slides: [], diagnostics: [] as DeckDiagnostic[], deck: { id: deck.id, ...deck.size } },
    spFence: { deckId: deck.id, contentWidth: deck.size.width - 2 * CONTENT_INSET, slots: [] as ChartSlot[], ...(deck.palette === undefined ? {} : { palette: deck.palette }) },
  };
}

/** One deck's engine: one Marpit instance, its CSS scoped to `div.sp-deck-<id>` (REQ-571). */
export function createDeckEngine(options: DeckEngineOptions): DeckEngine {
  const id = sanitiseDeckId(options.id);
  const size = options.size ?? '16:9';
  const ground = resolveGround(options.ground ?? 'silverpoint', 'SpDeck');
  const substrate = options.substrate ?? Object.keys(ground.substrates)[0]!;
  const mode: DeckMode = options.mode ?? 'ink';
  const markdownEngine = createMarpitEngine({ scope: `sp-deck-${id}`, theme: themeSource(SIZES[size]) });

  return {
    render(markdown: string): DeckRender {
      const { sp, spFence } = createDeckEnv({ id, size: SIZES[size], defaults: { ground: ground.name, substrate, mode }, ...(options.palette === undefined ? {} : { palette: options.palette }) });
      const bounded = withinBytes(markdown);
      if (bounded.cut) raiseLimit(sp.diagnostics, 'bytes');
      const out = markdownEngine.render(bounded.markdown, { sp, spFence });
      // REQ-576: past 300 slides, the first 300 (the annotation already counted them so).
      if (out.html.length > DECK_LIMITS.slides) raiseLimit(sp.diagnostics, 'slides');
      const slides: SlideRender[] = out.html.slice(0, DECK_LIMITS.slides).map((html, i) => {
        const token = out.slideTokens[i]!;
        const fragments = Number(token.attrGet('data-marpit-fragments') ?? 0);
        const classes = String(token.meta?.marpitDirectives?.['class'] ?? '').split(/\s+/).filter(Boolean);
        const resolved: AnnotateEnv['slides'][number] = sp.slides[i] ?? sp.defaults;
        return {
          index: i + 1,
          html: `<div class="${SLIDE_BOX}">${html}</div>`,
          notes: (out.comments[i] ?? []).map((c) => c.trim()),
          fragments,
          ground: resolved.ground,
          substrate: resolved.substrate,
          mode: resolved.mode,
          classes,
          ...(resolved.heading === undefined ? {} : { heading: resolved.heading }),
        };
      });
      return { id, total: slides.length, size: SIZES[size], css: out.css, slides, slots: spFence.slots, diagnostics: sp.diagnostics };
    },
  };
}
