# silverpoint — charts with the visual language of historical drawing

## Product Requirements Document (PRD)

| Field | Value |
|---|---|
| **Author** | Ernesto Crespo |
| **Status** | `APPROVED` |
| **Version** | 1.10 |
| **Date** | 2026-09-12 |
| **Reviewers** | Ernesto Crespo |
| **Last updated** | 2026-09-26 |
| **Applicable Constitution** | [`constitution.md`](constitution.md) v1.6 |

---

## 1. Executive Summary

**silverpoint** is a charting library for React, Vue and Angular whose visual language is drawn
from historical drawing techniques. The first style —the `silverpoint` *ground*— reproduces
the mechanics of Renaissance silverpoint: a prepared mid-tone substrate, a fine silver line,
value built by hatch density, and white heightening on a single element. The engine supports
several grounds, each with its own tonal mechanism.

It targets teams building data products that do not want to look like yet another dashboard,
and very particularly the houses that maintain more than one front-end framework at once and today
have no way to share a charting system between the two.

The difference from the existing hand-drawn stroke libraries is an engineering decision, not
a matter of taste: **irregularity lives only in the ornament**. The geometry of the data is
exact, and every chart offers a `precision` mode that disables inking entirely.

Charts are rarely used alone. A **dashboard composition** (§6.10) arranges cards in a
responsive grid whose layout is resolved in the core, server-renders, and is held to the same
parity gate as the charts — something no dashboard layer surveyed offers across frameworks. It is
a declarative layout, not an interactive builder.

## 2. Context and Problem

### 2.1 Current Situation

The web charting library market is saturated with a single visual idiom: flat fill,
corporate palette, rounded corners. Recharts, Chart.js, ECharts and Nivo produce
interchangeable results.

The only consolidated aesthetic alternative is the "sketchy" category, built almost entirely
on `rough.js`: roughViz.js, chart.xkcd, `plt.xkcd()`, Excalidraw. Its positioning is
explicit — roughViz's own front page says it is for *"where the communication goal is to show
intent or generality, and not absolute precision. Or just because they're fun and look
weird"*.

On the framework axis, `recharts` —the base of most chart-card systems— is React-only. There
is no Angular build.

### 2.2 Problem

Three distinct problems, which nobody solves at once today:

1. **The "handmade and precise" quadrant does not exist.** The handmade aesthetic is
   associated with marker pens and Comic Sans. But Renaissance drawing is the most rigorous
   tradition in the West: a Dürer diagram is exact and it is made by hand. That register
   —editorial, cultured, precise— has no digital implementation.
2. **Today's hand-drawn stroke costs accuracy.** Wood, Isenberg et al. (*Sketchy Rendering
   for Information Visualization*, IEEE VIS 2012) show that irregular strokes degrade
   judgement of area and proportion, with the worst effect on circular shapes, even though
   they raise reader engagement. The existing libraries take that cost without offering a way
   out.
3. **Mixed React + Angular teams cannot share charts.** Maintaining two implementations of
   the same design guarantees visual drift.

### 2.3 Opportunity

A framework-free geometry engine plus thin adapters solves all three at once: a single source
of truth for the mathematics and the appearance, a separable inking pass that enables
`precision` mode, and a ground system that turns style into data. As a by-product, a
fixed-size chart renders as pure SVG with no JavaScript on the client, something impossible
with `recharts`.

## 3. Target Users

### Persona 1: Data product developer
- **Description:** Senior frontend engineer building the dashboard of a SaaS product.
- **Main need:** For the product to have a visual character of its own without hiring bespoke
  design or writing charts from scratch.
- **Frequency of use:** Daily during development; the library choice is made once.
- **Technical level:** High.

### Persona 2: Architect at a multi-framework house
- **Description:** Tech lead at a company with a new product in React and a legacy platform in
  Angular.
- **Main need:** A single charting system, with a verifiable guarantee that both stacks
  produce the same thing.
- **Frequency of use:** Occasional, at platform decision points.
- **Technical level:** High.

### Persona 3: Editorial and documentation author
- **Description:** Writes reports, technical articles, annual reviews or academic material.
- **Main need:** Charts with the character of print publication, that work in black and white
  and survive printing.
- **Frequency of use:** Weekly.
- **Technical level:** Medium.

### Persona 4: Reader with precision or accessibility needs
- **Description:** Consumes the charts; may use a screen reader, high contrast, or simply need
  to compare magnitudes accurately.
- **Main need:** For the aesthetic not to cost them either information or precision.
- **Frequency of use:** Daily.
- **Technical level:** Variable.

## 4. Objectives and Success Metrics

### 4.1 Project objectives

| Objective | Metric | Target | Deadline |
|---|---|---|---|
| Verifiable parity across all three adapters | Art. 3 gates green over the full matrix | 100% | Release 0.2.0 |
| Do not charge for the style in accuracy | Identical vertices between `ink` and `precision` | 100% of the charts | Release 0.2.0 |
| Real accessibility | WCAG 2.1 AA audit over the example apps | 0 level A and AA issues | Release 0.2.0 |
| Low adoption cost | Weight of `@silverpoint/react` + `core` with one chart, minified and compressed | < 45 KB | Release 0.2.0 |
| Engine extensibility | Add the second ground without touching chart code | 0 chart files modified | Release 0.2.0 |
| Dashboards need no consumer CSS | App-level layout CSS in the reference dashboard of the four example apps | 0 rules | Release 0.2.0 |
| Parity extends to the arrangement | Differences on the dashboard fixtures, three adapters, against canonical renders | 0 | Release 0.2.0 |

### 4.2 User Objectives

| User Objective | Indicator |
|---|---|
| First chart on screen without reading the whole documentation | From `install` to first render in < 10 minutes following the quickstart |
| Connect their own data without fighting the API | Every chart accepts `data` plus accessor keys; none requires prior transformation |
| Change style without touching the charts | Changing the ground is one attribute or one CSS class |
| Trust what they see | `precision` mode is one prop away and turns itself on when the system asks for it |

## 5. Scope

### 5.1 In Scope

- [ ] `@silverpoint/core`: geometry, scales, interaction engine and the `Inker` interface.
- [ ] `@silverpoint/grounds`: declarative style tokens; complete `silverpoint` ground, and the
      `cyanotype` ground, whose tonal mechanism is line weight (REQ-028).
- [ ] `@silverpoint/react`: React adapter, compatible with Vite and Next.js (SSR included).
- [ ] `@silverpoint/angular`: standalone adapter with signals, packaged in APF.
- [ ] `@silverpoint/vue`: Vue 3 adapter with `<script setup>`, typed props and emits.
- [ ] The 28 charts of the base catalog and 5 new radial ones (§6.4).
- [ ] `ink` and `precision` modes in every chart.
- [ ] Accessibility layer: roles, names, tabular alternative and keyboard navigation.
- [ ] `vite-react`, `vite-vue`, `nextjs` and `angular` example apps as an integration bench. All four
      are **validated integrations with requirements of their own**, not demos: Vite under
      REQ-033 and REQ-034, Next.js under REQ-103, the Angular CLI under REQ-222.
- [ ] Cross visual regression harness and the Art. 3 CI gates.
- [ ] Documentation site with a gallery and a grounds playground.
- [ ] Dashboard composition in `@silverpoint/react`, `@silverpoint/vue` and `@silverpoint/angular`,
      with its layout resolved in `@silverpoint/core` (§6.10).

### 5.2 Out of Scope

- Svelte, Solid and web components — no adapter in the `0.x` line; the architecture does not preclude it.
- Grounds other than `silverpoint` and `cyanotype` in `0.2.0` — specified, implemented later.
- Geographic charts and maps — another family of problems (projections, topology).
- Canvas or WebGL rendering — the `0.x` line is SVG; the target data volume does not demand it.
- Visual editor or interactive dashboard builder: drag, resize, add or remove cells at runtime,
  persisted layout state. A declarative dashboard layout is in scope (§6.10).
- Data layer for dashboards: fetching, shared data pools, filters, cross-filtering.
- Nested dashboards, tabs and pages inside a dashboard.
- Transition animations between datasets — the `0.x` line animates entry only, and in a way that can be disabled.

### 5.3 Future Considerations

- `burin`, `woodcut`, `wash` and `plotter` grounds.
- Export to PDF and printable SVG, where this style has a natural advantage.
- A web components adapter to cover the rest of the frameworks with a single effort.
- A canvas backend for long series, behind the same API.
- Shared scales across the cards of a dashboard, on Vega-Lite's `resolve` model
  (`{ y: 'shared' }`), computed in the core; it needs a common domain prop on the cartesian
  charts first.
- Exporting a whole dashboard to PDF or printable SVG.

## 6. Functional Requirements

Criteria in EARS notation. Every `REQ-NNN` marked `MUST` requires at least one automated test
citing it (Constitution, Art. 9). Retired identifiers are not reused.

### 6.1 Geometry core and determinism

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-001 | ubiquitous | THE SYSTEM SHALL compute all geometry in `@silverpoint/core` without referencing `document`, `window` or any framework; the package SHALL be importable and executable in Node without a DOM. | MUST |
| REQ-002 | ubiquitous | THE SYSTEM SHALL emit every coordinate rounded to 2 decimals. | MUST |
| REQ-003 | ubiquitous | THE SYSTEM SHALL accept an explicit seed and, in its absence, derive one stably from the chart identifier. | MUST |
| REQ-004 | unwanted | IF any render path invokes `Math.random()` or `Date.now()`, THEN CI SHALL fail by means of a lint rule. | MUST |
| REQ-005 | event | WHEN the same render is requested twice with identical data, configuration, ground, mode and seed, THE SYSTEM SHALL produce identical SVG strings. | MUST |
| REQ-006 | ubiquitous | THE SYSTEM SHALL produce identical encoding vertices in `ink` mode and in `precision` mode for every chart. | MUST |
| REQ-007 | unwanted | IF the dataset is empty, THEN THE SYSTEM SHALL render the empty state declared by the ground, without spurious axes and without throwing. | MUST |
| REQ-008 | unwanted | IF a datum contains `null`, `undefined` or `NaN`, THEN THE SYSTEM SHALL omit that point from the stroke, honour the declared `connectNulls` policy and warn only in development builds. | MUST |
| REQ-009 | unwanted | IF the container measures 0 px in any dimension, THEN THE SYSTEM SHALL defer the render until dimensions are available and SHALL NOT emit attributes containing `NaN`. | MUST |
| REQ-010 | state | WHILE a scale's domain has zero length, THE SYSTEM SHALL expand it according to the ground's policy instead of dividing by zero. | MUST |
| REQ-011 | ubiquitous | THE SYSTEM SHALL expose the computed geometry as serialisable data, with no DOM nodes and no functions. | MUST |

### 6.2 Inking and the `Inker` interface

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-020 | ubiquitous | THE SYSTEM SHALL define an `Inker` interface that takes geometry and returns stroke instructions, resolved from the active ground. | MUST |
| REQ-021 | ubiquitous | THE SYSTEM SHALL implement `NullInker`, which returns the geometry unaltered; `precision` mode SHALL consist of exactly using it. | MUST |
| REQ-022 | ubiquitous | THE SYSTEM SHALL ink only strokes that do not encode data, and every inked stroke SHALL be rendered with `preserveVertices` active. | MUST |
| REQ-023 | ubiquitous | THE SYSTEM SHALL build tonal value by hatch density and angle, and SHALL NOT use fill opacity as a tonal mechanism, except in grounds that declare `tonalMechanism: "wash"`. | MUST |
| REQ-024 | ubiquitous | THE SYSTEM SHALL apply white heightening to a single element per chart. | MUST |
| REQ-025 | unwanted | IF a configuration declares heightening on more than one element, THEN THE SYSTEM SHALL throw an error in development and apply only the first in production. | MUST |
| REQ-026 | unwanted | IF a ground declares an unregistered inker, THEN THE SYSTEM SHALL fall back to `NullInker`, warn and continue the render. | MUST |
| REQ-027 | ubiquitous | No adapter SHALL import the inking engine; only the core resolves it. | MUST |
| REQ-028 | optional | WHERE the ground declares `tonalMechanism: "weight"`, THE SYSTEM SHALL encode value with line weight and SHALL omit all hatching. The `cyanotype` ground declares it (Data Model §3.7). | SHOULD |
| REQ-029 | ubiquitous | THE SYSTEM SHALL fill areas with a hatch tile shared per tonal level, and SHALL offer shape-by-shape hatching as an explicit consumer option. | MUST |
| REQ-030 | unwanted | IF two charts on the same page share a tonal level, THEN each one SHALL reference its own tile, with an identifier scoped to the instance. | MUST |
| REQ-031 | ubiquitous | THE SYSTEM SHALL stroke the outline of every white-heightened element with the main ink, so that its boundary reaches the minimum contrast even when the fill cannot. | MUST |
| REQ-032 | unwanted | IF the declared typeface fails to load, THEN THE SYSTEM SHALL render with the fallback stack, SHALL report diagnostic SP013, and SHALL NOT block the render. | MUST |

### 6.3 Grounds and theming

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-040 | ubiquitous | THE SYSTEM SHALL define each ground as a declarative token object: substrate, inks, heightening, tonal mechanism, inking parameters and typography. | MUST |
| REQ-041 | ubiquitous | THE SYSTEM SHALL expose a ground's colours as CSS custom properties prefixed with `--sp-`. | MUST |
| REQ-042 | ubiquitous | THE SYSTEM SHALL paint strokes and fills through CSS properties and NOT through presentation attributes with a literal colour, so that overriding a variable re-themes without re-rendering. | MUST |
| REQ-043 | ubiquitous | THE SYSTEM SHALL NOT require Tailwind or any other CSS framework. | MUST |
| REQ-044 | event | WHEN a ground is added, THE SYSTEM SHALL NOT require changes to the code of any chart; verifiable because the PR does not touch `packages/core/src/charts/**`. | MUST |
| REQ-045 | unwanted | IF an unregistered ground is requested, THEN THE SYSTEM SHALL use `silverpoint`, warn in development and continue. | MUST |
| REQ-046 | ubiquitous | The `silverpoint` ground SHALL offer at least four historical prepared substrates: cream, grey-green, pale blue and ochre. | MUST |
| REQ-047 | optional | WHERE the consumer uses Tailwind, THE SYSTEM MAY offer an optional preset in a separate package that maps the `--sp-` variables to theme tokens, without the core depending on it. The preset is `@silverpoint/tailwind`. | COULD |

### 6.4 Chart catalog

Each chart is a requirement. The first 28 constitute the functional inventory inherited from
the reference catalog; the last five are new radial ones, motivated by the volvelle tradition
and absent from it.

| ID | Chart | Family | Priority |
|---|---|---|---|
| REQ-060 | Spline `LineChart` with a dotted baseline series | line | MUST |
| REQ-061 | Step chart (`stepAfter`) | line | MUST |
| REQ-062 | Sparkline rows with readout | line | MUST |
| REQ-063 | KPI card with an area sparkline | line | MUST |
| REQ-064 | Pill bars, columns or rows | bar | MUST |
| REQ-065 | Stacked bars by tone | bar | MUST |
| REQ-066 | Composed columns + spline | bar | MUST |
| REQ-067 | Waterfall of floating deltas | bar | MUST |
| REQ-068 | Horizontal stage funnel | bar | MUST |
| REQ-069 | Bullet with target marker | bar | MUST |
| REQ-070 | Pyramid of levels | bar | MUST |
| REQ-071 | OHLC candlestick with wicks | bar | MUST |
| REQ-072 | Curved area with gradation | area | MUST |
| REQ-073 | Min-max range band | area | MUST |
| REQ-074 | Two-wave stream | area | MUST |
| REQ-075 | Donut with a central readout | polar | MUST |
| REQ-076 | Multi-axis polygonal radar | polar | MUST |
| REQ-077 | 360° polar bars | polar | MUST |
| REQ-078 | 180° radial arc group | polar | MUST |
| REQ-079 | Concentric radial rings of progress | polar | MUST |
| REQ-080 | 240° gauge arc | polar | MUST |
| REQ-081 | Semicircular meter | polar | MUST |
| REQ-082 | Weighted scatter | point | MUST |
| REQ-083 | Bubble with area encoding | point | MUST |
| REQ-084 | Labelled density heatmap | matrix | MUST |
| REQ-085 | Treemap of tiles | matrix | MUST |
| REQ-086 | Flow bands (sankey) | matrix | MUST |
| REQ-087 | Contributions activity grid | matrix | MUST |
| REQ-088 | **Coxcomb / polar area** — equal-angle sectors with variable radius | new polar | MUST |
| REQ-089 | **Wind rose** — directional data over labelled bearings | new polar | MUST |
| REQ-090 | **Volvelle** — concentric categorical rings with an index that aligns a combined readout | new polar | SHOULD |
| REQ-091 | **Chord ring** — flows between categories in a circular arrangement | new polar | MUST |
| REQ-092 | **Armillary orbits** — nested cyclic series with per-period markers | new polar | MUST |

> **Geometry note.** REQ-091 and REQ-092 are the only two polar charts that are **not**
> solved by the common arc engine: the chord ring needs a generator of ribbons between
> angular positions, and the orbits need elliptical arcs with markers positioned along the
> trajectory. The Technical Design will decide whether the ribbon generator leans on
> `d3-chord` or is implemented in the core.

Cross-cutting catalog requirements:

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-093 | ubiquitous | Every chart SHALL accept `data` together with the accessor keys for its fields, and SHALL render a demo dataset when invoked without data. | MUST |
| REQ-094 | ubiquitous | Every chart SHALL accept `ground`, `mode`, `seed`, `title`, `badge`, `value`, `unit`, `footerLeft` and `footerRight`. | MUST |
| REQ-095 | optional | WHERE the consumer asks for it, THE SYSTEM SHALL render only the drawing area, without the card frame. | MUST |
| REQ-096 | unwanted | IF the data exceeds the point threshold declared for its family, THEN THE SYSTEM SHALL warn in development and recommend aggregation, without degrading silently. | SHOULD |
| REQ-097 | unwanted | IF a chart requires a scale that cannot be derived from the data —price bounds in candlesticks, flow total in sankey— and it is not supplied, THEN THE SYSTEM SHALL derive it from the data present and document the derivation, or fail with a message naming the missing property. | MUST |
| REQ-098 | state | WHILE a chart renders its demo dataset, THE SYSTEM SHALL ignore the chart's accessor props and SHALL apply every other own prop as it would to consumer data. | MUST |
| REQ-099 | ubiquitous | The props reference SHALL state, for every accessor prop, that it is ignored without `data`. | MUST |

### 6.5 Framework adapters

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-100 | ubiquitous | Every adapter SHALL produce normalised SVG that is character-for-character identical to the canonical render stored with the fixture, for the same inputs. | MUST |
| REQ-101 | ubiquitous | The Angular adapter SHALL expose standalone components with signal inputs and `ChangeDetectionStrategy.OnPush`. | MUST |
| REQ-102 | ubiquitous | No adapter SHALL contain computation of scales, axes, arcs or paths. | MUST |
| REQ-103 | event | WHEN the Next.js app renders on the server, THE SYSTEM SHALL produce markup that hydrates without mismatches. | MUST |
| REQ-222 | event | WHEN the Angular CLI app renders on the server with `@angular/ssr`, THE SYSTEM SHALL produce markup that hydrates without mismatches. | MUST |
| REQ-104 | ubiquitous | The React adapter SHALL mark `"use client"` only on the components that require state or effects; fixed-size, non-interactive charts SHALL render entirely on the server. | MUST |
| REQ-105 | ubiquitous | The Angular adapter SHALL be published in Angular Package Format. | MUST |
| REQ-106 | unwanted | IF an adapter package imports `d3-*` or the inking engine, THEN CI SHALL fail. | MUST |
| REQ-107 | ubiquitous | Each chart SHALL be importable by its own subpath, so that an app using one does not include all 33. | MUST |
| REQ-108 | ubiquitous | The Vue adapter SHALL expose components authored with `<script setup>`, declaring typed props and typed emits, with no component-local reactive state beyond the measured container size and the active item of the interaction engine. | MUST |
| REQ-109 | event | WHEN a Vue application server-renders a chart with `@vue/server-renderer` and then hydrates it, THE SYSTEM SHALL produce the same markup, with no hydration mismatches. | MUST |

### 6.6 Accessibility

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-120 | ubiquitous | Every chart SHALL expose an accessible role and name, plus a description summarising the series. | MUST |
| REQ-121 | ubiquitous | Every chart SHALL offer a tabular alternative of its data, reachable by screen reader. | MUST |
| REQ-122 | event | WHEN the user navigates by keyboard, THE SYSTEM SHALL allow traversing the data points and announce the value of each one. | MUST |
| REQ-123 | event | WHEN the environment declares `prefers-contrast: more` or `forced-colors: active`, THE SYSTEM SHALL enable `precision` mode automatically. | MUST |
| REQ-124 | ubiquitous | No chart SHALL encode information solely by hatch style. | MUST |
| REQ-125 | event | WHEN the environment declares `prefers-reduced-motion: reduce`, THE SYSTEM SHALL omit the entry animation and render the final state. | MUST |
| REQ-126 | ubiquitous | Every ground SHALL reach a contrast ratio of at least 4.5:1 for text and 3:1 for graphical objects, against its substrate. | MUST |
| REQ-127 | unwanted | IF a ground does not reach the contrast minimums, THEN CI SHALL fail before publishing it. | MUST |

### 6.7 Interaction

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-140 | ubiquitous | THE SYSTEM SHALL resolve the active element in the core, as a pure function of pointer position and geometry, without touching the DOM. | MUST |
| REQ-141 | event | WHEN the pointer is placed over an element or that element receives keyboard focus, THE SYSTEM SHALL show the corresponding readout. | MUST |
| REQ-142 | optional | WHERE the consumer supplies their own readout renderer, THE SYSTEM SHALL use it instead of the built-in one. | SHOULD |
| REQ-143 | unwanted | IF the pointer leaves the drawing area or focus is lost, THEN THE SYSTEM SHALL hide the readout without leaving residual state. | MUST |
| REQ-144 | event | WHEN the input is touch, THE SYSTEM SHALL resolve the active element by proximity and SHALL respect a minimum target of 24 px. | SHOULD |

### 6.8 Packaging and distribution

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-160 | ubiquitous | THE SYSTEM SHALL be published as `@silverpoint/core`, `@silverpoint/grounds`, `@silverpoint/react`, `@silverpoint/angular`, `@silverpoint/vue`, `@silverpoint/fonts` (optional) and `@silverpoint/tailwind` (optional). | MUST |
| REQ-161 | ubiquitous | React, Angular and Vue SHALL be declared as `peerDependencies`, never as dependencies. | MUST |
| REQ-162 | ubiquitous | `@silverpoint/core` SHALL NOT declare runtime dependencies outside the Technical Design's allowlist. | MUST |
| REQ-163 | ubiquitous | Every package SHALL publish an `exports` map, types, and `sideEffects: false` except for the stylesheet. | MUST |
| REQ-164 | unwanted | IF a package exceeds its declared bundle budget, THEN CI SHALL fail. | MUST |
| REQ-033 | event | WHEN the packages are consumed from a Vite application, THE SYSTEM SHALL resolve every subpath export identically in the dev server and in the production build, with no `optimizeDeps` override required from the consumer. | MUST |
| REQ-034 | unwanted | IF a bundler would drop the stylesheet import because the package declares `sideEffects: false`, THEN THE SYSTEM SHALL declare the stylesheet as a side effect so that it survives tree-shaking. | MUST |

### 6.9 Quality and traceability

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-180 | ubiquitous | CI SHALL run the normalised-SVG equality gate for every adapter against the fixture's canonical render, with zero tolerance. | MUST |
| REQ-181 | ubiquitous | CI SHALL run the three pixel gates of Art. 3 with the thresholds set there. | MUST |
| REQ-182 | ubiquitous | The gates SHALL operate over a declared fixture matrix —chart × ground × mode × size—, versioned in the repository. | MUST |
| REQ-183 | ubiquitous | Every `MUST` requirement SHALL have at least one automated test citing its `REQ-NNN`. | MUST |
| REQ-184 | unwanted | IF a `MUST` requirement has no test citing it, THEN the Analyze gate SHALL report it as a blocking finding. | MUST |

### 6.10 Dashboard composition

A declarative grid of chart cards: layout resolved in the core, placed by CSS Grid and
container queries, server-renderable, held to the parity gate, accessible as a labelled region.
Linked interaction between charts is optional (SHOULD).

#### Layout

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-200 | ubiquitous | THE SYSTEM SHALL provide a dashboard composition in each adapter — React `Dashboard` / `DashboardCell`, Vue `SpDashboard` / `SpDashboardCell`, Angular `sp-dashboard` / `sp-dashboard-cell` — importable by its own `dashboard` subpath. | MUST |
| REQ-201 | ubiquitous | THE SYSTEM SHALL resolve a dashboard's layout —columns per breakpoint, spans, cell order and each cell's nominal box— in `@silverpoint/core`, as a pure function of a serialisable `DashboardLayout`; adapters SHALL only translate the resolved model into elements. | MUST |
| REQ-202 | ubiquitous | THE SYSTEM SHALL place cells with CSS Grid driven by `--sp-` custom properties and container queries on the dashboard's own width, and SHALL NOT measure the DOM to place cells. | MUST |
| REQ-203 | ubiquitous | The DOM order of the cells SHALL equal their reading order at every breakpoint; the layout SHALL NOT use `order`, `grid-auto-flow: dense` or explicit line placement. | MUST |
| REQ-204 | unwanted | IF a cell's span exceeds the columns of a breakpoint, THEN THE SYSTEM SHALL clamp it to that breakpoint's columns and SHALL warn `SP014` in development. | MUST |
| REQ-205 | unwanted | IF the layout names a cell that has no child, a child names a cell absent from the layout, or two cells share an id, THEN THE SYSTEM SHALL warn `SP015`, render every child in source order with span 1 for the unmatched ones, and SHALL NOT throw. | MUST |
| REQ-206 | ubiquitous | THE SYSTEM SHALL give each chart inside a cell a nominal width and a drawing-area height computed in the core from the layout and the chart's own card chrome, so that every card in a row with equal `rowSpan` has the same outer height; a chart's explicit `height` or `width` prop SHALL take precedence. | MUST |
| REQ-207 | event | WHEN a server-rendered dashboard hydrates, THE SYSTEM SHALL hydrate every chart at its nominal width, without mismatches, and only then re-render it at its measured width (REQ-103, REQ-109). | MUST |
| REQ-208 | ubiquitous | WHERE `Dashboard` is given no `layout`, THE SYSTEM SHALL lay its children out in source order with span 1 over the default columns (1 / 2 / 4). | MUST |

#### Determinism and parity

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-209 | ubiquitous | WHERE a chart inside a dashboard has no `id`, THE SYSTEM SHALL derive it from the dashboard's id and the cell's id, so that no seed depends on the framework's mount order. | MUST |
| REQ-210 | event | WHEN a dashboard fixture is rendered by any adapter, THE SYSTEM SHALL produce a parsed markup tree —dashboard wrapper and every chart's SVG— identical to the fixture's canonical render. | MUST |
| REQ-211 | ubiquitous | CI SHALL run the three pixel gates of Art. 3 on every dashboard fixture at each of the three breakpoint widths. | MUST |

#### Theming

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-212 | optional | WHERE the dashboard sets `ground`, `substrate`, `mode` or `locale`, the charts inside it SHALL inherit them with the precedence chart prop → dashboard → application provider → library default; the media query forcing `precision` (REQ-123) SHALL still not be overridable. | MUST |
| REQ-213 | ubiquitous | The dashboard's own chrome —title, description, gap— SHALL take colour and type only from the ground's tokens and `--sp-` custom properties, with no CSS framework. | MUST |

#### Accessibility

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-214 | ubiquitous | THE SYSTEM SHALL render a dashboard as a `section` labelled by a heading carrying its `title` (level configurable, `2` by default) and described by its `description` when given; each cell SHALL be an `article` labelled by its chart's accessible name. | MUST |
| REQ-215 | ubiquitous | Keyboard focus SHALL traverse the cells in reading order, each chart keeping its own navigation (REQ-122); the dashboard SHALL add no tab stop of its own and no keyboard trap. | MUST |

A dashboard's name is enforced by the type —`title` **or** `label` is required (API delta §2)— not
by a runtime warning.

#### Linked interaction

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-216 | optional | WHERE the dashboard declares a link on a key, WHEN the active item of one chart changes, THE SYSTEM SHALL mark, in every other chart of the dashboard, the items whose datum carries the same value of that key, resolved in the core as a pure function of the models (REQ-140). | SHOULD |
| REQ-217 | unwanted | IF a linked chart has no item carrying that value, THEN it SHALL show no linked mark —no interpolation, no nearest match— and SHALL warn `SP016` once in development if the key is absent from its data altogether. | SHOULD |
| REQ-218 | ubiquitous | Linked marks SHALL NOT be announced to assistive technology —only the chart holding focus announces— and SHALL clear in every chart when the source's active item clears (REQ-143). | SHOULD |
| REQ-219 | ubiquitous | Linked state SHALL exist only on the client and SHALL NOT alter the server-rendered markup. | MUST |

#### Budgets and integration

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-220 | unwanted | IF an adapter's `dashboard` subpath adds to its one-chart build more than its allowance min+gzip —2 KB for React (client and server) and Vue, 3 KB for Angular, whose partial-compilation output carries each component's template and input metadata— THEN CI SHALL fail (REQ-164). | MUST |
| REQ-221 | ubiquitous | Each example app —`vite-react`, `vite-vue`, `nextjs`, `angular`— SHALL include the reference dashboard page, verified end to end, the three server-rendered apps (`vite-vue`, `nextjs`, `angular`) hydrating it: no hydration mismatch, no axe A/AA issue, pixel gates green at the three breakpoints. | MUST |

A dashboard's name is enforced by the type —`title` or `label` is required (API Spec §7.1)—, not
by a runtime warning.

## 7. Non-Functional Requirements

The template assumes a service; silverpoint is a client library, so two headings are
reinterpreted and the original is stated.

### Performance

- Geometry computation for a 100-point chart in `@silverpoint/core`: < 2 ms on reference
  hardware.
- Full initial render of a card, inking included: < 16 ms, so as not to drop a frame.
- Resolving a 24-cell dashboard layout in the core: < 0.5 ms.
- The 12-card reference dashboard (demo data, `hatchFill: 'tile'`): server HTML ≤ 480 KB,
  twelve times the per-chart path budget.
- **Path data weight**: measured on `rough.js`, inking emits only 2 `<path>` elements per
  shape whatever the density, so element count was never the relevant magnitude. What grows
  is the **bytes inside the `d` attribute**: a 33×110 px bar with cross-hatching at gap 4.5
  takes 13 KB, and a 320×150 px area takes 41 KB. Every chart SHALL stay below **40 KB of
  path data** with its demo dataset. Since this is rendered on the server, the budget is also
  HTML weight.

### Security

- The surface is a supply chain, not a server: allowlisted dependencies, `pnpm audit` in CI,
  publication with Trusted Publishing and no tokens in the repository.
- THE SYSTEM SHALL NOT interpolate user content as markup; all text enters as a text node.

### Compatibility *(in place of "Availability")*

- Browsers: the last two major versions of Chrome, Firefox, Safari and Edge.
- React 18.2+ and 19. Angular: the two most recent majors. Vue 3.5+. Node 20+ for the build.
- Vite: the two most recent majors, as the dev server and bundler of the React example and,
  underneath, of the Angular CLI.
- TypeScript 5.9+, and 6.x where a supported framework requires it (Angular 22); the published types SHALL resolve under `moduleResolution: bundler` and
  `node16`.

### Data volume *(in place of "Scalability")*

- `0.x` target: up to 500 points per series in cartesian families and 60 sectors in polar ones,
  while keeping the node budget. Above that, a warning and a recommendation to aggregate
  (REQ-096).
- The chord ring (REQ-091) is bounded by number of categories, not points: the ribbons grow
  quadratically. `0.x` ceiling: 12 categories.

### Observability

- Actionable warnings in development builds, removed entirely in production via
  `process.env.NODE_ENV`.
- Every warning SHALL name the chart, the property involved and the `REQ-NNN` that motivates
  it.

## 8. Constraints and Dependencies

### Technical Constraints

- All geometry in the core; adapters do not compute (Constitution, Art. 2).
- SVG as the only render backend in the `0.x` line.
- No Tailwind and no CSS framework (Art. 8).
- `stroke` and `fill` must be applied as CSS properties, not as presentation attributes, so
  that the `--sp-` variables re-theme without re-rendering. This constrains the `Inker`'s
  output, which cannot embed colour.

### Project Constraints

- A one-person, part-time team: the plan must be pausable between phases without leaving the
  repository in an inconsistent state.
- Original work: the catalog takes the functional inventory of the reference project, but not
  a single line of its code or of its visual language enters here.

### External Dependencies

| Dependency | Type | Status | Risk |
|---|---|---|---|
| `rough.js` | Inking engine of the `silverpoint` ground | Stable, mature | Medium — mitigated by the `Inker` interface (REQ-020) |
| `d3-scale`, `d3-shape` | Scales and path generators | Stable, actively maintained | Low |
| Playwright | Visual regression harness | Stable | Low — the version is pinned by digest |
| `ng-packagr` | Angular packaging | Part of the Angular ecosystem | Low |

## 9. User Stories

### Epic A — First chart

**US-001:** As a product developer, I want to render a chart with my data without reading the
full documentation, so that I can evaluate the library in an afternoon.
- Acceptance criteria:
  - [ ] Installing, importing a chart and seeing it with my own data takes less than 10 minutes (REQ-093).
  - [ ] Invoking it without `data` shows a demo dataset instead of an empty canvas (REQ-093).

### Epic B — House with several frameworks

**US-002:** As an architect, I want a verifiable guarantee that every adapter draws the
same thing, so that I can standardise without auditing it by eye.
- Acceptance criteria:
  - [ ] CI publishes the result of the SVG equality gate on every PR (REQ-180).
  - [ ] The documentation shows the same fixture rendered by all three adapters (REQ-100).

### Epic C — Style as data

**US-003:** As a developer, I want to change the appearance of all my charts without touching
them one by one, so that I can fit the product to its identity.
- Acceptance criteria:
  - [ ] Changing the ground is one attribute or one CSS class (REQ-040, REQ-041).
  - [ ] Overriding `--sp-ink` re-themes without re-rendering (REQ-042).

### Epic D — Precision and accessibility

**US-004:** As a reader, I want to be able to trust the magnitudes I see, even though the
chart looks hand-drawn.
- Acceptance criteria:
  - [ ] `mode="precision"` disables inking on any chart (REQ-021).
  - [ ] The vertices match between `ink` and `precision` (REQ-006).
  - [ ] With system high contrast, `precision` turns itself on (REQ-123).
  - [ ] A screen reader can traverse the data as a table (REQ-121).

### Epic E — Dashboards

**US-005:** As a product developer, I want to arrange a strip of KPIs and a grid of charts from
one layout object, identical in React, Vue and Angular and rendered on the server, so that I stop
writing a grid around the cards in every app.
- Acceptance criteria:
  - [ ] One `layout` object places the cards at three container widths with no app CSS (REQ-201, REQ-202).
  - [ ] The dashboard is a labelled region and focus follows reading order (REQ-203, REQ-214, REQ-215).
  - [ ] The same fixture renders identically in all three adapters (REQ-210).

## 10. Wireframes / Mockups

Proof of concept rendered during the proposal phase, with the *burin* setting
(`roughness 0.45`, `bowing 0.6`, `preserveVertices: true`, fixed `seed`) against the
`rough.js` defaults: `docs/assets/probe-silverpoint.png`.

It shows the three mechanisms of the `silverpoint` ground over three prepared substrates:
hatch density as reinforcement of value in bars, cross-hatching plus white heightening on the
dominant sector of an arc, and exact vertices with a heightened live point in a time series.

## 11. Risks and Mitigations

| Risk | Prob. | Impact | Mitigation |
|---|---|---|---|
| **Path data weight**: measured, a 6-bar card with cross-hatching weighs 76 KB of `d`, and a 12-card dashboard 913 KB, which moreover travel inside the server's HTML | High | High | Mitigated in design: shared-tile fill (REQ-029) brings the cost down to ~1 KB per tonal level; default gap 7 and rounding to 2 decimals as additional levers; 40 KB budget verified in CI |
| The string equality gate turns out to be inapplicable because of serialisation differences between the adapters' server renderers | Medium | High | The risk is retired in Phase 0 with the vertical slice; if it falls, it degrades to SVG AST comparison before touching the pixel thresholds |
| `rough.js` is left unmaintained | Low | Medium | The `Inker` interface isolates it; an in-house `Inker` is viable because the subset used is small |
| The Angular adapter effort is underestimated (APF, TestBed, version matrix) | Medium | Medium | Angular enters the Phase 0 vertical slice, not the end |
| 33 charts are too many for a one-person team | High | Medium | The families share engines: one scale engine serves 15 charts and one arc engine 10; the plan groups them by engine, not by chart. Outside that amortisation are the chord ring and the orbits (REQ-091, REQ-092), which carry their own geometry and are planned as separate work |
| The aesthetic turns out to be too niche | Medium | Medium | The multi-ground engine is the cover: `cyanotype` and `plotter` are different registers on the same core |
| Insufficient ink-on-substrate contrast in some ground | Medium | High | REQ-126 and REQ-127: contrast is verified in CI before publishing the ground |
| A server render cannot know a dashboard's container width, so the first paint may be at the wrong width on a phone | High | Medium | Nominal width from `ssrWidth` (default the `lg` design width); charts re-render at their measured width after hydration (REQ-207) |
| Extending parity from SVG to the dashboard's HTML reopens the gate's normaliser | Medium | High | The wrapper is small and fixed; it is parsed and compared as a tree like the SVG (DD-017), with no string normalisation |
| Linked interaction becomes a state machine per adapter | Medium | Medium | Matching in the core; one reactive value per dashboard; SHOULD, so it can slip to a later minor |
| Scope creep toward a dashboard builder | Medium | High | §5.2 names what is out; there are no `row`, `col` or `order` props to extend |

## 12. Estimated Timeline

Explicit assumption: one person, part-time. The ranges are relative effort, not date
commitments.

| Phase | Effort | Deliverable |
|---|---|---|
| Spec & Design | 1-2 weeks | The 8 SDD artifacts approved |
| Phase 0 — vertical slice | 2-3 weeks | Monorepo, tokens, scale engine, one chart crossing core → React → Angular, Art. 3 gates operational |
| Phase 1 — layout engine | 2-3 weeks | The 6 charts without scales: bullet, pyramid, treemap, density heatmap, sankey, activity grid |
| Phase 2 — scale engine | 4-5 weeks | 15 cartesian charts on a common engine; includes candlesticks and sparklines, which do need a scale |
| Phase 3 — arc engine | 4-5 weeks | 10 charts on a common arc engine, plus the chord ring and the armillary orbits with their own geometry |
| Phase 4 — closing | 2-3 weeks | Accessibility audited, documentation, budgets, release `0.1.1` (published 2026-09-25) |
| Phase 5 — dashboard | 3-4 weeks | Dashboard composition in three adapters, parity and pixel gates per breakpoint, released in 0.2.0 |
| Phase 5, delta-012 | 1 week | The `cyanotype` ground (REQ-028), REQ-220 per adapter, Angular CLI SSR (REQ-222), in 0.2.0 |

---

## Change History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.10 | 2026-09-26 | Ernesto Crespo | Delta-013: REQ-047 names `@silverpoint/tailwind`; REQ-160 lists it (optional) |
| 1.9 | 2026-09-26 | Ernesto Crespo | Delta-012: every "v1" target becomes `0.2.0` (the line stays on `0.x`); `cyanotype` enters scope and REQ-028 names it; REQ-222 (Angular CLI SSR hydration) enters; REQ-220 gives each adapter an allowance, 3 KB for Angular; REQ-221 names the three server-rendered apps |
| 1.8 | 2026-09-25 | Ernesto Crespo | Deltas folded: REQ-108 admits the active item as Vue component state (delta-004); Vue 3.5+ and TypeScript 6.x where required (deltas 001, 005); REQ-098 and REQ-099 (view props apply to the demo, delta-011); §6.10 Dashboard composition, REQ-200..REQ-221, with the §5.2 scope amendment (feature-001) |
| 1.7 | 2026-09-13 | Ernesto Crespo | Vue added as a third supported framework: REQ-108 and REQ-109 enter, `@silverpoint/vue` joins REQ-160 and REQ-161, REQ-100 reformulated against a canonical render |
| 1.6 | 2026-09-13 | Ernesto Crespo | Vite raised to a first-class validated integration: REQ-033 and REQ-034 added, compatibility floor stated, scope wording corrected |
| 1.5 | 2026-09-13 | Ernesto Crespo | Converted to English; REQ-032 added to cover typeface load failure (Analyze finding A-05) |
| 1.4 | 2026-09-13 | Ernesto Crespo | Phase split corrected by breaking down per engine: 6 / 15 / 10+2 instead of 8 / 13 / 12 |
| 1.3 | 2026-09-13 | Ernesto Crespo | REQ-031 enters (heightening outline), after verifying that white does not reach 3:1 over any light substrate |
| 1.2 | 2026-09-13 | Ernesto Crespo | Measurement of the inking cost: the budget moves from SVG nodes to path bytes. REQ-002 drops to 2 decimals, REQ-029 and REQ-030 enter (shared-tile fill) and `@silverpoint/fonts` in REQ-160 |
| 1.1 | 2026-09-13 | Ernesto Crespo | REQ-091 and REQ-092 move from COULD to MUST; the geometry note, the chord ring's category ceiling and the Phase 3 adjustment are added |
| 1.0 | 2026-09-12 | Ernesto Crespo | Initial version |

## Approvals

| Role | Name | Date | Status |
|---|---|---|---|
| Author / Tech Lead | Ernesto Crespo | | ☐ Pending |

## Constitution check

- **Art. 1** — REQ-006 and REQ-022 make it verifiable: identical vertices between modes and
  inking restricted to strokes that do not encode data.
- **Art. 2** — REQ-001, REQ-102 and REQ-106 impose it and give it a CI gate.
- **Art. 3** — REQ-180 to REQ-182 carry the article's thresholds into executable gates over a
  versioned fixture matrix.
- **Art. 5** — the whole of section 6.6 develops it; REQ-123 covers the automatic activation
  of `precision`.
- **Art. 6** — REQ-023 captures it, and declares the `wash` exception that the article itself
  foresees.
- **Art. 7** — REQ-040 and REQ-044, the latter with mechanical verification over the files
  touched by the PR.
- **Art. 3** (v1.5) — REQ-210 and REQ-211 extend the gates to the dashboard's wrapper markup
  and to one pixel comparison per breakpoint.
- **Art. 4** — REQ-209 derives chart ids from the dashboard, not from the framework's mount order.
- **Requested exception:** none.
