# Research — the `reflex-silverpoint-react` 0.7 inventory, for React, Vue and Angular

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 0, approved 2026-10-18 by Ernesto Crespo (drafted the same day) |
| **Source** | [`ecrespo/reflex-silverpoint-react`](https://github.com/ecrespo/reflex-silverpoint-react) tag `v0.7.0`, commit `5868f97` (2026-10-18): `palette.py`, `surfaces.py`, `composed.py`, `overlays.py`, `timeline.py`, `assets/{surface.jsx, surfaces.css, timeline.jsx, timeline.css}`, `tests/test_v07.py`, demo pages `/components`, `/palettes`, `/timeline` |

## 1. What 0.7 of the Reflex wrapper added

The Reflex wrapper of `@silverpoint/react` added four families of its own on top of silverpoint
`0.6.0`. All four were declared **Reflex-only**, outside silverpoint's parity contract
(`surfaces.py`: "not part of silverpoint's React/Vue/Angular parity contract"). This feature brings
them into silverpoint itself, so they become library components under Art. 3, available in the three
adapters, and the Reflex wrapper can later wrap them instead of carrying its own JSX.

| Family | Reflex 0.7 | Mechanism there |
|---|---|---|
| **Palettes** | `palette=` on every chart, UI component and dashboard; `silverpoint_palette(...)` for a section; `PALETTES` (6 presets: `silverpoint`, `sanguine`, `sepia`, `iron_gall`, `verdigris`, `indigo`); `check_palette`, `contrast_ratio`, `palette_css`, `PALETTE_PROPERTIES` | Emotion class `&&` with the nine `--sp-` properties; a `display: contents` wrapper with a `:where(.sp-root, .sp-ui, .sp-dashboard, .sp-surface)` descendant rule |
| **Level A — composed** (12) | `sp_table` (+ `sort_rows`), `sp_pagination`, `sp_breadcrumb`, `sp_avatar` (+ `sp_avatar_group`), `sp_statistic`, `sp_descriptions`, `sp_timeline_list`, `sp_collapse` (+ `sp_collapse_item`), `sp_empty`, `sp_result`, `sp_textarea`, `sp_input_number` | Native HTML on an `sp_surface` (the `ui.css` root contract: `.sp-ui` + `sp-frame` / `sp-tone` parts); pagination and input number are JSX with their own maths |
| **Level B — overlays** (8) | `sp_modal`, `sp_drawer`, `sp_popover`, `sp_tooltip`, `sp_select`, `sp_dropdown_menu`, `sp_toast` (+ `sp_toaster`), `sp_trigger` | Radix primitives (`@radix-ui/react-dialog`, `-popover`, `-tooltip`, `-select`, `-dropdown-menu`, `-toast`) whose content is an `sp_surface` |
| **Timeline** | `sp_timeline` (optional extra `[timeline]`), `timeline_available()` | Knight Lab TimelineJS (MPL-2.0, npm `@knight-lab/timelinejs` 3.9.13) re-skinned with `--sp-` properties; a hidden probe reads the ground's frame and tone masks and republishes them as `--sp-kl-*` for TimelineJS's own DOM |
| Building blocks | `sp_surface`, `sp_glyph` | The root contract and the 16 × 16 glyphs (`UI_GLYPHS` + ten more: `plus`, chevrons, arrows, sort marks, `ellipsis`) |

## 2. What carries over unchanged

- **The palette model.** A palette is nine optional colours, each one `--sp-` property; unset fields
  keep the ground's own. Monochrome by design (two inks, never a colour per series, Art. 6).
  Presets are named after historical drawing media. The contrast thresholds are the data model's
  (4.5 for text and series, 3 for rules, grid and focus; `heighten` exempt because it is always
  outlined, §3.3). The six presets were checked in `test_v07.py`; this research re-checked them
  against the silverpoint contrast gate's pairs (§5).
- **The markup of the composed components.** It already is silverpoint's: `.sp-ui` roots,
  `part="sp-frame" data-kind`, `part="sp-tone" data-tone`, `part~="sp-heighten"`, `sp-ui-plate`,
  glyphs as `part="sp-mark"`. The class names (`sp-ui-table`, `sp-ui-page`, `sp-ui-crumb`, …) carry
  over, so the Reflex wrapper's CSS users keep their selectors.
- **The inventory and its props**, with the renames of §4.
- **The timeline skin**: phase 1 (colours, type, rules through `--sp-` properties) and phase 2 (the
  hand: frame and tone masks read from probes and laid on TimelineJS's markers, eras and menubar).

## 3. What cannot carry over as is

| Reflex 0.7 | Why not in silverpoint | silverpoint |
|---|---|---|
| Radix for every overlay | React-only; Vue and Angular would need Reka UI and the CDK: three engines, three markups, parity impossible (DD-023's option C, rejected in feature-002) | **The platform** (user decision 2026-10-18): `<dialog>` + `showModal()` for Modal and Drawer (focus trap, Escape, inert page, top layer); the Popover API for Popover, Tooltip, the Select list and the Menu (top layer, light dismiss); keyboard transitions and placement as pure functions in the core (DD-038, DD-039) |
| Pagination window and InputNumber clamping written in JSX | Art. 2: no maths in an adapter | `uiPageWindow`, `uiNumberValue` in `@silverpoint/core/ui` |
| `sort_rows` in Python | The same (Art. 2), and three adapters need one order | `uiSortRows` in the core: stable, `null` last, numbers before strings, locale-free |
| Table striping and row hover as `repeating-linear-gradient` over `color-mix(… 40%, transparent)` | A hatch drawn by CSS gradient is not the ground's tone (Art. 6 asks the ground's ramp; `cyanotype` has no hatch at all), and a mixed transparent colour is opacity as tone | The ground's tone, level 1, laid on the row as `ui.css` lays every tone (DD-026): hatch tile under `silverpoint`, weight under `cyanotype` |
| Backdrop: `color-mix(substrate 72%, transparent)` + tone at `opacity: 0.45` | Opacity as a tonal mechanism (Art. 6) | A hatched backdrop: the tone tile of level 2 over a transparent background. Hatching is see-through by construction (the page shows between the lines), so no opacity is needed; under `weight` grounds and in `precision` the backdrop is the substrate at the ground's `ui.backdrop` level (Data Model §3.8 addition) |
| `--sp-rule`-mixed row borders (`color-mix(var(--sp-grid) 45%, transparent)`) | The same | `var(--sp-grid)`, which already passes 3:1 |
| Entry animation `opacity 0 → 1` | Allowed as motion, but REQ-320 | Kept, under `prefers-reduced-motion: no-preference` only |
| `sp_trigger` | Existed because Reflex's `sp_button` did not forward Radix's props | Not needed: every overlay takes a trigger slot; `SpButton` is the trigger (§4) |
| Emotion `&&` specificity trick and `display: contents` section wrapper | Framework-specific CSS-in-JS | The palette is an inline `style` of `--sp-` declarations on the root, computed by the core (inline beats the ground's zero-specificity rules), and a section is a nested provider: `SilverpointProvider` / `provideSilverpoint` already scope by context (DD-037) |
| `sp_timeline` through `reflex-knightlab-timeline` | Python-side wrapper | A thin per-adapter component that loads `@knight-lab/timelinejs` (optional peer) on the client (user decision 2026-10-18; DD-042) |

## 4. Renames and merges for the three adapters

Every component is `Sp`-prefixed, kebab-case subpath, one name in the three adapters (OQ-U2).

| Reflex | silverpoint | Subpath |
|---|---|---|
| `sp_surface`, `sp_glyph` | `SpSurface`, `SpGlyph` | `ui/surface`, `ui/glyph` |
| `sp_table` | `SpTable` | `ui/table` |
| `sp_pagination` | `SpPagination` | `ui/pagination` |
| `sp_breadcrumb` | `SpBreadcrumb` | `ui/breadcrumb` |
| `sp_avatar`, `sp_avatar_group` | `SpAvatar`, `SpAvatarGroup` | `ui/avatar` |
| `sp_statistic` | `SpStatistic` | `ui/statistic` |
| `sp_descriptions` | `SpDescriptions` | `ui/descriptions` |
| `sp_timeline_list` | `SpTimelineList` | `ui/timeline-list` |
| `sp_collapse`, `sp_collapse_item` | `SpCollapse`, `SpCollapseItem` | `ui/collapse` |
| `sp_empty`, `sp_result` | `SpEmpty`, `SpResult` | `ui/empty`, `ui/result` |
| `sp_textarea`, `sp_input_number` | `SpTextarea`, `SpInputNumber` | `ui/textarea`, `ui/input-number` |
| `sp_modal`, `sp_drawer` | `SpModal`, `SpDrawer` | `ui/modal`, `ui/drawer` |
| `sp_popover`, `sp_tooltip` | `SpPopover`, `SpTooltip` | `ui/popover`, `ui/tooltip` |
| `sp_select` | `SpSelect` | `ui/select` |
| `sp_dropdown_menu` | `SpDropdownMenu` | `ui/dropdown-menu` |
| `sp_toast`, `sp_toaster` | `SpToast`, `SpToaster` | `ui/toast` |
| `sp_trigger` | — (`SpButton`) | — |
| `sp_timeline` | `SpTimeline` | `timeline` (its own subpath, outside `ui/`) |
| `silverpoint_palette` | `palette` on `SilverpointProvider` / `provideSilverpoint` | — |
| `PALETTES`, `check_palette`, `contrast_ratio`, `palette_css` | `PALETTES`, `checkPalette`, `contrastRatio`, `paletteStyle` | `@silverpoint/core` |

`SpSelect` is not `SpSegmented` or `SpRadioGroup`: it is the APG *select-only combobox* (a button
and a listbox), for lists too long for a segmented control.

## 5. Contrast of the six presets (re-checked 2026-10-18)

The Reflex tests only measured each field against the substrate. The silverpoint contrast gate has
more pairs (Data Model §3.8: text on heighten, outline on heighten, the precision frame). Recomputed
with the WCAG formula (scratch script, 2026-10-18), every preset passes every pair. The pair closest
to its threshold:

| Preset | Closest pair | Ratio | Threshold | `ink` | `text` | `ink` on `heighten` |
|---|---|---|---|---|---|---|
| `silverpoint` | `rule` / `grid` on substrate | 3.52 | 3 | 5.29 | 8.09 | 6.51 |
| `sanguine` | `rule` / `grid` on substrate | 4.02 | 3 | 6.40 | 11.33 | 7.75 |
| `sepia` | `rule` / `grid` on substrate | 3.82 | 3 | 6.29 | 11.08 | 7.79 |
| `iron_gall` | `rule` / `grid` on substrate | 3.87 | 3 | 7.73 | 11.89 | 9.29 |
| `verdigris` | `text_muted` on substrate | 5.15 | 4.5 | 5.84 | 9.92 | 6.95 |
| `indigo` | `rule` / `grid` on substrate | 4.00 | 3 | 7.17 | 11.27 | 8.61 |

These figures are re-measured by the gate, not trusted: T-201 writes the presets and their pairs
into `tools/contrast-gate`, and CI fails if one drops below its threshold (the palette is computed,
not chosen by eye).

## 6. What silverpoint takes, leaves, or adds

- **Takes:** the inventory, the palette model and presets, the markup names, the timeline skin.
- **Leaves:** Radix, the JSX maths, the gradient hatching, opacity on the backdrop, `sp_trigger`,
  the emotion specificity trick.
- **Adds:** core functions for every computation (sorting, page window, number clamping, listbox
  and menu keyboard, typeahead, placement); parity fixtures for every state; server rendering for
  the display components; the Angular `ControlValueAccessor` for `SpTextarea`, `SpInputNumber` and
  `SpSelect`; `precision` and forced colours for the overlays and the timeline.
