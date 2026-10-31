# Technical Design delta — slide decks

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 3 (first half), drafted 2026-10-31 after the PoC and approved with it the same day |
| **Amends** | [Technical Design](../../specs/technical-design.md) v1.11 → v1.12: §3.2 modules, §3.3 data flow, DD-051..DD-060, §5.1 structure, §5.3 allowlist, §7 diagnostics, §8 testing, §9 publication |
| **Requirements** | REQ-570..REQ-628 |
| **PoC** | [`poc.md`](poc.md) — decides DD-051 |

## 1. Modules (§3.2)

| Module | Package | Role | DOM |
|---|---|---|---|
| `engine/` | `@silverpoint/marp` | `createDeckEngine`: the Marpit instance per deck, directives, fence, slide annotations, `DeckRender` | no |
| `fence/` | `@silverpoint/marp` | `parseChartFence`, slug → recipe, static render through `@silverpoint/grounds`, error figures | no |
| `theme/` | `@silverpoint/marp` | the `silverpoint` theme source; `theme.css` generated at build from ground tokens | no |
| `controller/` | `@silverpoint/marp` | `DeckState` reducer and emitter | no |
| `client/` | `@silverpoint/marp/client` | `bindDeck` (keys, swipe, hash, fullscreen), `applyScaling`, `findChartSlots` | yes |
| `cli/` | `@silverpoint/marp/cli` | the Marp CLI engine (REQ-583) | no |
| `backdrop` | `@silverpoint/grounds` | `slideBackdrop(ground, substrate, { kind, seed, mode, width, height })` | no |
| `deck/` | each adapter | `SpDeck`: binds the controller, renders `DeckRender`, hydrates slots; `chart-loaders.ts` (generated) | yes |
| deck tools | `@silverpoint/mcp` | `validate_deck`, `render_deck`, `generate_code { deck }` | no |

## 2. Data flow (§3.3)

```
markdown ──► createDeckEngine({ id, ground, substrate, mode, palette, size }).render(md)      [server or client]
               │ Marpit (inlineSVG, anchor:false, html:false, container div.sp-deck-<id>,
               │         slideContainer div.sp-deck-slide)
               │ + directives plugin  ──► data-sp-ground / -substrate / -mode, aria on <section>
               │ + fence plugin       ──► grounds.renderChart(recipe, props, env) ──► <figure data-sp-slot> + SVG
               │ + backdrop           ──► grounds.slideBackdrop(...) ──► --sp-deck-backdrop: url(data:…)
               ▼
           DeckRender { css, slides[].html, notes, fragments, slots[], diagnostics }
               │
   adapter SpDeck render ──► <div class="sp-deck"> + <style>{css}</style> + slides html + controls     [SSR-safe]
               │
   client mount ──► applyScaling(viewport)  (ResizeObserver → --sp-deck-scale, data-sp-scaled)
                ──► createDeckController + bindDeck(root)  (keys, swipe, hash, fullscreen)
                ──► findChartSlots(root) ──► chartLoaders[slug]() ──► mount framework chart into slot
   markdown change ──► unmount slots ──► re-render ──► setTotal (clamp, SP028) ──► mount new slots
   unmount ──► unmount slots, cleanup bindDeck, applyScaling, controller.destroy()
```

## 3. Design decisions

### DD-051: Scaling — inline SVG at 1:1, scaled by a CSS transform (PoC outcome)

- **Decision:** Marpit runs with `inlineSVG: true` and `slideContainer: div.sp-deck-slide`. The
  server markup is Marpit's: `<div class="sp-deck-slide"><svg data-marpit-svg viewBox="0 0 1280 720">…`.
  Before hydration, `deck.css` sizes the `<svg>` at `width: 100%` (native `viewBox` scaling: right in
  Chromium and Firefox; static and possibly clipped in WebKit until hydration). On mount,
  `applyScaling(viewport)` observes the viewport with one `ResizeObserver`, writes
  `--sp-deck-scale: <width / 1280>` on it and sets `data-sp-scaled`; under that flag `deck.css`
  fixes every `<svg>` at 1280×720 (or 960×720) and applies `transform: scale(var(--sp-deck-scale))`
  with `transform-origin: 0 0` inside a box with `aspect-ratio` and `overflow: hidden`. Print resets
  the scale to 1 (`@media print`).
- **Context:** the PoC ([`poc.md`](poc.md)) measured three methods in Chromium, Firefox and WebKit at
  three widths.
- **Rationale:** `svg` (the prompt's default: `viewBox` scaling + `marpit-svg-polyfill`) failed in
  WebKit at every width: slides scaled twice, clicks lost or landing on the wrong bar, differently
  from run to run. `transform` (the prompt's fallback, no inline SVG) passed input in all engines but
  loses Marpit's advanced backgrounds (split, multiple, filtered), which exist only under inline SVG
  (REQ-588). `svg-transform` passed every measure in every engine, 9/9 on WebKit repeated.
- **Consequences:** `@marp-team/marpit-svg-polyfill` is **dropped** (amends REQ-570 and API delta §1;
  the allowlist names Marpit only). The scale is one custom property per deck, not one style per
  slide. Never re-wrap Marpit's DOM: its scoped CSS uses child combinators (PoC F3). The variant with
  CSS-set dimensions under `[data-sp-scaled]` (rather than the PoC's attributes) is the first e2e of
  Phase 10b, in WebKit.
- **Rejected:** `svg` + polyfill (WebKit); `transform` without inline SVG (REQ-588); `zoom`
  (changes layout metrics the charts measure, DD-015); an iframe or Shadow DOM (fonts, research).

### DD-052: `@silverpoint/marp` layout, and an engine seam not exported

- **Decision:** one package, entries `.`, `./client`, `./cli`, `./demo`, `./theme.css`, `./deck.css`,
  built with `tsup` (ESM + CJS types, as core). Marpit is imported through one module,
  `engine/marpit.ts`, which implements the internal interface
  `MarkdownDeckEngine { render(md, env) → { html: string[], css: string, comments: string[][] }; use(plugin) }`.
  Everything else (directives, fence, annotations) is a markdown-it plugin given to `use`.
- **Rationale:** Marpit is CJS; one import site keeps the interop in one place. A Marp Core engine
  later is a second implementation of the interface (REQ §5.2), not a refactor.
- **Rejected:** putting the deck in `@silverpoint/core` (Marpit would break the core's allowlist and
  its 45 kB budget, Art. 8); a `deck` folder in each adapter with its own Markdown handling (three
  engines, Art. 2).

### DD-053: The fence renders the canonical SVG; adapters hydrate per slug, lazily

- **Decision:** the fence plugin parses the body with `JSON.parse`, resolves `chart` (a slug) to a
  recipe through a table built from `@silverpoint/core` and `@silverpoint/core/catalog` (recipe
  `name` → kebab-case slug, as the agent catalog's), and calls `grounds.renderChart(recipe, props,
  { id, width })` with the slide's ground, substrate, mode and palette as props; `toChartRootString`
  (moved into grounds from the visual gate's reference writer, Analyze A-03) gives the chart's client
  DOM —`.sp-root`, SVG, live region, table— placed in `<figure class="sp-deck-chart" data-sp-slot>`. The parsed spec travels in
  `DeckRender.slots`; the client reads it back from a `data-sp-spec` attribute (JSON, escaped), so
  `findChartSlots` needs no side channel after SSR.
  Each adapter's `deck/chart-loaders.ts` maps the 60 slugs to `() => import('../<slug>')` and is
  **generated** by `tools/agent-catalog` (and diffed by its `check`). On mount the adapter loads the
  slot's module, empties the slot and mounts the chart: React `createPortal` from `SpDeck`'s tree,
  Vue `render(h(Chart, props), slot)` (with `appContext` for the provider), Angular
  `createComponent(Chart, { hostElement, environmentInjector })` + `appRef.attachView`.
- **Rationale:** the static SVG makes SSR, print, Marp CLI and agents' renders carry the chart
  (research §4); the framework chart produces the same tree (Art. 3), so hydration is a swap that
  adds interaction. Lazy loaders keep a two-chart deck from bundling sixty. PoC F4: the hydrated chart
  measures the canvas width inside a scaled slide.
- **Consequences:** `@silverpoint/marp` carries every recipe (the core's full bundle plus
  `/catalog`): measured into its budget (REQ-628), never on a chart-only path (REQ-616).
  `interactive: false` skips hydration.

### DD-054: Directives and slide annotations as markdown-it core rules

- **Decision:** `ground`, `substrate`, `mode` are registered with
  `marpit.customDirectives.local`, each a function that validates and returns `{ spGround }` etc.;
  a core rule after Marpit's `marpit_directives_apply` writes `data-sp-*`, `role="group"`,
  `aria-roledescription="slide"`, `aria-label="Slide n of N"`, and the backdrop custom property on
  each slide's opening token. Unknown values raise `SP027` through the core's diagnostic sink and are
  dropped, so Marpit's inheritance keeps the previous value.
- **Rationale:** tokens, not string post-processing (the gate parses trees; we should too).

### DD-055: Backdrops are drawn by `@silverpoint/grounds`

- **Decision:** `slideBackdrop(ground, substrate, { kind: 'plain' | 'hatched' | 'plate', seed, mode,
  width, height })` returns a standalone SVG (substrate fill; `hatched`: a band of the ground's tonal
  level 1 tile, `plate`: a double rule inset 24 px, both inked by the ground's inker with
  `preserveVertices`) and its data URI. Seed: `resolveSeed('<deckId>-s<n>')`. In `precision` the
  inker is the `NullInker`. The deck writes it as `--sp-deck-backdrop` on the `<section>`; the theme
  paints `background-image: var(--sp-deck-backdrop, none)` under Marpit's own backgrounds, which
  under inline SVG are separate layers (REQ-588).
- **Rationale:** Art. 2 (amended): inked strokes come from grounds. Art. 4: seeded. Art. 6: tile per
  tonal level, as charts fill.

### DD-056: The theme is generated from ground tokens

- **Decision:** `theme/silverpoint.css.ts` holds the theme's rules over `--sp-*` properties only; a
  build step (`tools/deck-theme`, private) emits `theme.css` with one
  `section[data-sp-ground=…][data-sp-substrate=…]` block per built-in ground × substrate, values read
  from the ground objects, plus `invert` blocks. Inside a deck, the same rules are added to the
  Marpit theme set, so the scoped CSS carries them. Marp CLI and VS Code read `theme.css`: no
  `data-sp-*` attribute exists there, so its `section` default block is the `silverpoint`/`cream`
  one, and `class: cyanotype` selects the other ground (documented degradation, REQ-582).
- **Context:** sizes are canvas px (REQ-580; the PoC's `h1` is identical at `html { font-size: 10px }`).
  Code: EB Garamond, `font-variant-numeric: tabular-nums`, framed plate (DD-010, REQ-578).
- **Consequences:** `tools/contrast-gate` gains the theme's text/rule pairs per ground × substrate ×
  class (REQ-581).

### DD-057: The controller is a reducer; fragments are revealed by CSS from one attribute

- **Decision:** `controller/` is a pure `reduce(state, action) → { state, events }` over the
  transitions of API delta §7.2, wrapped in a tiny emitter; adapters subscribe and copy `state` into
  their reactivity (React `useSyncExternalStore`, Vue `shallowRef`, Angular `signal`). The current
  page and step are written as `data-sp-page`/`data-sp-step` on the deck root and `data-sp-current`
  on the current slide box. A fragment of the current slide whose `data-marpit-fragment` exceeds the
  step carries `data-sp-pending`, and `deck.css` gives `[data-sp-pending]` `visibility: hidden` (box
  kept, out of the accessibility tree); `@media print` and the overview ignore it. The engine emits
  `data-sp-pending` for the initial page and step, and the client moves it on each step (a slide has
  a handful of fragments). Non-current slide boxes get `inert` and `hidden` from the adapter's render.
- **Rationale:** SSR renders the initial state, so the first paint is final (REQ-612); a step
  touches one slide's fragments only; no generated selector per fragment count.

### DD-058: Ids, SSR and the client-only half

- **Decision:** deck id = `id` prop, else React `useId`, Vue `useId`, Angular the adapters' existing
  hydration-safe counter (as charts), sanitised to `[a-z0-9-]`. Server: the engine renders (pure),
  the adapter emits markup and `<style>`; nothing from `./client` is imported at module scope of
  the server entry (React: the client half lives behind `useEffect`; Vue: `onMounted`; Angular:
  `afterNextRender`). Next.js: `SpDeck` is a client component (`"use client"`) that renders on the
  server like any client component. The `hash` binding reads `location.hash` only after mount, so
  the server render uses `page`/`defaultPage`, and a hash then moves the deck (no mismatch).

### DD-059: Gates — fixtures, pixels, three-engine e2e, bundles

- **Decision:** `fixtures/deck/*.deck.md` (6: basic, fragments, directives/grounds, fences + error,
  split backgrounds, classes) × the PR matrix (`silverpoint`, `cyanotype`; `ink`, `precision`).
  Canonical render: `@silverpoint/marp` + a canonical deck shell in `tools/visual-gate`
  (`deck-gate.ts`, DD-017 rules: parsed trees, numbers to 2 decimals). Each adapter's server render is
  compared with it. Pixels: slides at 1280×720 in the pinned Chromium. E2E: a `deck` project in
  each example app, run in Chromium, Firefox and WebKit by a new `browser-deck` CI job in the same
  pinned image (the PoC's `poc-docker.sh` becomes its local runner). Bundles: `tools/bundle-budget`
  asserts no `@marp-team` and no `@silverpoint/marp` module in the one-chart builds and measures the
  `deck` entries (REQ-616, REQ-628).

### DD-060: Agent access to the deck

- **Decision:** `tools/agent-catalog` reads `DECK_DIRECTIVES`, `THEME_CLASSES`, the fence's JSON
  Schema (generated from `ChartFenceSpec`) and `SpDeck`'s props from the types; `@silverpoint/mcp`
  adds `validate_deck` and `render_deck` (engine + `deck.css` + `styles.css` inlined, controls
  omitted, `embedFonts` as `render_chart`). `generate_code { deck }` emits the stylesheet imports of
  API delta §1 and an `SpDeck` per framework. The skill gains `references/deck.md` with compiled
  examples (REQ-557).

## 4. Structure (§5.1) — add

```
packages/marp/
  src/engine/{index.ts, marpit.ts, directives.ts, annotate.ts}
  src/fence/{parse.ts, recipes.ts, render.ts, error.ts}
  src/theme/{silverpoint.css.ts, classes.ts}
  src/controller/{reduce.ts, controller.ts}
  src/client/{bind.ts, scaling.ts, slots.ts}
  src/cli/index.ts   src/demo.ts   src/deck.css
  test/
packages/grounds/src/backdrop.ts
packages/{react,vue}/src/deck/   packages/angular/deck/
tools/deck-theme/      tools/deck-poc/ (the PoC, kept as the local three-engine runner)
fixtures/deck/
```

## 5. Runtime dependency allowlist (§5.3) — add

| Package | Runtime dependencies |
|---|---|
| `@silverpoint/marp` | `@silverpoint/core`, `@silverpoint/grounds`, `@marp-team/marpit` (`^3.2.3`, MIT; brings `markdown-it`, `postcss`, `js-yaml` and five small modules); no peer |
| `@silverpoint/react`, `@silverpoint/vue`, `@silverpoint/angular` | add optional `peer`: `@silverpoint/marp` (same version), imported only by `deck` |
| `@silverpoint/mcp` | add `@silverpoint/marp` |

`check-deps` allows `@marp-team/*` only in `@silverpoint/marp`, and `@silverpoint/marp` in the
adapters only as an optional peer. The Angular docs state `allowedCommonJsDependencies:
["@marp-team/marpit"]` (Marpit is CJS).

## 6. Diagnostics (§7) — add

`SP026`–`SP029` as API delta §9, raised through the core's sink (so `validate_deck` captures them as
`validate_props` does). `SP018` extended to the deck's region.

## 7. Testing (§8) — add

| Level | What | Where |
|---|---|---|
| Unit | directives, fence parse/errors, slug table, annotations, backdrop determinism, controller transitions (table-driven from API §7.2), limits | `packages/marp/test`, `packages/grounds/test` |
| Component | render, navigation, fragments, controlled/uncontrolled, hydration, markdown change, unmount (mount/listener counters) | each adapter's `deck` tests |
| Parity | deck fixtures, server render vs canonical | `tools/visual-gate` |
| Pixel | slides, Chromium | pixel gate |
| E2E | scaling, input, keyboard, fragments, hash, fullscreen availability, print layout | example apps × Chromium, Firefox, WebKit |
| Bundle | REQ-616, REQ-628 | `tools/bundle-budget` |
| Agent | `validate_deck`/`render_deck` contracts and goldens | `packages/mcp/test` |

## 8. Publication (§9) — add

`@silverpoint/marp` joins the `fixed` group as the ninth package. Its first version is published by
hand (`pnpm pack` + `npm publish`, as `mcp`), then its trusted publisher is set and CI publishes the
rest. `0.9.0` is a `minor`: the normalised output of existing charts does not change.

## Constitution check

- **Art. 1, 2** — charts and backdrops come from core and grounds (DD-053, DD-055); the deck package
  computes neither geometry nor colour.
- **Art. 3** — deck fixtures under the tree and pixel gates (DD-059); hydration is a tree-identical
  swap (DD-053).
- **Art. 4** — ids and seeds derived (DD-058, DD-055); the engine is pure.
- **Art. 5, 6** — keyboard, roles, live region, forced precision; fragments hidden from the
  accessibility tree; one heightened thumbnail in the overview (DD-057).
- **Art. 7, 8** — the theme is generated from ground tokens (DD-056); Marpit lives behind an optional
  peer, with the polyfill dropped (DD-051) and a budget (DD-059); no monospace.
