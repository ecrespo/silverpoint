# Technical Design delta — palettes, composed components, overlays and the timeline

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 3, approved 2026-10-18 by Ernesto Crespo (drafted the same day) |
| **Amends** | [Technical Design](../../specs/technical-design.md) v1.9 → v1.10: §3.2, §3.3, new DD-037..DD-043, §5.1, §5.3, §8, §10 |
| **Inputs** | [`prd-delta.md`](prd-delta.md), [`api-delta.md`](api-delta.md), [`research.md`](research.md) |

## 1. Components (§3.2) — additions

| Component | Package | Responsibility |
|---|---|---|
| `palette/palette.ts` | core (`/palettes`) | `Palette`, `PALETTE_PROPERTIES`, `resolvePalette`, `paletteStyle`, `SP023`/`SP024` |
| `palette/contrast.ts` | core (`/palettes`) | `contrastRatio`, `checkPalette`, `PALETTE_PAIRS` (the pairs of Data Model §3.9) |
| `palettes.ts` | core (`/palettes`) | The six frozen presets and `PALETTES` |
| `ui/sort.ts`, `ui/pages.ts`, `ui/number.ts`, `ui/initials.ts` | core (`/ui`) | `uiSortRows`, `uiPageWindow`/`uiPagination`, `uiNumberValue`/`uiNumberStep`, `uiInitials` |
| `ui/listbox.ts` | core (`/ui`) | `uiListKey`, `uiTypeahead` |
| `ui/place.ts`, `ui/anchor.ts` | core (`/ui`) | `uiPlace` (pure); `uiAnchor` (the DOM side, structural types, as `uiRovingFocus`) |
| `ui/view-composed.ts`, `ui/view-overlay.ts` | core (`/ui`) | The view trees of API delta §4 |
| `timeline/*` | core (`/timeline`) | `timelineView`, `timelineInk` (probe reader); the demo `TIMELINE_DEMO` on `/ui-demos` (*amended in implementation*, T-208) |
| `ui/ui-css.ts` | grounds | Rules of the new components; row tone, backdrop, list heightening |
| `timeline/timeline-css.ts` | grounds | `dist/timeline.css`, generated like `ui.css` (no literal colour, I-19) |
| `ui/*`, `timeline` | react, vue, angular | Bind values, events, slots and the platform calls; nothing else |
| `tools/contrast-gate` | tools | `PALETTE_PAIRS` × the six presets join the gate (REQ-464) |

## 2. Data flow (§3.3) — additions

```
palette (render time, server and client):
  prop ─┐
  cell ─┼─► core.resolvePalette(provider, cell, prop) ─► core.paletteStyle ─► root style="--sp-ink:…"
  provider ┘                                                   (fixed order; consumer style appended)

composed component (render time):
  props ─► core.uiSortRows / uiPagination / uiNumberValue / uiInitials ─► core.ui<Name>View ─► tree
  adapter: binds `sort`, `page`, `stepper`, `summary`, `native` elements; writes slots

overlay:
  render time ─► core.ui<Name>View(open) ─► <dialog data-state> / <div popover data-state>
  after hydration, when open ─► adapter: dialog.showModal() | el.showPopover()
                              ─► core.uiAnchor(trigger, overlay, opts) ─► uiPlace ─► --sp-ui-x/y, data-side
  keydown ─► core.uiListKey / uiTypeahead ─► active index | intent ─► focus / select / close
  toast ─► adapter setTimeout(duration), paused on pointerenter/focusin ─► open-change(false)

timeline (client only):
  render ─► core.timelineView ─► surface + probes + mount
  after hydration ─► import('@knight-lab/timelinejs') ─► new TL.Timeline(mount, data, options)
                  ─► core.timelineInk(host, probe) ─► --sp-kl-* on the host; MutationObserver re-reads
  import fails ─► fallback slot + SP025
```

No step on the render path measures the DOM, reads the clock or runs an inker.

## 3. Design decisions

### DD-037: Palettes are inline declarations computed by the core; sections are providers

- **Decision:** `palette` resolves field by field (element → dashboard → provider) in the core and
  is written as an inline `style` of `--sp-` declarations on the element's root —the chart root
  (`.sp-root`, or the `<svg>` of `toSVGString`), the UI root, the dashboard root— in the fixed order
  of `PALETTE_PROPERTIES`. A section is a nested `SilverpointProvider` / `provideSilverpoint`.
- **Why inline:** the ground's rules are `:where(...)`, zero specificity (`styles.css`); an inline
  declaration on the same element beats them without any selector trick, on the server as on the
  client, and it is part of the markup the tree gate compares. The Reflex `&&` class and the
  `display: contents` wrapper with a descendant rule are CSS-in-JS devices each framework would need
  its own of.
- **Why the provider:** the three adapters already scope configuration by context (React context,
  Vue `provide`, Angular DI); a palette is configuration like `ground` or `substrate` (REQ-311's
  chain). No wrapper element is added, so layout and parity are untouched.
- **Presets on a subpath:** a chart that takes `palette: Palette` and no name ships no preset; only
  `paletteStyle` and `resolvePalette` enter the chart path (≈ 0.3 KB min, measured in T-200 against
  the REQ-444 allowance). Names (Reflex's `palette="sanguine"`) are a consumer lookup in `PALETTES`.
- **Validation:** a value containing `;`, `{`, `}`, `<` or `url(` is dropped (`SP024`): it would
  break out of the declaration. Hex fields are measured in development (`SP023`), once per palette
  object (a `WeakSet`).
- *Amended in implementation (T-212):* (1) a nested provider inherits every field it leaves unset
  from the enclosing one (`nestProvider`, on `/palettes`), so a section re-coloured by a nested
  provider keeps the app's ground; before, a nested React provider replaced the whole configuration.
  (2) A dashboard's root carries its own palette only: React's `Dashboard` renders in Server
  Components, which read no provider, and Vue and Angular do the same for parity; the provider's
  palette still reaches every chart and component in its cells. (3) Vue gains a
  `SilverpointProvider` component for sections, as `provideSilverpoint` is an app plugin; Angular's
  `provideSilverpoint` returns a `Provider`, so it scopes a section from a component's `providers`.
- **Rejected:** a palette as a ground (Art. 7 would be satisfied, but a ground is registered
  globally and carries inker and tonal mechanism; a palette is a per-section colour override); a
  `<style>` element per palette (a stylesheet in the body of every chart, and selectors to scope).

### DD-038: Overlays on the platform, behaviour gaps in the core

- **Decision (user, 2026-10-18):** Modal and Drawer are `<dialog>` opened with `showModal()`
  (`show()` for a non-modal Drawer): the browser gives focus moving, trapping and return, the inert
  page, Escape (`cancel`) and the top layer. Popover, the Select list and the Menu are
  `popover="auto"` (top layer, light dismiss, one open `auto` popover per stack); the Tooltip is
  `popover="manual"`, so it never closes an open popover. What the platform does not give is core:
  placement (`uiPlace`), listbox and menu keys (`uiListKey`), typeahead (`uiTypeahead`).
- **Options:**

| Option | For | Against |
|---|---|---|
| **A. Platform + core (chosen)** | No dependency (Art. 8); one markup (Art. 3); focus trap and inertness by the browser, the hardest part to get right by hand | The Popover API has no anchoring that is Baseline in every pinned engine, hence `uiPlace`; `<dialog>` styling needs `::backdrop` |
| B. Radix / Reka UI / Angular CDK | Mature | Three engines, three markups: the tree gate fails by construction (DD-023 option C) |
| C. Zag.js | One engine | No Angular adapter; a runtime dependency |
| D. CSS anchor positioning instead of `uiPlace` | No JS for placement | Not Baseline in the pinned Firefox and WebKit; a progressive enhancement can come later without an API change |

- **Server render:** an overlay renders `data-state="open|closed"` and its full content; it never
  writes the `open` attribute (a `<dialog open>` would be non-modal) nor a position. The adapter
  calls `showModal()`/`showPopover()` after hydration and `uiAnchor` after that (REQ-502).
- **Backdrop** (REQ-499): `::backdrop` is painted by `ui.css` with the level-2 tone mask over a
  transparent background; hatch lines leave the page visible between them, so no opacity is needed.
  Under `weight` grounds and in `precision`, `background: var(--sp-substrate)` at the ground's
  `ui.backdrop` token, `mix-blend-mode: normal`: an opaque backdrop. A see-through flat backdrop
  would be opacity as tone.

### DD-039: One listbox engine for Select and Menu

- **Decision:** `uiListKey(state, key, kind)` returns the next active index and an intent (`open`,
  `close`, `select`) for the APG select-only combobox (`listbox`) and menu button (`menu`)
  patterns; disabled items are skipped; arrows do not wrap in a listbox and wrap in a menu, as the
  APG examples do. `uiTypeahead` finds the next enabled label starting with the buffer, wrapping;
  the adapter keeps the buffer and clears it 500 ms after the last key.
- **Focus model:** the Select keeps DOM focus on its trigger and points at the active option with
  `aria-activedescendant` (APG select-only combobox); the Menu moves DOM focus to the active
  `menuitem` (`tabindex="-1"`), as `uiRovingFocus` does. The active element is the one heightened
  (REQ-498): the heightening follows the keyboard, at most one per instance.

### DD-040: Table and the composed components as view trees with core computations

- **Decision:** every composed component is a `ui<Name>View` in the core, like the 17 of `0.3.0`;
  sorting (`uiSortRows`), the page window (`uiPageWindow`), number clamping (`uiNumberValue`) and
  initials (`uiInitials`) are pure core functions. The table does not sort by itself: `sortKey` and
  `sortOrder` are the consumer's state and `sort(key)` reports the click, as in Reflex; the
  consumer calls `uiSortRows` (exported) or sorts on its server.
- **Row tone** (REQ-475): even rows (`striped`) and the hovered row (`hoverable`) take the level-1
  tone of the ground's ramp as a `background` mask on the cells, painted with
  `var(--sp-ink-secondary)` as every tone (DD-026). `precision` keeps the tone (C-7: tone is value);
  a striped table under `cyanotype` takes `--sp-weight-1` as a cell rule instead.
- **Collapse** uses `<details name>` for `accordion`, Baseline since 2024; the core emits the same
  `name` (`${id}--accordion`) in every adapter (REQ-329).

### DD-041: The surface and glyph as public building blocks

- **Decision:** `SpSurface` and `SpGlyph` are exported, as Reflex exported `sp_surface` and
  `sp_glyph`, so a consumer can draw a framed, toned box or a mark in the ground without a
  component of the catalog. `SpSurface` takes `as` (the element), `name` (`sp-<name>`), `frame` and
  `tone`. The ten new glyphs join `UI_GLYPHS` (exact 16 × 16 paths, `role: 'encoding'` in spirit:
  never inked).

### DD-042: The timeline wraps TimelineJS on an optional subpath

- **Decision (user, 2026-10-18):** `SpTimeline` on `@silverpoint/<adapter>/timeline`, with
  `@knight-lab/timelinejs` an optional peer imported dynamically after hydration; the skin as
  `@silverpoint/grounds/timeline.css`, generated like `ui.css`; the probe reader `timelineInk` in the
  core (`/timeline`), so the three adapters share it.
- **Phase 1, the skin:** TimelineJS's colours, type and rules become `--sp-` properties (palettes,
  substrates, `cyanotype`, `precision` apply), as in Reflex.
- **Phase 2, the hand:** the ground's frame and tone masks are CSS custom properties that `ui.css`
  assigns to `[part='sp-frame'][data-kind]` and `[part='sp-tone'][data-tone]` inside an `.sp-ui`;
  hidden probes of each kind and level are rendered in the surface, `timelineInk` reads their
  resolved `--sp-ui-mask*` / `--sp-ui-tone*` values and republishes them as `--sp-kl-*` on the
  host, and `timeline.css` lays them on TimelineJS's markers, eras, menubar and card. A
  `MutationObserver` on the host's `data-mode`, `data-substrate`, `data-ground`, `data-frame` and
  `class` re-reads them. In `precision`, under `weight` grounds or with `inkedFrames: false`, every
  `--sp-kl-mask-*` is `none` and the rules fall back to an exact border.
- *Amended in implementation (T-211):* eras are hatched with the probed tone tiles whenever
  `timelineInk` found them (`data-kl-toned`), in every mode, since tone is value (C-7); Reflex keyed
  them to `ink`. Untoned (a `weight` ground, or before the probes are read), an era is a rule along
  its top of `--sp-stroke-width × --sp-weight-N` instead of Reflex's semi-transparent gradient
  (I-24), and a long marker headline is cut instead of faded out.
- **Parity:** only the surface, the probes and the empty mount are server markup (REQ-513); the
  TimelineJS DOM is third-party markup the library does not emit (Art. 3 as amended). A pixel
  fixture over a pinned TimelineJS version guards the skin.
- **Rejected:** bundling TimelineJS (~100 KB, MPL-2.0, its own CSS) or re-implementing it (a
  narrative timeline engine is a product of its own).

### DD-043: The new rows join the gates as fixtures

- **Decision:** DD-027 applies unchanged: one fixture per declared state (Data Model §5) in a
  fixed-width harness, tree gate against the core's canonical render, three pixel gates. Overlays
  are rendered open in the pixel harness (`showModal()`/`showPopover()` called by the harness, so the
  top layer is exercised); their tree fixture is the server markup with `data-state="open"`.
  Palette fixtures put each preset on a `LineChart`, an `SpCard` and an `SpTable`.
- **Harness widths:** 320 px; 640 px for Table, Descriptions, TimelineList, Collapse and Result;
  overlays in a 800 × 600 viewport.

## 4. Monorepo structure (§5.1) — additions

```
packages/core/src/palette/{palette.ts, contrast.ts}       # on /palettes (types on main)
packages/core/src/palettes.ts                             # /palettes
packages/core/src/ui/{sort.ts, pages.ts, number.ts, initials.ts, listbox.ts, place.ts, anchor.ts}
packages/core/src/ui/{view-composed.ts, view-overlay.ts}
packages/core/src/timeline/{view.ts, ink.ts, index.ts}    # /timeline
packages/grounds/src/timeline/timeline-css.ts             # → dist/timeline.css
packages/react/src/ui/{surface, glyph, table, …}.tsx  packages/react/src/timeline.tsx
packages/vue/src/ui/{surface, glyph, table, …}.ts     packages/vue/src/timeline.ts
packages/angular/ui/{surface, glyph, table, …}/       packages/angular/timeline/
fixtures/ui/<component>--<state>--<ground>-<substrate>--<mode>.{fixture.json, canonical.txt}
fixtures/palette/<preset>--<target>--<mode>.{fixture.json, canonical.txt}
examples/*/…/{composed, palettes, timeline} pages
```

## 5. Dependencies (§5.3) — addition

The runtime allowlist is unchanged. `@knight-lab/timelinejs` `^3.9.13` is an **optional peer** of
the three adapters, imported only by their `timeline` subpath, and a dev dependency of the example
apps and of `tools/visual-gate` (pinned exactly there, for the pixel fixture). Its MPL-2.0 licence
is compatible with the MIT packages because it is not bundled.

## 6. Testing strategy (§8) — additions

| Level | What | REQ |
|---|---|---|
| Core unit | `resolvePalette` merge and `SP024`; `paletteStyle` order; `contrastRatio` against WCAG reference pairs; `checkPalette` per pair; `uiSortRows` stability, nulls last, mixed types; `uiPageWindow` for counts 1..12 × every current × siblings 0..2; `uiPagination` and `uiNumberValue` corrections (`SP017`); `uiInitials`; `uiListKey` every key × kind × disabled pattern; `uiTypeahead` wrapping; `uiPlace` flip, shift, RTL, 2 decimals; benchmarks | 460–467, 474, 476, 485, 486, 493–495 |
| Core DOM (happy-dom) | `uiAnchor` writes `--sp-ui-x/y` and cleans up; `timelineInk` reads probes and republishes, `none` in `precision` | 493, 512 |
| Grounds | `ui.css` and `timeline.css` contain no literal colour (I-19); no `opacity` on any tone or backdrop rule (I-24); contrast gate over the presets (REQ-464) | 464, 475, 499, 511 |
| Adapter unit | Markup per component and state; controlled/uncontrolled values and `open`; Angular CVA; disabled emits nothing; overlay calls `showModal`/`showPopover` only after mount; toast timer pause; palette precedence | 470, 488, 490–503 |
| Mode invariance | I-17 over the new rows | 468, 522 |
| Parity (Node) | Tree gate on the new fixtures, three adapters vs canonical | 516 |
| Pixel (Docker) | Three gates per fixture, overlays open | 517 |
| E2E (four apps) | Composed, palettes and timeline pages: hydration, axe, APG keyboard for Select, Menu, Modal (focus trap and return), Tooltip (1.4.13), Toast (F8, pause); exclusive Collapse; native form submit with Textarea, InputNumber and Select; reduced motion; RTL (SHOULD); targets ≥ 24 px | 491–498, 503, 520, 522, 523 |
| Budget | size-limit per new subpath, overlay runtime, `ui.css`, `timeline.css`, the timeline wrapper; REQ-444 one-chart no-growth | 518, 519 |

## 7. Open questions (§10) — additions

| # | Question | Leaning |
|---|---|---|
| OQ-C1 | Overlays: platform or headless library | **Decided 2026-10-18:** the platform (DD-038) |
| OQ-C2 | Timeline: optional subpath, CSS only, or out | **Decided 2026-10-18:** optional subpath (DD-042) |
| OQ-C3 | If `paletteStyle` pushes a one-chart build past the REQ-444 allowance | **Decided 2026-10-18:** measured in T-200 at ≈ 0.56 KB minified for the core part alone (the allowance had ≈ 60 B left), so the gate is **re-baselined to `0.6.0`**: `one-chart-0.6.0.json`, measured on a v0.6.0 worktree, with a 1 KB allowance that holds the palette; the 0.25 KB no-growth rule applies again from `0.7.0` on (T-220). *Amended in implementation (T-212, user decision 2026-10-19):* with the `SP023` check, the cell merge and Angular's `palette` input and nested `provideSilverpoint`, the growth against `0.6.0` is up to 1305 B (React), 819 B (Vue) and 1736 B (Angular), so the allowance is **2 KB**; the re-baseline was done in T-212 (all 244 one-chart entries) |
| OQ-C4 | Should `SpTable` page by itself (`pageSize` + an internal `SpPagination`)? | No in `0.7.0`, as in Reflex: the consumer composes `SpTable` and `SpPagination` |

## Constitution check

- **Art. 1** — sort marks, steppers, trend arrows, ticks and placement are exact; frames, tones,
  the backdrop hatch and the timeline masks are ornament (DD-038, DD-040, DD-042).
- **Art. 2** — every computation in the core; adapters call the platform (DD-037..DD-040).
- **Art. 3** — new fixtures under the tree gate; the TimelineJS DOM outside it by the amendment (DD-042, DD-043).
- **Art. 4** — no measurement, timer or clock on the render path; ids from `id`.
- **Art. 5** — `<dialog>`, Popover API, `<details>`, native table and inputs; APG for listbox and menu.
- **Art. 6** — tone by the ramp for rows and backdrop; heightening on the one active item (DD-039, DD-040).
- **Art. 7** — palettes and presets are data; `ui.backdrop` is a ground token.
- **Art. 8** — no dependency; one optional peer; budgets.
- **Exception requested:** none.
