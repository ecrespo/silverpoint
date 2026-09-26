# silverpoint — Technical Design Document

## Metadata

| Field | Value |
|---|---|
| **Author** | Ernesto Crespo |
| **Status** | `IN_REVIEW` |
| **Version** | 1.5 |
| **Date** | 2026-09-25 |
| **Related PRD** | [`prd.md`](prd.md) v1.8 |
| **Related API Spec** | [`api-spec.md`](api-spec.md) v1.6 |
| **Applicable Constitution** | [`constitution.md`](constitution.md) v1.5 |

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

client only, when `link`:  chart A active item ─► dashboard link value (one reactive value)
                           ─► each chart: core.linkedItems(model, key, value) ─► `part="linked"` marks
```

Degradation: a span wider than its breakpoint is clamped (`SP014`); layout and children that
disagree are reconciled in source order (`SP015`); a linked chart without the key shows no mark
(`SP016`). None throws.

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
  were left unmaintained, one package gets replaced, not the core.

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
  validated integration in v1: SSR parity is verified directly with `@vue/server-renderer`
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

### DD-018: No new package; `dashboard` subpath in each adapter

- **Decision:** the code lives in the existing packages behind a `dashboard` subpath each.
- **Why:** the six packages share one version (Changesets `fixed`), and a new package would need its
  own trusted publisher before its first release; the dashboard depends on internals of each
  adapter (chart context, measurement) that a separate package would have to make public.

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
from growing without anyone noticing.

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
| Hydration | Next.js and Vue SSR apps | Playwright | REQ-103 and REQ-109: no server/client mismatches | Every PR |
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
| Budget | size-limit on each `dashboard` subpath; path-weight on the 12-card reference | 220, NFR |
| Lint | No `order`/`dense`/`grid-row-start`/`grid-column-start` in the dashboard stylesheet | 203 |

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

### Open

- [ ] **Concrete family for the small-caps subset.** If real small caps are wanted later,
      the CTAN original has to be subset and the derivative renamed, because of the OFL's
      Reserved Font Name clause. It does not block v1. *— after v1.*
- [ ] **The 40 KB budget against the full catalog.** The number comes from the measurement
      over bars and areas. The matrix families —contribution grid, density heatmap— have
      many small shapes instead of a few large ones, and the tile helps less there. They
      have to be measured in Phase 1, which is when they are implemented. *— Phase 1.*
- [ ] **Shared hatch tiles across a dashboard.** DD-007 scopes tiles per instance (REQ-030); a
      dashboard could share one `<defs>` across its cards and cut weight further, at the cost of
      per-chart stroke variation. *— measure on the reference dashboard first.*
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
| 1.5 | 2026-09-25 | Ernesto Crespo | Deltas folded: `tslib` in the Angular allowlist (002); TypeScript 6.x for Angular 22 (001). Dashboard composition: DD-013..DD-018, components, flow, structure, tests and open questions (feature-001) |
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
