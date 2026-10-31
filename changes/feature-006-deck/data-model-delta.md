# Data Model delta — slide decks

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 3 (second half), drafted and approved 2026-10-31 |
| **Amends** | [Data Model](../../specs/data-model.md) v1.9 → v1.10: new §2.32..§2.37, §5 (deck fixtures), invariants I-43..I-52 |

## §2.32 `ChartFenceSpec` — the body of a `silverpoint` fence

```ts
interface ChartFenceSpec {
  readonly chart: string;                                  // a catalog slug: 'bar-chart', 'sankey-chart', …
  readonly data?: unknown;                                 // what the chart reads; absent → its demo dataset
  readonly props?: Readonly<Record<string, unknown>>;      // the chart's own props + common view props
  readonly width?: number;                                 // 160..1280, canvas px; default: slide content width
  readonly height?: number;                                // 90..720; default 360
  readonly id?: string;                                    // default `${deckId}-s${slide}-c${ordinal}`
  readonly ground?: string;
  readonly substrate?: string;
  readonly mode?: 'ink' | 'precision';
  readonly palette?: string | Palette;
}
```

JSON Schema (generated from the type for the agent catalog, DD-060): `additionalProperties: false`
at the top level; `props` forbids `ground`, `substrate`, `mode`, `palette` and `id` (they are
top-level fields). This is `render_chart`'s input without `format` and `embedFonts`.
*Amended in implementation (T-258):* `props` also forbids `data`, `width` and `height`, as
`render_chart` does. The declared props come from `packages/marp/src/fence/charts.generated.ts`,
written by `tools/agent-catalog` and diffed by its `check`, because the recipes carry no prop metadata.

```ts
type FenceError =
  | { readonly kind: 'json'; readonly message: string }                     // JSON.parse message
  | { readonly kind: 'shape'; readonly message: string }                    // not an object, unknown top-level key
  | { readonly kind: 'chart'; readonly chart: string; readonly suggestions: readonly string[] }
  | { readonly kind: 'prop'; readonly props: readonly string[] }            // undeclared props
  | { readonly kind: 'size'; readonly width?: number; readonly height?: number }
  | { readonly kind: 'diagnostic'; readonly code: string; readonly message: string };  // an `error` diagnostic of the chart
```

## §2.33 `DeckRender` — the engine's output

```ts
interface DeckRender {
  readonly id: string;                       // sanitised deck id
  readonly total: number;                    // slides
  readonly size: { readonly width: number; readonly height: number };   // 1280×720 or 960×720
  readonly css: string;                      // Marpit's scoped CSS: theme + directives + backdrops
  readonly slides: readonly SlideRender[];
  readonly slots: readonly ChartSlot[];      // document order
  readonly diagnostics: readonly DeckDiagnostic[];
}
interface SlideRender {
  readonly index: number;                    // 1-based
  readonly html: string;                     // the slide box: <div class="sp-deck-slide"><svg …>…</svg></div>
  readonly notes: readonly string[];         // Marpit comments, in order, trimmed
  readonly fragments: number;                // data-marpit-fragments, 0 when none
  readonly ground: string; readonly substrate: string; readonly mode: 'ink' | 'precision';
  readonly classes: readonly string[];       // the `class` directive's tokens
  readonly heading?: string;                 // first heading's text, for labels and the overview
}
interface ChartSlot {
  readonly slotId: string;                   // `s${slide}-c${ordinal}`
  readonly slide: number; readonly ordinal: number;
  readonly chartId: string;
  readonly spec?: ChartFenceSpec;            // absent when the fence failed
  readonly error?: FenceError;
}
interface DeckDiagnostic {
  readonly code: 'SP018' | 'SP026' | 'SP027' | 'SP028' | 'SP029' | string;
  readonly severity: 'warn' | 'error';
  readonly message: string;
  readonly slide?: number;
  readonly slot?: string;
}
```

## §2.34 Directive values

```ts
interface SlideDirectives {
  readonly ground: string;          // a registered ground (resolveGround succeeds)
  readonly substrate: string;       // a key of that ground's substrates
  readonly mode: 'ink' | 'precision';
}
const DECK_DIRECTIVES: readonly {
  readonly name: 'ground' | 'substrate' | 'mode';
  readonly values: readonly string[] | 'per-ground';   // substrate depends on the ground
  readonly default: string;
  readonly attribute: 'data-sp-ground' | 'data-sp-substrate' | 'data-sp-mode';
}[];
const THEME_CLASSES: readonly ('lead' | 'invert' | 'plate' | 'hatched')[];
```

Resolution per slide: spot (`_x`) › inherited local (`x`, from this or an earlier slide or the front
matter) › deck option › default. A `ground` change without a `substrate` resets the substrate to the
new ground's first unless the inherited substrate belongs to the new ground.

## §2.35 `DeckState` and events — the controller

```ts
interface DeckState {
  readonly page: number;              // 1..total
  readonly step: number;              // 0..steps[page-1]
  readonly total: number;
  readonly steps: readonly number[];  // fragments per slide, length total
  readonly overview: boolean;
  readonly notes: boolean;
  readonly fullscreen: boolean;
  readonly controlled: boolean;
}
interface DeckEvents {
  pageChange: { readonly page: number; readonly total: number };
  fragmentChange: { readonly page: number; readonly step: number; readonly steps: number };
  ready: { readonly total: number };
  state: DeckState;                   // internal: the adapters' subscription
}
type DeckAction =
  | { type: 'next' } | { type: 'prev' } | { type: 'first' } | { type: 'last' }
  | { type: 'goTo'; page: number; step?: number | 'all' }
  | { type: 'setTotal'; total: number; steps: readonly number[] }
  | { type: 'setControlledPage'; page: number }
  | { type: 'toggle'; what: 'overview' | 'notes' | 'fullscreen'; force?: boolean };
```

In controlled mode, a page-moving action emits `pageChange` with the requested page and leaves
`state.page` unchanged until `setControlledPage`; the step it would have set is kept pending and
applied when the parent confirms that page (so `prev` into a slide still lands fully revealed).

## §2.36 Backdrop

```ts
interface SlideBackdropOptions {
  readonly kind: 'plain' | 'hatched' | 'plate';
  readonly seed: number;                     // resolveSeed(`${deckId}-s${n}`)
  readonly mode: 'ink' | 'precision';
  readonly width: number; readonly height: number;
}
interface SlideBackdrop { readonly svg: string; readonly dataUri: string }  // dataUri: `data:image/svg+xml,` + encodeURIComponent(svg)
```

`hatched` band: 32 px wide inside the slide's edge, filled with the ground's tonal level 1 tile.
`plate`: two rules, 24 px and 30 px inside the edge. `plain` returns the substrate fill only, and the
engine omits it (the theme paints the substrate colour); it exists for `render_deck`.

## §2.37 Agent catalog — `deck` section (extends §2.28)

```ts
interface AgentCatalog {
  // … §2.28 …
  readonly deck: {
    readonly names: Names;                   // reflex: '' until reflex-silverpoint-marp exists
    readonly imports: Imports;
    readonly peer: '@silverpoint/marp';
    readonly props: readonly PropEntry[];
    readonly events: readonly { readonly name: string; readonly payload: string; readonly doc: string }[];
    readonly directives: typeof DECK_DIRECTIVES;
    readonly classes: typeof THEME_CLASSES;
    readonly fence: { readonly schema: object; readonly example: string };
    readonly diagnostics: readonly string[];
    readonly stylesheets: readonly string[];
  };
}
```

## §5 Fixture matrix — add: deck fixtures

| Fixture | Content |
|---|---|
| `basic.deck.md` | Title (`lead`), headings, lists, a table, a blockquote, inline and block code, header/footer, pagination |
| `fragments.deck.md` | Fragmented lists at depth 1 and 2; a slide with none |
| `directives.deck.md` | Front-matter `ground`; a `_substrate` spot; `mode: precision` inherited; an unknown value (`SP027`) |
| `fences.deck.md` | Three fences (bar, donut, line) and one invalid per `FenceError.kind` |
| `backgrounds.deck.md` | `bg left:40%`, two `bg` images, `bg contain`, a filter |
| `classes.deck.md` | `invert`, `plate`, `hatched` on each built-in ground |

PR matrix: each × `silverpoint`/`cyanotype` × `ink`/`precision` where the fixture does not fix them
(24 deck renders). Images in fixtures are local SVG files under `fixtures/deck/assets/`.

## §6 Invariants — add

| ID | Invariant | REQ |
|---|---|---|
| I-43 | `DeckRender.slides.length === total` and `slides[i].index === i + 1`. | REQ-573 |
| I-44 | `render(md, opts)` twice gives deep-equal results; no field depends on time or randomness. | REQ-574 |
| I-45 | No `slides[i].html` contains `<script`, an `on*=` attribute, or a `javascript:`/`vbscript:` URL. | REQ-575 |
| I-46 | Every `ChartSlot` has exactly one of `spec`, `error`; `slotId`s are unique; every slot appears once in its slide's HTML as `data-sp-slot`. | REQ-589, REQ-591 |
| I-47 | A slot's `chartId` is `spec.id` when given, else `${id}-s${slide}-c${ordinal}`; chart ids are unique in a deck. | REQ-590 |
| I-48 | Every slide's `ground` is registered and its `substrate` belongs to it; `mode ∈ {ink, precision}`. | REQ-584, REQ-586 |
| I-49 | `1 ≤ state.page ≤ total` and `0 ≤ state.step ≤ steps[page-1]` after every action. | REQ-596, REQ-599 |
| I-50 | `next` then `prev` from any state with `step < steps[page-1]` or `page < total` returns the same `(page, step)`. | REQ-596 |
| I-51 | Every event payload is plain JSON (`JSON.parse(JSON.stringify(p))` deep-equals `p`). | REQ-606, REQ-609 |
| I-52 | The backdrop for the same ground, substrate, kind, seed, mode and size is byte-identical. | REQ-587 |

## Constitution check

- **Art. 3, 4** — I-44, I-47, I-52 make the render reproducible and the fixtures meaningful.
- **Art. 5** — `SlideRender.heading` names slides and the deck; fragments are a count, revealed by
  state.
- **Art. 7** — directive values are read from the ground registry, not listed in code (I-48).
