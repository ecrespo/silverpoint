# Implementation Plan and Tasks — Phase 10, slide decks

> Source specs: [`prd-delta.md`](prd-delta.md) §6.15 (REQ-570..REQ-628) · [`api-delta.md`](api-delta.md)
> · [`technical-design-delta.md`](technical-design-delta.md) DD-051..DD-060 ·
> [`data-model-delta.md`](data-model-delta.md) §2.32..§2.37 · [`poc.md`](poc.md). Generated:
> 2026-10-31. Task ids continue the global sequence after T-251.

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 4, drafted and approved 2026-10-31 |
| **Branch** | `feat/silverpoint-0.9` (off `develop`, after the spec branch merges into it) |
| **Prerequisite** | Gates 0..3 approved; the PoC done (step 10a) |

**Goal.** A Marp Markdown string given to `SpDeck` in React, Vue or Angular renders as a silverpoint
deck —theme, grounds, live charts, fragments, notes, keyboard, overview, print— identically in the
three adapters and in Chromium, Firefox and WebKit; the same theme works in Marp CLI; agents can
validate and render decks.

**Done criteria (Phase 10)**
- Every MUST of REQ-570..REQ-628 cited by a test; traceability 0 blocking.
- Deck fixtures green in the tree gate and the pixel gate; the `browser-deck` job green in three engines.
- REQ-444's one-chart builds unchanged, with no `@marp-team` module; `deck` budgets met.
- `agent-catalog` `check` clean; `validate_deck`/`render_deck` contract tests green.
- `/deck` page in the four example apps and the docs site; README of `@silverpoint/marp`.
- Released as `0.9.0` (changeset `minor`) from CI; deltas folded; `CLAUDE.md` status.

**Carried rules.** Test-first; cite the REQ; mutation-check any test written after the code. Every
change touching `packages/` adds a changeset. Run the CI steps of `ci.yml` in order before "done".
When reporting a test step, show its output (rendered HTML/CSS, transitions, the runner's output).

## Phases

| Step | Content | Depends on | Exit |
|---|---|---|---|
| 10a | PoC: scaling in three engines | gate 2 | ✅ `svg-transform` (DD-051) |
| 10b | `@silverpoint/marp` engine: package, Marpit wrapper, annotations, directives, fence, limits; `slideBackdrop` in grounds | gate 3 | unit tests for I-43..I-48, I-52 |
| 10c | Theme: source, generator, `theme.css`, contrast pairs, Marp CLI check, `cli` engine | 10b | contrast gate green; `marp --theme` renders |
| 10d | Controller and client: reducer, emitter, `bindDeck`, `applyScaling`, `findChartSlots`, `deck.css` | 10b | table-driven transitions (I-49..I-51) |
| 10e | Adapters: `SpDeck` ×3, chart loaders (generated), hydration, SSR | 10c, 10d | component tests; SSR without mismatch |
| 10f | Gates: deck fixtures, `deck-gate`, pixel fixtures, `browser-deck` e2e, bundle checks | 10e | CI green |
| 10g | Agent access: catalog `deck`, `validate_deck`, `render_deck`, `generate_code { deck }`, skill reference | 10b, 10e | `check` clean; contract tests |
| 10h | Demo, `/deck` pages, docs, README, changeset, fold deltas, `CLAUDE.md` | 10f, 10g | ready for the `0.9.0` release commit |

## Tasks

### 10a — PoC

- [x] **T-252** `tools/deck-poc`: three scaling methods × three engines × three widths; geometry, hit-testing, clicks, keyboard, split backgrounds, root font size; `poc.md`. *REQ-617, REQ-618, REQ-580, REQ-588*

### 10b — Engine

- [x] **T-253** `packages/marp` scaffold in the `fixed` group (tsup, exports of API delta §1, vitest project, `check-deps` rules: Marpit only here; optional peer in the adapters); `README` stub. *REQ-570, REQ-616*
- [x] **T-254** `engine/marpit.ts` + `createDeckEngine`: container `div.sp-deck-<id>`, `slideContainer div.sp-deck-slide`, `inlineSVG`, `anchor: false`, `html: false`, `htmlAsArray`; id sanitising; `DeckRender` shape. Tests: I-43, I-44, REQ-571, REQ-572. *REQ-571..REQ-574*
- [x] **T-255** Hostile-input corpus (raw HTML, `javascript:`/`vbscript:`/`data:` links and images, `on*` attributes in Markdown attributes, HTML in directives and comments); I-45. *REQ-575*
- [x] **T-256** Slide annotations (core rule): `role`, `aria-roledescription`, `aria-label`, `heading`, notes, fragments count. *REQ-573, REQ-614*
- [x] **T-257** Directives `ground`/`substrate`/`mode` (local, spot, inheritance, ground change resets substrate), `SP027`; `DECK_DIRECTIVES`; I-48. *REQ-584..REQ-586*
- [x] **T-258** `parseChartFence` + slug table from core and `/catalog` (60 slugs, kebab of recipe names, agrees with the agent catalog); every `FenceError` kind. *REQ-589, REQ-591*
- [x] **T-259** Move the canonical chart-DOM writer from `tools/visual-gate/dashboard-canonical.ts` into `@silverpoint/grounds` as `toChartRootString` (with the `.sp-root` palette style; the dashboard and palette gates prove adapter equality; Analyze A-03). Fence render through `grounds.renderChart` with the slide's ground/substrate/mode/palette; slot markup, `data-sp-spec`; error figure; `SP026`; ids (I-46, I-47); parity of the slot SVG with `render_chart`'s for the same input. *REQ-585, REQ-589..REQ-591*
- [x] **T-260** `slideBackdrop` in `@silverpoint/grounds` (`plain`, `hatched`, `plate`; seeded; `precision` exact); wired as `--sp-deck-backdrop`; I-52. *REQ-587*
- [x] **T-261** Limits (512 KB, 300 slides, 60 fences) and `SP029`. *REQ-576*

### 10c — Theme

- [x] **T-262** `theme/silverpoint.css.ts`: typography, scale, headings, lists, tables, blockquote, code (EB Garamond, `tnum`, no monospace), images, header/footer, pagination, `size` 16:9 and 4:3; canvas px only (lint rule: no `rem|vw|vh|cq`). *REQ-577, REQ-578, REQ-580*
- [x] **T-263** Classes `lead`, `invert`, `plate`, `hatched`; `THEME_CLASSES`. *REQ-579*
- [x] **T-264** `tools/deck-theme` generator → `packages/marp/theme.css` (one block per ground × substrate, `invert` blocks, a default block for Marp CLI); `check` mode in CI. *REQ-577, REQ-582*
- [x] **T-265** `tools/contrast-gate`: the theme's text/rule pairs per ground × substrate × class. *REQ-581*
- [x] **T-266** Marp CLI: render a fixture with `--theme theme.css` (dev dependency of `tools/deck-theme`, pinned) and assert the theme applies; `@silverpoint/marp/cli` engine renders directives, backdrops and fences (SHOULD). *REQ-582, REQ-583*

### 10d — Controller and client

- [x] **T-267** `controller/reduce.ts`: every row of API delta §7.2, controlled and uncontrolled, pending step in controlled mode, `SP028`; property tests for I-49, I-50. Show the transition table output. *REQ-595, REQ-596, REQ-598, REQ-599*
- [x] **T-268** Emitter and payloads (I-51); `ready` on new totals. *REQ-606*
- [x] **T-269** `bindDeck`: keys of API §7.3 scoped to the deck, editable targets ignored, chart keys win; swipe (48 px, 2:1); hash (`#<n>` only, `replaceState`); Fullscreen API availability. *REQ-600..REQ-603*
- [x] **T-270** `applyScaling` (one `ResizeObserver`, `--sp-deck-scale`, `data-sp-scaled`), `findChartSlots`, fragment `data-sp-pending` moves. *REQ-597, REQ-617, REQ-592*
- [x] **T-271** `deck.css`: viewport, slide boxes, scaled state, pending fragments, controls, notes, overview grid with the current thumbnail heightened, print layout, reduced motion, forced precision. *REQ-597, REQ-604, REQ-605, REQ-613, REQ-615*

### 10e — Adapters

- [x] **T-272** `tools/agent-catalog` generates `deck/chart-loaders.ts` for the three adapters; `check` diffs them. *REQ-593*
- [ ] **T-273** React `SpDeck` (`"use client"`): render from `DeckRender`, controller via `useSyncExternalStore`, `createPortal` hydration, markdown change and unmount cleanup counters, provider defaults. *REQ-593, REQ-608..REQ-611*
- [ ] **T-274** Vue `SpDeck`: `shallowRef` state, `v-model:page`, `render(h())` hydration with `appContext`, cleanup. *REQ-593, REQ-608, REQ-610, REQ-611*
- [ ] **T-275** Angular `sp-deck` (secondary entry point `deck`): signal inputs, `[(page)]`, `createComponent({ hostElement })` hydration, `afterNextRender`, `DestroyRef` cleanup. *REQ-593, REQ-608, REQ-610, REQ-611*
- [ ] **T-276** Controls and overview markup in the three adapters (native buttons, labels, `aria-pressed`, counter, live region, `SP018`). *REQ-604, REQ-613, REQ-614*
- [ ] **T-277** SSR: Next.js, `@vue/server-renderer`, Angular SSR render the deck; hydration without mismatch; the client half only after mount. *REQ-612*

### 10f — Gates

- [ ] **T-278** `fixtures/deck/` (Data Model §5) and `tools/visual-gate/deck-gate.ts`: canonical render vs each adapter's server render, DD-017 rules. *REQ-623*
- [ ] **T-279** Pixel fixtures: slides at 1280×720 per ground and mode, Chromium. *REQ-624*
- [ ] **T-280** `browser-deck` CI job (pinned image, three engines) + a `deck` e2e in each example app: scaling with CSS-set dimensions in WebKit first (PoC limit), hydration, clicks on marks, keyboard, fragments, hash, re-render, unmount, print layout, focus ring position. *REQ-617, REQ-618, REQ-625*
- [ ] **T-281** `tools/bundle-budget`: no `@marp-team`/`@silverpoint/marp` module in one-chart builds; `deck` entry and `@silverpoint/marp` budgets (values from the first build, recorded in the TD). *REQ-616, REQ-628*

### 10g — Agent access

- [ ] **T-282** Agent catalog `deck` section (§2.37): props and events from the types, `DECK_DIRECTIVES`, `THEME_CLASSES`, fence JSON Schema, diagnostics, stylesheets. *REQ-619*
- [ ] **T-283** `validate_deck` and `render_deck` (+ resources), limits, contract and golden tests. *REQ-620*
- [ ] **T-284** `generate_code { deck }` per framework; `reflex` → pending error; golden files type-check. *REQ-621*
- [ ] **T-285** Skill `references/deck.md` (authoring, directives, fence, adapters, Marp CLI), examples compiled. *REQ-622*

### 10h — Delivery

- [ ] **T-286** `DECK_DEMO` on `@silverpoint/marp/demo` (charts, fragments, split background, notes, a `precision` slide, a `cyanotype` slide); `/deck` page in the four apps and the docs site. *REQ-626*
- [ ] **T-287** Docs: usage ×3, authoring guide, theme with Marp CLI and VS Code + degradation, SSR per framework; `@silverpoint/marp` README. *REQ-627*
- [ ] **T-288** Changeset (`minor`), `@silverpoint/marp` in the `fixed` group and the release tooling's package list; first-publish note. *REQ-570*
- [ ] **T-289** Fold the deltas into `specs/` (constitution v1.11, PRD v1.15, API v1.13, TD v1.12, Data Model v1.10, plan v1.11), `reports/traceability.md`, `CLAUDE.md` status. *Art. 9*

## Risks carried

| Risk | Mitigation |
|---|---|
| CSS-set `<svg>` dimensions behave differently from the PoC's attributes in WebKit | T-280 runs it first; fallback: set attributes on mount (client-only, no SSR mismatch since the server keeps Marpit's markup) |
| `@silverpoint/marp`'s size (Marpit + every recipe) | Measured in T-281; never on a chart-only path; a pre-rendered `deck` prop is the Future Consideration |
| Angular and CJS Marpit | Documented `allowedCommonJsDependencies`; the Angular example app proves it |
