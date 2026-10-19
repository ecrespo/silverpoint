# Data Model delta — palettes, composed components, overlays and the timeline

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 3 with the Technical Design delta, approved 2026-10-18 by Ernesto Crespo (drafted the same day) |
| **Amends** | [Data Model](../../specs/data-model.md) v1.7 → v1.8: new §2.26, §2.27, §3.8, new §3.9, §4, §5, §6 |

## §2.26 Palettes (new)

| Field | Custom property | Threshold against the substrate |
|---|---|---|
| `substrate` | `--sp-substrate` | — (the background of every pair) |
| `ink` | `--sp-ink` | 4.5 |
| `inkSecondary` | `--sp-ink-secondary` | 4.5 |
| `heighten` | `--sp-heighten` | exempt (always outlined, §3.3); see §3.9 for its own pairs |
| `rule` | `--sp-rule` | 3 |
| `grid` | `--sp-grid` | 3 |
| `text` | `--sp-text` | 4.5 |
| `textMuted` | `--sp-text-muted` | 4.5 |
| `focus` | `--sp-ui-focus-color` | 3 |

The order of this table is the order of every emitted declaration (REQ-461). A value is any CSS
colour, by allowlist: a hex, a keyword, or a colour function (`rgb`…`oklch`, `color`, `color-mix`,
`light-dark`, `var`) over numbers, idents and `--custom` names; anything else (quotes, escapes, `;`,
`{`, `<`, `url(`, `image-set(`) is dropped (`SP024`, REQ-467). `paletteStyle` applies the same test. A palette
without `substrate` is measured against the resolved ground's substrate, else cream `#EDE7DA`.

**The presets** (`@silverpoint/core/palettes`, deep-frozen, I-23):

| Preset | `substrate` | `ink` | `inkSecondary` | `heighten` | `rule` = `grid` | `text` | `textMuted` |
|---|---|---|---|---|---|---|---|
| `silverpoint` | `#EDE7DA` | `#5A5E65` | `#685C4D` | `#FFFFFF` | `#737A82` | `#3F4348` | `#5A5E65` |
| `sanguine` | `#F2E8DC` | `#8A3A24` | `#6A4A3A` | `#FFFFFF` | `#9A6450` | `#4A2216` | `#7A3E2C` |
| `sepia` | `#F0E6D2` | `#6B4C2C` | `#5A5148` | `#FFFFFF` | `#8A6E52` | `#3B2A18` | `#6B4C2C` |
| `ironGall` | `#EEEAE0` | `#3C4858` | `#6A4E36` | `#FFFFFF` | `#6C7584` | `#232B36` | `#4A5566` |
| `verdigris` | `#E7EDE6` | `#2C6355` | `#65563F` | `#FFFFFF` | `#5C7B71` | `#1F3D36` | `#3E6A5E` |
| `indigo` | `#E9EAF1` | `#3A4884` | `#675641` | `#FFFFFF` | `#68709A` | `#232C52` | `#4A5590` |

Values are Reflex 0.7's, unchanged; their contrast is in [`research.md`](research.md) §5 and is
re-measured by the gate (REQ-464). `focus` is unset in every preset (the ground's default is `ink`).

## §2.27 Value contracts of the new components (new)

| Component | Value | Domain | Invalid value |
|---|---|---|---|
| Table `data` | rows (`Datum[]`) | any; a missing cell renders empty | — |
| Table `columns[].key` | non-empty string | unique | duplicate → later skipped, `SP019` |
| Table `sortKey` | a column key | a sortable column | unknown → no column sorted, silent |
| Pagination `current` | integer | `1..count`, `count = max(1, ceil(total / pageSize))` | → clamped, `SP017` |
| Pagination `total`, `pageSize` | integers | `total ≥ 0`, `pageSize ≥ 1` | → `0`, `10`, `SP017` |
| InputNumber | `number \| null` | `[min, max]`, `precision` decimals | → clamped and rounded, `SP017`; `null` is valid (empty field) |
| InputNumber `min`/`max`/`step` | finite, `min ≤ max`, `step > 0` | — | → unset bounds, step `1`, `SP017` |
| Descriptions `columns` | integer | `1..6` | → clamped, `SP017` |
| Textarea | `string` | `≤ maxLength` when set (the native attribute enforces it) | — |
| Select | a key of `items` | existing, enabled, or `null` | unknown → `null`, silent (as RadioGroup, A-06) |
| TimelineList `status` | `done \| current \| pending \| error` | at most one `current` | a second `current` renders as `done`, `SP017` |
| Overlay `open` | `boolean` | — | non-boolean → `Boolean(v)` |
| Toast `duration` | ms | `≥ 1000`, or `Infinity` (no auto close) | → `1000`, `SP017` |

**Sort order** (`uiSortRows`): rows whose value is `null` or missing go last, in input order;
numbers compare numerically and before strings; strings compare by code point after
`toLowerCase()` (no locale, so the order is the same on every server); ties keep input order.
`desc` reverses the present rows only.

**Page window** (`uiPageWindow(count, current, siblings)`): `1`; `start-gap` when
`current − siblings > 2`; the pages from `max(2, current − siblings)` to
`min(count − 1, current + siblings)`; `end-gap` when that end is `< count − 1`; `count` when
`count > 1`. Reflex 0.7's algorithm, unchanged.

## §3.8 The `ui` tokens of a ground — addition

```ts
/** Level of the substrate behind a modal overlay where it is not hatched (weight grounds, precision). */
backdrop: 1 | 2 | 3 | 4;
/** Level of the table's striped and hovered rows. */
rowTone: 1 | 2 | 3 | 4;
```

| Token | `silverpoint` | `cyanotype` | Default |
|---|---|---|---|
| `backdrop` | 2 | 2 | 2 |
| `rowTone` | 1 | 1 | 1 |

**Contrast pairs added** (REQ-313, REQ-522), on every substrate of every ground:

| Pair | Foreground | Background | Threshold |
|---|---|---|---|
| `ui.row-tone-text` | `text` over the `rowTone` tone (on the cell's plate) | substrate | 4.5 |
| `ui.overlay-text` | `text` in an overlay | substrate | 4.5 |
| `ui.option-active` | `text` on the heightened option | `heighten` | 4.5 |
| `ui.option-outline` | `primary` (the active option's outline) | `heighten` | 3 |
| `ui.crumb-separator` | `rule` | substrate | 3 |

## §3.9 Palette contrast pairs (new)

`checkPalette` and the contrast gate measure exactly these pairs (`PALETTE_PAIRS`):

| Pair | Foreground | Background | Threshold |
|---|---|---|---|
| `ink` | `ink` | `substrate` | 4.5 |
| `ink-secondary` | `inkSecondary` | `substrate` | 4.5 |
| `text` | `text` | `substrate` | 4.5 |
| `text-muted` | `textMuted` | `substrate` | 4.5 |
| `rule` | `rule` | `substrate` | 3 |
| `grid` | `grid` | `substrate` | 3 |
| `focus` | `focus` (else `ink`) | `substrate` | 3 |
| `heighten-outline` | `ink` | `heighten` | 3 |
| `heighten-text` | `text` | `heighten` | 4.5 |

A pair is skipped when either colour is unset (and unresolvable) or not hex.

## §4 Demo — addition

`UI_DEMOS` gains one entry per new state (§5), plain data, deep-frozen. The composed page composes
as the Reflex `/components` page does: a table of orders with sorting and pagination, a statistic
row, descriptions of the selected order, a timeline list of its history, a collapse of FAQs, the
empty and result states, and one trigger per overlay. The palettes page shows the six presets, each
over a `LineChart`, an `SpCard` with an `SpProgress`, and an `SpTable`. The timeline page holds a
frozen `TIMELINE_DEMO` (TimelineJS JSON: the life of a silverpoint drawing, eight events, two eras,
no external media).

## §5 Fixture matrix — addition

| Component | States | # |
|---|---|---|
| Surface | frame-card, tone-2 | 2 |
| Glyph | all (the 17 glyphs in a row) | 1 |
| Table | plain, sorted-striped, empty | 3 |
| Pagination | middle (both gaps), total (first page, `showTotal`) | 2 |
| Breadcrumb | three | 1 |
| Avatar | initials, square, group | 3 |
| Statistic | plain, trend-down | 2 |
| Descriptions | bordered, plain | 2 |
| TimelineList | mixed (done, current, pending, error) | 1 |
| Collapse | one-open, accordion-disabled | 2 |
| Empty | plain | 1 |
| Result | success, error | 2 |
| Textarea | count, invalid | 2 |
| InputNumber | value, at-min | 2 |
| Modal | open | 1 |
| Drawer | end-open | 1 |
| Popover | open | 1 |
| Tooltip | open | 1 |
| Select | placeholder, open-selected | 2 |
| DropdownMenu | open | 1 |
| Toast | info, error-action | 2 |
| Timeline | surface (server markup only) | 1 |

**36 states**, on the `0.3.0` axes (five ground × substrate, two modes): **360 nightly**, **144 on
every PR** (`silverpoint/cream` and `cyanotype/prussian`). **Palette fixtures:** six presets × three
targets (`LineChart`, `SpCard`, `SpTable`) × two modes on `silverpoint/cream` = **36, nightly and
PR**. Totals: 1,782 chart + 90 dashboard + 906 component and palette fixtures nightly; 330 chart + 30
dashboard + 360 component and palette fixtures on PR. The timeline's pixel fixture (one, TimelineJS pinned) is nightly only.

## §6 Invariants — additions

| # | Invariant | Requirement |
|---|---|---|
| I-23 | The six presets are deep-frozen and every one passes every pair of §3.9. | REQ-463, REQ-464 |
| I-24 | No rule of `ui.css` or `timeline.css` sets `opacity`, `color-mix(… transparent)` or a gradient on a tone, a row, a backdrop or a highlight. | REQ-475, REQ-499 |
| I-25 | A palette changes only the root's `style`: the tree of a fixture with a palette equals the tree without it except for that attribute. | REQ-468 |
| I-26 | `uiSortRows` is stable and total: for any rows and key, the output is a permutation of the input with nulls last. | REQ-474 |
| I-27 | `uiPlace` keeps the overlay inside the viewport minus `padding` whenever it fits, and its output has at most 2 decimals. | REQ-493 |
| I-28 | At most one element per open list overlay is heightened, and it is the `aria-activedescendant` of the Select or the focused item of the Menu. | REQ-498 |

## Constitution check

- **Art. 4** — fixtures carry ids; sort and placement are pure; presets frozen.
- **Art. 5** — contrast pairs extended to overlays, rows and palettes.
- **Art. 6** — I-24 forbids opacity and gradients as tone.
- **Art. 7** — `backdrop` and `rowTone` are ground tokens; presets are data.
- **Exception requested:** none.
