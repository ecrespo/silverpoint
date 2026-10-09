# PRD delta — catalog expansion: 27 new charts

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 1, approved 2026-10-09 by Ernesto Crespo (Phase 1) |
| **Amends** | [PRD](../../specs/prd.md) v1.11 → v1.12: §1, §4.1, §5.1, §5.3, §6.4 (new rows and a new sub-table), new §6.12, §7, §9 (Epic G), §11 |
| **Applicable Constitution** | [`constitution.md`](../../specs/constitution.md) v1.7, with the stack-row amendment proposed in [`constitution-amendment.md`](constitution-amendment.md) |
| **Research** | [`research.md`](research.md) |
| **Size** | Complex feature (≥ 3 sprints): PRD + API + TD + Data Model + Plan + Tasks + Analyze (Art. 9) |

## 1. Summary

silverpoint draws 33 charts. Measured against a current, broad catalog —TanStack Charts, 188
examples— it covers the everyday cartesian and polar marks but has **no distribution charts**
(histogram, box plot, violin…), **no hierarchy charts** beyond a declared-grid treemap, **no
comparison-of-two-values charts** (dumbbell, slope), **no ranking**, **no uncertainty marks** and **no
fields or networks**. A product team that needs any of them leaves silverpoint for that card, and the
dashboard mixes two visual systems again.

This feature adds **27 charts** in four engine families, delivered in three waves, each a minor
release. They obey every rule the 33 obey —exact encoding geometry, one engine in the core, parity of
markup, determinism, accessibility, tone by density— and add what the new families need: a statistics
and layout module in the core, a tabular alternative that shows the derived values, deterministic
iterative layouts, tree navigation by keyboard, and category identity beyond the tonal ramp.

It is **not** a port of TanStack Charts. The catalog answers one question —which charts are missing—
and nothing else: every new chart is drawn in silverpoint's own visual language (hatching on the
ground's ramp, a fine exact line, one heightened element, the inked card) and implemented the way the
33 are (a core recipe on the shared modules, thin adapters). REQ-450 makes that binding.

## 2. Problem

| Today | Cost |
|---|---|
| No chart derives a statistic from raw observations | The consumer bins and computes quartiles themselves, then draws them with `BarChart`, losing the box plot's whiskers and the violin's shape altogether |
| `TreemapChart` takes tiles on a declared grid; there is no hierarchy input | A tree-shaped dataset (a file system, a budget, an org) cannot be drawn without hand-placing every tile |
| No mark for "before → after", "rank over time" or "estimate ± interval" | Three of the most common analytical questions have no card |
| No field or network chart | Spatial and relational data go to another library |

## 3. Scope changes

### §1 Executive Summary — amend

"The 28 charts of the base catalog and 5 new radial ones" → "33 charts of the first catalog and 27
of the second, in families of distribution, comparison, hierarchy, fields and networks (§6.4, §6.12)".

### §4.1 Project objectives — add

| Objective | Measure |
|---|---|
| Cover the distribution, comparison, hierarchy and relational questions | The 27 charts of §6.4.2 published, each with fixtures, parity and docs |
| Keep the cost of a chart flat | The one-chart build budget (45 KB min+gzip) unchanged; the statistics module tree-shakes out of charts that do not use it |

### §5.1 In Scope — add

- [ ] 27 further charts (§6.4.2) in three waves, with the statistics and layout module in
      `@silverpoint/core` they need (§6.12).

### §5.2 Out of Scope — add

- Interaction beyond the readout: brushing, zoom and pan, scrubbing, synchronised cursors, grouped
  readouts, interactive legends, editable ranges, streaming windows. Proposed as feature-004.
- Data reducers (group-by, mean, sum) inside a chart: the consumer aggregates; charts that derive a
  **distribution** (§6.12) are the one exception, because the distribution is the mark.
- Force simulation as a live, animated process: `NetworkChart` lays out once, deterministically.

### §5.3 Future Considerations — add

- Variants of the existing charts surfaced by the same survey —N series, stacked areas, labels and
  annotations, polar variants, derived overlays, a secondary axis— as deltas 014..019
  ([`research.md`](research.md) §4).
- Small multiples with shared scales, once §5.3's shared-scale model exists.

## 4. §6.4 Chart catalog — new sub-table 6.4.2

The existing table becomes §6.4.1 unchanged. Wave = the release that ships it (OQ-C1).

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

## 5. New §6.12 — Derived geometry: statistics, layouts and identity

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

#### Grounds, demos, quality and docs

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-446 | ubiquitous | Every new chart SHALL ship a synthetic, original demo dataset, frozen in the source, that exercises its statistic or layout; none SHALL be copied from the reference catalog (REQ-093 extended). | MUST |
| REQ-447 | state | WHILE the active ground declares `tonalMechanism: "weight"`, every new chart SHALL encode tone by line weight and SHALL emit no hatch (REQ-028, I-16). | MUST |
| REQ-448 | ubiquitous | Every new chart SHALL join the fixture matrix on every ground, substrate and mode, and pass the parity and pixel gates (REQ-180, REQ-181, REQ-182 extended). | MUST |
| REQ-449 | ubiquitous | The documentation site SHALL show every new chart in the gallery with its demo, a props reference generated from the types, and a statement of the method behind each derived value (REQ-099 extended). | MUST |

## 6. §7 Non-Functional Requirements — amend

- **Performance:** add REQ-445's budgets beside the existing ones.
- **Path data weight:** the 40 KB per-chart budget applies unchanged. Waffle (100 cells), beeswarm
  (500 points) and density bins are the new stress cases; they fill through the shared tile (DD-007).
- **Data volume:** add REQ-443's ceilings.
- **Fixtures:** the matrix grows from 33 to 60 charts: 600 fixtures on PR, 3 240 nightly
  (Data Model delta §5).

## 7. §9 User Stories — add Epic G

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

## 8. §11 Risks — add

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| 27 charts nearly double the catalog for a one-person team | High | High | Three waves, each a minor release that is complete on its own; families share an engine; adapters are thin wrappers (`create-chart`) so a chart is mostly a core recipe |
| Floating-point drift between Node and a browser in densities and layouts breaks hydration | Medium | High | REQ-435: correctly rounded operations only inside iterations; Epanechnikov kernel; a hydration e2e in Firefox and WebKit for the beeswarm and network |
| The fixture matrix nearly doubles CI time | High | Medium | The user chose the full matrix on every PR (OQ-C4). PR matrix stays `md` × 2 modes; measure the gate job after wave 1 and, if needed, shard it across runners —never reduce the matrix |
| Owning tidy tree, squarify, marching squares and Delaunay costs more than importing them | High | Medium | DD-028: published algorithms with hand-computed test cases and property tests; exact predicates with `BigInt` fallback; wave 3 can ship without REQ-424 (COULD) |
| Many-category charts (sunburst, waffle) fail REQ-124 under a 4-level ramp | Medium | High | REQ-440: identity by label, printed share, legend, position and order, toned with the existing `ringTone` rule; the Analyze gate checks every new chart's fixture for unlabelled categories |

## Constitution check

- **Art. 1** — REQ-441 classifies every derived mark as encoding: exact, untouched by the inker. Layout
  positions that carry no value (a network node's position, a beeswarm's offset across the axis) are
  still drawn exactly; only ornament is inked.
- **Art. 2** — REQ-430: statistics and layouts live in the core; adapters stay translators.
- **Art. 3 / Art. 4** — REQ-435 and REQ-432 make the derived geometry deterministic across engines;
  REQ-448 puts every new chart in the gates.
- **Art. 5** — REQ-431, REQ-438 and REQ-440 extend the tabular alternative, keyboard navigation and
  the no-hatch-alone rule to derived values, trees and many categories.
- **Art. 6 / Art. 7** — tone stays density (or weight under `cyanotype`, REQ-447); no chart code names
  a ground. **Art. 8** — no new dependency (DD-028); the constitution's stale stack row is amended ([`constitution-amendment.md`](constitution-amendment.md)). **Art. 9**
  — this delta, REQ ids on every MUST.
