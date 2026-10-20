# PRD delta — palettes, composed components, overlays and the timeline

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 1, approved 2026-10-18 by Ernesto Crespo (drafted the same day) |
| **Amends** | [PRD](../../specs/prd.md) v1.12 → v1.13: §1, §4.1, §5.1, §5.2, §5.3, §6.3, new §6.13, §7, §9 (Epic H), §11 |
| **Applicable Constitution** | [`constitution.md`](../../specs/constitution.md) v1.8, with the v1.9 amendment proposed in [`constitution-amendment.md`](constitution-amendment.md) |
| **Research** | [`research.md`](research.md) |
| **Size** | Complex feature (≥ 3 sprints): PRD + API + TD + Data Model + Plan + Tasks + Analyze (Art. 9) |

## 1. Summary

`reflex-silverpoint-react` 0.7 grew, on top of silverpoint `0.6.0`, the pieces a product needs
around its charts and controls: **palettes** that re-colour a chart or a whole section in the inks of
a historical medium; **twelve composed components** (table, pagination, breadcrumb, avatar,
statistic, descriptions, a vertical timeline, collapse, empty and result states, textarea, number
input); **seven overlays** (modal, drawer, popover, tooltip, select, dropdown menu, toast); and a
**Knight Lab timeline** drawn in silverpoint. It built them in Reflex only, outside the parity
contract, with Radix for the overlays.

This feature makes them silverpoint's: in `@silverpoint/react`, `@silverpoint/vue` and
`@silverpoint/angular`, under one markup contract computed by `@silverpoint/core`, held to the
parity, pixel, contrast, accessibility and budget gates that hold the 17 `0.3.0` components. The
overlays use the platform —`<dialog>` and the Popover API— with their keyboard and placement in the
core, so no adapter depends on a headless library (user decision 2026-10-18). It ships as `0.7.0`.

## 2. Problem

| Today | Cost |
|---|---|
| A chart can be re-coloured only by writing `--sp-` overrides by hand | No named, verified palette; a consumer who picks colours by eye breaks the contrast the grounds guarantee |
| No table, pagination or breadcrumb in the ground's language | The page around a silverpoint dashboard falls back to the app's design system (the problem feature-002 began to solve) |
| No overlays: no dialog, menu, select, tooltip or toast | The commonest interactions of an app leave the drawing; PRD §5.3 promised them on one behaviour decision |
| The Reflex wrapper carries its own JSX for all of this | Two implementations of the same drawing (the failure Art. 2 exists to prevent); Vue and Angular users have none |

## 3. Scope changes

### §5.1 In Scope — add

- [ ] Palettes for every chart, UI component and dashboard, with six verified presets (§6.13.1).
- [ ] Twelve composed components and the surface and glyph they are built from (§6.13.2).
- [ ] Seven overlays on the platform's `<dialog>` and Popover API (§6.13.3).
- [ ] `SpTimeline`: Knight Lab TimelineJS drawn in the ground, behind an optional peer (§6.13.4).

### §5.2 Out of Scope — add

- Table features beyond sorting: editing, selection, column resize, virtualisation, tree rows,
  server pagination built in (the consumer pages; `SpPagination` draws the control).
- Overlays not in the inventory: Popconfirm, Notification centre, DatePicker, TimePicker,
  Cascader, AutoComplete, Command palette, multi-select.
- A palette per series. Palettes stay monochrome (two inks); tone is density (Art. 6).
- Bundling TimelineJS. It stays the consumer's install (MPL-2.0, ~100 KB); silverpoint owns the
  skin and the wrapper.

### §5.3 Future Considerations — amend

- Overlays: **resolved** by this feature (DD-038). Remove the bullet.
- Table on a core column layout: **resolved** (DD-040). Remove the bullet.
- Add: a multi-select and a combobox with free text, on the listbox engine of DD-039.

## 4. Personas served

- **Persona 1** (data product developer): the table under the chart, the dialog that edits it, the
  toast that confirms it, all in one drawing; a brand colour as a verified palette.
- **Persona 2** (multi-framework architect): the same overlays, identical markup, in React, Vue and
  Angular, with no per-framework headless library.
- **Persona 3** (editorial author): a narrative timeline and a statistic that print like the charts;
  sanguine or sepia inks for a publication.
- **Persona 4** (precision or accessibility needs): native dialogs with a trapped focus, APG menus
  and listboxes, `precision` and forced colours everywhere, palettes that cannot go below contrast.

## 5. Objectives and metrics (§4.1) — add

| Objective | Metric | Target | Deadline |
|---|---|---|---|
| The Reflex 0.7 inventory in the three adapters | Components of §6.13 available in React, Vue and Angular | 21 of 21 catalog rows (+ `SpTimeline`) | Release 0.7.0 |
| Colour without losing contrast | Presets passing every contrast pair of the gate | 6 of 6 | Release 0.7.0 |
| Parity extends to composed components and overlays | Differences on their fixtures, three adapters, against canonical renders | 0 | Release 0.7.0 |
| Accessible overlays | APG keyboard e2e per overlay pattern; axe on the composed page of the four apps | every pattern green; 0 A/AA issues | Release 0.7.0 |
| No new runtime dependency | Packages' `dependencies` added by this feature | 0 (one optional peer, `@knight-lab/timelinejs`, on the timeline subpath only) | Release 0.7.0 |

## 6. Functional requirements

Criteria in EARS. Identifiers REQ-460..REQ-523 are new; none is reused.

### §6.3 Grounds and theming — §6.13.1 Palettes (new)

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

### §6.13.2 Composed components (new)

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
| REQ-489 | ubiquitous | The display components —Surface, Glyph, Table without sorting, Breadcrumb, Avatar, AvatarGroup, Statistic, Descriptions, TimelineList, Collapse, Empty, Result— SHALL render in React Server Components from `@silverpoint/react/server/ui/<name>` (REQ-104 extended). | MUST |

### §6.13.3 Overlays (new)

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
| REQ-499 | ubiquitous | The backdrop of a modal overlay SHALL be the ground's level-2 tone over a transparent background, and the substrate at the ground's `ui.backdrop` level under a `weight` ground or in `precision`; it SHALL NOT use opacity (Art. 6). | MUST |
| REQ-500 | ubiquitous | Every overlay SHALL support controlled (`open` + open-change event) and uncontrolled use with a trigger slot; any element may be the trigger, and the overlay SHALL set `aria-haspopup`, `aria-expanded` and `aria-controls` on it as its APG pattern requires. | MUST |
| REQ-501 | unwanted | IF an `SpModal`, `SpDrawer` or `SpPopover` has neither a `title` nor a `label`, THEN THE SYSTEM SHALL warn `SP018` in development (REQ-319 extended). | MUST |
| REQ-502 | ubiquitous | An overlay rendered on the server SHALL emit its closed markup, and its open markup when `open` (or `defaultOpen`) is set, so that the tree gate compares it; the adapter SHALL call `showModal()` or `showPopover()` after hydration, never before. | MUST |
| REQ-503 | event | WHEN the environment declares `prefers-reduced-motion: reduce`, overlays SHALL appear and disappear without transition (REQ-320 extended). | MUST |

### §6.13.4 The Knight Lab timeline (new)

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-510 | ubiquitous | THE SYSTEM SHALL provide `SpTimeline` on a `timeline` subpath of each adapter, rendering a Knight Lab TimelineJS timeline inside an `SpSurface`, with `@knight-lab/timelinejs` declared as an **optional** peer dependency of the adapter packages and imported only by that subpath. | MUST |
| REQ-511 | ubiquitous | THE SYSTEM SHALL ship the timeline skin as an opt-in stylesheet `@silverpoint/grounds/timeline.css` that replaces TimelineJS's colours, type and rules with the ground's `--sp-` properties, so that substrates, palettes, `cyanotype` and `precision` apply. | MUST |
| REQ-512 | optional | WHERE `inkedFrames` is true (default) and the mode is `ink`, THE SYSTEM SHALL lay the ground's own frame and tone masks on TimelineJS's markers, eras, menubar and story card, read from hidden probes by a core function; in `precision`, under a `weight` ground or with `inkedFrames: false`, every frame SHALL fall back to an exact rule. | MUST |
| REQ-513 | ubiquitous | `SpTimeline` SHALL load and construct TimelineJS on the client only, after hydration; its server markup SHALL be the surface, the probes and an empty mount, and only that markup SHALL be under the tree gate (Art. 3 as amended). | MUST |
| REQ-514 | ubiquitous | `SpTimeline` SHALL forward TimelineJS's events —`change`, `loaded`, `nav_next`, `nav_previous`, `zoom_in`, `zoom_out`, `back_to_start`— in each framework's idiom, and ignore the `font` and `theme` options, which the skin owns. | MUST |
| REQ-515 | unwanted | IF `@knight-lab/timelinejs` cannot be loaded, THEN `SpTimeline` SHALL keep its surface, render its `fallback` slot (empty by default) and warn `SP025` in development, and SHALL NOT throw. | MUST |

*Amended in implementation (T-221):* "cannot be loaded" is a failure at run time: a chunk that does
not arrive, a blocked request, a module that throws as it is evaluated. The import is a literal, so
that the consumer's bundler splits TimelineJS into a chunk of its own; a consumer who imports the
`timeline` subpath without installing the peer therefore has a build that fails to resolve it, not a
page that warns. A consumer who does not import that subpath needs nothing (REQ-510).

### Parity, budgets, integration and documentation

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-516 | event | WHEN a composed-component, overlay, palette or timeline-surface fixture is rendered by any adapter, THE SYSTEM SHALL produce a parsed markup tree identical to the fixture's canonical render (REQ-327 extended). | MUST |
| REQ-517 | ubiquitous | CI SHALL run the three pixel gates of Art. 3 on every fixture of REQ-516, overlays rendered open. | MUST |
| REQ-518 | unwanted | IF one component's subpath adds more than 3 KB min+gzip over the shared UI runtime, the overlay runtime (placement, list keys, the adapter's overlay base) adds more than 4 KB over it, `ui.css` exceeds 24 KB, `timeline.css` exceeds 6 KB, or the `SpTimeline` wrapper exceeds 3 KB without TimelineJS, THEN CI SHALL fail (REQ-330 extended). | MUST |
| REQ-519 | unwanted | IF palette support makes a one-chart build grow by more than 1 KB minified against its `0.6.0` size (`one-chart-0.6.0.json`, the REQ-444 baseline re-measured by user decision 2026-10-18, OQ-C3), THEN CI SHALL fail as REQ-444 does. | MUST |
| REQ-520 | ubiquitous | Each example app —`vite-react`, `vite-vue`, `nextjs`, `angular`— SHALL include a composed page (the 21 catalog rows and their companions), a palettes page (the six presets over a chart, a UI component and a composed one) and a timeline page, verified end to end: no hydration mismatch, no axe A/AA issue, the APG pattern of every overlay, pixel gates green. | MUST |
| REQ-521 | ubiquitous | The documentation site SHALL document every new component, the palettes and the timeline with a live example and a props reference generated from the types (REQ-332 extended). | MUST |
| REQ-522 | ubiquitous | Every new element SHALL meet REQ-313 (contrast), REQ-316 (exact focus), REQ-317 (24 × 24 targets), REQ-320 (reduced motion) and REQ-329 (ids from `id`), and every new interactive element SHALL be skipped by its keyboard pattern when disabled (REQ-326). | MUST |
| REQ-523 | optional | WHERE the document or an ancestor sets `dir="rtl"`, THE SYSTEM SHOULD mirror Pagination, Breadcrumb, the Drawer's `start`/`end` sides, the placement of REQ-493 and the steppers of InputNumber (REQ-321 extended). | SHOULD |

*Amended in implementation (T-222):* the pages are `/composed`, `/palettes` and `/timeline` in every
app, their content in the shared harness (`COMPOSED_PAGE`, `PALETTES_PAGE`, `TIMELINE_PAGE`). The
composed page puts the 21 rows in the three panels of the UI page (silverpoint ink, silverpoint
precision, cyanotype), every overlay closed behind its trigger; the palettes page draws each preset
over a `LineChart`, an `SpCard` holding an `SpProgress`, and an `SpTable`. REQ-520's render and
hydration are verified by `e2e/pages.spec.ts` (T-222); its axe and APG halves by T-223.

**Count:** 57 requirements (56 MUST, 1 SHOULD). The PRD goes from 213 to 270 requirements (250 MUST).

## 7. Non-functional additions (§7)

- **Performance:** a composed component renders in < 1 ms for 100 table rows; `uiSortRows` sorts
  10,000 rows in < 10 ms; `uiPlace`, `uiListKey` and `uiTypeahead` < 0.05 ms per call. Benchmarks
  beside the UI ones.
- **Weight:** REQ-518 and REQ-519, measured by size-limit on every PR.
- **Compatibility:** `<dialog>` with `showModal()`, the Popover API and exclusive `<details name>`
  are Baseline in the pinned Chromium, Firefox and WebKit of the e2e job; the e2e job checks each.

## 8. User stories (§9) — Epic H, the Reflex 0.7 inventory

- **H1.** As Persona 1, I set `palette={sanguine}` on my provider and every chart, control and
  table of the section turns to red chalk, and CI tells me the palette still passes contrast.
- **H2.** As Persona 2, I open the same `SpModal` in React, Vue and Angular; the markup is the same,
  focus is trapped by the browser, and no headless library is in my bundle.
- **H3.** As Persona 4, I open an `SpSelect` with the keyboard, type "ve" to reach "Verdigris", and
  my screen reader hears a listbox with the selected option.
- **H4.** As Persona 3, I tell a story with `SpTimeline` and its markers are drawn with the same hand
  as the cards around it.

## 9. Risks (§11)

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Twenty-one components × three adapters plus a timeline: larger than Phase 6 | High | High | Phase 8 in three batches (A1 display, A2 entry and navigation, B overlays), each a review point; all ship together in `0.7.0` |
| Popover API light dismiss and `<dialog>` focus differ across engines | Medium | Medium | The APG e2e runs in Chromium, Firefox and WebKit on every overlay; behaviour the platform does not give is written once in the core |
| Palette support grows the one-chart bundle past REQ-444 | Medium | Medium | The presets live on their own subpath; only `paletteStyle` enters the chart path; measured in step 8a before any adapter work |
| TimelineJS (MPL-2.0) changes its DOM between versions | Medium | Low | Optional peer pinned to `^3.9.13`; the skin is outside the tree gate; a pixel fixture over a pinned version catches drift |
| Inline palette styles collide with a consumer's `style` | Low | Low | The core merges the consumer's `style` after the palette's, so the consumer wins |

## Constitution check

- **Art. 1** — composed components draw values (sort marks, steppers, counters, trend arrows) with
  exact glyphs; frames and tones are ornament (REQ-472..REQ-485).
- **Art. 2** — sorting, page windows, number clamping, placement, list keys and typeahead in the
  core (REQ-471, REQ-493..REQ-495).
- **Art. 3** — parity extended (REQ-516, REQ-517); the TimelineJS DOM is third-party markup, outside
  the gate by the amendment.
- **Art. 4** — no timers or measurement on the render path; placement and toast timers run in the
  interaction path (REQ-493, REQ-497, REQ-502).
- **Art. 5** — native `<dialog>`, Popover API, APG patterns, exact focus, `precision` (REQ-491..REQ-498).
- **Art. 6** — striping, backdrop and list highlight by the ramp and by heightening, never opacity
  (REQ-475, REQ-498, REQ-499).
- **Art. 7** — palettes are data; a preset needs no component code (REQ-460, REQ-463).
- **Art. 8** — no new dependency; one optional peer on one subpath; budgets (REQ-510, REQ-518, REQ-519).
- **Exception requested:** none. Amendments requested: see [`constitution-amendment.md`](constitution-amendment.md).
