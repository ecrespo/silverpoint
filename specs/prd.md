# silverpoint — charts with the visual language of historical drawing

## Product Requirements Document (PRD)

| Field | Value |
|---|---|
| **Author** | Ernesto Crespo |
| **Status** | `APPROVED` |
| **Version** | 1.14 |
| **Date** | 2026-09-12 |
| **Reviewers** | Ernesto Crespo |
| **Last updated** | 2026-10-20 |
| **Applicable Constitution** | [`constitution.md`](constitution.md) v1.10 |

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

The charts' language also reaches the controls around them. A first family of **17 interface
components** (§6.11) —buttons, inputs, tabs, switches, progress bars— is drawn with the same
grounds and held to the same rules: hand inking only on ornament, exact hit areas, focus and value
geometry, parity across the three adapters, server rendering and accessibility by construction. It
is not a complete design system: what stays out is named in §5.2.

The catalog holds **60 charts**: 33 in the first catalog (§6.4.1) and 27 in the second (§6.4.2),
which adds the families the first lacked —distribution, two-value comparison, ranking, uncertainty,
intervals, part-to-whole grids, hierarchies, fields and networks— under the same rules. Every
statistic and layout they derive is computed in the core, deterministically, with no new
dependency (§6.12).

A second family of **21 components** (§6.13) brings the interface components to 38: twelve composed
components —table, pagination, breadcrumb, avatar, statistic, descriptions, a vertical timeline,
collapse, empty and result states, textarea, number input— on the surface and glyph they are built
from, and seven overlays —modal, drawer, popover, tooltip, select, dropdown menu, toast— on the
platform's `<dialog>` and Popover API, with their keyboard and placement in the core and no headless
library. **Palettes** re-colour a chart, a component or a whole section in the inks of a historical
medium, six presets verified for contrast, and `SpTimeline` draws a Knight Lab TimelineJS timeline in
the ground, behind an optional peer. They ship in `0.7.0`, under the same parity, pixel, contrast,
accessibility and budget gates.

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

### Persona 5: Agent-assisted developer
- **Description:** Works in Claude Code, Cursor, VS Code or Claude, with an assistant writing much
  of the code.
- **Main need:** For the assistant to write silverpoint code that compiles and draws the right
  chart the first time, in their framework, Python/Reflex included.
- **Frequency of use:** Daily during development.
- **Technical level:** Variable; the assistant carries the API.

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
| One language for charts and controls | Components of §6.11 available in the three adapters | 17 of 17 | Release 0.3.0 |
| The hand never moves what the user reads or aims at | Layout boxes and value geometry identical in `ink` and `precision` | 100% of the component fixtures | Release 0.3.0 |
| Parity extends to controls | Differences on the component fixtures, three adapters, against canonical renders | 0 | Release 0.3.0 |
| Accessible controls | axe on the UI page of the four example apps; APG keyboard e2e per composite | 0 A/AA issues; every pattern green | Release 0.3.0 |
| Controls cost little | One component over the shared UI runtime; the runtime; `ui.css` | ≤ 3 KB; ≤ 8 KB; ≤ 24 KB min+gzip | Release 0.3.0 |
| Cover the distribution, comparison, hierarchy and relational questions | The charts of §6.4.2 published, each with fixtures, parity and docs | 27 of 27 | Release 0.6.0 |
| Keep the cost of a chart flat | The one-chart budget (45 KB min+gzip); the one-chart build of an existing chart against `0.3.0` | Unchanged; no growth (REQ-444) | Release 0.6.0 |
| The Reflex 0.7 inventory in the three adapters | Components of §6.13 available in React, Vue and Angular | 21 of 21 catalog rows (+ `SpTimeline`) | Release 0.7.0 |
| Colour without losing contrast | Presets passing every contrast pair of the gate | 6 of 6 | Release 0.7.0 |
| Parity extends to composed components and overlays | Differences on their fixtures, three adapters, against canonical renders | 0 | Release 0.7.0 |
| Accessible overlays | APG keyboard e2e per overlay pattern; axe on the composed page of the four apps | every pattern green; 0 A/AA issues | Release 0.7.0 |
| No new runtime dependency | Packages' `dependencies` added by this feature | 0 (one optional peer, `@knight-lab/timelinejs`, on the timeline subpath only) | Release 0.7.0 |
| Agents know the library | Charts and components in the agent catalog, generated from the types, with a committed copy CI regenerates without a diff | 60 of 60 and 38 of 38 | Release 0.8.0 |
| What an agent writes compiles | The skill's examples and `generate_code`'s golden files type-checked in the example apps | 100% | Release 0.8.0 |
| What an agent is shown is what the library draws | `render_chart` over the PR chart matrix against the canonical renders | 0 differences | Release 0.8.0 |

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
- [ ] The 28 charts of the base catalog and 5 new radial ones (§6.4.1).
- [ ] 27 further charts (§6.4.2) in three waves, with the statistics and layout modules in
      `@silverpoint/core` they need (§6.12).
- [ ] `ink` and `precision` modes in every chart.
- [ ] Accessibility layer: roles, names, tabular alternative and keyboard navigation.
- [ ] `vite-react`, `vite-vue`, `nextjs` and `angular` example apps as an integration bench. All four
      are **validated integrations with requirements of their own**, not demos: Vite under
      REQ-033 and REQ-034, Next.js under REQ-103, the Angular CLI under REQ-222.
- [ ] Cross visual regression harness and the Art. 3 CI gates.
- [ ] Documentation site with a gallery and a grounds playground.
- [ ] Dashboard composition in `@silverpoint/react`, `@silverpoint/vue` and `@silverpoint/angular`,
      with its layout resolved in `@silverpoint/core` (§6.10).
- [ ] Interface components in `@silverpoint/react`, `@silverpoint/vue` and `@silverpoint/angular`,
      with their geometry and keyboard behaviour resolved in `@silverpoint/core` and their frames
      and tones in `@silverpoint/grounds` (§6.11).
- [ ] Palettes for every chart, UI component and dashboard, with six verified presets (§6.13.1).
- [ ] Twelve composed components and the surface and glyph they are built from (§6.13.2).
- [ ] Seven overlays on the platform's `<dialog>` and Popover API (§6.13.3).
- [ ] `SpTimeline`: Knight Lab TimelineJS drawn in the ground, behind an optional peer (§6.13.4).
- [ ] The agent catalog, generated from the types, the catalogs, the demos and one metadata file (§6.14.1).
- [ ] `@silverpoint/mcp`: an MCP server over stdio and Streamable HTTP (§6.14.2).
- [ ] The `silverpoint` and `reflex-silverpoint` skills and their Claude plugin manifests (§6.14.3).
- [ ] Hosting at the official site's `/mcp`, and `/llms.txt` (§6.14.4).

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
- Overlays not in the inventory of §6.13.3: Popconfirm, Notification centre, Message, DatePicker,
  TimePicker, Cascader, AutoComplete, Command palette, multi-select.
- Data-heavy components: Tree, TreeSelect, Transfer, List virtualisation, Upload, Form
  (validation and layout), Calendar, Carousel, ColorPicker, Tour.
- Table features beyond sorting: editing, selection, column resize, virtualisation, tree rows,
  server pagination built in (the consumer pages; `SpPagination` draws the control).
- A palette per series. Palettes stay monochrome (two inks); tone is density (Art. 6).
- Bundling TimelineJS. It stays the consumer's install (MPL-2.0, ~100 KB); silverpoint owns the
  skin and the wrapper.
- Layout primitives (Grid, Flex, Space, Layout, Splitter): CSS does this; the dashboard is the
  one layout silverpoint owns.
- An icon set. Components take the consumer's icons; the few glyphs they draw themselves (tick,
  dot, close, status marks) are part of each component.
- Interaction beyond the readout: brushing, zoom and pan, scrubbing, synchronised cursors, grouped
  readouts, interactive legends, editable ranges, streaming windows. Proposed for a later feature.
- Data reducers (group-by, mean, sum) inside a chart: the consumer aggregates; charts that derive a
  **distribution** (§6.12) are the one exception, because the distribution is the mark.
- Force simulation as a live, animated process: `NetworkChart` lays out once, deterministically.
- An LLM inside the MCP server. Every tool is deterministic (Art. 4); the agent is the client's.
- Writing to the user's files or project, running user code, fetching URLs: the server is read-only.
- Authentication, accounts, quotas per user: the server is public and stateless.
- Skills or servers for frameworks the constitution does not support (Svelte, Solid…).
- A hosted playground UI. The site's playground is a separate concern.

### 5.3 Future Considerations

- `burin`, `woodcut`, `wash` and `plotter` grounds.
- Export to PDF and printable SVG, where this style has a natural advantage.
- A web components adapter to cover the rest of the frameworks with a single effort.
- A canvas backend for long series, behind the same API.
- Shared scales across the cards of a dashboard, on Vega-Lite's `resolve` model
  (`{ y: 'shared' }`), computed in the core; it needs a common domain prop on the cartesian
  charts first.
- Exporting a whole dashboard to PDF or printable SVG.
- Variants of the existing charts surfaced by the second catalog's survey —N series, stacked
  areas, labels and annotations, polar variants, derived overlays, a secondary axis— as deltas
  014..019 (`changes/feature-003-chart-catalog-expansion/research.md` §4).
- Small multiples with shared scales, once the shared-scale model above exists.
- A multi-select and a combobox with free text, on the listbox engine of the overlays (DD-039).
- Render a whole dashboard (`render_dashboard`) once the dashboard has a headless pipeline as charts do.
- MCP Apps / interactive UI resources, when the clients converge.
- A Vue/Angular-specific skill split if the shared skill grows past its size budget.
- A PNG render (REQ-544), once the ground's paint can be flattened into presentation attributes.

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

**Palettes** (§6.13.1) re-colour a ground through the same `--sp-` properties, per element, dashboard
or provider, without re-rendering (REQ-041, REQ-042) and without leaving the contrast the grounds
guarantee (REQ-126).

### 6.4 Chart catalog

Each chart is a requirement. The first catalog (§6.4.1) holds 33: 28 constitute the functional
inventory inherited from the reference catalog, and five are new radial ones, motivated by the
volvelle tradition and absent from it. The second catalog (§6.4.2) holds 27 more.

#### 6.4.1 First catalog

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

#### 6.4.2 Second catalog

The families the first catalog lacked, found by measuring it against TanStack Charts' catalog (188
examples), which supplies the inventory only (REQ-450). Wave = the release that ships it.

| ID | Chart | Family | Wave | Priority |
|---|---|---|---|---|
| REQ-400 | **Histogram** — raw observations binned in the core; `cumulative` turns the counts into a running total | distribution | 1 | MUST |
| REQ-401 | **ECDF** — empirical cumulative distribution as a step function of the sorted observations | distribution | 1 | MUST |
| REQ-402 | **Box plot** — per group: quartiles, median, Tukey whiskers at 1.5 IQR, outliers as points | distribution | 1 | MUST |
| REQ-403 | **Violin** — per group: a mirrored kernel density, with the median and quartiles marked inside | distribution | 1 | MUST |
| REQ-404 | **Ridgeline** — per group: a kernel density on its own baseline, the baselines overlapping by a declared ratio | distribution | 1 | MUST |
| REQ-405 | **Beeswarm** — one point per observation along a value axis, packed without overlap by a deterministic layout | distribution | 1 | MUST |
| REQ-406 | **Lollipop** — a stem from the baseline and a head at the value, per category | comparison | 1 | MUST |
| REQ-407 | **Dumbbell** — two values per category joined by a segment; `endMarker: 'arrow'` encodes direction from the first to the second | comparison / change | 1 | MUST |
| REQ-408 | **Slopegraph** — two parallel axes (two periods), one segment per category, labelled at both ends | change | 1 | MUST |
| REQ-409 | **Bump** — the rank of each series at each x, computed in the core, one line per series | ranking | 1 | MUST |
| REQ-410 | **Error bars** — a point estimate with its interval per category, rows or columns | uncertainty | 1 | MUST |
| REQ-411 | **Interval** — floating bars from `start` to `end` on lanes, over a numeric axis or ISO dates (UTC) | interval | 1 | MUST |
| REQ-412 | **Diverging bars** — ordered levels (a Likert scale) stacked on both sides of a neutral centre | survey | 1 | MUST |
| REQ-413 | **Connected scatter** — an ordered path through x-y points, with direction marks and labelled ends | relationship | 1 | SHOULD |
| REQ-414 | **Waffle** — a unit grid of cells (100 by default) filled in reading order by category | part-to-whole | 2 | MUST |
| REQ-415 | **Marimekko** — columns whose width is their total and whose segments are their composition, both axes at 100 % | part-to-whole | 2 | MUST |
| REQ-416 | **Squarified treemap** — a hierarchy laid out by the squarified algorithm, nested frames per level | hierarchy | 2 | MUST |
| REQ-417 | **Sunburst** — a hierarchy as concentric rings of arcs, angle ∝ value, with a controlled root node | hierarchy | 2 | MUST |
| REQ-418 | **Tree** — a tidy node-link tree, horizontal or vertical | hierarchy | 2 | MUST |
| REQ-419 | **Parallel coordinates** — one value axis per dimension, one polyline per row | multivariate | 2 | SHOULD |
| REQ-420 | **Polar line** — a line over angle × radius, closed when the angle is cyclic | polar | 2 | MUST |
| REQ-421 | **Polar scatter** — points over angle × radius, unbinned | polar | 2 | SHOULD |
| REQ-422 | **Density bins** — x-y points binned in two dimensions into hexagons or rectangles, tone by count | field | 3 | MUST |
| REQ-423 | **Contours** — iso-lines and filled bands, from a point cloud (density) or a regular grid of values | field | 3 | SHOULD |
| REQ-424 | **Delaunay / Voronoi** — the triangulation of x-y points, or its dual cells | field | 3 | COULD |
| REQ-425 | **Vector field** — an arrow per grid point, direction and length from its components | field | 3 | COULD |
| REQ-426 | **Network** — a node-link graph laid out deterministically, or at the positions the consumer gives | network | 3 | SHOULD |

> **Geometry note.** REQ-400..REQ-415 and REQ-419..REQ-421 reuse the cartesian and arc engines and
> add statistics or a small layout of their own. REQ-416..REQ-418 need hierarchy layouts, REQ-423 and
> REQ-424 need marching squares and a robust triangulation, and REQ-426 needs an iterative layout. All of
> them are owned by the core; no dependency is added (DD-028, user decision 2026-10-08).

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

### 6.11 UI components

Criteria in EARS. Identifiers REQ-300..REQ-334 are new; none is reused. The block starts at 300 so
the family reads as one range.

#### The catalog

| Group | Components |
|---|---|
| Actions | Button |
| Data entry | Input, Checkbox, RadioGroup, Switch, Slider, Rate, Segmented |
| Navigation | Tabs, Steps |
| Data display | Card, Tag, Badge, Divider |
| Feedback | Progress, Alert, Skeleton |

#### Structure

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-300 | ubiquitous | THE SYSTEM SHALL provide the 17 components of the catalog in each adapter —React `SpButton`…, Vue `SpButton`…, Angular `SpButton` as `sp-…` or `[sp…]`, one name per component in the three adapters (OQ-U2)— each importable by its own `ui/<kebab-case-name>` subpath. | MUST |
| REQ-301 | ubiquitous | THE SYSTEM SHALL ship the components' styles as a separate, opt-in stylesheet `@silverpoint/grounds/ui.css`; an application that imports no component SHALL see no change in its bundle or in `styles.css`. | MUST |
| REQ-302 | ubiquitous | THE SYSTEM SHALL compute every component geometry —value fractions, arcs, step connectors, frame variant— and every keyboard transition in `@silverpoint/core`, as pure functions; adapters SHALL only translate the result into elements (REQ-102 extended). | MUST |
| REQ-303 | ubiquitous | THE SYSTEM SHALL add no runtime dependency to any package for this feature; the runtime allowlist (TD §5.3) is unchanged. | MUST |

#### Drawing

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-304 | ubiquitous | THE SYSTEM SHALL draw hit areas, focus indicators and every value-bearing shape —progress fill, slider thumb and fill, rating marks, switch knob, step markers and connectors— with exact geometry, and SHALL apply hand inking only to frames, rules and tonal fills. | MUST |
| REQ-305 | ubiquitous | THE SYSTEM SHALL paint hand-inked frames and tonal fills from pieces generated at build time, laid as CSS masks and painted through `--sp-` custom properties; the render path SHALL NOT measure the DOM, run an inking engine, or emit a literal colour (REQ-042). | MUST |
| REQ-306 | ubiquitous | Switching a component between `ink` and `precision` SHALL change no element's layout box and no value geometry. | MUST |
| REQ-307 | ubiquitous | THE SYSTEM SHALL choose a component's frame variant as a pure function of its `seed`, else its `id`, else variant `0`; never from mount order, randomness or time (Art. 4). | MUST |
| REQ-308 | ubiquitous | THE SYSTEM SHALL render the tone of checked, selected, filled and emphasised states from the ground's tonal ramp —hatch tiles under a `hatch` ground, line weight under a `weight` ground— and SHALL NOT use opacity as a tonal mechanism (Art. 6). | MUST |
| REQ-309 | ubiquitous | THE SYSTEM SHALL heighten only the current item of a component that has one —active tab, current step, selected segment, slider thumb— at most one element per component instance, outlined in ink (REQ-024, §3.3 of the Data Model). | MUST |
| REQ-310 | ubiquitous | No component SHALL convey a state by hatching alone: checked, selected, current, error and disabled SHALL also be carried by a glyph, a shape, text or a native state (REQ-124 extended). | MUST |

#### Theming

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-311 | optional | WHERE a component sets `ground`, `substrate` or `mode`, or sits under a provider or a dashboard that does, THE SYSTEM SHALL resolve them with the precedence component prop → dashboard → provider → library default; the `precision` override of REQ-123 SHALL apply after resolution and SHALL NOT be overridable. | MUST |
| REQ-312 | ubiquitous | Each ground SHALL declare a `ui` token section —control heights, frame style, focus width, radius, frame variants— and adding a ground SHALL NOT require changes to any component's code (REQ-044 extended to `packages/core/src/ui/**` and the adapters' `ui/`). | MUST |
| REQ-313 | ubiquitous | Every component's text SHALL reach 4.5:1 and every graphical object needed to identify a control or its state 3:1 against its substrate, on every substrate of every ground (REQ-126 extended), the normative list of pairs being Data Model §3.8; CI SHALL verify it as REQ-127 does. | MUST |

#### Accessibility

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-314 | ubiquitous | THE SYSTEM SHALL build on native elements where they exist: Button on `<button>`, Input on `<input>`, and Checkbox, RadioGroup, Switch, Slider, Rate and Segmented on native inputs that stay in the accessibility tree (visually hidden, never `display: none`), the drawing being `aria-hidden`. | MUST |
| REQ-315 | event | WHEN a composite widget —Tabs, RadioGroup, Segmented, Rate— has keyboard focus, THE SYSTEM SHALL follow its WAI-ARIA Authoring Practices pattern: one tab stop per widget, arrow keys by orientation, Home and End, with the transition resolved in the core as a pure function of state, key, orientation and direction. | MUST |
| REQ-316 | event | WHEN an interactive element receives focus through `:focus-visible`, THE SYSTEM SHALL draw an exact, uninked focus indicator at least 2 px wide with at least 3:1 contrast against the adjacent colours. | MUST |
| REQ-317 | ubiquitous | Every interactive target SHALL measure at least 24 × 24 CSS px at every component size (WCAG 2.5.8; REQ-144). | MUST |
| REQ-318 | ubiquitous | THE SYSTEM SHALL expose each non-native component with its role: Progress as `progressbar` with `aria-valuenow`/`min`/`max` (no `valuenow` when indeterminate), Steps as an ordered list with `aria-current="step"`, Alert as `alert` for `error`/`warning` and `status` otherwise, Divider as `separator`, Skeleton with `aria-busy` on its region and hidden shapes, Badge with its count in the accessible name. | MUST |
| REQ-319 | unwanted | IF a Button or Badge has no accessible name —no text content and no `label`— THEN THE SYSTEM SHALL warn `SP018` in development. | MUST |
| REQ-320 | event | WHEN the environment declares `prefers-reduced-motion: reduce`, THE SYSTEM SHALL render every component without transition or animation, and an indeterminate Progress SHALL show a static tone (REQ-125 extended). | MUST |
| REQ-321 | optional | WHERE the document or an ancestor sets `dir="rtl"`, THE SYSTEM SHALL mirror horizontal Slider, Progress, Steps and Segmented, and the arrow-key transitions of REQ-315. | SHOULD |

#### State and forms

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-322 | ubiquitous | Every value component —Input, Checkbox, RadioGroup, Switch, Slider, Rate, Segmented, Tabs— SHALL support controlled and uncontrolled use in each framework's idiom: React `value`/`defaultValue`/`onChange`, Vue `v-model`, Angular two-way `[(value)]`. | MUST |
| REQ-323 | ubiquitous | The Angular form components SHALL implement `ControlValueAccessor`, and in every adapter the native inputs SHALL carry `name` and `value` so that the components submit with a native HTML form. | MUST |
| REQ-324 | unwanted | IF a Slider, Rate or Progress value or a Steps `current` falls outside its range or off its step, or a Slider or Rate range (`min`, `max`, `step`, `count`) is invalid, THEN THE SYSTEM SHALL clamp and round it in the core (or fall back to the defaults), render the corrected value and warn `SP017` in development. | MUST |
| REQ-325 | unwanted | IF the items of a Tabs, Segmented, RadioGroup or Steps share a key, THEN THE SYSTEM SHALL keep the first, skip the later ones and warn `SP019` in development, and SHALL NOT throw. | MUST |
| REQ-326 | ubiquitous | A disabled component or item SHALL use the native `disabled` attribute where there is one, and `aria-disabled` otherwise; it SHALL emit no change or select event and, inside a composite, SHALL be skipped by the arrow keys. | MUST |
| REQ-334 | optional | WHERE an Input sets `message`, THE SYSTEM SHALL render it as text tied to the native input by `aria-describedby` (id `${id}--message`); WHERE it sets `invalid`, THE SYSTEM SHALL set `aria-invalid="true"` on the native input and draw the exact warning glyph inside the frame, so the error is carried by glyph and text, not by tone (REQ-310). | MUST |

#### Determinism and parity

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-327 | event | WHEN a component fixture is rendered by any adapter, THE SYSTEM SHALL produce a parsed markup tree identical to the fixture's canonical render (Art. 3, "chart, composition or component"). | MUST |
| REQ-328 | ubiquitous | CI SHALL run the three pixel gates of Art. 3 on every component fixture at its declared size. | MUST |
| REQ-329 | event | WHEN a page with components is server-rendered and hydrated in any example app, THE SYSTEM SHALL hydrate without mismatch; ids relating elements (tab ↔ panel, label ↔ control) SHALL derive from the component's `id` by the chart id rule, never from the framework's id hook. | MUST |

#### Budgets, integration and documentation

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-330 | unwanted | IF one component's subpath adds more than 3 KB min+gzip over the shared UI runtime, the shared UI runtime exceeds 8 KB, or `ui.css` exceeds 24 KB, THEN CI SHALL fail (REQ-164); the chart budgets stay unchanged. | MUST |
| REQ-331 | ubiquitous | Each example app —`vite-react`, `vite-vue`, `nextjs`, `angular`— SHALL include a UI reference page with the 17 components, verified end to end: no hydration mismatch, no axe A/AA issue, the APG keyboard pattern of every composite, pixel gates green. | MUST |
| REQ-332 | ubiquitous | The documentation site SHALL document every component with a live example and a props reference generated from the types, not retyped (REQ-099 extended). | MUST |
| REQ-333 | optional | WHERE an application uses `SilverpointProvider` (or `provideSilverpoint`), the same provider SHOULD ground both its charts and its components. | SHOULD |

**Count:** 35 requirements (33 MUST, 2 SHOULD). With §6.1–§6.10 the PRD has 165 requirements.

### 6.12 Derived geometry: statistics, layouts and identity

Requirements that bind the charts of §6.4.2 and any later chart that derives what it draws.

#### Computation

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-430 | ubiquitous | THE SYSTEM SHALL compute every statistic (bins, quantiles, densities, cumulative distributions, ranks) and every layout (packing, hierarchy, mosaic, 2-D bins, contours, triangulation, graph) in `@silverpoint/core`, as pure functions of the data and the props; adapters SHALL receive geometry only (REQ-102 extended). | MUST |
| REQ-432 | ubiquitous | THE SYSTEM SHALL default every statistic to a documented method —bins by Freedman–Diaconis, falling back to Sturges when the IQR is zero; quantiles by linear interpolation (Hyndman–Fan type 7); density by an Epanechnikov kernel with Silverman's rule-of-thumb bandwidth; whiskers at 1.5 IQR; ranks by competition ranking with ties broken by series order— and SHALL let each be overridden by a prop. | MUST |
| REQ-433 | unwanted | IF a statistic parameter is invalid —`bins < 1`, a non-finite or non-positive `bandwidth`, a `whisker` below 0, thresholds not increasing— THEN THE SYSTEM SHALL use the default, warn with `SP021` and render. | MUST |
| REQ-434 | unwanted | IF a group has fewer observations than its statistic needs —fewer than 5 for a box, fewer than 2 for a density— THEN THE SYSTEM SHALL draw that group's observations as points, warn with `SP022` and render the other groups unchanged. | MUST |
| REQ-435 | ubiquitous | Every iterative layout (beeswarm packing, network layout) SHALL run a fixed number of iterations from a start derived from the chart's seed, and SHALL use inside the iteration only operations ECMAScript requires to be correctly rounded (`+ − × ÷`, `Math.sqrt`, comparisons), so that Node and every supported browser produce the same coordinates (REQ-005, REQ-103). | MUST |
| REQ-436 | state | WHILE every node of a `NetworkChart` carries finite `x` and `y`, THE SYSTEM SHALL draw the nodes at those positions, scaled to the plot, and SHALL run no layout. | MUST |
| REQ-437 | unwanted | IF hierarchical data is invalid —a duplicate `id`, a `parent` that does not exist, a cycle, or more than one root— THEN THE SYSTEM SHALL drop the offending rows (and, for several roots, add a synthetic root named by the chart), warn with `SP020` naming the first offending `id`, and render without throwing. | MUST |

#### Accessibility and identity

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-431 | ubiquitous | WHERE a chart derives what it draws, its tabular alternative and its keyboard announcements SHALL present the **derived** values —bin range and count, the five-number summary, rank, the node's value and share of its parent— and its description SHALL name the method and its parameters (REQ-120, REQ-121 extended). | MUST |
| REQ-438 | event | WHEN the user navigates a hierarchy chart by keyboard, THE SYSTEM SHALL follow the WAI-ARIA tree pattern —Down/Up to the next/previous node in depth-first order, Right to the first child, Left to the parent, Home/End to the first/last node— and SHALL announce the node's path from the root, its value and its share (REQ-122 extended). | MUST |
| REQ-439 | optional | WHERE a `SunburstChart` or `SquarifiedTreemap` sets `rootId`, THE SYSTEM SHALL draw that node as the root; activating a node SHALL emit `onRootChange` with its `id` (and the parent's on its centre), and the chart SHALL keep no root state of its own (REQ-108). | SHOULD |
| REQ-440 | ubiquitous | WHERE a chart shows more categories than the ground's tonal levels, THE SYSTEM SHALL tone them as the polar charts already do —the ramp in turn, no two neighbours sharing a level— and SHALL carry each category's identity by a direct label, a printed share, the legend, its position or order, and the tabular alternative; tone SHALL only repeat what one of those already says (REQ-124 extended). | MUST |
| REQ-441 | ubiquitous | Every stroke that encodes a datum or a derived value —bin edges and tops, whiskers, medians, density outlines, stems and heads, rank lines, interval ends, tile and arc boundaries, contour lines, triangle edges, arrows, links— SHALL be `role: 'encoding'` and exact; inking SHALL touch only axes, grids, frames and tonal fills (REQ-022 extended). | MUST |
| REQ-442 | ubiquitous | Each chart of §6.4.2 SHALL heighten exactly one element, the one its API row declares (REQ-024 extended). | MUST |
| REQ-450 | ubiquitous | Every chart of §6.4.2 SHALL be drawn with silverpoint's existing visual grammar —the stroke roles, paint parts, tonal ramp, heighten rule, card layout and typography the first 33 charts use— and SHALL introduce no new stroke part, paint, label kind, `part` attribute or `--sp-` variable; the reference catalog contributes the inventory only, never a rendering or styling approach. | MUST |

#### Volume, performance and weight

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-443 | unwanted | IF the input exceeds its family's ceiling —10 000 observations for binned or density charts, 500 drawn points for beeswarm, polar scatter, connected scatter and Delaunay, 200 intervals, 500 hierarchy nodes, 150 network nodes or 600 links, 60 × 60 grid cells for fields— THEN THE SYSTEM SHALL warn with `SP008`, recommend aggregation, and render (REQ-096 extended). | MUST |
| REQ-444 | ubiquitous | Every new chart SHALL be importable by its own subpath, and the statistics and layout module SHALL tree-shake: the one-chart build of an existing chart SHALL not grow (REQ-107, REQ-164 extended). | MUST |
| REQ-445 | ubiquitous | Geometry SHALL be computed within: 2 ms for 100 points (unchanged); 4 ms for a statistic over 1 000 observations; 8 ms for a 60 × 60 field; 16 ms for a 150-node network layout; on the reference hardware, as CI benchmarks. | MUST |

*Amended in implementation (feature-004):* REQ-444's no-growth gate measures each existing
one-chart build minified against a recorded baseline, within an allowance (0.25 KB through `0.6.0`).
For `0.7.0` the baseline is `tools/bundle-budget/one-chart-0.6.0.json` (all 244 one-chart entries,
measured on a v0.6.0 worktree) and the allowance 2 KB, which holds the palette on the chart path
(REQ-519; user decision 2026-10-19); from `0.7.0` on it is 0.25 KB again.

#### Grounds, demos, quality and docs

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-446 | ubiquitous | Every new chart SHALL ship a synthetic, original demo dataset, frozen in the source, that exercises its statistic or layout; none SHALL be copied from the reference catalog (REQ-093 extended). | MUST |
| REQ-447 | state | WHILE the active ground declares `tonalMechanism: "weight"`, every new chart SHALL encode tone by line weight and SHALL emit no hatch (REQ-028, I-16). | MUST |
| REQ-448 | ubiquitous | Every new chart SHALL join the fixture matrix on every ground, substrate and mode, and pass the parity and pixel gates (REQ-180, REQ-181, REQ-182 extended). | MUST |
| REQ-449 | ubiquitous | The documentation site SHALL show every new chart in the gallery with its demo, a props reference generated from the types, and a statement of the method behind each derived value (REQ-099 extended). | MUST |

**Count:** §6.4.2 and §6.12 hold 48 requirements (40 MUST, 6 SHOULD, 2 COULD). With the rest of §6 the PRD has 213 requirements (194 MUST).

### 6.13 Palettes, composed components, overlays and the timeline

`reflex-silverpoint-react` 0.7 grew, on top of silverpoint `0.6.0`, the pieces a product needs around
its charts and controls, in Reflex only and outside the parity contract. This section makes them
silverpoint's, in the three adapters, under one markup contract computed by `@silverpoint/core` and
held to the gates of §6.11. The overlays use the platform —`<dialog>` and the Popover API— with their
keyboard and placement in the core, so no adapter depends on a headless library (user decision
2026-10-18). Released in `0.7.0`. Identifiers REQ-460..REQ-523 are new, with 469 and 504..509 left
free; none is reused.

#### 6.13.1 Palettes

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-460 | ubiquitous | THE SYSTEM SHALL define a palette as up to nine optional colours —`substrate`, `ink`, `inkSecondary`, `heighten`, `rule`, `grid`, `text`, `textMuted`, `focus`— each setting one `--sp-` custom property (Data Model §2.26); an unset field SHALL keep the ground's own value. | MUST |
| REQ-461 | optional | WHERE a chart, a UI component, a composed component, an overlay, a dashboard or a `SpTimeline` sets `palette`, THE SYSTEM SHALL write the palette's declarations on that element's root as an inline `style` computed by `@silverpoint/core`, in the fixed order of REQ-460, so that it re-colours without re-rendering the drawing (REQ-041, REQ-042). | MUST |
| REQ-462 | optional | WHERE a provider (`SilverpointProvider`, `provideSilverpoint`) or a dashboard sets `palette`, THE SYSTEM SHALL merge palettes field by field with the precedence element → dashboard → provider, a nested provider scoping a section. | MUST |
| REQ-463 | ubiquitous | THE SYSTEM SHALL ship six presets —`silverpoint`, `sanguine`, `sepia`, `ironGall`, `verdigris`, `indigo`— as frozen data on `@silverpoint/core/palettes`, importable one by one so that an application ships only the presets it names. | MUST |
| REQ-464 | ubiquitous | Every preset SHALL pass every contrast pair of the gate (Data Model §3.8 and §3.9) against its own substrate; CI SHALL verify it as REQ-127 does. | MUST |
| REQ-465 | ubiquitous | THE SYSTEM SHALL expose `contrastRatio(a, b)` and `checkPalette(palette, substrate?)`, which measures every hex field of a palette against its thresholds and returns one finding per failing pair (empty when it passes). | MUST |
| REQ-466 | unwanted | IF a palette given to any element has a hex field below its contrast threshold, THEN THE SYSTEM SHALL render it as given and warn `SP023` in development, once per palette. | MUST |
| REQ-467 | unwanted | IF a palette has a field outside REQ-460, or a value that is not a CSS colour (by allowlist: a hex, a keyword, or a colour function over numbers, idents and custom properties; so no `;`, `{`, `}`, `<`, quotes, escapes, `url(` or `image-set(`), THEN THE SYSTEM SHALL drop that field and warn `SP024` in development. | MUST |
| REQ-468 | ubiquitous | A palette SHALL NOT change any geometry, any element or any attribute other than the root's `style`; `precision` mode and REQ-123 SHALL apply over any palette. | MUST |

*Amended in implementation:* (1) the palette API —`resolvePalette`,
`paletteStyle`, `nestProvider`, `checkPalette`, `contrastRatio` and the presets— lives on
`@silverpoint/core/palettes`, and the main entry keeps only the `Palette` and `PaletteFinding` types:
on the main entry it pushed `@silverpoint/core` past its 45 kB budget (REQ-164); (2) `SP023` measures
a palette against its own `substrate`, else cream, since the core does not know the ground's
substrate colour when it resolves a palette; (3) `SP024` is a development warning, but the field is
dropped in every build, and the allowlist of REQ-467 is applied again by `paletteStyle`; (4) nested
providers inherit field by field, and a dashboard's root carries its own palette only; (5) a chart's
palette is on the adapter's `.sp-root` frame, and the core's `toSVGString` writes it on the `<svg>`;
(6) the consumer's own `style` is appended after the palette's, so the consumer wins.

#### 6.13.2 Composed components

| Group | Components |
|---|---|
| Building blocks | Surface, Glyph |
| Data display | Table, Statistic, Descriptions, TimelineList, Avatar (+ AvatarGroup), Empty, Result |
| Navigation | Pagination, Breadcrumb |
| Disclosure | Collapse (+ CollapseItem) |
| Data entry | Textarea, InputNumber |

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-470 | ubiquitous | THE SYSTEM SHALL provide the components of the table above in each adapter as `Sp<Name>`, one name in the three adapters, each importable by its own `ui/<kebab-case-name>` subpath (REQ-300 extended). | MUST |
| REQ-471 | ubiquitous | Each component SHALL be a view tree computed by `@silverpoint/core/ui`; every computation —sort order, page window, number clamping and rounding, initials— SHALL be a pure core function, and the adapters SHALL only bind values, events and slots (REQ-302 extended). | MUST |
| REQ-472 | ubiquitous | `SpSurface` SHALL render the root contract of the UI components (`.sp-ui`, ground, substrate, mode, size, frame variant) on any element the consumer names, with an optional frame of any kind and an optional tone; `SpGlyph` SHALL render any glyph of `UI_GLYPHS`, which gains `plus`, `chevronDown`, `chevronRight`, `chevronLeft`, `arrowUp`, `arrowDown`, `sortUp`, `sortDown`, `sort` and `ellipsis`. | MUST |
| REQ-473 | ubiquitous | `SpTable` SHALL render a native `<table>` with `<caption>`, a header row of `<th scope="col">` and one row per datum, on a card frame; numbers SHALL use tabular figures and columns SHALL align `start`, `center` or `end`. | MUST |
| REQ-474 | event | WHEN the consumer activates a sortable column header, THE SYSTEM SHALL emit the column key; WHERE `sortKey` and `sortOrder` are set, THE SYSTEM SHALL set `aria-sort` on that header and draw its sort glyph, and `uiSortRows` SHALL order rows stably with `null` and missing values last. | MUST |
| REQ-475 | optional | WHERE a table sets `striped` or `hoverable`, THE SYSTEM SHALL tone the even rows or the row under the pointer with the ground's level-1 tone, and SHALL NOT use a gradient, a colour mix or opacity (Art. 6). | MUST |
| REQ-476 | ubiquitous | `SpPagination` SHALL render a `<nav>` landmark holding previous, next, the first, the last and a window of pages around the current one computed by `uiPageWindow`; the current page SHALL carry `aria-current="page"` and be heightened (REQ-309). | MUST |
| REQ-477 | ubiquitous | `SpBreadcrumb` SHALL render a `<nav>` landmark with an ordered list of links whose last item, or any item without `href`, is the current page (`aria-current="page"`). | MUST |
| REQ-478 | ubiquitous | `SpAvatar` SHALL render an image with its `alt`, or the initials `uiInitials(name)` with `role="img"` and the name as accessible name; `SpAvatarGroup` SHALL be a `role="group"`. | MUST |
| REQ-479 | ubiquitous | `SpStatistic` SHALL render a title, a value with tabular figures, optional prefix and suffix and an optional trend whose direction is carried by an exact arrow glyph and by the delta text, never by tone alone (REQ-310). | MUST |
| REQ-480 | ubiquitous | `SpDescriptions` SHALL render label–value pairs as a `<dl>` in `columns` columns, one column under 520 px of container width. | MUST |
| REQ-481 | ubiquitous | `SpTimelineList` SHALL render an ordered list of events with time, title and description; each status SHALL be carried by a mark shape —`done` toned, `current` heightened (at most one, `aria-current="step"`), `pending` empty with a dashed connector, `error` a cross glyph— and by the item's text. | MUST |
| REQ-482 | ubiquitous | `SpCollapse` SHALL render each `SpCollapseItem` as a native `<details>`/`<summary>`; WHERE `accordion` is set, THE SYSTEM SHALL make the items exclusive with the native `name` attribute; a disabled item SHALL not toggle and SHALL carry `aria-disabled`. | MUST |
| REQ-483 | ubiquitous | `SpEmpty` SHALL render a toned tray and a description; `SpResult` SHALL render a round frame with the status glyph (tick, info, warning, cross), a heading and a subtitle, with `role="status"` for `success` and `info` and `role="alert"` for `warning` and `error`. | MUST |
| REQ-484 | ubiquitous | `SpTextarea` SHALL be a native `<textarea>` on the `SpInput` contract —frame, `message` tied by `aria-describedby`, `invalid` with `aria-invalid` and the warning glyph (REQ-334)— with `rows`, `maxLength` and an optional character counter. | MUST |
| REQ-485 | ubiquitous | `SpInputNumber` SHALL be a native `<input type="number">` between exact − and + stepper buttons; `uiNumberValue` SHALL clamp the value to `min`/`max` and round it to `precision`, the steppers SHALL be disabled at their bound, and an emptied field SHALL report `null`. | MUST |
| REQ-486 | unwanted | IF an `SpInputNumber` value or an `SpPagination` `current` falls outside its range, THEN THE SYSTEM SHALL correct it in the core, render the corrected value and warn `SP017` in development (REQ-324 extended). | MUST |
| REQ-487 | unwanted | IF the columns of an `SpTable` or the items of an `SpBreadcrumb`, `SpTimelineList`, `SpSelect` or `SpDropdownMenu` share a key, THEN THE SYSTEM SHALL keep the first, skip the later ones and warn `SP019` (REQ-325 extended). | MUST |
| REQ-488 | ubiquitous | `SpTextarea`, `SpInputNumber` and `SpSelect` SHALL support controlled and uncontrolled use in each framework's idiom and, in Angular, implement `ControlValueAccessor` (REQ-322, REQ-323 extended). | MUST |
| REQ-489 | ubiquitous | The display components —Surface, Glyph, Table without sorting, Breadcrumb, Avatar, AvatarGroup, Statistic, Descriptions, TimelineList, Empty, Result— SHALL render in React Server Components from `@silverpoint/react/server/ui/<name>` (REQ-104 extended). | MUST |

*Amended in implementation:* (1) REQ-489 no longer lists Collapse: the
navigation and entry components —Pagination, Collapse, Textarea, InputNumber— are client components
with no `server/ui/*` entry, as `0.3.0`'s Input is, because each needs a handler (a disabled
`SpCollapseItem` cannot be held shut without one); (2) the table draws its rows as given: the consumer
sorts them with `uiSortRows` and pages them with `SpPagination` (REQ-474, DD-040), and a cell holds its
text on a plate of the substrate, so a toned row keeps its text's contrast; (3) the steppers of
`SpInputNumber` are `tabindex="-1"`, the arrow keys on the input stepping as in APG's spinbutton, and
it reports a typed value on commit (blur or Enter; `change` in Vue and Angular), clamped by
`uiNumberValue`, `null` when emptied; (4) `SpSurface`'s element name must be a lowercase ident other
than `script`, `style`, `iframe`, `object`, `embed`, `template` or `noscript`, and a table column's
`width` a plain length, each else dropped with `SP017`; (5) optional keys (Breadcrumb, Descriptions,
TimelineList) are deduplicated by REQ-487 only when given, and an accordion's group name is
`${id}--accordion`, `SP017` without an `id` (REQ-329).

#### 6.13.3 Overlays

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-490 | ubiquitous | THE SYSTEM SHALL provide `SpModal`, `SpDrawer`, `SpPopover`, `SpTooltip`, `SpSelect`, `SpDropdownMenu`, `SpToast` and `SpToaster` in each adapter, each on its own `ui/<name>` subpath, with no runtime dependency (REQ-303 kept). | MUST |
| REQ-491 | ubiquitous | `SpModal` and `SpDrawer` SHALL be a native `<dialog>` opened with `showModal()`: focus moves into it, is trapped while it is open and returns to the element that had it; the page behind is inert; Escape closes it unless the consumer prevents it. `SpDrawer` with `modal: false` SHALL open with `show()`. | MUST |
| REQ-492 | ubiquitous | `SpPopover`, the list of `SpSelect` and the menu of `SpDropdownMenu` SHALL use the Popover API (`popover="auto"`): top layer, light dismiss by Escape and by a click outside, focus returned to the trigger; `SpTooltip` SHALL use `popover="manual"`. | MUST |
| REQ-493 | ubiquitous | THE SYSTEM SHALL place every anchored overlay with `uiPlace`, a pure core function of the anchor box, the overlay size, the viewport, the preferred side and alignment, the offset and the collision padding, flipping to the opposite side and shifting along the side to stay in the viewport; placement SHALL run on open, scroll and resize only, never during a server render. | MUST |
| REQ-494 | event | WHEN an `SpSelect` has focus, THE SYSTEM SHALL follow the APG select-only combobox pattern —Enter, Space, ArrowDown and ArrowUp open the list; arrows, Home, End and typeahead move the active option, skipping disabled ones; Enter selects; Escape closes without selecting— with every transition resolved by `uiListKey` and `uiTypeahead` in the core. | MUST |
| REQ-495 | event | WHEN an `SpDropdownMenu` is open, THE SYSTEM SHALL follow the APG menu button pattern —arrows, Home, End and typeahead over enabled items; Enter and Space activate and close; Escape and Tab close— with the transitions of REQ-494's core functions. | MUST |
| REQ-496 | event | WHEN the element an `SpTooltip` describes gets hover or keyboard focus, THE SYSTEM SHALL show the tooltip after `delay` ms, link it by `aria-describedby`, keep it while the pointer is over the tooltip itself, and hide it on blur, pointer leave or Escape (WCAG 1.4.13). | MUST |
| REQ-497 | ubiquitous | `SpToaster` SHALL be a labelled region holding its toasts; an `SpToast` SHALL be announced politely (`role="status"`) for `info` and `success` and assertively (`role="alert"`) for `warning` and `error`, carry its kind by glyph and text, close after `duration` ms unless the pointer or focus is in it, and report the close through its open-change event. | MUST |
| REQ-498 | ubiquitous | In every list overlay the active option or item SHALL be heightened, at most one per instance (REQ-309 extended to the active item of an open list); the chosen option of an `SpSelect` SHALL also carry the exact tick glyph and `aria-selected="true"`. | MUST |
| REQ-499 | ubiquitous | The backdrop of a modal overlay SHALL be the tone of the ground's `ui.backdrop` level (2 by default) over a transparent background, and the opaque substrate under a `weight` ground or in `precision`; it SHALL NOT use opacity (Art. 6). | MUST |
| REQ-500 | ubiquitous | Every overlay SHALL support controlled (`open` + open-change event) and uncontrolled use with a trigger slot; any element may be the trigger, and the overlay SHALL set `aria-haspopup`, `aria-expanded` and `aria-controls` on it as its APG pattern requires. | MUST |
| REQ-501 | unwanted | IF an `SpModal`, `SpDrawer` or `SpPopover` has neither a `title` nor a `label`, THEN THE SYSTEM SHALL warn `SP018` in development (REQ-319 extended). | MUST |
| REQ-502 | ubiquitous | An overlay rendered on the server SHALL emit its closed markup, and its open markup when `open` (or `defaultOpen`) is set, so that the tree gate compares it; the adapter SHALL call `showModal()` or `showPopover()` after hydration, never before. | MUST |
| REQ-503 | event | WHEN the environment declares `prefers-reduced-motion: reduce`, overlays SHALL appear and disappear without transition (REQ-320 extended). | MUST |

*Amended in implementation:* (1) REQ-499: the `ui.backdrop` level
is that of the **hatched** backdrop; where the backdrop is not hatched —a `weight` ground,
`precision`— it is the opaque substrate whatever the level, and forced colours paint `Canvas`;
(2) REQ-491's trap is the native modal `<dialog>`'s: Tab cycles through the dialog and the browser's
own chrome, never the inert page behind; (3) the overlays are client components only in React, as the
entry components are; an overlay hangs from the element just before it (React, Vue) or from
`spTrigger` (Angular), so no ref is merged into the consumer's trigger, and the platform calls of
REQ-502 go through the core's `uiOverlaySync`, which leaves a popover in flow where the Popover API is
absent; (4) placement (REQ-493) also re-runs when the trigger or the overlay changes size, so that an
overlay placed before the web font replaced its fallback is placed again; (5) REQ-497: a paused toast
restarts its whole `duration` once pointer and focus leave it, since the time left would need a clock
on the render path (Art. 4), and F8 moves focus to the toaster, which takes `tabindex="-1"` only
then, never in the server markup.

#### 6.13.4 The Knight Lab timeline

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-510 | ubiquitous | THE SYSTEM SHALL provide `SpTimeline` on a `timeline` subpath of each adapter, rendering a Knight Lab TimelineJS timeline inside an `SpSurface`, with `@knight-lab/timelinejs` declared as an **optional** peer dependency of the adapter packages and imported only by that subpath. | MUST |
| REQ-511 | ubiquitous | THE SYSTEM SHALL ship the timeline skin as an opt-in stylesheet `@silverpoint/grounds/timeline.css` that replaces TimelineJS's colours, type and rules with the ground's `--sp-` properties, so that substrates, palettes, `cyanotype` and `precision` apply. | MUST |
| REQ-512 | optional | WHERE `inkedFrames` is true (default) and the mode is `ink`, THE SYSTEM SHALL lay the ground's own frame and tone masks on TimelineJS's markers, eras, menubar and story card, read from hidden probes by a core function; in `precision`, under a `weight` ground or with `inkedFrames: false`, every frame SHALL fall back to an exact rule. | MUST |
| REQ-513 | ubiquitous | `SpTimeline` SHALL load and construct TimelineJS on the client only, after hydration; its server markup SHALL be the surface, the probes and an empty mount, and only that markup SHALL be under the tree gate (Art. 3 as amended). | MUST |
| REQ-514 | ubiquitous | `SpTimeline` SHALL forward TimelineJS's events —`change`, `loaded`, `nav_next`, `nav_previous`, `zoom_in`, `zoom_out`, `back_to_start`— in each framework's idiom, and ignore the `font` and `theme` options, which the skin owns. | MUST |
| REQ-515 | unwanted | IF `@knight-lab/timelinejs` cannot be loaded, THEN `SpTimeline` SHALL keep its surface, render its `fallback` slot (empty by default) and warn `SP025` in development, and SHALL NOT throw. | MUST |

*Amended in implementation:* (1) REQ-515's "cannot be loaded" is a failure at run
time: a chunk that does not arrive, a blocked request, a module that throws as it is evaluated, or a
TimelineJS build error. The import is a literal, so that the consumer's bundler splits TimelineJS
into a chunk of its own; a consumer who imports the `timeline` subpath without installing the peer
therefore has a build that fails to resolve it, not a page that warns. A consumer who does not import
that subpath needs nothing (REQ-510). The subpath imports TimelineJS's source module, since the
package entry of 3.9.13 imports a Less stylesheet that no consumer bundler loads; (2) REQ-512: toned
eras are not keyed to `ink` mode, and an untoned era is a rule of the ramp's weight, so that a ground
with no ramp draws the stroke width; (3) TimelineJS 3.9.13 has no destroy method, so its `document`
keydown and `window` resize listeners outlive the component.

#### 6.13.5 Parity, budgets, integration and documentation

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-516 | event | WHEN a composed-component, overlay, palette or timeline-surface fixture is rendered by any adapter, THE SYSTEM SHALL produce a parsed markup tree identical to the fixture's canonical render (REQ-327 extended). | MUST |
| REQ-517 | ubiquitous | CI SHALL run the three pixel gates of Art. 3 on every fixture of REQ-516, overlays rendered open. | MUST |
| REQ-518 | unwanted | IF one component's subpath adds more than 3 KB min+gzip over the shared UI runtime, the overlay runtime (placement, list keys, the adapter's overlay base) adds more than 4 KB over it, `ui.css` exceeds 24 KB, `timeline.css` exceeds 6 KB, or the `SpTimeline` wrapper exceeds 3 KB without TimelineJS, THEN CI SHALL fail (REQ-330 extended). | MUST |
| REQ-519 | unwanted | IF palette support makes a one-chart build grow by more than 2 KB minified against its `0.6.0` size (`one-chart-0.6.0.json`, the REQ-444 baseline re-measured by user decision 2026-10-18, OQ-C3; the allowance raised to 2 KB by user decision 2026-10-19), THEN CI SHALL fail as REQ-444 does. | MUST |
| REQ-520 | ubiquitous | Each example app —`vite-react`, `vite-vue`, `nextjs`, `angular`— SHALL include a composed page (the 21 catalog rows and their companions), a palettes page (the six presets over a chart, a UI component and a composed one) and a timeline page, verified end to end: no hydration mismatch, no axe A/AA issue, the APG pattern of every overlay, pixel gates green. | MUST |
| REQ-521 | ubiquitous | The documentation site SHALL document every new component, the palettes and the timeline with a live example and a props reference generated from the types (REQ-332 extended). | MUST |
| REQ-522 | ubiquitous | Every new element SHALL meet REQ-313 (contrast), REQ-316 (exact focus), REQ-317 (24 × 24 targets), REQ-320 (reduced motion) and REQ-329 (ids from `id`), and every new interactive element SHALL be skipped by its keyboard pattern when disabled (REQ-326). | MUST |
| REQ-523 | optional | WHERE the document or an ancestor sets `dir="rtl"`, THE SYSTEM SHOULD mirror Pagination, Breadcrumb, the Drawer's `start`/`end` sides, the placement of REQ-493 and the steppers of InputNumber (REQ-321 extended). | SHOULD |

*Amended in implementation:* (1) REQ-519: with the `SP023` check, the provider
merge and Angular's `palette` input, the growth against `0.6.0` measured up to 1.7 KB (Angular), so
the allowance is 2 KB (user decision 2026-10-19), held by REQ-444's gate over all 244 one-chart
entries; (2) REQ-518's increments are written as absolute limits, as REQ-330's are (8 + 3 KB,
8 + 4 + 3 KB); React and Vue keep the overlay runtime inside each overlay's bundle, so their 4 KB is
held by the overlay rows, and Angular's overlay base is an entry of its own, `ui/overlay`; (3) the
fixtures of REQ-516 are 360 nightly and 144 on every PR, plus 36 palette fixtures on every PR (396 /
180); a palette fixture compares the trees with the `<svg>`'s `style` set aside, then the two styles
as sorted declarations.

*Amended in implementation:* the pages are `/composed`, `/palettes` and `/timeline` in every
app, their content in the shared harness (`COMPOSED_PAGE`, `PALETTES_PAGE`, `TIMELINE_PAGE`). The
composed page puts the 21 rows in the three panels of the UI page (silverpoint ink, silverpoint
precision, cyanotype), every overlay closed behind its trigger; the palettes page draws each preset
over a `LineChart`, an `SpCard` holding an `SpProgress`, and an `SpTable`. REQ-520's render and
hydration are verified by `e2e/pages.spec.ts`; its axe and APG halves by `e2e/composed.spec.ts`.

*Amended in implementation:* the overlays section of each composed panel holds its toasts in an
`SpToaster` (labelled `Notifications · <panel>`, laid out in place by the page's CSS); on the page
every item is uncontrolled as a consumer writes it (a pagination's `current` is its `defaultCurrent`,
a toast's `open` its `defaultOpen`). The APG patterns, REQ-497's pause and F8, REQ-503, REQ-523,
REQ-316/317 for the new controls and axe on the three pages are verified by `e2e/composed.spec.ts`;
Firefox and WebKit run in the pinned Playwright image.

*Amended in implementation:* REQ-521's sections are the site's galleries `/ui`, `/composed`
and `/overlays` (one per catalog family, by group) and the pages `/palettes` and `/timeline`; every
component's page stays at `/ui/<slug>`, and the nav marks its family. A docs overlay is drawn closed
behind its trigger, and a docs toast sits in an `SpToaster` of `duration: Infinity`, so a reader is
never timed (WCAG 2.2.1). The props tables come from the types: `Palette` and `SpTimelineProps` join
`generated/props.json`. Each adapter README names the 38 UI components and shows the palettes and
the timeline with its optional peer; since a preset is imported from `@silverpoint/core/palettes`,
the READMEs ask the application to name `@silverpoint/core` among its own dependencies (a strict
package manager does not hoist it).

**Count:** §6.13 holds 57 requirements (56 MUST, 1 SHOULD). With the rest of §6 the PRD has 270
requirements (250 MUST).

### 6.14 Agent access

silverpoint is newer than every language model's training data, so agents wrote it badly or not at
all. This section gives agents the facts, generated from the published types so they cannot drift.
The agent catalog is the single source; the server and the skills are views of it. A tool or a
skill never states a prop, a default or a name the catalog does not hold.

#### 6.14.1 The agent catalog

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-530 | ubiquitous | THE SYSTEM SHALL generate one agent catalog (`agent-catalog.json`, Data Model §2.28) from the published types (the props pipeline of REQ-332), the chart catalog, `UI_COMPONENTS`, the demos and one metadata file; no prop, type or default SHALL be typed by hand. | MUST |
| REQ-531 | ubiquitous | The catalog SHALL describe each of the 60 charts with its names and import paths in React, Vue, Angular and Reflex, its family, a one-line summary, the data shape it reads, the intents it serves, its own props (name, type, optional, default, doc) and a reference to its demo dataset. | MUST |
| REQ-532 | ubiquitous | The catalog SHALL describe each of the 38 UI components with its names and import paths per framework, its family and group, its props, its value and open bindings per framework, its events and its slots. | MUST |
| REQ-533 | ubiquitous | The catalog SHALL describe the props every chart and every component shares, the dashboard and its layout, the grounds and substrates, the six palette presets and the palette fields, the timeline and its optional peer, and the 25 diagnostic codes with their requirement, condition and remedy. | MUST |
| REQ-534 | ubiquitous | The catalog SHALL carry the library version it describes and, for Reflex, the `reflex-silverpoint-react` version and the silverpoint version that release wraps. | MUST |
| REQ-535 | event | WHEN a public type, a catalog row, a demo or the metadata file changes, CI SHALL regenerate the catalog and fail if the committed one differs. | MUST |
| REQ-536 | unwanted | IF a chart or component exported by an adapter is missing from the catalog, or the catalog names one no adapter exports, or a chart lacks family, summary, data shape or an intent, THEN CI SHALL fail. | MUST |
| REQ-537 | ubiquitous | The catalog SHALL ship inside `@silverpoint/mcp` and be published by the official site at `/agent-catalog.json`. | MUST |

#### 6.14.2 The MCP server

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-538 | ubiquitous | `@silverpoint/mcp` SHALL expose an MCP server over stdio (an executable, `silverpoint-mcp`) and over stateless Streamable HTTP (a request handler), with the same tools and resources on both. | MUST |
| REQ-539 | ubiquitous | The server SHALL provide the tools of API Spec §14.3 —`get_version`, `list_charts`, `get_chart`, `list_components`, `get_component`, `recommend_chart`, `generate_code`, `validate_props`, `render_chart`, `check_palette`, `search_catalog`— each with a JSON Schema input and a structured output. | MUST |
| REQ-540 | event | WHEN `recommend_chart` receives a data shape and an intent, THE SYSTEM SHALL return at most five charts ranked by the rules of Data Model §2.31, each with its reasons, identically for identical input (Art. 4). | MUST |
| REQ-541 | event | WHEN `generate_code` receives a chart or component, a framework (`react`, `vue`, `angular`, `reflex`) and optional field names and props, THE SYSTEM SHALL return the imports, the stylesheet imports and the code, using only names, paths and props the catalog holds, with the user's field names as accessors. | MUST |
| REQ-542 | event | WHEN `validate_props` receives a chart and props, THE SYSTEM SHALL build the chart with the core and return every diagnostic raised (code, severity, requirement, message, remedy) and every prop the chart does not declare. | MUST |
| REQ-543 | event | WHEN `render_chart` receives a chart, props, a size and an id, THE SYSTEM SHALL return a standalone SVG whose parsed tree, with the inlined stylesheet set aside, is identical to the canonical render of the same chart, props, size and id (Art. 3). | MUST |
| REQ-544 | optional | WHERE the client asks for `format: "png"`, THE SYSTEM SHOULD return the render rasterised as an MCP image, for clients that cannot display SVG. | SHOULD |
| REQ-545 | event | WHEN `check_palette` receives a palette, THE SYSTEM SHALL return the findings of the core's `checkPalette` for it (REQ-465). | MUST |
| REQ-546 | ubiquitous | The server SHALL provide the resources of API Spec §14.4: the whole catalog, one per chart and per component, the guides of the `silverpoint` skill, and the diagnostic codes. | MUST |
| REQ-547 | unwanted | IF a code pattern is not run by an example app (REQ-520) —today, an `SpButton` as an overlay's `trigger` (delta-014)— THEN `generate_code` and the skills SHALL NOT emit it. | MUST |
| REQ-548 | optional | WHERE the client supports prompts, THE SYSTEM SHOULD offer `choose-chart` and `build-dashboard` prompts that sequence the tools. | SHOULD |
| REQ-549 | unwanted | IF a tool receives an unknown chart, component, framework, ground, substrate or palette, THEN it SHALL return a tool error naming the closest valid names, never an exception or an empty result. | MUST |
| REQ-550 | ubiquitous | Every tool result SHALL carry the library version it was computed with, which SHALL be the version of the catalog the server ships. | MUST |
| REQ-551 | unwanted | IF a request would make the server write a file, open a network connection, read the environment beyond its configuration or evaluate code from the request, THEN the server SHALL refuse it: the server has no such capability. | MUST |

#### 6.14.3 The skills

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-552 | ubiquitous | This repository SHALL provide the `silverpoint` skill (`skills/silverpoint/`), written in English: a `SKILL.md` and references for choosing a chart, the charts by family, the components, grounds and palettes, the dashboard, the timeline, and React, Vue and Angular usage, its props tables generated from the catalog. | MUST |
| REQ-553 | ubiquitous | `reflex-silverpoint-react` SHALL provide the `reflex-silverpoint` skill, written in English, generated from its own catalog export (DD-049): builders, state-driven props and events, the provider and palettes, composed components and overlays, the timeline, and the demo app's patterns. | MUST |
| REQ-554 | ubiquitous | Each skill SHALL name the version it describes, SHALL tell the agent to prefer the MCP tools when they are connected, and SHALL keep its `SKILL.md` under 500 lines with the rest in references loaded on demand. | MUST |
| REQ-555 | ubiquitous | Each repository SHALL publish a Claude plugin manifest that installs its skill and the hosted MCP server. | MUST |
| REQ-556 | unwanted | IF the Reflex catalog wraps a silverpoint version other than the one the agent catalog describes, THEN the catalog build SHALL mark every Reflex entry `stale` with the version it wraps, and a release build SHALL fail. | MUST |
| REQ-557 | ubiquitous | CI SHALL extract every code example of both skills and the code of `generate_code`'s golden tests, and type-check them (React, Vue and Angular with the example apps' compilers; Reflex by importing and rendering the components). | MUST |

#### 6.14.4 Hosting and the official site

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-558 | ubiquitous | The HTTP server SHALL run as a serverless function and be reachable at the official site's `/mcp`; the site SHALL stay a static, frontend-only export. | MUST |
| REQ-559 | ubiquitous | A cold start SHALL answer within 1.5 s and `render_chart` of a demo dataset within 300 ms at p95. | MUST |
| REQ-560 | unwanted | IF a request body exceeds 256 KB, a dataset 5,000 rows, a string 1,000 characters, or a render the path budget (`PATH_BYTE_BUDGET`), THEN the server SHALL reject it with a tool error before computing. | MUST |
| REQ-561 | optional | WHERE the deployment provides a shared store, THE SYSTEM SHOULD limit each client address to 60 tool calls per minute. | SHOULD |
| REQ-562 | ubiquitous | The server SHALL keep no state between requests and SHALL NOT log request bodies; it MAY count calls per tool. | MUST |
| REQ-563 | ubiquitous | Tool descriptions and results SHALL be data from this repository's catalog only, and SHALL NOT carry instructions to the agent beyond the tools' own documentation. | MUST |
| REQ-564 | ubiquitous | The official site SHALL publish `/llms.txt` and `/llms-full.txt`, generated from the agent catalog at export. | MUST |
| REQ-565 | ubiquitous | The official site SHALL have a "Use with AI" page: the MCP URL, configuration for the common clients, how to install each skill, and the local `npx @silverpoint/mcp` alternative. | MUST |

#### 6.14.5 Quality

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-566 | ubiquitous | Every tool SHALL have contract tests: its input schema, its errors (REQ-549) and golden outputs. | MUST |
| REQ-567 | ubiquitous | CI SHALL run `render_chart` over every chart fixture of the PR matrix and compare each result to its canonical render as REQ-543 states. | MUST |
| REQ-568 | ubiquitous | CI SHALL start the built HTTP handler and run an MCP client smoke test: initialise, list tools and resources, call every tool once. | MUST |
| REQ-569 | ubiquitous | `@silverpoint/mcp` SHALL have a README and the documentation site a page for agent access, generated where they list tools from the server's own definitions. | MUST |

*Amended in implementation:* (1) **REQ-544 (PNG, SHOULD) is deferred** (user decision 2026-10-20):
the WASM rasteriser resolves no `var(--sp-*)` and reads no WOFF2, so a faithful PNG needs the
ground's paint flattened into presentation attributes first; `render_chart` takes no `format`.
(2) **REQ-556** applies in its strict form only when the Reflex pin is the wrapper's own export; the
interim pin, derived from the wrapper's sources (`derived` set), makes a stale release build warn
instead of fail (user decision 2026-10-20, option b). (3) **REQ-561 (rate limit, SHOULD) is not
implemented**: no shared store is configured, so the payload limits of REQ-560 stand alone.
(4) REQ-555: the plugin declares its server inline in `plugin.json`, not in a root `.mcp.json`,
which would connect every session opened in the repository. (5) REQ-559 measured 0.31 s cold start
and 13 ms `render_chart` p95 over the 60 demos. (6) REQ-569: the README's tool table and the site's
`docs/site/generated/agent-tools.json` are read from a running server and diffed by the catalog check;
the site's page is `/#/ai`, "Use with AI". (7) The release commit runs the catalog's `generate`
after `version-packages`, and the release job runs its `check --release` before publishing.

**Count:** §6.14 holds 40 requirements (37 MUST, 3 SHOULD). With the rest of §6 the PRD has 310
requirements (287 MUST).

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
- **UI components:** a component renders in < 1 ms (no geometry beyond fractions and one arc); a
  keyboard transition in the core < 0.05 ms. Benchmarks beside the geometry ones.
- **UI weight:** the budgets of REQ-330, measured by size-limit on every PR.
- **Derived geometry (REQ-445):** 4 ms for a statistic over 1 000 observations; 8 ms for a 60 × 60
  field; 16 ms for a 150-node network layout; CI benchmarks beside the 2 ms of a 100-point chart.
- **Path data weight, second catalog:** the 40 KB budget applies unchanged. The waffle (100 cells),
  the beeswarm (500 points) and the density bins are its stress cases; they fill through the shared
  tile, and a dense cloud's bins of one tone are drawn as one path.
- **Composed components and overlays:** a composed component renders in < 1 ms for 100 table rows;
  `uiSortRows` sorts 10,000 rows in < 10 ms; `uiPlace`, `uiListKey` and `uiTypeahead` < 0.05 ms per
  call. Benchmarks beside the UI ones.
- **Weight, `0.7.0`:** REQ-518 and REQ-519, measured by size-limit on every PR.
- **The MCP server, `0.8.0`:** REQ-559. The catalog is loaded once per instance (≤ 1 MB).

### Security

- The surface is a supply chain, not a server: allowlisted dependencies, `pnpm audit` in CI,
  publication with Trusted Publishing and no tokens in the repository.
- THE SYSTEM SHALL NOT interpolate user content as markup; all text enters as a text node.
- The MCP endpoint: REQ-551, REQ-560..563. No secrets in the package; the deployment needs none.

### Compatibility *(in place of "Availability")*

- Browsers: the last two major versions of Chrome, Firefox, Safari and Edge.
- React 18.2+ and 19. Angular: the two most recent majors. Vue 3.5+. Node 20+ for the build.
- Vite: the two most recent majors, as the dev server and bundler of the React example and,
  underneath, of the Angular CLI.
- TypeScript 5.9+, and 6.x where a supported framework requires it (Angular 22); the published types SHALL resolve under `moduleResolution: bundler` and
  `node16`.
- The CSS mask technique of DD-022 is checked in the pinned Chromium of the pixel gate and, in
  the e2e job, in Firefox and WebKit on the UI page.
- `<dialog>` with `showModal()`, the Popover API and exclusive `<details name>` are Baseline in the
  pinned Chromium, Firefox and WebKit of the e2e job; the e2e job checks each.
- TimelineJS: the optional peer `@knight-lab/timelinejs` `^3.9.13`.
- MCP: the protocol version pinned in the Technical Design (DD-044); clients tested: Claude Code,
  Claude (connector), MCP Inspector.

### Data volume *(in place of "Scalability")*

- `0.x` target: up to 500 points per series in cartesian families and 60 sectors in polar ones,
  while keeping the node budget. Above that, a warning and a recommendation to aggregate
  (REQ-096).
- The chord ring (REQ-091) is bounded by number of categories, not points: the ribbons grow
  quadratically. `0.x` ceiling: 12 categories.
- The second catalog's ceilings (REQ-443): 10 000 observations for binned or density charts; 500
  drawn points for the beeswarm, polar scatter, connected scatter and Delaunay; 200 intervals; 500
  hierarchy nodes; 150 network nodes or 600 links; 60 × 60 grid cells for fields.
- Fixtures: the chart matrix grows with the catalog, 60 charts and three state fixtures: 630 on
  every PR and 3 402 nightly (Data Model §5).
- Fixtures, `0.7.0`: the composed components, overlays and timeline surface add 36 states, 360
  nightly and 144 on every PR, and the palettes 36 fixtures on every PR (Data Model §5).

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

### Epic F — UI components

- **F1.** As Persona 1, I put a silverpoint `Segmented` above a silverpoint chart and switch its
  period, and both read as one drawing.
- **F2.** As Persona 2, I render the same `Tabs` in React and Angular and CI proves the markup is
  the same.
- **F3.** As Persona 4, I tab to a `Slider`, move it with the arrows, and my screen reader
  announces a native range; with high contrast on, the frame turns into a plain exact border.

### Epic G — Questions the first catalog could not answer

- **G-1** As a data product developer (Persona 1), I want to pass raw observations and get a
  histogram, box plot or violin, so that I do not compute statistics to draw a distribution.
  - [ ] Passing 1 000 numbers to `HistogramChart` draws bins whose counts sum to 1 000 (REQ-400).
  - [ ] The data table shows each bin's range and count, not the 1 000 rows (REQ-431).
- **G-2** As an editorial author (Persona 3), I want before/after and rank-over-time charts.
  - [ ] `DumbbellChart` with `endMarker: 'arrow'` shows direction without colour (REQ-407, REQ-440).
  - [ ] `BumpChart` ranks are computed for me; ties are stable between renders (REQ-409, REQ-432).
- **G-3** As a developer with a tree-shaped dataset, I want to pass `{ id, parent, value }` rows.
  - [ ] An orphan row does not crash the chart; I get `SP020` naming it (REQ-437).
  - [ ] A screen-reader user walks the tree with arrow keys and hears the path (REQ-438).
- **G-4** As a reader with precision needs (Persona 4), the new charts behave like the old ones.
  - [ ] `precision` mode changes no encoding vertex (REQ-441, REQ-006).
  - [ ] A server-rendered beeswarm hydrates in Firefox without a mismatch (REQ-435).

### Epic H — The Reflex 0.7 inventory

- **H1.** As Persona 1, I set `palette={sanguine}` on my provider and every chart, control and
  table of the section turns to red chalk, and CI tells me the palette still passes contrast.
- **H2.** As Persona 2, I open the same `SpModal` in React, Vue and Angular; the markup is the same,
  focus is trapped by the browser, and no headless library is in my bundle.
- **H3.** As Persona 4, I open an `SpSelect` with the keyboard, type "ve" to reach "Verdigris", and
  my screen reader hears a listbox with the selected option.
- **H4.** As Persona 3, I tell a story with `SpTimeline` and its markers are drawn with the same hand
  as the cards around it.

### Epic I — Agent access

| Story | Requirements |
|---|---|
| I-1 As Persona 5, my assistant knows every chart and component, in my framework | REQ-530..537, REQ-552, REQ-553 |
| I-2 As Persona 1, I ask which chart fits and see it drawn before coding | REQ-540, REQ-543, REQ-544 |
| I-3 As Persona 5, generated code compiles and validates | REQ-541, REQ-542, REQ-547, REQ-557 |
| I-4 As a Reflex user, the assistant writes idiomatic `reflex-silverpoint-react` | REQ-553, REQ-556 |
| I-5 As maintainer, nothing drifts and the endpoint is safe | REQ-535, REQ-536, REQ-551, REQ-560..563, REQ-566..568 |

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
| Seventeen components × three adapters is the largest phase yet | High | High | Step 6c in three batches, each closed by its own gates and review before the next starts; all 17 ship in `0.3.0` (OQ-U3, decided 2026-09-28) |
| CSS masks render differently across engines | Medium | Medium | Pixel gates are Chromium-pinned (Art. 3); Firefox and WebKit are covered by e2e presence checks, and `precision` needs no mask |
| Native inputs styled invisible break in some assistive technology | Low | High | Visually-hidden pattern, never `display: none` or `opacity: 0` on a zero box; axe and manual NVDA/VoiceOver pass on the UI page before release |
| Pressure to add overlays inside `0.3.0` | Medium | High | §5.2 names them; they need a behaviour-engine decision first (§5.3) |
| Name collisions (`Button`, `Input`) in React apps | Low | Low | Every component is `Sp`-prefixed in the three adapters (OQ-U2, decided 2026-09-28) |
| 27 charts nearly double the catalog for a one-person team | High | High | Three waves, each a minor release that is complete on its own; families share an engine; adapters are thin wrappers (`create-chart`) so a chart is mostly a core recipe |
| Floating-point drift between Node and a browser in densities and layouts breaks hydration | Medium | High | REQ-435: correctly rounded operations only inside iterations; Epanechnikov kernel; a hydration e2e in Firefox and WebKit for the beeswarm and network |
| The fixture matrix nearly doubles CI time | High | Medium | The user chose the full matrix on every PR (OQ-C4): the PR matrix stays `md` × 2 modes for every chart; if the gate job grows too slow, shard it across runners —never reduce the matrix |
| Owning tidy tree, squarify, marching squares and Delaunay costs more than importing them | High | Medium | DD-028: published algorithms with hand-computed test cases and property tests; exact predicates with `BigInt` fallback; wave 3 can ship without REQ-424 (COULD) |
| Many-category charts (sunburst, waffle) fail REQ-124 under a 4-level ramp | Medium | High | REQ-440: identity by label, printed share, legend, position and order, toned with the existing `ringTone` rule; an identity test checks every toned chart for a channel beyond tone (REQ-124) |
| Twenty-one components × three adapters plus a timeline: larger than Phase 6 | High | High | Phase 8 in three batches (A1 display, A2 entry and navigation, B overlays), each a review point; all ship together in `0.7.0` |
| Popover API light dismiss and `<dialog>` focus differ across engines | Medium | Medium | The APG e2e runs in Chromium, Firefox and WebKit on every overlay; behaviour the platform does not give is written once in the core |
| Palette support grows the one-chart bundle past REQ-444 | Medium | Medium | The presets and the palette API live on their own subpath; measured in step 8a before any adapter work. *Amended in implementation:* it did; the gate was re-baselined to `0.6.0` with a 2 KB allowance (REQ-519, user decisions 2026-10-18 and 2026-10-19) |
| TimelineJS (MPL-2.0) changes its DOM between versions | Medium | Low | Optional peer pinned to `^3.9.13`; the skin is outside the tree gate; a pixel fixture over a pinned version catches drift |
| Inline palette styles collide with a consumer's `style` | Low | Low | The core merges the consumer's `style` after the palette's, so the consumer wins |
| Agents are shown props or names the library does not have | High | High | Everything an agent reads is generated from the types and diffed in CI (REQ-535); examples and generated code are type-checked (REQ-557) |
| A public endpoint is abused | Medium | Medium | Read-only, stateless, payload limits before any work (REQ-560), no request logging; a rate limit once a shared store exists (REQ-561) |
| The Reflex wrapper lags the library | High | Medium | Its catalog carries the version it wraps; entries are marked `stale`, and a release fails on a stale export (REQ-556) |

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
| Phase 6 — UI components | 3 batches | 17 components × 3 adapters (§6.11), their gates and example-app pages, released in 0.3.0 |
| Phase 7 — second catalog | 3 waves | 27 charts × 3 adapters (§6.4.2, §6.12), the core's statistics and layouts, their gates and example-app pages; the three waves released together as 0.6.0 (user decision 2026-10-10) |
| Phase 8 — composed components | 3 batches | Palettes, 21 components × 3 adapters and `SpTimeline` (§6.13), their gates, example-app pages and docs; released in 0.7.0 |
| Phase 9 — agent access | 7 steps | The agent catalog, `@silverpoint/mcp`, the skills and plugin manifests, the hosted endpoint (§6.14); three repositories; target 0.8.0 |

---

## Change History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.14 | 2026-10-20 | Ernesto Crespo | Feature-005 folded: §6.14 agent access (REQ-530..REQ-569; 40 requirements: 37 MUST, 3 SHOULD; 270 → 310 in all, 287 MUST); Persona 5, §4.1, §5.1–§5.3, §7 additions, Epic I, §11 risks, §12 Phase 9; what the implementation changed folded as built ("amended in implementation"): REQ-544 deferred, REQ-556 strict only for the wrapper's own export, REQ-561 not implemented |
| 1.13 | 2026-10-20 | Ernesto Crespo | Feature-004 folded: §6.13 palettes, composed components, overlays and the timeline (REQ-460..REQ-523; 57 requirements: 56 MUST, 1 SHOULD; 213 → 270 in all, 250 MUST); §1, §4.1, §5.1–§5.3, §6.3, §7 additions, Epic H, §11 risks, §12 Phase 8; REQ-444's gate re-baselined to `0.6.0`; what the implementation changed folded as built ("amended in implementation"): REQ-489 without Collapse, REQ-499, REQ-519 at 2 KB |
| 1.12 | 2026-10-10 | Ernesto Crespo | Feature-003 folded: §6.4 split into §6.4.1 and §6.4.2 (27 charts, REQ-400..REQ-426), §6.12 derived geometry (REQ-430..REQ-450); 48 requirements, 165 → 213 in all; §1, §4.1, §5.1–§5.3, §7 additions, Epic G, §11 risks, §12 Phase 7 |
| 1.11 | 2026-09-29 | Ernesto Crespo | Feature-002 folded: §6.11 UI components, REQ-300..REQ-334 (35 requirements: 33 MUST, 2 SHOULD; 130 → 165 in all); §4.1 metrics, §5.1–§5.3 scope, §7 additions, Epic F, §11 risks; released in 0.3.0 |
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
- **Art. 1** (v1.7 amendment) — REQ-304 and REQ-306 extend it to interaction and value geometry.
- **Art. 2** — REQ-302 puts component geometry and keyboard transitions in the core.
- **Art. 3** — REQ-327 and REQ-328 extend the gates to component markup.
- **Art. 4** — REQ-307 and REQ-329 derive frame variants and ids from `seed`/`id`.
- **Art. 5** — REQ-314..REQ-320: native first, APG keyboard, exact focus.
- **Art. 6** — REQ-308 and REQ-309: tone by the ramp, one heightened item per component.
- **Art. 7** — REQ-312: `ui` tokens are ground data.
- **Art. 8** — REQ-303 and REQ-330: no new dependency, no CSS framework, budgets.
- **Art. 1** — REQ-441 classifies every derived mark as encoding: exact, untouched by the inker.
- **Art. 2** — REQ-430: statistics and layouts live in the core; adapters stay translators.
- **Art. 3 / Art. 4** — REQ-435 and REQ-432 make derived geometry deterministic across engines;
  REQ-448 puts every chart of §6.4.2 in the gates.
- **Art. 5** — REQ-431, REQ-438 and REQ-440 extend the tabular alternative, keyboard navigation
  and the no-hatch-alone rule to derived values, trees and many categories.
- **Art. 6 / Art. 7** — REQ-442, REQ-447 and REQ-450: one heighten, tone by the ground's mechanism,
  the existing grammar. **Art. 8** — no new dependency (the core owns its algorithms); REQ-444.
- **Art. 1** — composed components draw values (sort marks, steppers, counters, trend arrows) with
  exact glyphs; frames and tones are ornament (REQ-472..REQ-485).
- **Art. 2** — sorting, page windows, number clamping, placement, list keys and typeahead in the
  core (REQ-471, REQ-493..REQ-495).
- **Art. 3** (v1.9) — parity extended (REQ-516, REQ-517); the TimelineJS DOM is third-party markup,
  outside the gate (REQ-513).
- **Art. 4** — no timers or measurement on the render path; placement and toast timers run in the
  interaction path (REQ-493, REQ-497, REQ-502).
- **Art. 5** — native `<dialog>`, Popover API, APG patterns, exact focus, `precision` (REQ-491..REQ-498).
- **Art. 6** (v1.9) — striping, backdrop and list highlight by the ramp and by heightening, never
  opacity (REQ-475, REQ-498, REQ-499).
- **Art. 7** — palettes are data; a preset needs no component code (REQ-460, REQ-463).
- **Art. 8** — no new dependency; one optional peer on one subpath; budgets (REQ-510, REQ-518, REQ-519).
- **Requested exception:** none.
