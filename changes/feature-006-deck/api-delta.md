# API Spec delta — slide decks

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 2, drafted and approved 2026-10-31 |
| **Amends** | [API Spec](../../specs/api-spec.md) v1.12 → v1.13: §1 (a new package, `deck` subpaths), new §1.4, new §3.6, §7 (new §7.5), §9, §10, §11 (`SP026`–`SP029`), §12, §14 (two tools, a catalog section) |
| **SemVer** | `minor` — a new package in the `fixed` group and new subpaths; no change to any existing export, prop or normalised output |
| **Requirements** | REQ-570..REQ-628 ([`prd-delta.md`](prd-delta.md) §6.15) |

Shapes named here (`DeckRender`, `DeckState`, `ChartFenceSpec`…) are defined field by field in the
Data Model delta (gate 3); this document fixes names, entries and behaviour.

## 1. Packages and entry points (§1, new §1.4)

| Package | Entry | Exports | Environment |
|---|---|---|---|
| `@silverpoint/marp` (new) | `.` | `createDeckEngine(options?)`, `DECK_DIRECTIVES`, `THEME_CLASSES`, `parseChartFence(source)`, types | Pure: Node, browser, workers. No DOM |
| `@silverpoint/marp` | `./client` | `createDeckController(options)`, `bindDeck(root, controller, options)`, `findChartSlots(root)`, `applyScaling(root)` | Browser only |
| `@silverpoint/marp` | `./theme.css` | the `silverpoint` Marpit theme, both built-in grounds, standalone (REQ-582) | CSS |
| `@silverpoint/marp` | `./deck.css` | the deck chrome: viewport, controls, notes, overview, print (loaded by the apps with `ui.css`) | CSS |
| `@silverpoint/marp` | `./cli` | an engine module for Marp CLI's `--engine` (REQ-583, SHOULD) | Node |
| `@silverpoint/marp` | `./demo` | `DECK_DEMO` (a Markdown string, REQ-626) | Pure |
| `@silverpoint/react` | `./deck` | `SpDeck` (`"use client"`) | |
| `@silverpoint/vue` | `./deck` | `SpDeck` | |
| `@silverpoint/angular` | `deck` (secondary entry point) | `SpDeckComponent` (`sp-deck`); notes come from the Markdown only, so there is no template slot | |
| `@silverpoint/grounds` | `.` (addition) | `slideBackdrop(ground, substrate, options)` → `{ svg, dataUri }` (REQ-587) | Pure |

**Dependencies.** `@silverpoint/marp` depends on `@silverpoint/core`, `@silverpoint/grounds`
(`workspace:*`), `@marp-team/marpit` `^3.2.3` and `@marp-team/marpit-svg-polyfill` `^2.1.0`. The three
adapters declare `@silverpoint/marp` as an **optional peer** (`peerDependenciesMeta.optional`) at the
same version, and as a dev dependency for their tests; only their `deck` entry imports it
(REQ-616). `@silverpoint/mcp` depends on `@silverpoint/marp` (REQ-620). `check-deps` allows Marpit
and the polyfill in `@silverpoint/marp` only, and `@silverpoint/marp` in the adapters only as an
optional peer.

**Consumer stylesheets** for a deck: `@silverpoint/fonts/fonts.css`, `@silverpoint/grounds/styles.css`,
`@silverpoint/grounds/ui.css`, `@silverpoint/marp/deck.css`. The theme's CSS comes inside the
`DeckRender` (scoped by Marpit), so it is not imported separately.

**Public versus internal (§2).** Public: everything in the table, the props and events of §6, the
markup contract and `part` names of §8, the directives and classes of §4, the fence schema of §5,
`SP026`–`SP029`. Internal: `@silverpoint/marp/client`'s functions are shared by the adapters, as
`@silverpoint/core/timeline`'s are; applications may use them for a framework-free deck, but they
fall under the `0.x` warning like the rest.

## 2. The engine (`@silverpoint/marp`)

```ts
interface DeckEngineOptions {
  id: string;                         // the deck id (REQ-571); required: adapters pass theirs
  ground?: string;                    // default 'silverpoint'
  substrate?: string;                 // default: the ground's first substrate
  mode?: InkMode;                     // 'ink' | 'precision'; default 'ink'
  theme?: string;                     // Marpit theme name; default 'silverpoint'
  size?: '16:9' | '4:3';              // default '16:9' (1280×720); '4:3' is 960×720
  locale?: string;                    // passed to fence charts, as the provider's
  palette?: Palette | PaletteName;    // default palette for fence charts
}

interface DeckEngine {
  render(markdown: string): DeckRender;  // pure, deterministic (REQ-573, REQ-574)
}

function createDeckEngine(options: DeckEngineOptions): DeckEngine;
function parseChartFence(source: string): { spec?: ChartFenceSpec; error?: FenceError };
```

`DeckRender` (Data Model): `{ id, total, size: { width, height }, css, slides: SlideRender[],
slots: ChartSlot[], diagnostics: Diagnostic[] }`; `SlideRender`: `{ index (1-based), html, notes:
string[], fragments, ground, substrate, mode, classes: string[] }`; `ChartSlot`: `{ slotId, slide,
ordinal, chartId, spec }`.

**Engine seam (DD-052).** `createDeckEngine` builds on an internal `MarkdownDeckEngine` interface
(`render(markdown, env) → { html[], css, comments[][] }` plus a markdown-it plugin hook). Only the
Marpit implementation exists in `0.9.0`; the interface is not exported.

*Amended in implementation (T-273..T-278):* the pure entry also exports what the three adapters
share, so none computes markup of its own (Art. 2): `deckView(render, state, options) → DeckView`
(the root, viewport, container, slide boxes, notes, controls and status, as attributes and core UI
trees), `hydrationPlan(render, palette?)` (each slot's chart and props, from the function the static
render uses), `createDeckController` (also on `/client`), and `deckMarkup(view) → string`, the deck's
static HTML: the canonical render of the tree gate (REQ-623), and what `render_deck` returns (§11).

## 3. The theme (`silverpoint`)

| Item | Contract |
|---|---|
| Name | `/* @theme silverpoint */`; `/* @size 16:9 1280px 720px */`, `/* @size 4:3 960px 720px */` |
| Type | EB Garamond 400/500/400 italic; `font-variant-numeric: tabular-nums` in tables and code; no monospace |
| Scale | h1 64px, h2 48px, h3 36px, body 30px, small 22px; line-height 1.3; slide padding 64px 80px |
| Colour | Only `--sp-*` properties: `--sp-substrate`, `--sp-ink-text`, `--sp-ink-primary`, `--sp-ink-rule`, `--sp-ink-heighten`… set per `section[data-sp-ground][data-sp-substrate]` |
| Pagination | `section::after { content: attr(data-marpit-pagination) ' / ' attr(data-marpit-pagination-total) }`, bottom right |
| `header` / `footer` | small caps by `text-transform: uppercase` + tracking (DD-010), top / bottom rule |

### Classes (REQ-579)

| Class | Effect |
|---|---|
| `lead` | Title slide: content centred vertically, h1 at 88px, a single rule under it |
| `invert` | Text in `--sp-ink-heighten` on a substrate darkened to the ground's `ink.primary`; contrast computed per ground |
| `plate` | An inked plate mark (a double rule inset 24px) as backdrop; content inside the plate |
| `hatched` | An inked hatched border band (tonal level 1) as backdrop |

## 4. Directives (REQ-584..586)

| Directive | Values | Default | Spot form | Written as |
|---|---|---|---|---|
| `ground` | a registered ground: `silverpoint`, `cyanotype` | `options.ground` | `_ground` | `data-sp-ground` |
| `substrate` | one of the ground's substrates (`cream`, `green`, `blue`, `ochre`; `prussian`) | `options.substrate`, else the ground's first | `_substrate` | `data-sp-substrate` |
| `mode` | `ink` \| `precision` | `options.mode` | `_mode` | `data-sp-mode` |

They are Marpit **local** directives (`marpit.customDirectives.local`): set in front matter they
apply to every slide; in a slide's comment they apply to it and the slides after; with `_` to that
slide only. Marpit's own directives (`theme`, `class`, `paginate`, `header`, `footer`,
`backgroundColor`, `backgroundImage`, `color`, `size`, `headingDivider`, `lang`) keep their meaning.
`DECK_DIRECTIVES` exports this table as data (the agent catalog reads it).

## 5. The chart fence (REQ-589..591)

````markdown
```silverpoint
{ "chart": "bar-chart",
  "data": [{ "label": "Florence", "value": 42 }, { "label": "Siena", "value": 27 }],
  "props": { "xKey": "label", "yKey": "value", "title": "Workshops by city" },
  "height": 420 }
```
````

| Field | Type | Default | Notes |
|---|---|---|---|
| `chart` | catalog slug (`bar-chart`, `sankey-chart`…) | required | The agent catalog's slugs; unknown → `SP026` with the closest slugs |
| `data` | array or object, as the chart reads | the chart's demo dataset | Same as `render_chart` |
| `props` | object | `{}` | The chart's own props (§7) and the common ones except `ground`, `substrate`, `mode`, `palette`, `id` |
| `width` | 160..1280 | the slide's content width (1120 at 16:9) | px of the slide canvas |
| `height` | 90..720 | 360 | |
| `id` | string | `<deckId>-s<slide>-c<n>` | Seed source (REQ-590) |
| `ground`, `substrate`, `mode` | as §4 | the slide's | |
| `palette` | preset name or `Palette` | the deck's | |

The body must be one JSON object (no comments, no trailing commas): it is parsed with `JSON.parse`,
never evaluated. An info string other than `silverpoint` (` ```js `) is a normal code block.

**Slot markup**

```html
<figure class="sp-deck-chart" data-sp-slot="s2-c1" part="sp-deck-chart">
  <!-- the chart's canonical root, as the adapters render it -->
  <div class="sp-root sp-chart …">…<svg …>…</svg>…</div>
</figure>
```

**Error markup** (REQ-591), drawn with the UI layer's `Alert` look, `role="note"`:

```html
<figure class="sp-deck-chart sp-deck-chart--error" data-sp-slot="s2-c1" role="note" part="sp-deck-chart-error">
  <figcaption>Chart fence on slide 2: unknown chart "barchart". Did you mean "bar-chart"?</figcaption>
</figure>
```

## 6. `SpDeck` — props and events (REQ-606, REQ-608, REQ-609)

| Prop / input | Type | Default | Notes |
|---|---|---|---|
| `markdown` | `string` | required | The Marp Markdown |
| `page` | `number` | — | Controlled current page (1-based); pair with `pageChange` |
| `defaultPage` | `number` | `1` | Uncontrolled initial page |
| `id` | `string` | the adapter's hydration-safe id | Deck id (REQ-571) |
| `label` | `string` | first heading of slide 1 | Accessible name of the deck region |
| `theme` | `string` | `'silverpoint'` | Marpit theme name |
| `ground` | `string` | `'silverpoint'` | Deck default, overridden by directives |
| `substrate` | `string` | the ground's first | |
| `mode` | `'ink' \| 'precision'` | `'ink'` | |
| `palette` | `string` | — | Preset name for fence charts (a string, REQ-609; `Palette` objects through the provider) |
| `size` | `'16:9' \| '4:3'` | `'16:9'` | |
| `showNotes` | `boolean` | `false` | |
| `showControls` | `boolean` | `true` | |
| `keyboard` | `boolean` | `true` | Keys while focus is in the deck (§7.3) |
| `swipe` | `boolean` | `true` | |
| `hash` | `boolean` | `false` | `#<n>` deep link (REQ-602) |
| `interactive` | `boolean` | `true` | Hydrate fence charts (REQ-594) |

| Event | Payload | React | Vue | Angular |
|---|---|---|---|---|
| `pageChange` | `{ page: number, total: number }` | `onPageChange` | `@page-change` (and `v-model:page`) | `(pageChange)` |
| `fragmentChange` | `{ page: number, step: number, steps: number }` | `onFragmentChange` | `@fragment-change` | `(fragmentChange)` |
| `ready` | `{ total: number }` | `onReady` | `@ready` | `(ready)` |

Vue's `page` also works with `v-model:page`; Angular's `page` is a signal input, and `pageChange` makes
`[(page)]` two-way binding work. `SpDeck` takes the provider's ground, substrate, mode and palette
when its own props are absent, like charts do.

```tsx
// React
import { SpDeck } from '@silverpoint/react/deck';
<SpDeck markdown={md} hash showNotes onPageChange={({ page }) => setPage(page)} />
```
```vue
<!-- Vue -->
<SpDeck :markdown="md" v-model:page="page" show-notes />
```
```html
<!-- Angular -->
<sp-deck [markdown]="md" [(page)]="page" [showNotes]="true" />
```

## 7. The controller (`@silverpoint/marp/client`, REQ-595..607)

### 7.1 API

```ts
function createDeckController(options: {
  total: number; steps: readonly number[];          // fragments per slide, from DeckRender
  page?: number; defaultPage?: number;              // controlled / uncontrolled
}): DeckController;

interface DeckController {
  readonly state: DeckState;                        // { page, step, total, steps, overview, notes, fullscreen }
  next(): void; prev(): void; first(): void; last(): void;
  goTo(page: number, step?: number | 'all'): void;
  toggleOverview(force?: boolean): void; toggleNotes(force?: boolean): void; toggleFullscreen(force?: boolean): void;
  setTotal(total: number, steps: readonly number[]): void;   // after a re-render (clamps, SP028)
  setControlledPage(page: number): void;                     // controlled mode: the parent's value
  on<E extends keyof DeckEvents>(event: E, fn: (payload: DeckEvents[E]) => void): () => void;
  destroy(): void;
}

function bindDeck(root: HTMLElement, controller: DeckController,
                  options: { keyboard: boolean; swipe: boolean; hash: boolean }): () => void;  // returns cleanup
function findChartSlots(root: ParentNode): Array<{ element: HTMLElement; slotId: string; spec: ChartFenceSpec }>;
function applyScaling(root: HTMLElement): () => void;   // the PoC's method (REQ-617); returns cleanup
```

In controlled mode, `next`/`prev`/`goTo` emit `pageChange` and wait for the parent's
`setControlledPage`; fragment steps stay internal. `DeckEvents` also carries the internal
`state` event the adapters subscribe to.

### 7.2 State transitions (REQ-596)

| From | Operation | To |
|---|---|---|
| page p, step s < steps[p] | `next` | p, s+1 → `fragmentChange` |
| page p < total, step = steps[p] | `next` | p+1, 0 → `pageChange`, `fragmentChange` |
| page total, step = steps[total] | `next` | unchanged |
| page p, step s > 0 | `prev` | p, s−1 → `fragmentChange` |
| page p > 1, step 0 | `prev` | p−1, steps[p−1] → `pageChange`, `fragmentChange` |
| any | `goTo(q)` | clamp(q), 0 (or `steps[q]` with `'all'`) |
| any | `setTotal(t, steps)` | clamp(p), min(s, steps[p]); `ready` |

### 7.3 Keyboard (REQ-600)

| Keys | Action |
|---|---|
| `ArrowRight`, `ArrowDown`, `PageDown`, `Space`, `Enter` (not on a button) | `next` |
| `ArrowLeft`, `ArrowUp`, `PageUp`, `Shift+Space` | `prev` |
| `Home` / `End` | `first` / `last` |
| `o` | toggle overview; in the overview, arrows move, `Enter` selects, `Escape` closes |
| `f` | toggle fullscreen (when available) |
| `n` | toggle notes |

Ignored when the event target is an `input`, `textarea`, `select` or `[contenteditable]`, when a
modifier other than `Shift` is held, or inside a hydrated chart that handles the key itself (the
chart's keyboard model wins while it has focus).

## 8. Markup contract (§10, REQ-612..614)

```html
<div class="sp-deck" part="sp-deck" role="region" aria-roledescription="slide deck" aria-label="…"
     tabindex="0" data-sp-page="1" data-sp-step="0" data-sp-overview="false">
  <div class="sp-deck-viewport" part="sp-deck-viewport">
    <div class="sp-deck-<id>">                         <!-- Marpit container: the CSS scope -->
      <svg data-marpit-svg viewBox="0 0 1280 720">       <!-- or no svg: the PoC decides -->
        <foreignObject width="1280" height="720">
          <section role="group" aria-roledescription="slide" aria-label="Slide 1 of 12"
                   data-sp-ground="silverpoint" data-sp-substrate="cream" data-sp-mode="ink"
                   data-marpit-pagination="1" data-marpit-pagination-total="12" …>…</section>
        </foreignObject>
      </svg>
      <!-- other slides: inert, hidden -->
    </div>
  </div>
  <aside class="sp-deck-notes" part="sp-deck-notes" aria-label="Speaker notes">…</aside>   <!-- showNotes -->
  <div class="sp-deck-controls" part="sp-deck-controls" role="toolbar" aria-label="Deck controls">
    <button type="button" aria-label="Previous slide">…</button>
    <span class="sp-deck-counter" part="sp-deck-counter">1 / 12</span>
    <button type="button" aria-label="Next slide">…</button>
    <button type="button" aria-label="Overview" aria-pressed="false">…</button>
    <button type="button" aria-label="Speaker notes" aria-pressed="false">…</button>
    <button type="button" aria-label="Full screen" aria-pressed="false">…</button>
  </div>
  <p class="sp-deck-status" aria-live="polite">Slide 1 of 12</p>                         <!-- visually hidden -->
</div>
```

Fragments are revealed by the step on the root: an item with `data-marpit-fragment="k"` is shown
iff `k ≤ data-sp-step` on the current slide; otherwise `visibility: hidden` (its box kept, and out
of the accessibility tree). The server renders the initial page and step, so the first paint is
final.

**CSS custom properties (new):** `--sp-deck-gap` (space between viewport, notes and controls),
`--sp-deck-notes-width`, `--sp-deck-controls-height`. **Parts (new):** `sp-deck`,
`sp-deck-viewport`, `sp-deck-notes`, `sp-deck-controls`, `sp-deck-counter`, `sp-deck-chart`,
`sp-deck-chart-error`, `sp-deck-overview`.

## 9. Diagnostics (§11)

| Code | Severity | REQ | Condition |
|---|---|---|---|
| `SP026` | warn | REQ-591 | A chart fence is invalid: bad JSON, unknown chart, undeclared prop, an `error` diagnostic of the chart, or a size out of range. The slot shows the error |
| `SP027` | warn | REQ-586 | A `ground`, `substrate` or `mode` directive has an unknown value, or a substrate not in the slide's ground; the inherited value holds |
| `SP028` | warn | REQ-599 | `page` or `defaultPage` is outside `1..total`, or a re-render shrank the deck under the current page; clamped |
| `SP029` | warn | REQ-576 | The Markdown exceeds a limit (512 KB, 300 slides, 60 fences); rendered up to it |

`SP018` (REQ-319) is extended to a deck with no `label` and no heading on slide 1. 25 → 29 codes.

## 10. Limits and budgets (§12)

| Item | Limit |
|---|---|
| Markdown | 512 KB, 300 slides, 60 fences (REQ-576) |
| Fence size | 160..1280 × 90..720 px of the canvas |
| `@silverpoint/marp` own code (`.` + `./client`), gzip | declared in the TD from the PoC build (REQ-628); Marpit's ≈ 131 kB gzip reported apart |
| A chart-only build | unchanged (REQ-444, REQ-616) |

## 11. Agent access (§14)

| Tool | Input | Output |
|---|---|---|
| `validate_deck` | `{ markdown: string }` | `{ valid, total, diagnostics: [{ code, severity, req, message, todo, slide?, slot? }] }` |
| `render_deck` | `{ markdown, slide?: number, ground?, substrate?, mode?, palette?, size?, embedFonts?: boolean }` | `{ html: string, total, diagnostics[] }` — a standalone HTML document (all slides, static charts, theme, ground and deck CSS inlined, controls omitted), or with `slide`, that slide alone |
| `generate_code` (amended) | `target: { deck: { markdown?: string } }` | an `SpDeck` usage per framework; `reflex` → `unknown_name` tool error naming `reflex-silverpoint-marp` as pending |

The catalog's `deck` section: `{ names, imports, props[], events[], directives[], classes[],
fence: { schema, example }, diagnostics: ['SP026', …], stylesheets }`. The skill gains
`references/deck.md`. Resources: `silverpoint://deck` (the section) and `silverpoint://guides/deck`.
The Markdown limit of REQ-576 applies; REQ-560's 256 KB body cap holds first.
