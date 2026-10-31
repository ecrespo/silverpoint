# PRD delta — slide decks: Marp/Marpit Markdown in the silverpoint style

| Field | Value |
|---|---|
| **Status** | `FOLDED` — gate 1, drafted and approved 2026-10-31; folded into [`specs/prd.md`](../../specs/prd.md) v1.15 on 2026-10-31 |
| **Amends** | [PRD](../../specs/prd.md) v1.14 → v1.15: §1, §3 (Persona 6), §5.1, §5.2, §5.3, new §6.15, §6.14 (agent access gains the deck), §7, §9 (Epic J), §11 |
| **Applicable Constitution** | [`constitution.md`](../../specs/constitution.md) v1.10, with the v1.11 amendment proposed in [`constitution-amendment.md`](constitution-amendment.md) |
| **Research** | [`research.md`](research.md) |
| **Size** | Complex feature (≥ 3 sprints, a new package, three adapters, a blocking PoC): PRD + API + TD + Data Model + Plan + Tasks + Analyze (Art. 9) |
| **Target release** | `0.9.0` (`minor`) |

## 1. Summary

A deck module renders **Marp/Marpit Markdown presentations in the silverpoint style** for React,
Vue and Angular. A new framework-free package, `@silverpoint/marp`, owns the Markdown engine
(Marpit), the `silverpoint` theme, two-plus-one custom directives (`ground`, `substrate`, `mode`),
a `silverpoint` code fence that draws any of the 60 charts inside a slide, and a deck controller
(pages, fragments, notes, deep links, keyboard, swipe, fullscreen, overview, print). Each adapter
adds a thin `SpDeck` on a `deck` subpath that binds the controller to its reactivity and hydrates the
charts with its own components. The theme also ships as a plain CSS file for Marp CLI and the Marp
VS Code extension. Agents learn the deck through the agent catalog, two new MCP tools and the skill.

## 2. Problem

| Today | Cost |
|---|---|
| A talk about data leaves silverpoint: charts are exported as images into a slide tool | The ground, the type, precision mode and the accessible tables are lost |
| Marp Markdown is what developers and agents write for slides, but its themes know nothing of silverpoint | The deck and the dashboard look like two products |
| A chart in a slide is a picture | It cannot be read by keyboard or a screen reader, nor updated from data |
| The Reflex wrapper has no deck to wrap | Python users have no way to present |

## 3. Scope changes

### §5.1 In Scope — add

- [ ] `@silverpoint/marp`: the engine, the theme, the directives, the chart fence, generated
      backdrops and the deck controller (§6.15.1..§6.15.5).
- [ ] `SpDeck` on `@silverpoint/react/deck`, `@silverpoint/vue/deck` and `@silverpoint/angular/deck` (§6.15.6).
- [ ] The theme as a standalone file for Marp CLI and the Marp VS Code extension (REQ-579).
- [ ] Scaling decided by a cross-browser PoC (§6.15.7).
- [ ] The deck in the agent catalog, the MCP server and the skill (§6.15.8).

### §5.2 Out of Scope — add

- Marp Core (math, emoji, syntax highlighting, `auto-scaling`). The engine is Marpit; DD-052 leaves a
  seam for another engine, not an implementation.
- Raw HTML in Markdown, in any form, and therefore any sanitiser (research §6, decision 5).
- A presenter window, speaker timer, remote control or audience sync. Notes are shown in the deck.
- Export to PPTX, PDF or images by the library. Print-to-PDF is the browser's (REQ-601).
- Slide transitions and animations beyond fragment reveal.
- A WYSIWYG editor.
- The Reflex wrapper itself (`reflex-silverpoint-marp`, another repository).

### §5.3 Future Considerations — add

- A pre-rendered `deck` prop (the JSON of `DeckRender`) so a server-rendered app ships no Marpit to
  the client.
- A Marp Core engine behind the engine seam.
- A presenter view in a second window, synchronised through `BroadcastChannel`.
- Grounds `burin`, `woodcut`, `wash`, `plotter` in the theme as they ship.

## 4. Personas served

- **Persona 6 — new — technical presenter.** A developer, analyst or researcher who writes talks in
  Markdown, often with an agent, and presents data. Needs the deck to look like the product, the
  charts to be real charts, and the same file to work in Marp CLI.
- **Persona 1** (data product developer): embeds a deck in an app (an onboarding tour, a report),
  driven by props and events.
- **Persona 4** (precision or accessibility needs): the deck is keyboard-navigable, announces its
  pages, and every chart keeps its tabular alternative and precision mode.
- **Persona 5** (agent-assisted developer): the agent writes valid fences and directives the first
  time, and can render the deck to check it.

## 6.15 Slide decks

`@silverpoint/marp` does the work; the adapters bind it. Requirements stated of "the deck" hold in
the three adapters identically.

#### 6.15.1 The package and the engine

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-570 | ubiquitous | THE SYSTEM SHALL provide `@silverpoint/marp`, free of DOM in its main entry and of framework in all entries, depending on `@marp-team/marpit` 3.x, `@marp-team/marpit-svg-polyfill`, `@silverpoint/core` and `@silverpoint/grounds`, in the `fixed` release group. | MUST |
| REQ-571 | ubiquitous | Each deck SHALL have its own Marpit instance whose container is `div.sp-deck-<id>`, so that Marpit's CSS scoping isolates decks in one document without iframe or Shadow DOM; `<id>` SHALL be the `id` prop or a hydration-safe id derived as the adapters derive chart ids, never a random value (Art. 4). | MUST |
| REQ-572 | ubiquitous | The engine SHALL run with `anchor: false`, with Markdown HTML disabled and not configurable, and with the inline-SVG setting the TD records from the PoC (REQ-614). | MUST |
| REQ-573 | event | WHEN `render(markdown)` is called, THE SYSTEM SHALL return a `DeckRender` (Data Model): per slide its HTML, its notes, its fragment count and its resolved directives; the deck's CSS; the slide count; the chart slots; and the diagnostics raised. | MUST |
| REQ-574 | ubiquitous | `render` SHALL touch no DOM and no global, and SHALL return an identical `DeckRender` for identical Markdown, options and id, on the server and in the browser (Art. 4). | MUST |
| REQ-575 | unwanted | IF the Markdown contains raw HTML, a `javascript:`, `vbscript:` or non-image `data:` URL, or an inline event handler, THEN none SHALL reach the output: HTML is rendered as text and the URL is dropped. | MUST |
| REQ-576 | unwanted | IF the Markdown exceeds 512 KB, 300 slides or 60 chart fences, THEN THE SYSTEM SHOULD render up to the limit and raise `SP029` naming the limit. | SHOULD |

#### 6.15.2 The theme

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-577 | ubiquitous | THE SYSTEM SHALL provide a Marpit theme named `silverpoint` (`/* @theme silverpoint */`), 1280×720 by default, whose colours, inks and rules come from the ground's tokens through `--sp-*` custom properties (Art. 7), set in EB Garamond, styling headings, paragraphs, lists, tables, blockquotes, inline and block code, images, `header`, `footer` and pagination (`section::after` from `data-marpit-pagination` and `data-marpit-pagination-total`). | MUST |
| REQ-578 | ubiquitous | Code SHALL be set in EB Garamond with tabular figures on a framed plate; the theme SHALL declare no monospace family (DD-010). | MUST |
| REQ-579 | ubiquitous | The theme SHALL provide the classes `lead`, `invert`, `plate` and `hatched` for Marpit's `class` directive, documented with an example each. | MUST |
| REQ-580 | ubiquitous | The theme SHALL size everything in px of the slide canvas and SHALL NOT use `rem`, `vw`, `vh` or container units, so that a slide renders the same whatever the host page's root font size. | MUST |
| REQ-581 | ubiquitous | Every text and rule colour of the theme, on every substrate of every built-in ground and under every class, SHALL pass the contrast gate (`tools/contrast-gate`): the colours are computed, not chosen (REQ-126). | MUST |
| REQ-582 | ubiquitous | THE SYSTEM SHALL ship the theme as a standalone file, `@silverpoint/marp/theme.css`, loadable by Marp CLI (`--theme`) and by the Marp VS Code extension (`markdown.marp.themes`), carrying both built-in grounds; the documentation SHALL state what degrades there: no generated backdrops, fences shown as code, no controller. | MUST |
| REQ-583 | optional | WHERE Marp CLI is run with `--engine @silverpoint/marp/cli`, THE SYSTEM SHOULD render the directives, the generated backdrops and the chart fences as static SVG. | SHOULD |

#### 6.15.3 Directives and backdrops

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-584 | ubiquitous | THE SYSTEM SHALL add the local directives `ground` (a registered ground name), `substrate` (one of that ground's substrates) and `mode` (`ink` \| `precision`), each with Marpit's inheritance and its `_` spot form, written to the slide's `<section>` as `data-sp-ground`, `data-sp-substrate` and `data-sp-mode`. Defaults: the `ground`, `substrate` and `mode` options of the deck, else `silverpoint`, the ground's first substrate and `ink`. | MUST |
| REQ-585 | ubiquitous | A chart fence SHALL take the slide's resolved `ground`, `substrate` and `mode` unless its spec names its own. | MUST |
| REQ-586 | unwanted | IF a directive's value is unknown, or a substrate does not belong to the slide's ground, THEN THE SYSTEM SHALL raise `SP027` with the closest valid names and keep the inherited value. | MUST |
| REQ-587 | ubiquitous | Each slide SHALL be painted with its ground's substrate; under the `hatched` and `plate` classes the slide SHALL also carry an inked backdrop (a hatched border, a plate mark) rendered by `@silverpoint/grounds` as an SVG data URI, seeded from the deck id and slide index (Art. 2, Art. 4); in `precision` mode the backdrop SHALL be drawn with exact strokes. | MUST |
| REQ-588 | ubiquitous | Marpit's image syntax —`bg`, split backgrounds (`bg left`, `bg right:40%`), sizing and filters— SHALL keep working; the generated backdrop SHALL sit under the author's backgrounds. | MUST |

#### 6.15.4 The chart fence

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-589 | event | WHEN a slide holds a fenced block with the info string `silverpoint` whose body is a JSON object `{ chart, props?, data?, width?, height?, id?, ground?, substrate?, mode?, palette? }` —the input of the MCP `render_chart` tool— THE SYSTEM SHALL render, in its place, a `<figure>` slot holding the chart's canonical SVG rendered by `@silverpoint/grounds`, and SHALL record the slot and its parsed spec in the `DeckRender`. | MUST |
| REQ-590 | ubiquitous | A fence chart's id SHALL be `<deckId>-s<slide>-c<n>` (slide and fence ordinals, 1-based) unless the spec names one, so its seed is stable (Art. 4). | MUST |
| REQ-591 | unwanted | IF a fence's body is not valid JSON, names an unknown chart, carries a prop the chart does not declare, raises an `error` diagnostic, or asks for a size outside 160..1280 × 90..720, THEN THE SYSTEM SHALL render a visible, styled error figure in the slot naming the problem and the closest valid names, raise `SP026`, and render every other slide and fence unaffected; it SHALL NOT throw. | MUST |
| REQ-592 | ubiquitous | `findChartSlots(root)` (client entry) SHALL return, for a rendered deck element, every slot element with its slot id and parsed spec, in document order. | MUST |
| REQ-593 | event | WHEN a deck mounts in the browser, each adapter SHALL hydrate every slot by mounting its own chart component for the slot's spec with its native mechanism (React `createPortal`, Vue `render`, Angular `createComponent` with `hostElement`), whose markup SHALL equal the static SVG's parsed tree (Art. 3), loading each chart's module on demand by slug. | MUST |
| REQ-594 | optional | WHERE `interactive` is `false`, the deck SHALL NOT hydrate its charts and SHALL keep the static SVG. | SHOULD |

#### 6.15.5 The controller

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-595 | ubiquitous | `@silverpoint/marp` SHALL provide a framework-free deck controller: a pure state machine over `DeckState` (Data Model) with the operations `next`, `prev`, `goTo`, `first`, `last`, `toggleOverview`, `toggleNotes`, `toggleFullscreen`, `setTotal`, and an event emitter; DOM bindings live in a separate client entry. | MUST |
| REQ-596 | event | WHEN `next` is called on a slide with unrevealed fragments, THE SYSTEM SHALL reveal the next fragment; otherwise it SHALL go to the next slide with no fragment revealed. WHEN `prev` is called with fragments revealed, it SHALL hide the last; otherwise it SHALL go to the previous slide with all its fragments revealed. | MUST |
| REQ-597 | ubiquitous | A fragment not yet revealed SHALL keep its layout box, be invisible, and be hidden from assistive technology; in print and in the overview every fragment SHALL be shown. | MUST |
| REQ-598 | ubiquitous | The deck SHALL work uncontrolled (`defaultPage`, default 1) and controlled (`page` with `pageChange`); pages are 1-based. | MUST |
| REQ-599 | unwanted | IF `page` or `defaultPage` is outside `1..total`, or a re-render leaves the current page beyond the new total, THEN THE SYSTEM SHALL clamp it and raise `SP028`. | MUST |
| REQ-600 | event | WHEN `keyboard` is on (default) and focus is inside the deck but not in an editable control, THE SYSTEM SHALL handle the keys of API delta §7.3; it SHALL NOT listen on the document. | MUST |
| REQ-601 | event | WHEN a horizontal swipe longer than 48 px and steeper than 2:1 ends on the deck, THE SYSTEM SHALL call `next` (leftwards) or `prev` (rightwards). | MUST |
| REQ-602 | optional | WHERE `hash` is on, THE SYSTEM SHALL read a hash of the form `#<n>` on mount and write it with `history.replaceState` on page change, and SHALL ignore and never overwrite any other hash. | MUST |
| REQ-603 | event | WHEN fullscreen is toggled, THE SYSTEM SHALL use the Fullscreen API on the deck element; IF the API is unavailable, THEN the fullscreen control SHALL not be rendered. | MUST |
| REQ-604 | event | WHEN the overview is open, THE SYSTEM SHALL show every slide as a thumbnail in a grid, focusable and selectable by keyboard and pointer, with the current slide heightened (Art. 6); selecting one or pressing `Escape` closes it. | MUST |
| REQ-605 | event | WHEN the page is printed, THE SYSTEM SHALL lay out every slide on its own page at the slide size with every fragment shown and the controls, notes and overview hidden. | MUST |
| REQ-606 | ubiquitous | The deck SHALL emit `pageChange { page, total }`, `fragmentChange { page, step, steps }` and `ready { total }` (after each render with a new slide count), each one plain JSON-serialisable object, with the same names and payloads in the three adapters. | MUST |
| REQ-607 | optional | WHERE `showNotes` is on, the deck SHALL show the current slide's notes (Marpit's HTML comments) in a panel beside or below the slides. | MUST |

#### 6.15.6 The adapters

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-608 | ubiquitous | THE SYSTEM SHALL provide `SpDeck` on `@silverpoint/react/deck` and `@silverpoint/vue/deck`, and `sp-deck` (`SpDeckComponent`) on the `@silverpoint/angular/deck` secondary entry point, with the props and events of API delta §6, identical in name and meaning. | MUST |
| REQ-609 | ubiquitous | The React `SpDeck`'s props SHALL be strings, numbers and booleans only, and its events SHALL carry one plain object, so that a Python wrapper can drive it. | MUST |
| REQ-610 | event | WHEN `markdown` changes, the deck SHALL re-render, destroy every chart it hydrated and every listener it bound for the old slides, hydrate the new slots, and keep the current page (clamped, REQ-599). | MUST |
| REQ-611 | event | WHEN a deck unmounts, it SHALL destroy its hydrated charts, listeners, observers and the polyfill's observer, leaving nothing attached to `document` or `window`. | MUST |
| REQ-612 | ubiquitous | The deck SHALL render on the server —the slides with their static charts, the current page shown, the controls— with no DOM access, and SHALL hydrate in Next.js, Vue (`@vue/server-renderer`) and Angular SSR with no hydration mismatch; the polyfill, the controller's bindings and chart hydration SHALL run on the client only. | MUST |
| REQ-613 | ubiquitous | The deck controls (previous, next, counter `n / N`, fullscreen, overview, notes) SHALL be native buttons drawn with the UI layer (`@silverpoint/grounds/ui.css`), each with an accessible name and an exact focus indicator (Art. 5). | MUST |
| REQ-614 | ubiquitous | The deck SHALL expose a region with `aria-roledescription="slide deck"` and an accessible name (`label`, else the first slide's first heading, else `SP018`); each slide a group with `aria-roledescription="slide"` and the name "Slide n of N"; the slides other than the current one `inert` and hidden; and a polite live region announcing page changes. | MUST |
| REQ-615 | event | WHEN `prefers-contrast: more` or `forced-colors: active` holds, the deck SHALL apply `precision` to its backdrops and charts (Art. 5); WHEN `prefers-reduced-motion: reduce` holds, it SHALL reveal and change slides without transition. | MUST |
| REQ-616 | ubiquitous | `@silverpoint/marp` SHALL be an optional peer of the three adapters, imported only by their `deck` entry; a build that imports charts and no `deck` SHALL contain no module of `@silverpoint/marp` or Marpit, and SHALL keep REQ-444's no-growth budget. | MUST |

#### 6.15.7 Scaling

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-617 | ubiquitous | A slide SHALL scale to the width of its container, keeping its aspect ratio and its 1280×720 layout exactly, in Chromium, Firefox and WebKit, with the method the PoC selects and the TD records (inline SVG with the polyfill, or `transform: scale()` from a `ResizeObserver`). | MUST |
| REQ-618 | ubiquitous | A hydrated chart inside a scaled slide SHALL receive pointer, focus and keyboard input at the right place, in the three engines. | MUST |

#### 6.15.8 Agent access

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-619 | ubiquitous | The agent catalog (REQ-530) SHALL gain a `deck` section, generated: the props and events of `SpDeck` per framework, the directives and their values, the theme's classes, the fence's schema and the deck's diagnostic codes. | MUST |
| REQ-620 | event | WHEN `validate_deck` receives Markdown, THE SYSTEM SHALL return the diagnostics `render` raises, per slide and per fence. WHEN `render_deck` receives Markdown and options, it SHALL return a standalone HTML document of the deck (static charts, theme and ground styles inlined), or one slide's HTML, deterministically, within REQ-560's limits. | MUST |
| REQ-621 | event | WHEN `generate_code` receives `{ deck }` and `react`, `vue` or `angular`, THE SYSTEM SHALL return the imports, stylesheets and code of an `SpDeck`; for `reflex` it SHALL return a tool error until `reflex-silverpoint-marp` exports a catalog. | MUST |
| REQ-622 | ubiquitous | The `silverpoint` skill SHALL gain a deck reference (authoring, directives, fence, adapters, Marp CLI), its examples type-checked as REQ-557 states. | MUST |

#### 6.15.9 Quality and delivery

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-623 | ubiquitous | Deck fixtures (`fixtures/deck/*.deck.md`) SHALL be compared, for each adapter's server render, against the canonical render of `@silverpoint/marp` as parsed trees under DD-017's rules, with zero tolerance (Art. 3). | MUST |
| REQ-624 | ubiquitous | Each deck fixture's slides SHALL have pixel fixtures at 1280×720 in the pinned Chromium, per built-in ground and mode, under Art. 3's thresholds. | MUST |
| REQ-625 | ubiquitous | CI SHALL run the deck's e2e (scaling, hydration, keyboard, fragments, re-render, unmount) in Chromium, Firefox and WebKit, in the example apps. | MUST |
| REQ-626 | ubiquitous | `@silverpoint/marp/demo` SHALL export `DECK_DEMO`, a deck presenting silverpoint itself, with charts, fragments, split backgrounds, notes, a `precision` slide and a `cyanotype` slide; the four example apps and the docs site SHALL draw it on a `/deck` page. | MUST |
| REQ-627 | ubiquitous | The documentation SHALL cover usage per framework, the authoring guide (supported Markdown, directives, the fence), the theme with Marp CLI and VS Code and its degradation, and SSR per framework; `@silverpoint/marp` SHALL have a README. | MUST |
| REQ-628 | ubiquitous | `@silverpoint/marp`'s own code and each adapter's `deck` entry SHALL respect a gzip budget declared in the TD and measured in CI, Marpit's modules reported apart. | MUST |

**Count:** §6.15 holds 59 requirements (56 MUST, 3 SHOULD). With the rest of §6 the PRD has 369
requirements (343 MUST).

## 6.14 Agent access — amend

- REQ-539: the tool list gains `validate_deck` and `render_deck` (13 tools).
- REQ-541: `generate_code`'s targets gain `{ deck }` (REQ-621).
- REQ-546: the resources gain the deck reference of the skill and the fence schema.

## 7. Non-functional — add

- **Performance:** rendering `DECK_DEMO` (≈ 20 slides, 6 charts) SHALL take under 150 ms on the
  bench machine in Node; a page change SHALL commit within one frame.
- **Security:** REQ-575; no raw HTML; fence JSON is parsed, never evaluated.
- **Compatibility:** Marpit 3.x; the polyfill 2.x; the engines of REQ-617; Marp CLI 4.x for REQ-582
  and REQ-583.
- **Bundle:** REQ-616, REQ-628.

## 9. Epic J — slide decks

| Story | Requirements |
|---|---|
| J-1 As Persona 6, I write a Marp deck and it looks like silverpoint, in my app and in Marp CLI | REQ-570..588 |
| J-2 As Persona 6, a fence draws a real chart in my slide; a typo shows an error, not a blank | REQ-589..594 |
| J-3 As Persona 1, I embed a deck and drive it with props and events | REQ-595..607, REQ-608..612 |
| J-4 As Persona 4, I present and follow a deck by keyboard and screen reader | REQ-597, REQ-600, REQ-613..615, REQ-618 |
| J-5 As a Reflex user, a wrapper can drive the React deck from Python | REQ-606, REQ-609 |
| J-6 As Persona 5, my agent writes and checks decks | REQ-619..622 |
| J-7 As maintainer, nothing leaks, drifts or grows the chart bundle | REQ-610, REQ-611, REQ-616, REQ-623..628 |

## 11. Glossary — add

- **Deck** — a Marp Markdown document rendered as slides by `SpDeck`.
- **Fence** — a fenced code block; the `silverpoint` fence draws a chart.
- **Fragment** — a list item Marpit marks (`*` lists) to be revealed one step at a time.
- **Backdrop** — a slide's generated substrate and inked decoration (`hatched`, `plate`).
- **Hydrate (a slot)** — replace a fence's static SVG with the framework's live chart component.

## Constitution check

- **Art. 1** — fence charts are the library's charts, unchanged; backdrops carry no data and are the
  only inked strokes the deck adds.
- **Art. 2** — `@silverpoint/marp` computes no geometry or colour (amendment v1.11): charts and
  backdrops come from core and grounds (REQ-587, REQ-589).
- **Art. 3** — the deck's markup joins the tree and pixel gates (REQ-623, REQ-624); hydration is
  markup-identical (REQ-593); SSR hydrates with no mismatch (REQ-612).
- **Art. 4 / 5 / 6** — ids and seeds derived (REQ-571, REQ-590); keyboard, roles, live region and
  forced precision (REQ-600, REQ-613..615); one heightened item in the overview (REQ-604).
- **Art. 7 / 8** — the theme reads ground tokens (REQ-577); no CSS framework, Marpit only behind an
  optional peer and a budget (REQ-616, REQ-628); no monospace (REQ-578, DD-010).
