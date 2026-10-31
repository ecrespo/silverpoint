/**
 * `@silverpoint/marp/cli` (T-266, REQ-583): the Marp CLI engine — `marp --engine @silverpoint/marp/cli`.
 * Marp CLI loads a module engine as a class inherited from Marpit (its default export). This one
 * carries the deck's directives, annotations, backdrops and chart fences, the `silverpoint` theme as
 * its default, and the grounds' chart stylesheet in its CSS, so fences print as static SVG. Raw HTML
 * stays off and author CSS is sanitised, whatever options Marp CLI passes (REQ-572, REQ-575).
 */
import { Marpit, type Options } from '@marp-team/marpit';
import { cyanotype, silverpoint } from '@silverpoint/grounds';
import { createDeckEnv } from '../engine';
import { installDeckRules } from '../engine/marpit';
import { sanitiseDeckCss } from '../engine/sanitize';
import { standaloneTheme } from '../theme/standalone';
import { GROUNDS_CSS } from './grounds-css.generated';

/** Marp CLI renders 16:9: the Marpit engine reads its size from the theme (`size` is Marp Core's). */
const SIZE = { width: 1280, height: 720 } as const;
const DECK_ID = 'deck';

interface Rendered<T> {
  readonly html: T;
  readonly css: string;
  readonly comments: string[][];
}

export default class SilverpointMarp extends Marpit {
  constructor(options: Options = {}) {
    super({ ...options, inlineSVG: true, markdown: { html: false } });
    this.themeSet.default = this.themeSet.add(standaloneTheme([silverpoint, cyanotype]));
    installDeckRules(this);
  }

  // Marpit's two overloads: `htmlAsArray` gives one string per slide.
  override render(markdown: string, env: { htmlAsArray: true; [key: string]: unknown }): Rendered<string[]>;
  override render(markdown: string, env?: Record<string, unknown>): Rendered<string>;
  override render(markdown: string, env: Record<string, unknown> = {}): Rendered<string | string[]> {
    // A fresh deck per render: Marp CLI renders each file, and each watch, with one instance.
    const deck = createDeckEnv({ id: DECK_ID, size: SIZE, defaults: { ground: 'silverpoint', substrate: 'cream', mode: 'ink' } });
    const out = super.render(markdown, { ...env, ...deck }) as Rendered<string | string[]>;
    return { ...out, css: `${sanitiseDeckCss(out.css)}\n${GROUNDS_CSS}` };
  }
}
