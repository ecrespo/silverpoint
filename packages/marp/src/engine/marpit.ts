/**
 * The one module that imports Marpit (DD-052). It implements the internal `MarkdownDeckEngine`
 * seam, so a Marp Core engine could be a second implementation; the seam is not exported.
 */
import { Element, Marpit } from '@marp-team/marpit';
import { renderFences, type FenceEnv } from '../fence/rule';
import { annotate, isContentSection, type AnnotateEnv } from './annotate';
import { registerDirectives } from './directives';
import { isSafeBackgroundImage, sanitiseDeckCss } from './sanitize';

/** The slide-opening token fields the engine reads (Marpit's own, see its fragment and directive plugins). */
export interface SlideToken {
  readonly type: string;
  readonly meta?: { readonly marpitSlide?: number; readonly marpitDirectives?: Readonly<Record<string, unknown>> } | null;
  attrGet(name: string): string | number | null;
}

/** The slice of markdown-it the engine registers core rules on. */
interface MarkdownIt {
  readonly core: {
    readonly ruler: {
      before(name: string, rule: string, fn: (state: { tokens: Array<{ meta?: { marpitDirectives?: Record<string, unknown> } | null }> }) => void): void;
      push(rule: string, fn: (state: never) => void): void;
    };
  };
}

export interface MarkdownDeckRender {
  readonly html: readonly string[];
  readonly css: string;
  readonly comments: readonly (readonly string[])[];
  /** The opening token of each slide's content `<section>`, in slide order. */
  readonly slideTokens: readonly SlideToken[];
}

export interface MarkdownDeckEngine {
  render(markdown: string, env: { readonly sp: AnnotateEnv; readonly spFence: FenceEnv }): MarkdownDeckRender;
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
  registerDirectives(marpit as unknown as Parameters<typeof registerDirectives>[0]);
  // REQ-575: an unsafe `backgroundImage` directive is dropped before Marpit writes it to `style`.
  const md = marpit.markdown as unknown as MarkdownIt;
  md.core.ruler.before('marpit_directives_apply', 'sp_safe_directives', (state) => {
    for (const token of state.tokens) {
      const directives = token.meta?.marpitDirectives;
      if (directives && 'backgroundImage' in directives && !isSafeBackgroundImage(directives['backgroundImage'])) {
        delete directives['backgroundImage'];
      }
    }
  });
  // DD-054: last, so Marpit's directives, fragments and advanced backgrounds are all in place.
  md.core.ruler.push('sp_annotate', annotate as (state: never) => void);
  // DD-053: after the annotation, so each fence knows its slide's ground, substrate and mode.
  md.core.ruler.push('sp_fences', renderFences as (state: never) => void);

  return {
    render(markdown, env) {
      const { html, css, comments } = marpit.render(markdown, { htmlAsArray: true, ...env }) as unknown as {
        html: string[];
        css: string;
        comments: string[][];
      };
      const tokens = (marpit as unknown as { lastSlideTokens: SlideToken[][] }).lastSlideTokens;
      const slideTokens = tokens.map((slide) => slide.find(isContentSection)!);
      return { html, css: sanitiseDeckCss(css), comments, slideTokens };
    },
  };
}

