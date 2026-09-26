# PRD delta — Dashboard composition

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-25 ("Apruebo el cambio que mencionas, las 4 puertas del dashboard y el delta-011") — gate 1, including the §5.2 amendment (A-02); **folded into `specs/prd.md` (v1.8) on 2026-09-25** |
| **Amends** | [PRD](../../specs/prd.md) v1.7 → v1.8: §1, §5.1, §5.2, §5.3, new §6.10, §7, §11 |
| **Applicable Constitution** | [`constitution.md`](../../specs/constitution.md) v1.4 |
| **Research** | [`research.md`](research.md) |
| **Size** | Complex feature (≥ 3 sprints): PRD + API + TD + Data Model + Plan + Tasks + Analyze (Art. 9) |

## 1. Summary

A **dashboard** is how silverpoint's charts are actually used: Persona 1 (PRD §3) builds "the
dashboard of a SaaS product", and the path-weight measurement that shaped DD-007 was taken on a
12-card dashboard. Today every consumer re-invents the grid around the cards, with their own CSS,
their own breakpoints, their own heading structure, and with nothing that keeps the arrangement
identical across React, Vue and Angular or through server rendering.

This feature adds a **declarative dashboard layout** to the three adapters: a grid of chart cards
whose layout is resolved in `@silverpoint/core`, laid out by CSS Grid and container queries,
server-renderable, held to the same parity gate as the charts, accessible as a landmark with a
heading and one labelled region per card, and — optionally — with **linked interaction** between
charts that share a category.

It is **not** a dashboard builder: no drag, no resize, no persisted editing state, no data layer.

## 2. Problem

| Today | Cost |
|---|---|
| Each app writes its own grid around the cards | Inconsistent gaps and breakpoints between the four example apps; the design language stops at the card edge |
| Card heights differ inside a row unless `height` is tuned by hand per chart, per chrome | The consumer does arithmetic on the card chrome that the core already knows (Art. 2 in spirit) |
| Charts' ids come from `useId()` / creation order when omitted | A dashboard's seeds depend on the framework's mount order, so the "same" dashboard inks differently in React and Angular (Art. 4, Art. 3) |
| No heading/landmark structure around a set of charts | Screen-reader users meet 12 unrelated `role="img"` in a row |
| Hover in one chart says nothing about the same hour in its neighbour | The main reason other libraries ship `syncId` / `connect` |

## 3. Scope changes

### §5.1 In Scope — add

- [ ] Dashboard composition in `@silverpoint/react`, `@silverpoint/vue` and `@silverpoint/angular`,
      with its layout resolved in `@silverpoint/core` (§6.10).

### §5.2 Out of Scope — amend

- ~~Visual editor or dashboard builder.~~ → **Visual editor or interactive dashboard builder:**
  drag, resize, add/remove cells at runtime, persisted layout state.
- Data layer for dashboards: fetching, shared data pools, filters, cross-filtering.
- Nested dashboards, tabs and pages inside a dashboard.

### §5.3 Future Considerations — add

- **Shared scales across the cards of a dashboard**, on Vega-Lite's `resolve` model
  (`{ y: 'shared' }`), computed in the core. It needs a common domain prop on the cartesian charts
  first.
- Exporting a whole dashboard to PDF / printable SVG (extends the existing export consideration).

## 4. Personas served

- **Persona 1** (data product developer): the primary one — a KPI strip plus a grid of cards in
  one component.
- **Persona 2** (architect at a multi-framework house): the same dashboard, identical in three
  frameworks, from one layout object.
- **Persona 4** (reader with precision or accessibility needs): a navigable structure instead of a
  wall of images.

## 5. Objectives and metrics

| Objective | Metric |
|---|---|
| A dashboard needs no consumer CSS | The reference dashboards in the four example apps use zero app-level CSS for layout |
| Parity extends to the arrangement | 0 differences on the dashboard fixtures, all three adapters, against canonical renders |
| Accessible by construction | axe: 0 A/AA issues on the dashboard page of every example app |
| Cheap | Dashboard subpath ≤ 2 KB min+gzip per adapter; reference 12-card dashboard server HTML ≤ 480 KB (12 × the 40 KB per-chart path budget) |

## 6. §6.10 Functional requirements — Dashboard

Criteria in EARS. Identifiers REQ-200..REQ-221 are new; none is reused.

### Layout

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

### Determinism and parity

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-209 | ubiquitous | WHERE a chart inside a dashboard has no `id`, THE SYSTEM SHALL derive it from the dashboard's id and the cell's id, so that no seed depends on the framework's mount order. | MUST |
| REQ-210 | event | WHEN a dashboard fixture is rendered by any adapter, THE SYSTEM SHALL produce a parsed markup tree —dashboard wrapper and every chart's SVG— identical to the fixture's canonical render. | MUST |
| REQ-211 | ubiquitous | CI SHALL run the three pixel gates of Art. 3 on every dashboard fixture at each of the three breakpoint widths. | MUST |

### Theming

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-212 | optional | WHERE the dashboard sets `ground`, `substrate`, `mode` or `locale`, the charts inside it SHALL inherit them with the precedence chart prop → dashboard → application provider → library default; the media query forcing `precision` (REQ-123) SHALL still not be overridable. | MUST |
| REQ-213 | ubiquitous | The dashboard's own chrome —title, description, gap— SHALL take colour and type only from the ground's tokens and `--sp-` custom properties, with no CSS framework. | MUST |

### Accessibility

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-214 | ubiquitous | THE SYSTEM SHALL render a dashboard as a `section` labelled by a heading carrying its `title` (level configurable, `2` by default) and described by its `description` when given; each cell SHALL be an `article` labelled by its chart's accessible name. | MUST |
| REQ-215 | ubiquitous | Keyboard focus SHALL traverse the cells in reading order, each chart keeping its own navigation (REQ-122); the dashboard SHALL add no tab stop of its own and no keyboard trap. | MUST |

A dashboard's name is enforced by the type —`title` **or** `label` is required (API delta §2)— not
by a runtime warning.

### Linked interaction

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-216 | optional | WHERE the dashboard declares a link on a key, WHEN the active item of one chart changes, THE SYSTEM SHALL mark, in every other chart of the dashboard, the items whose datum carries the same value of that key, resolved in the core as a pure function of the models (REQ-140). | SHOULD |
| REQ-217 | unwanted | IF a linked chart has no item carrying that value, THEN it SHALL show no linked mark —no interpolation, no nearest match— and SHALL warn `SP016` once in development if the key is absent from its data altogether. | SHOULD |
| REQ-218 | ubiquitous | Linked marks SHALL NOT be announced to assistive technology —only the chart holding focus announces— and SHALL clear in every chart when the source's active item clears (REQ-143). | SHOULD |
| REQ-219 | ubiquitous | Linked state SHALL exist only on the client and SHALL NOT alter the server-rendered markup. | MUST |

### Budgets and integration

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-220 | unwanted | IF an adapter's `dashboard` subpath adds more than 2 KB min+gzip to its one-chart budget, THEN CI SHALL fail (REQ-164). | MUST |
| REQ-221 | ubiquitous | Each example app —`vite-react`, `vite-vue`, `nextjs`, `angular`— SHALL include the reference dashboard page, verified end to end: no hydration mismatch, no axe A/AA issue, pixel gates green at the three breakpoints. | MUST |

**Count:** 22 requirements (19 MUST, 3 SHOULD). The PRD goes from 105 to 127 requirements.

## 7. Non-functional additions (§7)

- **Performance:** resolving a 24-cell layout in the core < 0.5 ms (benchmark beside the 2 ms
  geometry one). Full render of the 12-card reference dashboard < 16 ms per card, as today.
- **Weight:** reference 12-card dashboard, demo data, `hatchFill: 'tile'`: server HTML ≤ 480 KB,
  measured by `tools/path-weight` on every PR.

## 8. Risks (§11)

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| A server render cannot know the container width, so the first paint may be at the wrong width on a phone | High | Medium | Nominal width from an explicit `ssrWidth` (default: the `lg` design width); charts re-render at their measured width after hydration (REQ-207); documented |
| Extending parity from SVG to HTML reopens the gate's normaliser | Medium | High | The wrapper's markup is small and fixed; DD-017 parses it with the same tree comparison (DD-004), no string normalisation |
| Linked interaction becomes a state machine per adapter | Medium | Medium | Matching in the core; the adapter holds one reactive value (the link's active value) per dashboard; SHOULD, so it can slip to a later minor |
| Scope creep toward a builder | Medium | High | §5.2 names what is out; no `row`/`col`/`order` props exist to extend |

## Constitution check

- **Art. 2** — layout resolution and every cell size live in the core (REQ-201, REQ-206); the
  adapters emit a wrapper and CSS variables.
- **Art. 3** — parity is **extended**, not relaxed: the wrapper joins the parsed-tree gate and the
  pixel gates run per breakpoint (REQ-210, REQ-211). Art. 3's text says "normalised SVG output";
  the amendment to say "normalised markup" was approved on 2026-09-25 (A-01,
  [`constitution-amendment.md`](constitution-amendment.md)).
- **Art. 4** — ids derived from dashboard + cell, not mount order (REQ-209); linked state is
  client-only and never reaches the render path of the server (REQ-219).
- **Art. 5** — landmark, heading, labelled cells, reading order = DOM order (REQ-203, REQ-214,
  REQ-215).
- **Art. 8** — no CSS framework; CSS Grid, container queries and `--sp-` properties (REQ-202,
  REQ-213); budget enforced (REQ-220).
- **Exception requested:** none.
