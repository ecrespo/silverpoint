/**
 * The deck's markdown-it core rule, pushed after Marpit's own (DD-054): it resolves each slide's
 * directives and writes them, with the slide's accessible role and name, on the content
 * `<section>`; it reads the slide's first heading. Tokens, never string post-processing.
 */
import type { DeckDiagnostic } from '../types';
import { resolveSlide, type Resolved } from './directives';

interface Token {
  readonly type: string;
  readonly content: string;
  readonly children: readonly Token[] | null;
  readonly meta?: { readonly marpitSlide?: number; readonly marpitSlideTotal?: number; readonly marpitDirectives?: Readonly<Record<string, unknown>> } | null;
  attrGet(name: string): string | number | null;
  attrSet(name: string, value: string): void;
}

/** What the rule needs from the render and what it gives back, carried on markdown-it's `env`. */
export interface AnnotateEnv {
  readonly defaults: Resolved;
  readonly slides: Array<Resolved & { heading?: string }>;
  readonly diagnostics: DeckDiagnostic[];
}

export function isContentSection(token: { readonly type: string; attrGet(name: string): string | number | null }): boolean {
  if (token.type !== 'marpit_slide_open') return false;
  const advanced = token.attrGet('data-marpit-advanced-background');
  return advanced === null || advanced === 'content';
}

function text(inline: Token | undefined): string {
  return (inline?.children ?? []).filter((t) => t.type === 'text' || t.type === 'code_inline').map((t) => t.content).join('').trim();
}

export function annotate(state: { tokens: readonly Token[]; env: { sp?: AnnotateEnv } }): void {
  const sp = state.env.sp;
  if (!sp) return;
  const reported = new Set<string>();
  let carried: Partial<Resolved> = {};
  let current: (Resolved & { heading?: string }) | undefined;

  for (let i = 0; i < state.tokens.length; i++) {
    const token = state.tokens[i]!;
    if (isContentSection(token)) {
      const n = (token.meta?.marpitSlide ?? sp.slides.length) + 1;
      const total = token.meta?.marpitSlideTotal ?? n;
      const raw = token.meta?.marpitDirectives ?? {};
      const resolved = resolveSlide(raw, sp.defaults, carried, n, reported, sp.diagnostics);
      token.attrSet('role', 'group');
      token.attrSet('aria-roledescription', 'slide');
      token.attrSet('aria-label', `Slide ${n} of ${total}`);
      token.attrSet('data-sp-ground', resolved.ground);
      token.attrSet('data-sp-substrate', resolved.substrate);
      token.attrSet('data-sp-mode', resolved.mode);
      current = { ...resolved };
      sp.slides[n - 1] = current;
      // What the next slide inherits if it brings an unknown value (REQ-586).
      carried = Object.fromEntries((['ground', 'substrate', 'mode'] as const).filter((k) => k in raw).map((k) => [k, resolved[k]]));
    } else if (current && current.heading === undefined && token.type === 'heading_open') {
      const heading = text(state.tokens[i + 1]);
      if (heading !== '') current.heading = heading;
    }
  }
}
