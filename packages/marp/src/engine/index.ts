import { resolveGround } from '@silverpoint/grounds';
import { themeSource } from '../theme/source';
import type { DeckEngine, DeckEngineOptions, DeckMode, DeckRender, SlideRender } from '../types';
import { createMarpitEngine, SLIDE_BOX } from './marpit';

const SIZES = { '16:9': { width: 1280, height: 720 }, '4:3': { width: 960, height: 720 } } as const;

/** `[a-z0-9-]`, no leading/trailing or doubled dashes (REQ-571). Throws when nothing is left. */
export function sanitiseDeckId(id: string): string {
  const clean = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (clean === '') throw new Error(`silverpoint: the deck id ${JSON.stringify(id)} has no [a-z0-9] character.`);
  return clean;
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
      const out = markdownEngine.render(markdown);
      const slides: SlideRender[] = out.html.map((html, i) => {
        const token = out.slideTokens[i]!;
        const fragments = Number(token.attrGet('data-marpit-fragments') ?? 0);
        const classes = String(token.meta?.marpitDirectives?.['class'] ?? '').split(/\s+/).filter(Boolean);
        return {
          index: i + 1,
          html: `<div class="${SLIDE_BOX}">${html}</div>`,
          notes: (out.comments[i] ?? []).map((c) => c.trim()),
          fragments,
          ground: ground.name,
          substrate,
          mode,
          classes,
        };
      });
      return { id, total: slides.length, size: SIZES[size], css: out.css, slides, slots: [], diagnostics: [] };
    },
  };
}
