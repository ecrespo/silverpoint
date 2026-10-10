# silverpoint — Technical Design Document

## Metadata

| Field | Value |
|---|---|
| **Author** | Ernesto Crespo |
| **Status** | `IN_REVIEW` |
| **Version** | 1.9 |
| **Date** | 2026-09-29 |
| **Related PRD** | [`prd.md`](prd.md) v1.12 |
| **Related API Spec** | [`api-spec.md`](api-spec.md) v1.10 |
| **Applicable Constitution** | [`constitution.md`](constitution.md) v1.8 |

> **Template adaptation note.** The template assumes a service with a database and queues.
> Here "Security" is read as supply chain (§6), "Observability" as development diagnostics
> (§7), and "Migration / Rollout" as publication strategy (§9).

---

## 1. Context

The central engineering problem is not drawing charts: it is **preventing two
implementations of the same drawing from diverging**. The Constitution turns that into an
invariant (Art. 2 and Art. 3) and this document describes how it is held up in code.

The solution is a one-way pipeline with the mathematics concentrated in a DOM-free
package, a separable inking pass, and adapters that do nothing but translate data
structures into nodes. That `precision` mode exists is not an added feature: it is the
pipeline run with an `Inker` that does nothing.

The second engineering tension is the cost of style. A cross-hatched shape produces dozens
of segments where a flat fill produces one, and that multiplier falls directly on the DOM.
The node budget and its contingency plan (DD-007) are part of the design, not a later
optimization.

## 2. Technical Goals

- **Correctness:** the encoding geometry is identical across modes and across frameworks,
  verified by string comparison with zero tolerance (REQ-006, REQ-180).
- **Determinism:** same input, same SVG string, always (REQ-005).
- **Performance:** geometry for 100 points in < 2 ms; full initial render in < 16 ms;
  ≤ 40 KB of path data per chart.
- **Maintainability:** a new chart is added as a pure recipe in `core/charts/`, without
  touching adapters; a new ground touches no recipe (REQ-044).
- **Consumer operability:** diagnostics with a stable code, stripped in production.

## 3. Proposed Architecture

### 3.1 High-level diagram

```
                    @silverpoint/core   (no DOM, no framework)
  props ──▶ ┌──────────────────────────────────────────────────┐
            │  resolve   scales    recipe      interaction     │
            │  config ─▶ domain ─▶ geometry ─▶ hit-testing     │
            └────────────────────────┬─────────────────────────┘
                                     │  Geometry (exact, serializable)
                                     ▼
                    @silverpoint/grounds
            ┌──────────────────────────────────────────────────┐
            │  ground tokens  +  Inker  (Rough | Null | …)     │
            └────────────────────────┬─────────────────────────┘
                                     │  Geometry (inked, no color)
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
  @silverpoint/react    @silverpoint/vue     @silverpoint/angular
  strokes.map(→<path>)  v-for="stroke"       @for (stroke of …)
            │                    │                    │
            └────────────────────┼────────────────────┘
                                     ▼
                            SVG with `part` attributes
                                     │
                                     ▼
                     styles.css paints by `part` ◀── --sp-* variables
```

The pipeline is one-way and has no feedback. No adapter returns information to the core
except the measured dimensions of the container.

### 3.2 Components

| Component | Technology | Responsibility |
|---|---|---|
| `core/scales` | `d3-scale` | Domains, ranges, ticks; a single implementation for the 15 cartesian charts |
| `core/geometry/*` | `d3-shape`, `d3-chord`, in-house | The recipes: props plus scales produce `Geometry` |
| `core/ink` | in-house | `Inker` interface and `NullInker`. **No dependencies** |
| `core/interaction` | in-house | Hit-testing as a pure function (REQ-140) |
| `core/render` | in-house | Rounding to 2 decimals and serialization |
| `core/diagnostics` | in-house | `SPNNN` codes, strippable by `NODE_ENV` |
| `grounds` | `roughjs` | Declarative tokens, `RoughInker`, `styles.css` |
| `react` | React 18.2+/19 | Translation to JSX; client/server boundaries |
| `angular` | Angular, `ng-packagr` | Translation to template; signals and `OnPush` |
| `core/dashboard` | in-house | `resolveDashboard` (defaults, span clamping, cell matching, chart ids, CSS variables, nominal boxes) and `cellChartBox` (cell box → chart size, reusing `cardLayout`'s chrome measure) |
| `core/interaction/linked` | in-house | `linkedItems`: the items of a model whose datum matches a linked value |
| Dashboard components | react, vue, angular | Call the core, write the wrapper, heading and variables; give the charts below the cell box, chart id and inherited config |
| `.sp-dashboard` rules | `grounds` stylesheet | CSS Grid, the three `@container` breakpoints, gap and heading type from ground tokens |
| `ui/value.ts` | core | `uiValue`: clamp, step rounding, fraction (REQ-324) |
| `ui/progress.ts`, `ui/steps.ts` | core | Circle-progress arc on the existing polar engine; step statuses and connector fractions |
| `ui/keyboard.ts` | core | `uiRovingKey`: APG transitions, orientation and direction (REQ-315, REQ-321) |
| `ui/frame.ts` | core | `uiFrameVariant`; the exact frame outline per frame kind, the input of the piece generator (DD-022) |
| `ui/items.ts`, `ui/names.ts` | core | Key de-duplication (`SP019`), accessible-name check (`SP018`) |
| `src/ui/pieces.ts`, `scripts/build-ui-css.ts` | grounds (build only) | Inks each frame kind and tone level per ground and variant with the ground's own inker, and writes them into `ui.css` as mask images |
| `ui.css` | grounds | Sizes, focus, states, the pieces as masks, the `precision` and forced-colours fallbacks |
| `ui/*` components | react, vue, angular | Bind state, events and forms idiomatically; emit the markup contract (API Spec §7.2) |
| `ui/view*.ts`, `ui/roving.ts`, `ui/tone.ts`, `ui/tokens.ts` | core | Amended in implementation: the markup contract as `ui*View` trees; `uiRovingFocus`, the DOM glue of REQ-315 with structural types; `uiToneTile`; `resolveUiTokens` |
| `charts/shared/stats.ts`, `density.ts`, `distribution.ts`, `beeswarm.ts` | core | Bins, quantiles, five-number summary, ECDF, ranks; Epanechnikov density; the box/violin/ridgeline skeleton; beeswarm packing (DD-029, DD-030) |
| `charts/shared/hierarchy.ts`, `nodes.ts` | core | Stratify (`SP020`), squarify, partition, tidy tree, reroot; what the three hierarchy charts share (DD-028, DD-033) |
| `charts/shared/field.ts`, `delaunay.ts`, `network.ts`, `xy.ts` | core | Grid validation, density grid, marching squares, 2-D bins; Bowyer–Watson with exact predicates and Voronoi cells; the deterministic force layout; the field charts' x-y frame (DD-028, DD-030) |
| `interaction/tree.ts`, `interaction/root-change.ts` | core | The tree keyboard as `HitArea.moves`; `rootChangeOf` (DD-031, DD-033) |
| `catalog.ts` (`@silverpoint/core/catalog`) | core | The second catalog's 27 recipes and their demos (DD-036) |
| `tools/demo-gen` | in-house, build only | Generates the synthetic demos with a fixed seed and prints them as frozen literals (REQ-446) |
| `tools/svg-normalizer` | in-house | Canonical form for the string gate |
| `tools/visual-gate` | Playwright | Art. 3 pixel gates |
| `tools/lint-rules` | in-house ESLint | Forbids `Math.random`, `Date.now` and cross imports |

### 3.3 Data flow

**Main flow: rendering a chart**

```
1. The adapter resolves config: prop → provider → media query → default
2. The adapter measures the container (ResizeObserver) or uses explicit width/height
3. core: accessors extract the series from `data`
4. core: the scales are built; degenerate domain → domainPadding (SP004)
5. core: the chart recipe produces exact Geometry, with role='encoding'
   on every stroke that encodes data
6. grounds: Inker.ink(geometry, inkOptions)
     · mode='precision'  → NullInker returns the geometry untouched
     · mode='ink'        → RoughInker inks role='ornament' and generates role='hatch',
                           preserving the endpoints of role='encoding'
7. core/render: all coordinates are rounded to 2 decimals
8. The adapter maps strokes to <path> with their `part` attribute
9. The CSS paints by `part` from the --sp-* variables
```

**Error and degradation flow**

```
· empty data            → the ground's empty-state geometry, SP001, no exception
· non-finite value      → point omitted, connectNulls is respected, SP002
· 0px container         → render deferred; NaN is never emitted in attributes, SP003
· degenerate domain     → expansion by domainPadding, SP004
· unknown inker         → NullInker, SP006, the render continues
· unknown ground        → silverpoint, SP007, the render continues
· node budget           → switch to <pattern> fill (DD-007), SP011
· scale bound missing and not derivable → SP009 error naming the property
```

Every degradation is *fail-soft* except `SP009`, which is a programming error on the
consumer's side and must break early and with a message that says what is missing.

**Dashboard flow** (API Spec §7.1)

```
DashboardProps + [cell id of each child]  ──►  core.resolveDashboard  ──►  DashboardModel
                                                                         │
            adapter writes <section> + --sp-* vars; per cell <article>   │
                         and a cell context { box, chartId, config } ◄───┘
                                                                         │
chart inside cell: id ?? chartId; size ?? core.cellChartBox(box, props) ─┘──► existing chart pipeline

The cell context reaches the chart as a prop set by the cell (`cloneElement` in React), not through
a framework context, in React: a context needs a `"use client"` provider, and the dashboard must
render inside a Server Component with no client boundary of its own (REQ-104). Vue and Angular use
`provide`/`inject` and DI. Consequence: a cell's direct child is its chart. A server chart's `id`,
`width` and `height` are optional by type, because a cell supplies them. Standing alone, a missing
one warns (`SP002`, `SP003`) instead of failing to compile.

client only, when `link`:  chart A active item ─► dashboard link value (one reactive value)
                           ─► each chart: core.linkedItems(model, key, value) ─► `part="linked"` marks
```

Degradation: a span wider than its breakpoint is clamped (`SP014`); layout and children that
disagree are reconciled in source order (`SP015`); a linked chart without the key shows no mark
(`SP016`). None throws.

**UI component flow** (API Spec §7.2)

```
build time (grounds):
  core.uiFrameOutline(kind) ──► ground.inker.ink(outline, variant seed) ──► 9 pieces per kind × variant
  ground.tonalRamp ──► tone tiles                                          ──► ui.css (mask images, no colour)

render time (adapter, server and client):
  props ──► core.uiValue / uiSteps / uiProgressArc / uiFrameVariant ──► fractions, arcs, data-frame
        ──► element tree of API Spec §7.2, with --sp-ui-fraction etc. as inline custom properties
  CSS: ::before paints var(--sp-ink) through the piece mask; `precision` swaps it for an exact border

keyboard (client):
  keydown ──► core.uiRovingKey(state, key, orientation, dir) ──► index ──► focus + (automatic) select
```

No step measures the DOM, runs an inker, or reads the clock at render time.

## 4. Design Decisions

### DD-001: Headless core with thin adapters

- **Decision:** all geometry in `@silverpoint/core`, free of DOM and of framework;
  React, Vue and Angular only translate.
- **Context:** `recharts` is React-only and there is no shared equivalent with Angular.
  A choice has to be made about where the drawing lives.

| Option | Pros | Cons |
|---|---|---|
| **A. Headless core (chosen)** | A single source of truth; SSR without JS; `precision` mode for free; string gate made possible | Axes, tooltip and responsive measurement have to be reimplemented |
| B. Native library per framework | The fastest way to ship React | Visual drift guaranteed; the design *is* the product |
| C. Web components plus wrappers | One implementation for every framework | Weak SSR and RSC; style encapsulation fights with variable-based theming |

- **Rationale:** the design uses a narrow subset of what a charting engine offers —no brush,
  no zoom, no legend, fixed margins, one or two series— and 8 of the 33 charts are already
  hand-written geometry. The cost of reimplementing is bounded; the cost of drift is not.
- **Consequences:** the adapters are thin and cheap to add. Vue or Svelte would be small
  increments in the future.

### DD-002: `rough.js` isolated behind `Inker` and housed in `grounds`, not in `core`

- **Decision:** `core` defines the `Inker` interface and `NullInker` **with no
  dependencies**; `RoughInker` and the `roughjs` dependency live in `@silverpoint/grounds`.
- **Context:** Art. 7 requires grounds to be data, and not all of them share a tonal
  mechanism: `cyanotype` encodes by stroke weight and `wash` by washes, things `rough.js`
  does not know how to do.
- **Rationale:** besides allowing several inkers, it moves `roughjs` out of the base
  package. A consumer who only uses `mode="precision"` does not download it, which is money
  straight against the 45 KB budget.
- **Consequences:** the runtime allowlist of `core` is reduced to `d3-*`. If `rough.js`
  were left unmaintained, one package gets replaced, not the core. The second inker,
  `WeightInker` (DD-019), lives beside it and does not use `rough.js` at all.

### DD-003: The equality gate runs in Node, with the server renderers

- **Decision:** the Art. 3 string gate compares the output of `renderToStaticMarkup`
  (React) with that of `renderApplication` from `@angular/platform-server`, in Node,
  without a browser.
- **Context:** the gate could be run by reading `outerHTML` in Playwright.

| Option | Pros | Cons |
|---|---|---|
| **A. SSR in Node (chosen)** | Seconds, not minutes; no browser flakiness; exercises the SSR requirement along the way | It sees nothing that depends on browser layout |
| B. `outerHTML` in the browser | Compares exactly what is shipped | Slow, subject to timing and to browser startup |

- **Rationale:** the string gate verifies geometry, which is independent of layout; what
  does depend on the browser is covered by the pixel gate. And running every adapter under
  SSR satisfies REQ-103 with no extra work.
- **Consequences:** every adapter has to render on the server, which was already a
  requirement. The gate is fast enough to run on every PR over the full matrix.

### DD-004: The gate compares parsed trees, not normalized strings

- **Decision:** both outputs are parsed with a conforming parser and compared as trees:
  tag, sorted attributes, rounded numeric values and text with entities already resolved.
  `tools/svg-normalizer` filters, by explicit list, the attributes Angular adds
  (`ng-*`, `_ngcontent-*`, `ngh`) and normalizes generated `id`s to a stable counter.
- **Context:** the alternative was to make the strings equal through substitutions.
  Measured over `renderToStaticMarkup`, React produces:

  ```
  <path d="M 1.50 2.25 L 3 4" stroke-width="0.9" part="sp-ink"></path>
  <text x="0" y="0">Throughput &amp; &quot;hatching&quot; &lt;1&gt;</text>
  ```

  Attributes in JSX order, explicit closing instead of self-closing, and quotes escaped to
  `&quot;` inside the text itself. Angular's serializer differs on all three counts and
  additionally injects attributes of its own.

| Option | Pros | Cons |
|---|---|---|
| A. Normalize strings with substitutions | No parser | Fragile: it breaks the moment a framework changes serializer |
| **B. Compare parsed trees (chosen)** | Immune to self-closing, to entities and to attribute order **by construction** | About eighty lines or one small development dependency |
| C. Have the core emit the string and the adapters inject it | Eliminates the divergence at the root | Requires `innerHTML`, which clashes with §6, and breaks React's interaction |

- **Rationale:** the parser undoes the entities and self-closing disappears when the tree is
  built, so the three measured differences cease to exist instead of being patched. It does
  not reduce the probability of a false positive: it takes it to zero.
- **Consequences:** attribute order and serialization form fall outside the contract.
  Generated `id`s are part of it, and that is why they are normalized instead of ignored.
  The list of filtered attributes is explicit and versioned: a new Angular attribute breaks
  the gate until someone adds it deliberately, which is the desired behavior.

### DD-005: `d3-chord` for the ribbon generator

- **Decision:** `ChordRing` (REQ-091) rests on `d3-chord`; the conversion of
  `{source, target, value}` rows into a matrix lives in `core`.
- **Context:** API Spec §8.3 left the choice open.
- **Rationale:** it is ~3 KB, the same ecosystem and the same maintainers as `d3-shape`, and
  the angular allocation of a flow matrix is solved work with no differential value. Its
  generator returns a `d` string, which is exactly what the pipeline consumes.
- **Consequences:** `d3-chord` enters the allowlist. The matrix conversion is ours, so the
  ceiling of 12 categories (SP010) is applied before calling the library.

### DD-006: Seed and PRNG

- **Decision:** the derivation from `id` to seed uses 32-bit FNV-1a implemented in `core`,
  with no dependency. The inking PRNG is `rough.js`'s internal one, fed with that seed.
- **Rationale:** a twelve-line hash function is preferable to a dependency, and owning it
  guarantees that the derivation will not change because of someone else's update —which
  would break every consumer's golden images.
- **Consequences:** the derivation function is frozen by SemVer: changing it is *major*.

### DD-007: Shared tile fill by tonal level

- **Decision:** areas are filled with a hatching `<pattern>`, one per tonal level and per
  chart instance. Shape-by-shape hatching remains an explicit consumer option
  (`hatchFill: 'per-shape'`).
- **Context:** it was the PRD's highest-impact risk, and measurement reframed it.
  `rough.js` emits **2 `<path>` elements per shape whatever the density**, so element count
  was never the problem. What grows is the bytes of the `d` attribute:

| Shape | `<path>` | Plain hatching | Cross-hatching |
|---|---|---|---|
| Bar 33×110, gap 4.5 | 2 | 6.6 KB | 13.0 KB |
| Area 320×150, gap 4.5 | 2 | 21.3 KB | 41.3 KB |
| Area 320×150, gap 7 | 2 | 15.5 KB | 29.9 KB |

  A 6-bar card with cross-hatching weighs 76 KB of path data; a 12-card dashboard, 913 KB —
  which additionally travels inside the server's HTML.

| Option | Pros | Cons |
|---|---|---|
| A. Per-shape hatching always | Maximum fidelity; every shape drawn separately | 913 KB in a 12-card dashboard |
| B. Area threshold | An apparent compromise | **Rejected:** within one and the same chart the small shapes would come out hatched and the large ones tiled, and the boundary would move when the data changed. The same chart would look different with another dataset |
| **C. Tile per tonal level (chosen)** | Cost ~1 KB per level; uniform whatever happens with the data | The stroke variation between shapes is lost; it is preserved inside the tile |

- **Rationale:** tone is quantized on the ramp, so there are few distinct levels and one
  tile per level covers the whole chart. Option B was rejected not on cost but on
  data-dependent inconsistency, which is worse than either of the extremes.
- **Complementary levers, already applied:** default gap 7 instead of 4.5, which almost
  halves the bytes and is more faithful —an engraving has countable lines—, and rounding to
  2 decimals instead of 3 (REQ-002), which takes off another ~15% and also makes the DD-004
  gate easier.
- **Consequences:** the id of each tile is derived from the seed and scoped to the instance
  (REQ-030), so that two charts on the same page do not share a definition. The tile's
  children keep their `part` attribute and receive color from CSS like any other stroke,
  because they live in the same SVG. **The tile is still hatch density and angle, so there
  is no exception to Art. 6 to ask for.**

### DD-008: Nx as the monorepo orchestrator

- **Decision:** pnpm workspaces with Nx.
- **Rationale:** Angular is the deciding factor: first-class generators and executors, and
  orchestration of `ng-packagr` without manual wiring. The affected graph matters when the
  visual regression matrix is expensive.
- **Live alternative:** Turborepo plus manual Angular configuration. Lighter, and
  replaceable without touching the packages' code.

### DD-009: Template-driven rendering in Angular and Vue

- **Decision:** declarative templates — `@for` with `[attr.d]` in Angular, `v-for` with
  `:d` in Vue — not imperative DOM construction.
- **Rationale:** it is idiomatic, it works with `OnPush` and signals, and it produces
  predictable markup. Imperative construction would give more control over attribute order,
  control that DD-004 makes unnecessary.

### DD-010: Typography — self-hosted EB Garamond, no monospace

- **Decision:** `@silverpoint/fonts`, an optional package, with EB Garamond in three cuts
  —400 normal, 500 normal and 400 italic— in woff2 subset to Latin, plus its `@font-face`
  rules. No monospace family.
- **Context:** Art. 3 requires self-hosted typography, because a system serif stack does not
  exist identically on Linux, Windows and Android and the pixel gate would stop meaning
  anything.
- **Rationale:** EB Garamond is a free digitization of Claude Garamont's romans and Robert
  Granjon's italics, taken from the Berner specimen of **1592**. It does not evoke the
  period: it is of the period. **SIL OFL** license, which permits commercial use,
  modification and packaging; it obliges us not to reuse the Reserved Font Name in a
  derivative —and subsetting counts as deriving— and not to sell it on its own.
- **Verified, not assumed:** the features of the Latin subset were inspected, `tnum`
  (tabular figures) **is present**, which was the critical one for a charting system.
  `smcp` **is not** in the Google Fonts build, so the small-caps lines are set with
  `text-transform: uppercase` and open tracking, which is also deterministic in any engine.
  336 glyphs and 23.8 KB per cut; ~72 KB for all three.
- **No monospace:** monospace is an invention of the typewriter and has no place in a
  Renaissance ground. What motivated its use —aligning figures— is solved by `tnum`. An
  entire family is saved and the set gains coherence.
- **Consequences:** the package is optional. Whoever does not install it falls back to the
  system stack, which is acceptable for them but invalidates the golden images; the
  documentation says so. CI always installs it. **A font-load failure is observable and
  reported as `SP013`**, because falling back silently would invalidate the consumer's
  golden images.

### DD-011: Package resolution under a bundler

- **Decision:** the `exports` map is authored so that Vite's dev server and its production
  build resolve every subpath the same way, and `sideEffects` is `false` everywhere
  **except** `*.css`. No consumer ever needs an `optimizeDeps` entry.
- **Context:** React, Vue and Angular are the frameworks, but none of them resolves modules —
  the bundler does. Vite hosts the React example and, since Angular 17, the Angular CLI as
  well, so it is the single most exercised resolution path in the project and until now it
  had no requirement of its own while Next.js had REQ-103.
- **The three failure modes this closes:**

| Failure | Why it happens | Guard |
|---|---|---|
| Works in `vite dev`, breaks in `vite build` | Dependency pre-bundling resolves a dual ESM/CJS package one way in dev and another in Rollup | Both modes exercised in CI, not just dev |
| The stylesheet silently disappears | `sideEffects: false` lets the bundler drop a CSS import whose result is never referenced | `sideEffects: ["*.css"]` |
| A subpath resolves to the barrel | `exports` conditions ordered so `default` shadows `import` | Condition order asserted by a resolution test |

- **Justification:** each of these produces a bug that looks like the library is broken while
  the failure is really in its published metadata. They cost the consumer an afternoon and
  cost us the report.
- **Consequences:** the example apps stop being demos and become the integration bench they
  were always described as. The Vite check runs in CI in both modes, which is cheap, and it
  covers Angular's resolution path for free.

### DD-012: The Vue adapter

- **Decision:** Vue 3 components authored with `<script setup>`, typed props and typed
  emits, built with `tsup` like the React adapter, server-rendered through
  `@vue/server-renderer` for the string gate.
- **Context:** Vue contributes a component layer, so unlike a build tool it earns an
  adapter. The question was how thin that adapter can be.

| Option | Pros | Cons |
|---|---|---|
| **A. `<script setup>` SFC (chosen)** | Idiomatic; typed props and emits come free; `v-for` produces the same predictable markup as Angular's `@for` | Needs an SFC compile step in the build |
| B. Render functions in plain TS | No SFC toolchain; closest to the React adapter | Non-idiomatic for Vue consumers; loses template-level type checking |
| C. Web component wrapper | One implementation for Vue and anything else | Loses typed props and emits, and Vue users would pay for encapsulation they did not ask for |

- **Justification:** the adapter is thin by Art. 2, so the SFC compile step is the only real
  cost and `tsup` absorbs it. Option B would have been defensible on symmetry alone, but a
  Vue library that does not look like Vue is not adopted.
- **No Nuxt.** A Nuxt app consumes the package like any other Vue app. Nuxt is **not** a
  validated integration in the `0.x` line: SSR parity is verified directly with `@vue/server-renderer`
  (REQ-109), which is what the gate needs and what a meta-framework would only wrap. Adding
  Nuxt later is an example app and a CI job, not an architectural change.
- **Consequences:** three adapters is where the thin-adapter discipline of Art. 2 stops
  being a principle and starts paying: the Vue adapter is the same translation written a
  third time, and none of the geometry, interaction or inking is touched.

### DD-013: Composition by children, layout matched by cell id

- **Decision:** charts are children (`<DashboardCell cell="traffic"><LineChart/></DashboardCell>`);
  the layout is a separate, data-only object matched to children by `cell` id.
- **Options:**

| Option | For | Against |
|---|---|---|
| **A. Children + layout by id (chosen)** | Each chart is imported by its own subpath (REQ-107 holds); the layout is JSON and becomes the fixture; framework-idiomatic | Two things to keep in step — mismatches are warned, never thrown (REQ-205) |
| B. JSON cells naming chart types (`{ chart: 'LineChart', props }`) | One object describes everything (Highcharts, Grafana) | Needs a registry of all 33 charts, which defeats tree-shaking; props lose their per-chart types; functions (tooltip renderers) cannot live in JSON |
| C. Coordinates (`row`, `col`, `x/y/w/h`) | Precise placement | Serves drag-and-drop, which is out of scope; lets visual order diverge from DOM order (WCAG 1.3.2) |

### DD-014: CSS Grid with container queries, three fixed breakpoints

- **Decision:** the wrapper is `display: grid; container-type: inline-size`. Columns and spans are
  CSS variables written from the model; the stylesheet switches between the `sm`/`md`/`lg`
  variables with `@container` at 640 px and 1024 px.
- **Context:** `@container` conditions cannot read `var()`, so breakpoint widths cannot be
  per-dashboard props; they are fixed and documented, while columns and spans per breakpoint stay
  configurable.
- **Rejected:** viewport media queries (a dashboard in a sidebar is narrow on a wide screen);
  JS-measured placement or masonry (DOM measurement to place cells — REQ-202 — and a server render
  that cannot match the client).
- **No `order`, no `dense`, no line placement** (REQ-203): `grid-auto-flow: row`. A wide cell that
  does not fit leaves a gap at the row end rather than pulling a later cell forward. The
  documentation shows how to order cells to avoid gaps.

### DD-015: Nominal boxes in the core; hydrate at nominal, then measure

- **Decision:** the core computes each cell's box at `ssrWidth` for the `lg` breakpoint — when
  `ssrWidth` is under 1024 px, for the breakpoint it falls in —
  `width = (ssrWidth − gap·(cols−1)) / cols · span + gap·(span−1)`,
  `height = rowHeight·rowSpan + gap·(rowSpan−1)`, 2 decimals. `cellChartBox` subtracts the chart's
  card chrome (title, value, footers — already known to `cardLayout`) from the height.
  The server and the hydration pass render at that box; after hydration, the chart's existing
  container measurement takes over (REQ-207).
- **Rejected:** requiring `width` on every chart in a server-rendered dashboard (unusable); scaling
  one SVG by `viewBox` to fill the cell (scales text off the type scale of DD-010 and the 9.5 px
  label rules, and breaks the golden images).
- **Consequence:** a phone that receives a server render sees one re-render after hydration; the
  first paint is still a correct chart, only at the nominal width. Documented, and `ssrWidth` lets
  a mobile-first app choose `360`.

### DD-016: Linked interaction — one value per dashboard, matching in the core

- **Decision:** the dashboard holds one reactive value `{ key, value } | null`. A chart publishes
  its active item's `datum[key]`; every other chart asks `linkedItems(model, key, value)` and marks
  those items with `part="linked"`. Matching is by **value**, like Recharts' `syncMethod: 'value'`,
  never by index — charts with different rows still line up, and a chart without the value shows
  nothing (REQ-217).
- **Why value, not index:** index matching is right only when every chart shares the same rows,
  which a dashboard rarely does.
- **Not an active item:** the linked mark fires no `onActiveChange`, no readout, and no
  announcement (REQ-218); it is `aria-hidden` decoration over the chart.
- **Client only** (REQ-219): the React server entry point rejects `link` by type; the Vue and
  Angular server renders never hold a value.

### DD-017: Parity extends to the wrapper markup

- **Decision:** dashboard fixtures render wrapper + charts. The DD-004 tree comparison parses the
  whole fragment (HTML wrapper and inline SVG) with the same parser and compares element names,
  attributes (sorted) and text; numbers in `style` variables are compared at 2 decimals like
  coordinates. No string normalisation is added.
- **Pixel gates** run each dashboard fixture at three container widths — 375, 800, 1280 px — one
  per breakpoint (REQ-211).
- **Framework noise:** adapters must not emit comments or empty text nodes in the wrapper; the
  existing rule that strips framework hydration markers from chart SVG is applied to the wrapper
  too, and it is the only stripping allowed.
- **As implemented, three rules, each a parse and none a string patch:**
  1. **Comments.** Comments are kept, except the hydration markers on an explicit, versioned
     list: Vue's `[`, `]`, `v-if` and the empty comment; Angular's `container`, `ng-container`,
     `ngh` and `bindings={…}`. Any other comment is a difference.
  2. **Style.** `style` is compared as its declarations, in order, with numbers at 2 decimals, so
     Vue's trailing `;` is serialisation, not content.
  3. **Angular hosts.** Angular's component host elements (`sp-*`, e.g. `<sp-line-chart>`,
     `<sp-chart-frame>`) are transparent, because React and Vue write no `sp-` element.

  The canonical render is drawn from the core alone (`dashboardView`, `inCell`, the render
  pipeline) and serialised by a reference writer in `tools/visual-gate`, never by an adapter.

### DD-018: No new package; `dashboard` subpath in each adapter

- **Decision:** the code lives in the existing packages behind a `dashboard` subpath each.
- **Why:** the six packages share one version (Changesets `fixed`), and a new package would need its
  own trusted publisher before its first release; the dashboard depends on internals of each
  adapter (chart context, measurement) that a separate package would have to make public.
- **Cost, measured (2026-09-26).** Over its one-chart build, min+gzip: React client 1,872 B,
  React server 1,731 B, Vue 1,929 B, Angular 2,492 B. Angular's own code is as small as React's;
  its partial-compilation output (APF) carries each component's template twice (the declaration
  and the class metadata) and a record for each of its 13 signal inputs. REQ-220 therefore
  allows 2 KB for React and Vue and 3 KB for Angular (delta-012), and CI measures the increment
  itself, not only the total.

### DD-019: The `weight` tonal mechanism — a second inker, and the tone written as `data-weight`

- **Decision:** the `cyanotype` ground declares `tonalMechanism: 'weight'` and the inker
  `'weight'`. `WeightInker` (in `@silverpoint/grounds`) turns each toned shape into its own
  outline, `paint: 'stroke'`, with the internal `Stroke.tonalWeight` set to its tonal level, and
  returns every other stroke untouched. `Stroke.weight` keeps its own meaning, a relative weight
  that `BulletChart`'s target tick already carries and that the view does not write. The view writes the level as `data-weight`; the stylesheet turns it
  into `stroke-width: calc(var(--sp-stroke-width) * var(--sp-weight-N))`, with the four
  multipliers declared by the ground (its `tonalRamp` of `{ style: 'weight' }` steps).
- **Context:** REQ-028 asks for value by line weight and no hatching. A cyanotype is a contact
  print: its line is exact, white on Prussian blue, so the inker does not roughen ornament
  either.
- **Alternatives:**

| Option | For | Against |
|---|---|---|
| **A. Level in `data-weight`, width in CSS (chosen)** | Width is paint, and paint lives in CSS (REQ-042); a consumer re-weights with one variable; the SVG stays identical across themes | One more attribute for the three adapters to map |
| B. `stroke-width` attribute on the path | No CSS rule | Paint in the markup, against REQ-042 and Art. 8; the width could not follow `--sp-stroke-width` |
| C. Keep hatching, thicken the hatch lines | Reuses `RoughInker` | Still hatching, against REQ-028's "SHALL omit all hatching" |

- **Consequences:** under `weight`, `hatchFill` has no effect, so the fixture matrix collapses
  that axis for `cyanotype`. `precision` mode is still `NullInker`: no hatch under `hatch`, no
  weight under `weight`, the same encoding vertices (REQ-006). A single-substrate ground
  declares its colours on the ground-wide rule, so an unnamed or foreign `substrate` still
  paints it.

### DD-020: The Tailwind preset — a package of names, with no dependencies

- **Decision:** `@silverpoint/tailwind` is a seventh package in the `fixed` group. It has two
  entry points: `theme.css` (`@theme inline`, Tailwind 4) and a JS preset (`theme.extend`,
  Tailwind 3.4). Both are generated from, or held equal to, one mapping in `src/tokens.ts`. It
  declares no `dependencies` and no `peerDependencies`, and no package depends on it.
- **Context:** REQ-047 wants the preset "in a separate package … without the core depending on
  it". Art. 8 and REQ-043 forbid requiring Tailwind, and the Phase 0 exit criterion was "no Tailwind
  anywhere in the dependency tree".
- **Alternatives:**

| Option | For | Against |
|---|---|---|
| **A. Separate package, names only, no peers (chosen)** | Nothing reaches a consumer who does not install it; the values stay in the grounds, so variable overrides and ground switches keep working | One more package to publish, with its own trusted publisher |
| B. A subpath of `@silverpoint/grounds` | No new package | Every grounds consumer would ship Tailwind-shaped files, and REQ-047 says "separate package" |
| C. Copy the colours into the preset | Works with opacity modifiers under 3.4 | Two sources for one palette, against Art. 7 and the contrast gate; overrides and grounds would stop reaching the utilities |

- **Consequences:** under 3.4 a variable colour takes no opacity modifier. The tests compile both
  entry points with real Tailwind, as dev-dependencies of the tests only. The first version is
  published by hand, so that npm knows the name and its trusted publisher can be set; CI publishes
  every later version (§9).

### DD-021: A `ui/` subpath in each existing adapter; no new package

- **Decision:** components live in `@silverpoint/react|vue|angular` under `ui/<name>`, their core in
  `@silverpoint/core` (`src/ui/`), their stylesheet as a second file of `@silverpoint/grounds`.
- **Options:**

| Option | For | Against |
|---|---|---|
| **A. `ui/` subpath (chosen)** | Same reasoning as DD-018: one version, no new trusted publisher, shared internals (provider, config resolution, diagnostics) stay private | Adapter packages grow in scope; mitigated by subpaths, `sideEffects: false` and budgets (REQ-330) |
| B. New `@silverpoint/ui-react`, `-vue`, `-angular` | Clear identity, separable adoption | Three new packages to register and trust-publish; the provider and resolution chain would have to become public API |
| C. Web components (Lit) once for all | One implementation | Loses the per-framework SSR parity silverpoint guarantees; forms and `v-model`/CVA integration become adapters anyway; PRD §5.2 keeps web components out of `0.x` |

- **Decided** 2026-09-28 (OQ-U1): the `ui/` subpath.

### DD-022: Frames as build-time pieces, laid as a multi-layer CSS mask

- **Decision:** for each ground, frame kind (`control`, `pill`, `box`, `card`, `round`) and variant
  (0..3), the build inks the exact outline once with the ground's inker and cuts it into 9 pieces
  (4 corners, 4 edges, no centre). `ui.css` lays them on the frame element itself
  (`[part='sp-frame']`, absolutely positioned over the box) as eight `mask-image` layers, all
  `no-repeat`: corners at their size, edges stretched along their own axis only, so a horizontal
  edge keeps its line's thickness. `box` and `round` frame fixed-size squares and are laid as one
  whole piece. The frame is painted with `background: var(--sp-ink)`; the URL list is one custom
  property (`--sp-ui-mask`) read by both `mask-image` and `-webkit-mask-image`, so no image is
  written twice. The component chooses a variant with `data-frame` (REQ-307).
- **Spike, Phase 2 (2026-09-28):** the technique was rendered from the real pieces in the pinned
  Playwright image in Chromium, Firefox and WebKit, identically in the three
  ([`spike-dd-022/`](spike-dd-022/)). Two findings: edges repeated with `round` would show a step
  at every seam (a hand line does not end where it began), hence the axis stretch; and a mask URL
  must live in a stylesheet rule, never in a `style` attribute, whose quotes it breaks.
- **Tone tiles** are the core's `uiToneTile`: each line family clipped to the rectangle that is its
  own period (width `n·gap / |sin θ|`, height `n·gap / |cos θ|`), so a tile at −41° repeats without
  a seam although a CSS mask cannot rotate a repeating image as an SVG pattern can. Cross-hatch is
  a second layer with its own period. Their lines are `ornament`, drawn by the ground's inker.
- **Text over a tone** sits on a plate of the substrate (`.sp-ui-plate`), as a chart label sits on
  its halo; the heightened item's plate is `--sp-heighten` outlined in ink.
- **Why a mask:** a `border-image` from an SVG cannot read CSS custom properties, so colour would be
  baked in (REQ-042 forbids it). `mask-border` is not in every engine; eight plain mask layers are.
- **Rejected:** SVG per element sized by `ResizeObserver` (DOM measurement, JavaScript per element,
  a server render that cannot know the size); one SVG stretched with `preserveAspectRatio="none"`
  (stretches the stroke's own width and wobble, so the hand drawing changes with the box).
- **`precision`:** the frame mask is removed and the tone is unchanged (hatch tiles, or weights under a `weight` ground, stay: tone is value, not ornament; C-7); the frame is `border: 1px solid var(--sp-rule)` with
  `--sp-ui-radius`. The layout box is identical because the frame never takes layout space in either
  mode (it is an absolutely positioned element over a fixed padding box) — REQ-306, I-17.
- **Forced colours:** REQ-123 already forces `precision`; the plain border then takes the system
  colour.
- **Weight grounds** (`cyanotype`): `ui.frame` is `'css'`; no pieces are generated, the frame is a
  border whose width follows `--sp-weight-n`.

### DD-023: Behaviour in the core, on native elements; no headless library

- **Decision:** native elements carry keyboard, forms and accessibility wherever they exist
  (REQ-314). The remaining behaviour —roving focus in Tabs, RadioGroup-like composites, value
  stepping— is a handful of pure functions in `@silverpoint/core` (`uiRovingKey`, `uiValue`) that
  every adapter calls.
- **Options:**

| Option | For | Against |
|---|---|---|
| **A. Core-owned transitions + native elements (chosen)** | One engine for three adapters (Art. 2); no dependency (Art. 8, REQ-303); the library owns the markup, so parity holds (Art. 3) | Only viable for simple patterns; overlays need more (hence PRD §5.2) |
| B. Zag.js machines | One engine, props spread by adapters | No official Angular adapter; a new runtime dependency |
| C. React Aria + Reka UI + Angular Aria | Mature, audited | Three engines, three markups: parity cannot hold; three dependencies |

- **Revisit** when overlays are specified (PRD §5.3).

### DD-024: Angular Button and Input are attribute components on the native element

- **Decision:** `button[spButton]`, `a[spButton]`, `input[spInput]`. The consumer writes the native
  element; the component decorates its host. React and Vue render the same native element
  themselves, so the parsed markup is identical (REQ-327).
- **Why:** a wrapping `<sp-button>` element would add a host element that React and Vue do not emit
  (breaking parity) and would put a custom element between a `<form>` and its submit button.
- The other components are element selectors: their root is not a native control.
- **Amended in Phase 3 (2026-09-28):** `SpInput` is an element too (`<sp-input>`): an `<input>` has no
  children, so an attribute component on it could draw neither the frame, nor the ⚠ glyph, nor the
  message (C-1). Only `SpButton` decorates a native element.

### DD-025: Value geometry as fractions, written as custom properties

- **Decision:** a linear value becomes `--sp-ui-fraction: 0.42` on the component root, 2 decimals,
  computed by `uiValue`. CSS sizes the fill (`inline-size: calc(var(--sp-ui-fraction) * 100%)`) and
  positions the thumb. Only the circle Progress and the glyphs (tick, dash, dot, lozenge, ✕, status marks) are
  SVG, in fixed view boxes, with `role: 'encoding'` strokes the inker never touches.
- **Why:** a fraction is independent of the container, so the server render is correct at any width
  with no measurement; pixels would need the width.
- **Exactness:** the fraction is the value; the CSS maps it linearly. The thumb's centre sits at
  exactly `fraction` of the track (a test compares the computed style positions in the e2e job).

### DD-026: Tone on controls from the ground's ramp

- **Decision:** under a `hatch` ground, tone levels 1-4 are the ground's own hatch tiles, generated
  at build time like the frame pieces and laid as a repeating mask painted with
  `var(--sp-ink-secondary)`. Under a `weight` ground, the tone is the frame's line weight
  (`--sp-weight-1..4`), as for charts (DD-019). No opacity, no flat fill (REQ-308).
- **Mapping:** checked, selected and filled use level 3; the `primary` Button variant level 2; the
  `danger` variant level 4 plus its ✕ glyph; disabled level 1 plus the native `disabled` state
  (REQ-310). An Alert of kind `error` fills its box with level 1 (`ui.tone.alertError`), plus its ✕
  glyph and `role="alert"`; the other kinds take no tone. Level 1 is the lightest, so the Alert's
  text keeps 4.5:1 over it, and the pair joins the contrast gate (Data Model §3.8, C-3).
- **Rate** marks are exact lozenges (C-2): a drawn diamond reads as the engraver's mark where a
  five-pointed icon reads as the web's; filled marks take level 3.
- **Steps** connectors carry the status of the step they lead to in `data-status`; a `wait`
  connector is dashed, the others solid, both exact (C-4). The dash is a CSS `stroke-dasharray` on
  the exact line, not an inked stroke.

### DD-027: Components join the parity and pixel gates as fixtures

- **Decision:** a component fixture renders one component in one declared state (Data Model §5)
  inside a fixed-width harness. The DD-004 tree comparison and DD-017's rules apply unchanged (no
  comments, no empty text nodes; the only stripping allowed is the frameworks' hydration markers).
  Fixture ids are required, so every related id is `${id}--${part}` (REQ-329).
- **Pixel gates** run at the fixture's declared width (320 px; 640 px for Card and Alert).
- **Amended in implementation (2026-09-28/29):** the markup contract is the core's `ui*View` trees,
  and a fixture's canonical render is that tree written by a reference writer
  (`tools/visual-gate/ui-canonical.ts`), not the React render (as DD-017). Batches join the gates by
  being added to `GATED_BATCHES` (tools) and `UI_GATED_BATCHES` (harness).

**Second catalog** (feature-003, DD-028..DD-036):

### DD-028: Every algorithm is owned by the core; no new dependency

- **Decision:** the core **owns** every statistic and layout of this feature: binning, quantiles,
  kernel density, ECDF, ranking, beeswarm packing, waffle allocation, mosaic, the hierarchy layouts
  (stratify, squarify, partition, tidy tree), 2-D binning, marching squares, the Delaunay
  triangulation and its Voronoi dual, and the network layout. **No runtime dependency is added**; the
  allowlist of §5.3 is unchanged. *User decision, 2026-10-08 (OQ-C2).*
- **Context:** the first catalog took `d3-chord` as "solved work with no differential value"
  (DD-005). For this feature the user chose the other rule of §5.3 —owning the code prevents the
  surface from growing without anyone noticing— and it also buys something DD-005 did not need:
  **control over floating point** in every derived coordinate (REQ-435), which a library can change
  under a minor version and silently move every consumer's golden images.

| Option | Pros | Cons |
|---|---|---|
| **A. Own everything (chosen)** | No new dependency (Art. 8); every operation inside a sum or iteration is ours to keep correctly rounded (REQ-435); nothing upstream can move a canonical | More code to write and test: tidy tree, squarify, marching squares and Delaunay are subtle |
| B. Own the small, take `d3-hierarchy`, `d3-contour`, `d3-delaunay` | Battle-tested generators | Three allowlist entries; `d3-contour`'s density and `d3-delaunay`'s float paths are not under our REQ-435 discipline; rejected by the user |
| C. Also take `d3-force` | Familiar API | Trigonometric initial placement; see DD-030 |

- **How the subtle ones are made safe:**
  - **Tidy tree** — Buchheim, Jünger and Leipert's linear-time Reingold–Tilford; arithmetic only.
    Tested against hand-computed layouts of the classic cases (unbalanced subtrees, a single chain,
    wide fan-out) and the property "no two nodes of one depth closer than the node gap".
  - **Squarify** — Bruls, Huizing and van Wijk; worst-aspect-ratio comparison by multiplication and
    division only. Property: tile area ∝ value (I-25), tiles disjoint and covering their parent.
  - **Marching squares** — the 16-case table with linear interpolation on cell edges and the two
    saddle cases resolved by the cell's centre average; rings assembled and oriented so filled bands
    use the even-odd rule. Point density for `source: 'points'` is a grid splat of the Epanechnikov
    kernel (DD-029), not a blur, so it stays polynomial.
  - **Delaunay** — Bowyer–Watson, points inserted in `(x, y, index)` order after snapping to the
    2-decimal output grid, i.e. integers in hundredths of a pixel. `orient2d` is exact in doubles at
    that magnitude; `inCircle` is evaluated in doubles with a static error bound and, when the bound
    is inconclusive, **exactly with `BigInt`**. Degenerate inputs (duplicates, collinear sets) are
    handled by the predicates, not by perturbation. The Voronoi cells are the triangles'
    circumcentres, clipped to the plot by Sutherland–Hodgman.
- **Weight:** the code lives in the new `charts/shared` modules (§3.2), reached only from the recipes that use
  it, so it tree-shakes out of every other chart (REQ-444). Each new chart is held to the 45 KB
  one-chart budget like any other; the hierarchy and field modules are measured when their wave lands.
- **Consequences:** §5.3 and REQ-106 unchanged. The lint that forbids `Math.random`/`Date.now` on the
  render path (REQ-004) is extended to forbid `Math.exp`, `Math.log`, `Math.pow`, `Math.sin`,
  `Math.cos`, `Math.atan2` inside those new modules, with a reviewed allow-comment for
  the two single calls of DD-029.

**Amended in implementation (feature-003).** The modules are `charts/shared/stats.ts`,
`density.ts`, `distribution.ts`, `beeswarm.ts`, `hierarchy.ts`, `nodes.ts` (what the three hierarchy
charts share), `field.ts`, `delaunay.ts`, `network.ts` and `xy.ts` (the x-y frame of the field
charts). Marching squares pads the grid with holes, shares each crossing per cell edge and orients
its rings, so filled bands fill under the **non-zero** rule; contours for `source: 'points'` read a
product-Epanechnikov density grid. `orient2d` and `inCircle` are filtered in doubles and settled with
`BigInt`; collinear inputs are chained, duplicates on the 2-decimal grid dropped (first row kept). The
Voronoi cells clip the plot by each Delaunay neighbour's bisector (half-planes), not by
Sutherland–Hodgman over circumcentres. The lint rule is `silverpoint/no-transcendental`: it covers
those modules and `contracts.ts`, also forbids `**`, and has one reviewed allowance, `rootOf`, the
single `Math.pow` of DD-029. The recipes, their demos and these modules are reached only through
`@silverpoint/core/catalog`.

### DD-029: Statistics — methods fixed, inputs sorted once, outputs rounded at the boundary

- **Decision:** `charts/shared/stats.ts` and `density.ts` implement the methods REQ-432 names. Every function takes a **sorted
  copy** (ties ordered by original index, so the result does not depend on sort stability), returns
  plain frozen data, and rounds only where geometry is emitted (REQ-002), never in between.
- **Kernel:** Epanechnikov, `K(u) = ¾(1 − u²)` on `|u| ≤ 1` — polynomial, so the density sum uses
  only `+ − × ÷`. A Gaussian kernel would call `Math.exp`, which ECMAScript does not require to be
  correctly rounded: Node and a browser may differ in the last bit (REQ-435's reasoning applied to
  sums). The density is evaluated at **64** points over the shared value domain per group, then
  passed through the existing curve engine (`curveMonotoneX` along the value axis).
- **Bandwidth:** Silverman, `0.9 · min(σ, IQR/1.34) · n^(−1/5)`. `n^(−1/5)` needs `Math.pow`, which is
  not guaranteed correctly rounded either; it is called **once** per chart and its result is rounded
  to 6 significant digits before use, which makes a cross-engine difference in the drawn coordinates
  improbable rather than impossible. The hydration e2e of #179 watches it in Firefox and WebKit;
  if it ever fires, the fallback is a 32-entry table of `n^(−1/5)` with linear interpolation.
- **Bins:** Freedman–Diaconis width `2·IQR·n^(−1/3)` (same rounding rule as the bandwidth), snapped
  to the nice step of the value scale so bin edges fall on axis ticks; Sturges when `IQR = 0`.
- **Quantiles:** Hyndman–Fan type 7 (linear interpolation; R's and NumPy's default).
- **Ranks:** competition ranking ("1224"); equal values take the same rank, ties broken for **line
  order only** by the series' first appearance in `data`.

### DD-030: Deterministic layouts — greedy beeswarm, fixed-iteration network

- **Beeswarm (REQ-405):** not iterative. Points are placed in ascending value order (ties by index);
  each takes the smallest offset across the axis —alternating sides, starting on the side the seed
  picks— at which it touches no placed point. Candidates come from the exact tangency condition with
  each nearby placed point, which needs only `Math.sqrt`. `O(n log n)` with a sweep window; the result
  is a pure function of the sorted values, the radius and the seed.
- **Network (REQ-426):** Fruchterman–Reingold with a linearly cooling temperature over a fixed
  `iterations` (300). Start: nodes on a square grid in an order permuted by the core's seeded PRNG
  (`render/prng.ts`), so no trigonometry. Inside the iteration: pairwise repulsion `k²/d`, link
  attraction `d²/k`, displacement capped by the temperature — `+ − × ÷` and `Math.sqrt` only.
  `O(n²)` per iteration: 150 nodes × 300 iterations ≈ 3.4 M pair updates, which is REQ-445's 16 ms
  budget **to be confirmed by the #195 benchmark**; if it fails, the default `iterations` drops to
  the largest value that fits and the docs say so.
- **Consumer layout (REQ-436):** when every node carries finite `x` and `y`, positions are only scaled
  to the plot.
- **Test:** the cross-engine determinism test of §8 runs both layouts in Node, Chromium, Firefox and
  WebKit and compares the serialised geometry byte for byte.

**Amended in implementation (feature-003).** The layout has no walls: after the last iteration
the positions are fitted to the unit square, then to the plot (walls piled nodes on the edges). It
runs on the nodes sorted by id and the links by their ends, so the rows' order cannot move it.
Measured (#195's benchmark, first): 150 nodes, 600 links, 300 iterations ≈ 13.5 ms after
optimisation (22.5 ms before), within the 16 ms; the default stays 300.

### DD-031: A `tree` keyboard model in the interaction engine

- **Decision:** `HitArea` gains an optional `node?: { id: string; parent: string | null; depth:
  number; order: number }`. `stepTree` beside `stepLinear` and `stepGrid` implements REQ-438: Down/Up
  move in depth-first pre-order (`order`), Right to the first child (no-op on a leaf), Left to the
  parent (no-op on the root), Home/End to the first/last node.
- **Announcement:** the path is built in the core from `parent` links ("Budget › Operations › Travel:
  12 400, 8 % of Operations") and passed as the active item's label, so the adapters announce it as
  they announce any item.
- **Why not `aria-tree` markup:** the charts expose one focusable SVG with a roving active item and a
  tabular alternative (REQ-121); adding a parallel `role="tree"` DOM would change the markup contract
  of every adapter for two charts. The data table of a hierarchy chart adds `level` and `path`
  columns instead (REQ-431).

**Amended in implementation (feature-003).** `HitArea.node` stays, but the moves reach the
interaction engine as data: each hit area may carry `moves` (Data Model §2.25), the index each key
leads to, which `stepActive` follows before the linear and grid models. `interaction/tree.ts`
(`treeMoves`, `treeLabel`) computes them for the hierarchy charts only; a `stepTree` inside
`hit-test.ts` put the tree model in every one-chart build (+156 B, REQ-444). The same field carries
the network's own model (Right/Left the nodes, Down a node's links, Up back to it).

### DD-032: Category identity beyond the ramp — the catalog's own rule, `ringTone` and labels

- **Decision:** many-category charts (waffle, Marimekko, sunburst, treemap, network groups) tone their
  categories exactly as `DonutChart` and the polar charts already do: `ringTone(index, count)` walks
  the ground's ramp in turn and never gives two neighbours the same level, and **the tone only repeats
  what a label, a printed share or the legend already says** (the rule written above `ringTone` in
  `charts/shared/polar.ts`, REQ-124). Value-driven tone (density bins, contours, treemap leaves by
  share) uses `toneOf(ratio)`, as `HeatmapChart` and `ActivityGrid` do.
- **Identity:** a direct label where the shape holds it (the `TreemapChart` label + share pattern), the
  `sectorLegend` column with names and shares where it does not —its "+N more" row included— and the
  tabular alternative always (I-29).
- **Rejected — cycling the hatch angle per category** (proposed in the first draft of feature-003's design): the
  hatch angle is a **ground token** (Data Model §3.4, −41° / +49°), so a chart choosing angles would put
  style into chart code (Art. 7), and it would invent a visual device silverpoint's grammar does not
  have. Withdrawn on 2026-10-08.
- **Under `weight` (REQ-447):** the same levels, drawn as weight by the ground's inker; nothing in the
  recipe changes.

### DD-033: Derived items and the controlled root

- **Derived `ActiveItem`:** recipes put a frozen summary object in `HitArea.datum` (API Spec §9);
  `modelBase` receives the derived table (REQ-431). No raw row reaches the readout of a derived mark.
- **Root:** `reroot(hierarchy, rootId)` is pure: it returns the subtree, rescaled to the full
  extent, and an `up` item for the centre (sunburst) or the frame (treemap). Activation of a node
  goes through the existing `onSelect` path; the adapter maps it to `onRootChange(node.id)` for
  these two charts. No adapter stores the root (REQ-108), so a server render with `rootId` is the
  same markup as a client render with it (Art. 3).

**Amended in implementation (feature-003).** The mapping is the core's: `rootChangeOf(geometry,
item)` (`interaction/root-change.ts`, on `/catalog`) gives the node's id, the drawn root's parent
(its summary's `up`), or `null` for the data root, reading the item's place in the geometry as drawn
now, so a consumer who passes the new `rootId` back gets the new centre's parent on the next Enter.
React wraps the client chart (`createDrillableChart`), Vue emits `rootChange` beside `select`, and
Angular's `rootChange` output follows `select`. None holds a root (I-30).

### DD-034: One catalog row per chart; three waves through the same gates

- **Decision:** each new chart is a row in `tools/visual-gate/catalog.ts` (recipe, subpath, consumer
  sample with non-default accessors) and the gates, adapter tests and docs generator iterate it, as
  they do for the 33. A wave is complete when its rows are green in every gate; waves do not change
  the gates.
- **Consequence:** adding a chart touches the core recipe, its demo, one file per adapter and one
  catalog row — the cost profile Phase 2 measured for the cartesian family.

**Amended in implementation (feature-003).** A row may carry `required` (props every use must
pass, such as the ridgeline's `groupKey`, the diverging bars' `levels` and parallel coordinates'
`dimensions`) and `states` (named prop sets beyond the demo, each its own fixture suffixed
`--<state>`: `root` on the treemap and the sunburst, `placed` on the network).

### DD-035: Every new chart is drawn with the grammar the 33 already use

TanStack Charts is the **inventory** of this feature and nothing else: no rendering approach, mark
style, colour, animation or API shape is taken from it. Each new chart is drawn with silverpoint's
existing vocabulary, and REQ-450 makes that a check: **no new `StrokePart`, `StrokePaint`, `LabelKind`,
`--sp-` variable or `part` attribute.**

The vocabulary, as the code has it (`types/geometry.ts`, Data Model §3):

| Element | What it means in silverpoint | Where the 33 use it |
|---|---|---|
| `role: 'encoding'`, exact | The datum's geometry; the inker never touches it (Art. 1) | Every bar, line, sector, tile, point |
| `role: 'ornament'`, `part: 'grid' \| 'axis' \| 'rule'` | Hand-inked: grids, axes, rules, legend swatches | Radar rings and spokes, value axes, tracks |
| `tone: 1..4` on a closed shape | Hatching on the ground's ramp (−41°, level 4 cross-hatched), shared tile per level (DD-007) | Bars tone 2, the secondary series tone 1, radar polygon tone 1, heatmap by `toneOf` |
| `part: 'ink-secondary'`, `dash: 'dotted'` | The second, comparison series ("previous", "low") | `BarChart` secondary, `RangeBandChart` low line |
| `heighten` | One element: `part: 'heighten', paint: 'fill'` **plus** the same path `part: 'ink', paint: 'stroke'` (REQ-031) | `LineChart`'s last live point, `StepChart` |
| Pill shape (`pillPath`) | The catalog's bar | `BarChart`, `StackedBarChart`, `FunnelChart` |
| Card (`cardLayout`) | Title, badge, metric value and unit, footer left/right, EB Garamond, small caps | All 33 |
| Printed values | The number is written where it fits; tone only repeats it | Heatmap cells, treemap tiles, donut legend shares |

How each new chart uses it (encoding exact; tone and ornament as the table above):

| Chart | Encoding marks | Tone | Ornament (inked) | Heighten | Printed / labels |
|---|---|---|---|---|---|
| Histogram | Abutting bins, square tops (`rectPath`, not pills: bins are contiguous) | 2; cumulative: 1 under an `ink` top line | Value axis, grid, ticks at bin edges | Modal bin | Bin counts on top when they fit; footer `n` and the bin rule |
| ECDF | Step line (`curveStepAfter`, as `StepChart`); quantile markers as `rule` | — | Axes, grid at 0.25/0.5/0.75 | Median crossing point | Two groups at most: `ink` and `ink-secondary` dotted, the catalog's two-series grammar |
| Box plot | Box (`rectPath`), median line (heavier weight), whiskers with caps, outliers as `circlePath` | Box 1 | Group and value axes | Highest median | Group labels on the category axis |
| Violin | Mirrored density outline (closed path), quartiles as short `ink-secondary` dotted rules | 1 | Group and value axes | Highest median mark | Group labels |
| Ridgeline | One open density line per group, **outline only**, as an engraver draws overlapping profiles | 0 (no fill: overlapping hatch would read as value) | Baselines as `rule`, value axis | Front ridge's peak | Group names at each baseline |
| Beeswarm | The scatter point mark of `points.ts` | — | Value axis | Maximum observation | `label` in readout and table |
| Lollipop | Stem line + head circle | Head 2 | Category and value axes | Largest head | Values at the heads when they fit |
| Dumbbell | Start mark `ink-secondary` dotted outline, end mark `ink` tone 2 (the `BarChart` "previous / current" pairing), connector `ink`; arrow end exact | End 2 | Axes | Largest change's end mark | Both values; direction also in the table |
| Slopegraph | One segment per category between two vertical axes; decreases `ink-secondary` dotted | — | The two period axes | Largest change | Label and value at both ends (no legend) |
| Bump | One line per series through rank positions, with rank dots | — | Rank rows as grid | Last point of the rank-1 series | Series names at both ends, as direct labels |
| Error bars | Interval line with caps, estimate as a circle | Estimate 2 | Axes; `reference` as a dotted `rule` | Estimate furthest from the reference | Estimate printed when it fits |
| Interval | Floating pills (`pillPath`) on lanes | 2 | Lane rules, time/value axis | Longest interval | Lane names; interval label inside when it fits |
| Diverging bars | Abutting segments in one row, centred on a `rule` | Distance from neutral → 1..3, neutral 0 (outline only); the **side** carries the sign | Centre rule, percentage axis | Largest positive share | Level names in a top legend; shares in segments that fit |
| Connected scatter | Ordered `ink` path, small exact chevrons for direction | — | Axes, grid | Last point | Labels at the ends and where given |
| Waffle | Square cells (`rectPath`, inset) | `ringTone` by category | — | The largest category's cells as **one** path | `sectorLegend` with names and shares |
| Marimekko | Tiles (`rectPath`, inset) | `ringTone` by segment | Column labels, 0–100 % axis | Largest cell | Segment label + share in tiles that fit (treemap pattern) |
| Squarified treemap | Tiles (`rectPath`, inset per depth) | Leaves by `toneOf(share)`; parents level 0 with an `ink` frame | — | Largest leaf | Label + share, as `TreemapChart` |
| Sunburst | Sectors per depth (`sectorPath`, the donut's arc engine) | First level `ringTone`; descendants one level lighter than their parent, never below 1 | Ring guides as `grid` | Largest first-level arc | Centre readout as `DonutChart` (root name, total); rim labels where they fit |
| Tree | Links (d3-shape's link generator, already allowed), nodes as circles | Nodes by depth, 2 → 1 | — | Root | Node labels beside the nodes |
| Parallel coordinates | One polyline per row | — | One `axis` per dimension with its ticks | First row's polyline (heighten + ink outline) | Dimension names on the axes |
| Polar line | Line on the radar's frame (`polarFrame`) | — | Rings and spokes as `grid`, as `RadarChart` | Maximum point | Rim labels for `period` divisions |
| Polar scatter | The scatter point mark on `polarFrame` | — | Rings and spokes | Point of largest radius | Rim labels |
| Density bins | Hexagons or rectangles | `toneOf(count / max)`, as `HeatmapChart` | Axes | Densest bin | A four-step key of count ranges (the ramp's levels) |
| Contours | Iso-lines `ink`; filled bands closed shapes | Bands by `toneOf(level)` | Axes | Highest band | Level values on the lines where they fit |
| Delaunay / Voronoi | Edges `ink-secondary`, points `ink` | — | Axes | Point of highest degree | Labels where given |
| Vector field | Arrows, length ∝ magnitude | — | Axes, grid | Largest magnitude | Magnitude scale in the footer |
| Network | Links `ink-secondary`, nodes as circles | Groups by `ringTone` | — | Node of highest degree | Labels for the highest-degree nodes; `sectorLegend` of groups |

**Amended in implementation (feature-003).** Density bins: a bin's size repeats its tone, by the
scale the heatmap uses when its values do not fit (`TONE_SCALE`, in `shared/cells.ts`), so the count
survives `precision` (REQ-124); bins of one tone are one path and the densest is drawn alone,
heightened (NFR path weight). Contours: every level is named on one of its lines, the longest first,
nine positions each. The network names its three busiest nodes and its groups with their sizes.

### DD-036: Every new chart is implemented the way the 33 are

The anatomy of a recipe, as `bar-chart.ts`, `line-chart.ts` and `donut-chart.ts` have it, is the
template; a reviewer should be able to read any new recipe against one of those line by line.

| Step | Convention | Reused from |
|---|---|---|
| 1 | `const CHART = 'HistogramChart'`; `build<Name>(props, context): ChartModel` | — |
| 2 | Demo rule: `usesDemo = props.data === undefined`; keys from `<NAME>_DEMO_KEYS` when it is (REQ-098) | `demo.ts` pattern |
| 3 | Read with `read`/`accessorName`, validate with `finite`, warn with `warnValue` / `diagnose` | `shared/format.ts`, `shared/cells.ts`, `diagnostics/` |
| 4 | Derive (the new step): statistics or layout from the new `shared` modules | §1 |
| 5 | `modelBase(CHART, props, context, '<Kind> chart', table)` with the derived table (REQ-431) | `shared/shell.ts` |
| 6 | `measure` → deferred model at 0 px (REQ-009); `emptyModel` on no data (REQ-007) | `shared/shell.ts` |
| 7 | `cardLayout` → `area`; `cartesianPlot` or `polarFrame` → plot | `shared/card.ts`, `cartesian.ts`, `polar.ts` |
| 8 | Axes: `valueAxis`, `horizontalValueAxis`, `categoryAxis`, `categoryLabels`, `rimLabels` | `shared/cartesian.ts`, `polar.ts` |
| 9 | Push `strokes`, `labels`, `hitAreas` in the DD-035 grammar | — |
| 10 | Heighten: one mark, two strokes (fill `heighten` + `ink` outline) | `step-chart.ts` pattern |
| 11 | Description string: "`${name}`. *Kind* of *n* … ; *summary*." | every recipe |
| 12 | `readyModel(base, description, { viewBox, plot, strokes, labels, hitAreas })` | `shared/shell.ts` |
| 13 | `export const histogramChart: ChartRecipe<HistogramChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build })` | every recipe |

Around the recipe, unchanged conventions: `demo.ts` exports a frozen `<NAME>_DEMO` and
`<NAME>_DEMO_KEYS`; the props interface lives in `types/props.ts` with JSDoc stating "Ignored without
`data`" on every accessor (REQ-099); the recipe is exported from `index.ts`; React adds one file
`createClientChart(recipe)` (or the server variant when the chart has no interaction, REQ-104); Vue one
`Sp<Name>.vue` over `ChartShell` with typed props and emits; Angular one standalone component over the
existing base; the gates read one row in `tools/visual-gate/catalog.ts`. When two or more new charts
share a skeleton, it becomes a family builder in `shared/` (as `buildPoints`, `buildTracks`,
`buildScalar`): `buildDistribution` for box, violin and ridgeline.

**Amended in implementation (feature-003).** The recipes are exported from
`packages/core/src/catalog.ts` (`@silverpoint/core/catalog`), not from `index.ts`; their props types
stay in the main entry. React's drillable charts use `createDrillableChart`.

## 5. Patterns and Conventions

### 5.1 Monorepo structure

```
silverpoint/
├── packages/
│   ├── core/src/
│   │   ├── types/          # the public types of API Spec §3
│   │   ├── dashboard/      # resolveDashboard, cellChartBox, reference layouts (DD-013..DD-015)
│   │   ├── scales/         # band, linear, time, radial
│   │   ├── geometry/
│   │   │   ├── cartesian/  # line, area, bar, stack, step, candlestick, waterfall
│   │   │   ├── polar/      # arc, sector, donut, coxcomb, wind rose
│   │   │   ├── ribbon/     # chords (d3-chord)
│   │   │   ├── orbit/      # elliptical arcs with markers
│   │   │   └── layout/     # treemap, matrix, sankey, grid, bullet, pyramid
│   │   ├── ink/            # Inker interface + NullInker (zero dependencies)
│   │   ├── interaction/    # pure hit-testing
│   │   ├── render/         # rounding and serialization
│   │   ├── diagnostics/    # SPNNN codes
│   │   └── charts/         # the 33 recipes: props → Geometry
│   ├── grounds/src/        # tokens, RoughInker, styles.css
│   ├── fonts/           # EB Garamond woff2 + @font-face (optional)
│   ├── react/src/
│   ├── vue/src/            # <script setup> SFCs, same props as react
│   └── angular/src/
├── examples/{vite-react,nextjs,angular}/
├── fixtures/               # the declared matrix of Art. 3, versioned; fixtures/dashboard/ for compositions
├── tools/{svg-normalizer,visual-gate,lint-rules}/
├── docs/
├── specs/  changes/
└── nx.json  pnpm-workspace.yaml
```

`packages/core/src/charts/**` is the path REQ-044 watches: a PR that adds a ground may not
touch it.

**UI components (DD-021..DD-027)** add:

```
packages/core/src/ui/{value.ts, progress.ts, steps.ts, keyboard.ts, frame.ts, items.ts, names.ts, types.ts, demo.ts}
packages/core/src/ui/{tokens.ts, tone.ts}               # resolveUiTokens, uiToneTile
packages/grounds/src/ui/{pieces.ts, ui-css.ts}          # the pieces and the stylesheet
packages/grounds/scripts/build-ui-css.ts                # → dist/ui.css, after tsup
packages/react/src/ui/{button.tsx, input.tsx, …, index.ts}   # exports SpButton, SpInput, …
packages/vue/src/ui/{SpButton.vue, SpInput.vue, …, index.ts}
packages/angular/ui/{button, input, …}/                 # one secondary entry point each
fixtures/ui/<component>--<state>--<ground>-<substrate>--<mode>.{fixture.json, canonical.txt}
examples/*/…/ui page
```

Amended in implementation: `UI_DEMOS` is exported from `@silverpoint/core/ui-demos` and the runtime from
`@silverpoint/core/ui`, both subpaths, because from the main entry they took the core's full bundle
over its 45 kB. The markup contract lives in `ui/view*.ts` (`ui*View` trees) and the DOM glue of
REQ-315 in `ui/roving.ts` (`uiRovingFocus`, structural types, no DOM lib). In Angular the providers,
tokens and environment signals live in `@silverpoint/angular/env` (re-exported by the main entry),
so a UI component does not carry the charts' render pipeline (REQ-330), and `@angular/forms` is a
peer (REQ-323).

`packages/core/src/ui/**` and the adapters' `ui/` join the paths REQ-044 watches (REQ-312).

The second catalog (feature-003) adds no top-level module: its recipes are
`packages/core/src/charts/<slug>/<slug>.ts` with a frozen `demo.ts`, as the first 33's, exported
from `catalog.ts`; the modules its families share sit in `charts/shared/` (§3.2). `tools/demo-gen/`
(private) is the one-off script that generates the synthetic demo datasets with a fixed seed and
prints them as literals (a regular grid as its values, row by row); its output is committed and
checked byte for byte, and it never runs at render time (REQ-446).


### 5.2 Patterns applied

| Pattern | Where | Why |
|---|---|---|
| One-way pipeline | `props → scales → geometry → ink → nodes` | Makes it impossible for an adapter to influence the geometry |
| Strategy | `Inker` | One tonal mechanism per ground without touching recipes (Art. 7) |
| Null Object | `NullInker` | `precision` mode stops being a special case |
| Pure functions | `core/**` | Testable without DOM and deterministic by construction |
| Declarative tokens | `grounds` | Style is data, not code |

### 5.3 Runtime dependency allowlist

Closes REQ-162. Any addition requires an amendment to this document.

| Package | Runtime dependencies |
|---|---|
| `@silverpoint/core` | `d3-scale`, `d3-shape`, `d3-chord` |
| `@silverpoint/grounds` | `@silverpoint/core`, `roughjs` |
| `@silverpoint/react` | `@silverpoint/core`, `@silverpoint/grounds`; `peer`: `react`, `react-dom` |
| `@silverpoint/vue` | `@silverpoint/core`, `@silverpoint/grounds`; `peer`: `vue` |
| `@silverpoint/angular` | `@silverpoint/core`, `@silverpoint/grounds`, `tslib` (the compiler helpers `ng-packagr` emits imports of); `peer`: `@angular/core`, `@angular/common` |
| `@silverpoint/fonts` | none — only woff2 and CSS |

Forbidden in all of them: `d3-selection` and any d3 module that touches the DOM. `d3-array`
enters as a transitive of `d3-scale` but **is not imported directly**: `extent`, `max` and
`min` are five-line functions in `core/scales/util`, and owning them prevents the surface
from growing without anyone noticing. The same rule owns every statistic and layout of the second
catalog (DD-028): binning, quantiles, densities, packing, hierarchy, mosaic, contours,
triangulation and graph layout add no dependency.

### 5.4 Error handling

```ts
// A single channel, with a stable code, strippable in production.
export function diagnose(code: SpCode, chart: string, detail: Detail): void;

// error  → always throws (SP009, SP012)
// warn   → console.warn only if process.env.NODE_ENV !== 'production'
```

No diagnostic interrupts a render except `SP009`. The text always names chart, property and
`REQ-NNN`.

## 6. Supply chain *(in place of "Security")*

The attack surface of a client library is not a server: it is what gets published and what
gets dragged along.

| Vector | Mitigation |
|---|---|
| Compromised dependency | Allowlist of §5.3; `pnpm audit` in CI; committed lockfile; Dependabot with manual review |
| Publication with leaked credentials | Trusted Publishing from GitHub Actions; no token in the repository or in its history |
| Injection through user content | All text enters as a text node, never as markup; neither `innerHTML` nor `dangerouslySetInnerHTML` is used anywhere |
| SVG identifier collision | Every generated `id` is scoped to the instance and derived from the seed; no shared global definition |
| Execution in the consumer's build | `sideEffects: false` except for the stylesheet; no `postinstall` script |

## 7. Diagnostics *(in place of "Observability")*

There is no server to instrument; what gets instrumented is the experience of the
developer doing the integration.

| Code | Where it is emitted | Stripped in production |
|---|---|---|
| `SP001`–`SP004` | `core/scales`, `core/charts` | Yes |
| `SP005`–`SP007` | `core/ink`, `grounds` | Yes |
| `SP008`, `SP010`, `SP011` | `core/charts`, `core/render` | Yes |
| `SP009` | `core/charts` | No — always throws |
| `SP012` | Contrast script in CI | Not applicable at runtime |
| `SP014`–`SP016` | `core/dashboard`, `core/interaction` | Yes |
| `SP020` | `charts/shared/contracts.ts` (hierarchy rows) | Yes |
| `SP021`, `SP022` | `charts/shared/contracts.ts`, `stats.ts`, `density.ts`, recipes | Yes |

The messages follow a single template: `[SPNNN] <Chart>: <what happened>. <what to do>. (REQ-NNN)`.

## 8. Testing Strategy

| Level | Goal | Tools | What it covers | When it runs |
|---|---|---|---|---|
| Geometry unit | > 90% in `core/geometry` and `core/scales` | Vitest, `d` string snapshots | The recipes, the scales, the rounding. Deterministic, so the snapshots are stable | Every PR |
| Property-based | Key invariants | Vitest plus `fast-check` | Scale monotonicity, domain coverage, that the Inker preserves the endpoints of `role='encoding'` | Every PR |
| `ink`/`precision` equivalence | 33 charts | Vitest | REQ-006: same encoding vertices in both modes | Every PR |
| React adapter | Happy path and accessibility | Vitest plus Testing Library | Props, events, ARIA roles | Every PR |
| Vue adapter | Happy path and accessibility | Vitest plus Vue Test Utils | Props, emits, ARIA roles | Every PR |
| Angular adapter | Happy path and accessibility | TestBed | Signal inputs, outputs, `OnPush` | Every PR |
| **String gate** | Full matrix | Node, SSR of all three adapters plus `svg-normalizer` | REQ-180, zero tolerance | Every PR |
| **Pixel gate** | Reduced matrix on PR, full at night | Playwright, container pinned by digest | REQ-181, the three thresholds of Art. 3 | PR and nightly |
| Hydration | Next.js, Vue and Angular CLI SSR apps | Playwright | REQ-103, REQ-109 and REQ-222: no server/client mismatches | Every PR |
| Accessibility | The four example apps | `axe-core` | REQ-120 to REQ-125; zero A and AA issues | Every PR |
| Ground contrast | Every registered ground | In-house script over the tokens | REQ-126, REQ-127; fails before publishing | Every PR |
| Budgets | The five packages | `size-limit` | REQ-164 | Every PR |
| Bundler resolution | Vite dev and build | Vite plus resolution assertions | REQ-033, REQ-034: every subpath in both modes, stylesheet survives tree-shaking | Every PR |
| Performance | Geometry and render | Vitest benchmarks | The 2 ms and 16 ms of §2 | Nightly |
| Boundary rules | The whole repo | In-house ESLint | REQ-004 and REQ-106: no `Math.random`, no `Date.now`, no cross imports | Every PR |

**Dashboard composition** (DD-013..DD-018) adds:

| Level | What | REQ |
|---|---|---|
| Core unit | Defaults, clamping (`SP014`), mismatch (`SP015`), chart ids, nominal boxes, chrome subtraction, `linkedItems` with missing values, 24-cell benchmark | 201, 204–206, 208, 209, 216, 217 |
| Adapter unit | Wrapper markup, variables, precedence of inherited config, name required by type (type test), no link on the server entry | 200, 212–214, 219 |
| Parity (Node) | Parsed-tree gate on the dashboard fixtures, three adapters vs canonical | 210 |
| Pixel (Docker) | Three widths per fixture | 211 |
| E2E (four apps) | Hydration without mismatch, then measured re-render; axe; Tab order = reading order; linked marks appear and clear | 207, 215, 216, 218, 221 |
| Budget | size-limit on each `dashboard` subpath, and the increment over its one-chart entry within the adapter's allowance; path-weight on the 12-card reference | 220, NFR |
| Lint | No `order`/`dense`/`grid-row-start`/`grid-column-start` in the dashboard stylesheet | 203 |

**UI components** (DD-021..DD-027) add:

| Level | What | REQ |
|---|---|---|
| Core unit | `uiValue` clamping and rounding (`SP017`); `uiRovingKey` over every key × orientation × direction × disabled pattern; `uiSteps`; `uiFrameVariant` purity; `uiItems` (`SP019`); `uiRequireName` (`SP018`); benchmarks | 302, 307, 315, 321, 324, 325, 319 |
| Grounds | Piece generator is deterministic (same bytes twice); `ui.css` contains no literal colour (I-19); contrast gate over the `ui` pairs, focus included | 305, 308, 312, 313, 316 |
| Adapter unit | Markup contract per component; controlled/uncontrolled; Vue `v-model`; Angular `model()` and CVA with Reactive Forms; disabled emits nothing; precedence chain | 300, 311, 314, 318, 322, 323, 326 |
| Mode invariance | Layout boxes and fractions equal between `ink` and `precision` for every state (I-17) | 304, 306 |
| Parity (Node) | Tree gate on the component fixtures, three adapters vs canonical | 327 |
| Pixel (Docker) | Three gates per fixture at its width | 328 |
| E2E (four apps) | UI page: hydration, axe, APG keyboard per composite, native form submit, reduced motion, RTL (SHOULD), target size ≥ 24 px (I-20) | 317, 320, 321, 323, 329, 331 |
| Budget | size-limit per `ui/<name>`, UI runtime, `ui.css` | 330 |

**Second catalog** (feature-003, DD-028..DD-036) adds:

| Test | What it proves | REQ |
|---|---|---|
| Reference values | Every statistic against values computed independently (R / NumPy, recorded in the test with their command) for the demo datasets and edge cases (ties, n = 1, IQR = 0) | REQ-432 |
| Property tests | Bin counts sum to n; ECDF is monotone and ends at 1; quartiles ordered; ranks a permutation with ties; waffle cells sum to `cells`; mosaic areas ∝ values; treemap areas ∝ values within 0.5 px² | REQ-400..REQ-416 |
| **Cross-engine determinism** | The core's geometry for every new chart's demo, serialised in Node and in Playwright Chromium, Firefox and WebKit, byte-identical (`e2e/determinism.spec.ts`); hydration in Firefox and WebKit of the beeswarm, violin, network and contours | REQ-435, REQ-103 |
| Mode invariance | `role: 'encoding'` vertices equal in `ink` and `precision`, every new chart | REQ-441, REQ-006 |
| Owned layouts | Tidy tree, squarify, marching squares and Delaunay against hand-computed cases and their properties (DD-028); Delaunay: empty-circumcircle property on every triangle, checked with the exact predicate, on random, grid-aligned, collinear and duplicate inputs | REQ-416..REQ-418, REQ-423, REQ-424 |
| Forbidden maths | Lint: no transcendental `Math.*` in the new `charts/shared` modules beyond the two reviewed calls | REQ-435 |
| Grammar | Type test: the new recipes compile against the unchanged `StrokePart`, `StrokePaint`, `LabelKind`; the stylesheet diff of each wave adds no `--sp-` variable and no `part` | REQ-450 |
| Tree keyboard | `stepTree` over every key × leaf/root/middle × first/last sibling | REQ-438 |
| Hierarchy validation | Each invalid case drops the right rows and raises `SP020` once with the first id | REQ-437 |
| No-growth | Every existing one-chart build's uncompressed minified size against a v0.3.0 build (`tools/bundle-budget/one-chart-0.3.0.json`), within 0.25 KB | REQ-444 |
| Benchmarks | REQ-445's four budgets (`packages/core/bench/stats.bench.ts`, held by `tools/bench-report`) | REQ-445 |
| Category identity | Every toned chart carries the toned value on a channel besides hatch (a label, a legend, size or position) | REQ-124, REQ-440 |

**Traceability (REQ-183).** Every test cites its requirement in the name:
`test('REQ-006 · identical vertices between ink and precision', …)`. A CI script extracts
the cited `REQ-NNN` and compares them with the `MUST`s of the PRD; the difference is the
report that feeds the Analyze gate (REQ-184).

## 9. Publication strategy *(in place of "Migration / Rollout")*

- The four packages are published **always with the same version**, so that there are no
  internal compatibility matrices.
- Versioning and changelog with Changesets; every PR that touches `packages/` requires a
  changeset.
- Trusted Publishing from GitHub Actions, no tokens.
- Before `1.0.0` a `0.x` series is published from the end of Phase 0, with the warning that
  the public surface may change. The API Spec comes into force with `1.0.0`.
- A change that alters the normalized SVG output is **never a patch**, not even when it is
  an improvement: it breaks the golden images of consumers using the same gate. It goes in
  a minor with a prominent note in the changelog, or in a major if it also changes a prop.

## 10. Open Questions

### Resolved in this version

| Question | Resolution |
|---|---|
| Ground typography | DD-010: EB Garamond, SIL OFL, three self-hosted cuts in `@silverpoint/fonts`; `tnum` verified present, `smcp` absent and replaced by uppercase with tracking; no monospace |
| Area threshold for `<pattern>` | DD-007: there is no threshold. The tile per tonal level is the default, because a threshold would produce data-dependent inconsistency |
| Robustness of the string gate | DD-004: string normalization is replaced by parsed-tree comparison, immune by construction to the three measured differences |
| Angular versions | **21 and 22**. Angular 22 is the current stable (22.1.5, September 2026); two majors a year implies reviewing the floor every six months. Angular 22's compiler requires TypeScript 6.0, so the build uses TypeScript 6.x where that major requires it, and CI runs an Angular 22 consumer job (Constitution v1.5 stack table) |
| `d3-array` | Out of the allowlist. It enters as a transitive of `d3-scale`, but `extent`, `max` and `min` are implemented in `core/scales/util` |

| Dashboard heightening | One white heightening **per chart**, as Art. 6 says; the dashboard adds no cap and no diagnostic (decided 2026-09-25) |
| Dashboard release | Ships in `0.2.0`; the line stays on `0.x` and `1.0.0` is not cut yet (decided 2026-09-25) |
| What else ships in `0.2.0` | Delta-012 (decided 2026-09-26): the `cyanotype` ground (DD-019), REQ-220 per adapter, and the Angular example app server-rendered with `@angular/ssr` (REQ-222) |

**UI components** (feature-002):

| Question | Resolution |
|---|---|
| OQ-U1 · `ui/` subpath or new packages | **Decided 2026-09-28:** subpath (DD-021) |
| OQ-U2 · React names unprefixed or `Sp` | **Decided 2026-09-28:** `Sp` prefix in the three adapters |
| OQ-U3 · 17 components in `0.3.0` or 8 first | **Decided 2026-09-28:** all 17 in `0.3.0` |
| OQ-U4 · Angular attribute selectors for Button/Input | **Decided 2026-09-28:** yes (DD-024) |
| OQ-U5 · Four frame variants per kind: enough variety, or does `ui.css` weight allow six? | **Measured 2026-09-28 (step 6b):** `ui.css` gzip is 4.40 KB with one variant, 7.85 KB with four, 10.09 KB with six (≈ 1.1 KB each). Six fit, but the component rules of step 6c share the 24 KB; four are kept, and a ground may declare up to six |

**Second catalog** (feature-003):

| # | Question | Resolution |
|---|---|---|
| OQ-C1 | Three waves as `0.4.0`, `0.5.0`, `0.6.0`, or fewer, larger releases? | **Decided 2026-10-08:** three waves. **Revised 2026-10-10:** the waves are built in turn but released together as `0.6.0`; `0.4.0` and `0.5.0` are never published |
| OQ-C2 | Take `d3-hierarchy`, `d3-contour`, `d3-delaunay`, or own them? | **Decided 2026-10-08:** own them in the core (DD-028 A) |
| OQ-C3 | Export the statistics publicly (`@silverpoint/core/stats`)? | **Decided 2026-10-09:** no for `0.x`; it would freeze method signatures under SemVer before the charts have used them |
| OQ-C4 | PR fixture matrix for the new charts: full or reduced? | **Decided 2026-10-08:** full on every PR (600 chart fixtures) |
| OQ-C5 | Ship `DelaunayChart` and `VectorFieldChart` (COULD) in wave 3, or drop them to a later minor? | **Decided 2026-10-09:** ship if wave 3 is on budget; they are cheap once the field engine exists |

### Open

- [ ] **Concrete family for the small-caps subset.** If real small caps are wanted later,
      the CTAN original has to be subset and the derivative renamed, because of the OFL's
      Reserved Font Name clause. It does not block `0.2.0`. *— after `0.2.0`.*
- [ ] **The 40 KB budget against the full catalog.** The number comes from the measurement
      over bars and areas. The matrix families —contribution grid, density heatmap— have
      many small shapes instead of a few large ones, and the tile helps less there. They
      have to be measured in Phase 1, which is when they are implemented. *— Phase 1.*
- [ ] **Shared hatch tiles across a dashboard.** DD-007 scopes tiles per instance (REQ-030); a
      dashboard could share one `<defs>` across its cards and cut weight further, at the cost of
      per-chart stroke variation. *— measure on the reference dashboard first.*
- [ ] **OQ-U6 · Overlays: core machines or per-framework headless libraries.** Out of
      feature-002 (PRD §5.3); DD-023 is revisited when overlays are specified.
- [ ] **Shared scales across a dashboard's cards** (Vega-Lite `resolve`). Needs a common domain
      prop on the cartesian charts. *— PRD §5.3.*

---

## Change History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-09-13 | Ernesto Crespo | Initial version |
| 1.1 | 2026-09-13 | Ernesto Crespo | DD-004 moves to parsed-tree comparison; DD-007 moves to tile per tonal level with the measurements that motivate it; DD-010 (typography) enters; `d3-array` leaves the allowlist; Angular pinned to 21 and 22; the exception to Art. 6 is withdrawn |
| 1.4 | 2026-09-13 | Ernesto Crespo | Vue added as a third adapter: DD-012, DD-009 extended to cover it, DD-004 amended to compare against a canonical render instead of pairwise |
| 1.3 | 2026-09-13 | Ernesto Crespo | DD-011 added: package resolution under a bundler, with Vite raised to a validated integration alongside Next.js |
| 1.7 | 2026-09-26 | Ernesto Crespo | Delta-013: DD-020, the Tailwind preset package |
| 1.6 | 2026-09-26 | Ernesto Crespo | Delta-012: DD-019 (the `weight` tonal mechanism, `WeightInker`, `data-weight`); DD-002 names the second inker; DD-018 records the measured dashboard cost per adapter; hydration tests cover the Angular CLI SSR app (REQ-222); `0.2.0` scope in §10 |
| 1.5 | 2026-09-25 | Ernesto Crespo | Deltas folded: `tslib` in the Angular allowlist (002); TypeScript 6.x for Angular 22 (001). Dashboard composition: DD-013..DD-018, components, flow, structure, tests and open questions (feature-001) |
| 1.8 | 2026-09-29 | Ernesto Crespo | Feature-002 folded: UI components (§3.2, §3.3), DD-021..DD-027, structure (§5.1), tests (§8), decisions OQ-U1..OQ-U6 (§10) |
| 1.9 | 2026-10-10 | Ernesto Crespo | Feature-003 folded: the second catalog's modules (§3.2, §5.1), DD-028..DD-036 with their implementation amendments, allowlist rule (§5.3), `SP020`–`SP022` (§7), tests (§8), decisions OQ-C1..OQ-C5 (§10) |
| 1.2 | 2026-09-13 | Ernesto Crespo | Converted to English; rounding corrected to 2 decimals (Analyze finding A-08); font-load failure made observable in DD-010 (finding A-05) |

## Constitution check

- **Art. 2** — DD-001 and the structure of §5.1 materialize it; the ESLint rule of §8 turns
  it into a gate.
- **Art. 3** — DD-003 and DD-004 define how it is run, and §8 when; DD-017 extends it to the
  dashboard's wrapper markup, as Constitution v1.5 requires.
- **Art. 4** — DD-006 fixes the seed derivation and freezes it by SemVer.
- **Art. 5** — §8 includes `axe-core` and the contrast script as PR gates.
- **Art. 6** — met without exception. The tile of DD-007 still builds the tonal value with
  hatch density and angle, which is exactly what the article requires; what is lost is the
  stroke variation between shapes, which the article never promised. **The partial
  exception requested in v1.0 of this document is withdrawn.**
- **Art. 7** — `packages/core/src/charts/**` is the path watched by REQ-044.
- **Art. 8** — the allowlist of §5.3 closes REQ-162; DD-002 takes `roughjs` out of the base
  package.
- **Art. 1 / Art. 2** (feature-003) — DD-029 and DD-030 emit `role: 'encoding'` strokes the inker
  never touches, and all of DD-028's code is in the core; adapters add one event mapping (DD-033).
- **Art. 3 / Art. 4** (feature-003) — DD-029 and DD-030 remove the cross-engine sources of drift
  (transcendental calls inside sums and iterations, unseeded starts); §8 adds the test that proves it.
- **Art. 6 / Art. 7** (feature-003) — DD-035 draws the 27 charts with the existing tones, parts and
  heighten rule; DD-032 leaves the hatch angle to the ground.
- **Art. 8** (feature-003) — DD-028 adds no dependency, and the new code tree-shakes (REQ-444).
