/**
 * The one module that imports Marpit (DD-052). It implements the internal `MarkdownDeckEngine`
 * seam, so a Marp Core engine could be a second implementation; the seam is not exported.
 */
import { Element, Marpit } from '@marp-team/marpit';

/** The slide-opening token fields the engine reads (Marpit's own, see its fragment and directive plugins). */
export interface SlideToken {
  readonly type: string;
  readonly meta?: { readonly marpitSlide?: number; readonly marpitDirectives?: Readonly<Record<string, unknown>> } | null;
  attrGet(name: string): string | number | null;
}

export interface MarkdownDeckRender {
  readonly html: readonly string[];
  readonly css: string;
  readonly comments: readonly (readonly string[])[];
  /** The opening token of each slide's content `<section>`, in slide order. */
  readonly slideTokens: readonly SlideToken[];
}

export interface MarkdownDeckEngine {
  render(markdown: string): MarkdownDeckRender;
}

export interface MarpitEngineOptions {
  readonly scope: string;          // the container class, `sp-deck-<id>`
  readonly theme: string;          // the theme's CSS, `/* @theme … */` first; it fixes the slide size
}

/** The slide box class (DD-051): Marpit's `slideContainer`, so its scoped CSS selects through it. */
export const SLIDE_BOX = 'sp-deck-slide';

export function createMarpitEngine(options: MarpitEngineOptions): MarkdownDeckEngine {
  const marpit = new Marpit({
    anchor: false,                                              // REQ-572: no ids in the host page
    inlineSVG: true,                                            // DD-051: kept for advanced backgrounds
    container: new Element('div', { class: options.scope }),    // REQ-571: CSS scope per deck
    slideContainer: new Element('div', { class: SLIDE_BOX }),
    markdown: { html: false },                                  // REQ-572, REQ-575: never configurable
  });
  marpit.themeSet.default = marpit.themeSet.add(options.theme);

  return {
    render(markdown) {
      const { html, css, comments } = marpit.render(markdown, { htmlAsArray: true }) as unknown as {
        html: string[];
        css: string;
        comments: string[][];
      };
      const tokens = (marpit as unknown as { lastSlideTokens: SlideToken[][] }).lastSlideTokens;
      const slideTokens = tokens.map((slide) => slide.find(isContentSection)!);
      return { html, css, comments, slideTokens };
    },
  };
}

/**
 * Under inline SVG a slide may have several `<section>`s: Marpit's advanced backgrounds add a
 * `background` one and, for a split, a `pseudo` one. The content section is the other.
 */
function isContentSection(token: SlideToken): boolean {
  if (token.type !== 'marpit_slide_open') return false;
  const advanced = token.attrGet('data-marpit-advanced-background');
  return advanced === null || advanced === 'content';
}
