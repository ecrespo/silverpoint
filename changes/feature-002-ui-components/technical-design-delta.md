# Technical Design delta — UI components

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 3, approved 2026-09-28 by Ernesto Crespo, with OQ-U1, OQ-U4 and the concept corrections C-2, C-3, C-4, C-6, C-7 of [`analyze.md`](analyze.md); **folded into `specs/technical-design.md` (v1.8) on 2026-09-29** (T-162) |
| **Amends** | [Technical Design](../../specs/technical-design.md) v1.7 → v1.8: §3.2, §3.3, new DD-021..DD-027, §5.1, §8, §10 |
| **Inputs** | [`prd-delta.md`](prd-delta.md), [`api-delta.md`](api-delta.md), [`research.md`](research.md) |

## 1. Components (§3.2) — additions

| Component | Package | Responsibility |
|---|---|---|
| `ui/value.ts` | core | `uiValue`: clamp, step rounding, fraction (REQ-324) |
| `ui/progress.ts`, `ui/steps.ts` | core | Circle-progress arc on the existing polar engine; step statuses and connector fractions |
| `ui/keyboard.ts` | core | `uiRovingKey`: APG transitions, orientation and direction (REQ-315, REQ-321) |
| `ui/frame.ts` | core | `uiFrameVariant`; the exact frame outline per frame kind, the input of the piece generator (DD-022) |
| `ui/items.ts`, `ui/names.ts` | core | Key de-duplication (`SP019`), accessible-name check (`SP018`) |
| `scripts/ui-pieces.ts` | grounds (build only) | Inks each frame kind and tone level per ground and variant with the ground's own inker, and writes them into `ui.css` as mask images |
| `ui.css` | grounds | Sizes, focus, states, the pieces as masks, the `precision` and forced-colours fallbacks |
| `ui/*` components | react, vue, angular | Bind state, events and forms idiomatically; emit the markup contract (API delta §4) |

## 2. Data flow (§3.3)

```
build time (grounds):
  core.uiFrameOutline(kind) ──► ground.inker.ink(outline, variant seed) ──► 9 pieces per kind × variant
  ground.tonalRamp ──► tone tiles                                          ──► ui.css (mask images, no colour)

render time (adapter, server and client):
  props ──► core.uiValue / uiSteps / uiProgressArc / uiFrameVariant ──► fractions, arcs, data-frame
        ──► element tree of API delta §4, with --sp-ui-fraction etc. as inline custom properties
  CSS: ::before paints var(--sp-ink) through the piece mask; `precision` swaps it for an exact border

keyboard (client):
  keydown ──► core.uiRovingKey(state, key, orientation, dir) ──► index ──► focus + (automatic) select
```

No step measures the DOM, runs an inker, or reads the clock at render time.

## 3. Design decisions

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

## 4. Monorepo structure (§5.1) — additions

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

`packages/core/src/ui/**` and the adapters' `ui/` join the paths REQ-044 watches (REQ-312).

## 5. Testing strategy (§8) — additions

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

## 6. Open questions (§10) — additions

| # | Question | Leaning |
|---|---|---|
| OQ-U1 | `ui/` subpath or new packages | **Decided 2026-09-28:** subpath (DD-021) |
| OQ-U2 | React names unprefixed or `Sp` | **Decided 2026-09-28:** `Sp` prefix in the three adapters |
| OQ-U3 | 17 components in `0.3.0` or 8 first | **Decided 2026-09-28:** all 17 in `0.3.0` |
| OQ-U4 | Angular attribute selectors for Button/Input | **Decided 2026-09-28:** yes (DD-024) |
| OQ-U5 | Four frame variants per kind: enough variety, or does `ui.css` weight allow six? | **Measured 2026-09-28 (T-142):** `ui.css` gzip is 4.40 KB with one variant, 7.85 KB with four, 10.09 KB with six (≈ 1.1 KB each). Six fit, but the component rules of step 6c share the 24 KB; four are kept, and a ground may declare up to six |
| OQ-U6 | Overlays: core machines or per-framework headless libraries | Out of this feature (PRD §5.3) |

## Constitution check

- **Art. 1** — (amended) frames and fills are ornament; hit areas, focus and value shapes exact (DD-022, DD-025).
- **Art. 2** — every fraction, arc and transition in the core; the build tool inks core outlines with the ground's inker.
- **Art. 3** — (amended) components are fixtures under the same tree gate (DD-027).
- **Art. 4** — no inking, measurement or time at render; variants and ids from `seed`/`id`.
- **Art. 5** — native first, APG keyboard, exact focus, forced `precision` (DD-023).
- **Art. 6** — (amended) tone from the ramp; one heightening per component instance (DD-026).
- **Art. 7** — frame style and sizes are ground tokens; no component code per ground.
- **Art. 8** — no dependency; `ui.css` opt-in; budgets.
- **Exception requested:** none.
