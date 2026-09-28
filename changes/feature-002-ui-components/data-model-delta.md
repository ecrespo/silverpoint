# Data Model delta — UI components

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 3 with the Technical Design delta, approved 2026-09-28 by Ernesto Crespo, with the concept corrections C-1, C-3, C-5 of [`analyze.md`](analyze.md) |
| **Amends** | [Data Model](../../specs/data-model.md) v1.5 → v1.6: new §2.14, new §3.8, §3.7, §4, §5, §6 |

## §2.14 Component value contracts

| Component | Value | Domain | Invalid value |
|---|---|---|---|
| Input | `string`; `message?: string` | any; an empty `message` is no message | Empty `message` → no message element and no `aria-describedby` |
| Checkbox, Switch | `boolean` | — | Non-boolean → `Boolean(v)`, no warning |
| RadioGroup, Segmented, Tabs | a key of `items` | existing, enabled key; `null` only for RadioGroup | Unknown key → RadioGroup `null`; Segmented and Tabs the first enabled key; `SP017` is not used (not a range) — silent, documented |
| Slider | `number` | `[min, max]`, on `step` from `min` | → clamped, rounded to the nearest step, `SP017` (REQ-324) |
| Rate | integer | `0..count` | → clamped and rounded, `SP017` |
| Progress | `number` or absent | `0..100`; absent = indeterminate | → clamped, `SP017` |
| Steps `current` | integer | `0..items.length − 1` | → clamped, `SP017` |
| `items[].key` | non-empty string | unique in the list | Duplicate → later skipped, `SP019` (REQ-325) |
| `min`, `max`, `step` | finite numbers, `min < max`, `step > 0` | — | → defaults `0`, `100`, `1` with `SP017` |
| `count` (Rate) | integer 1..10 | — | → clamped, `SP017` |

Fractions (DD-025) are `(value − min) / (max − min)`, rounded to 2 decimals (REQ-002); `0` and `1`
are exact at the ends.

## §3.8 The `ui` tokens of a ground (new)

Added to the `Ground` token schema (API Spec §6) as an optional section; a ground without it takes
the defaults below, so grounds registered by consumers keep working (REQ-312).

```ts
readonly ui?: Readonly<{
  /** `'inked'`: build-time pieces as masks (DD-022). `'css'`: an exact border (weight grounds). */
  frame: 'inked' | 'css';
  /** Frame variants generated per kind; 1..6. */
  frameVariants: number;
  /** Control heights in px, per size; each ≥ 24 (REQ-317). */
  controlHeight: Readonly<{ sm: number; md: number; lg: number }>;
  /** Corner radius of the `precision` / `css` frame, px. */
  radius: number;
  /** Focus indicator width, px; ≥ 2 (REQ-316). */
  focusWidth: number;
  /** Tone level per state (DD-026). */
  tone: Readonly<{
    selected: 1 | 2 | 3 | 4;
    primary: 1 | 2 | 3 | 4;
    danger: 1 | 2 | 3 | 4;
    disabled: 1 | 2 | 3 | 4;
    /** The box fill of an Alert of kind `error` (C-3); the other kinds take no tone. */
    alertError: 1 | 2 | 3 | 4;
  }>;
}>;
```

| Token | `silverpoint` | `cyanotype` | Default (no `ui` section) |
|---|---|---|---|
| `frame` | `inked` | `css` | `css` |
| `frameVariants` | 4 | 1 | 1 |
| `controlHeight` | 24 / 32 / 40 | 24 / 32 / 40 | 24 / 32 / 40 |
| `radius` | 2 (= `--sp-radius`) | 2 | 2 |
| `focusWidth` | 2 | 2 | 2 |
| `tone` | selected 3, primary 2, danger 4, disabled 1, alertError 1 | same (as weights) | same |

**Contrast pairs added to the gate** (REQ-313), on every substrate: control text on substrate
(4.5:1); frame ink, mark ink and focus colour on substrate (3:1); text on the level-3 tone (4.5:1,
measured on the tile's darkest line as for chart labels); text on the `alertError` tone (4.5:1, measured the same way; C-3); heightened item's ink outline (3:1, as
§3.3). Disabled text is exempt by WCAG 1.4.3 but must still reach 3:1 here, so disabled stays legible.

## §4 Demo — the UI reference page (addition)

Frozen, like every demo dataset, and used by the fixtures, the example apps and the docs site:
`UI_DEMOS` in `packages/core/src/ui/demo.ts`, one entry per component with its props per state
(§5), plain data, deep-frozen (I-9 extended).

The UI page composes as the concept drawing does: its Card holds a KPI and a Sparkline chart (C-5).
The Card fixtures hold no chart: text content only, so a component fixture tests the component and
the chart keeps its own fixtures and gates.

## §5 Fixture matrix — addition

Same `Fixture` shape; `chart` names the component, `props` the state, `size` the harness width.

**Declared states** (45):

| Component | States | # |
|---|---|---|
| Button | default, primary, danger, disabled | 4 |
| Input | empty (placeholder), filled, invalid with `message`, disabled | 4 |
| Checkbox | unchecked, checked, indeterminate, disabled | 4 |
| RadioGroup | selected, with a disabled item | 2 |
| Switch | off, on, disabled | 3 |
| Slider | value 30 with marks, disabled | 2 |
| Rate | 3 of 5, read-only | 2 |
| Segmented | first selected, middle selected | 2 |
| Tabs | first active, with a disabled tab | 2 |
| Steps | current 2 of 4, with an error step | 2 |
| Card | plain, with title and extra (text content only, no chart) | 2 |
| Tag | tone 1, closable tone 3 | 2 |
| Badge | count, dot, overflow (`99+`) | 3 |
| Divider | plain, with text | 2 |
| Progress | line 40, circle 72, indeterminate | 3 |
| Alert | info, success, warning, error | 4 |
| Skeleton | paragraph, with avatar | 2 |

| Axis | Values | Count |
|---|---|---|
| Component state | the table above | 45 |
| Ground × substrate | the four of `silverpoint`, plus `cyanotype` × `prussian` | 5 |
| Mode | `ink`, `precision` | 2 |
| Size | `md`; plus `sm` and `lg` for Button, Input and Segmented in their first state (nightly) | — |

**Nightly: 450 state fixtures + 60 size fixtures = 510.** **On every PR: 180** — the 45 states × 2
modes × `silverpoint/cream` and `cyanotype/prussian`. Harness width 320 px, 640 px for Card and
Alert. The totals become 1,782 chart + 90 dashboard + 510 component fixtures nightly.

## §6 Invariants — additions

| # | Invariant | Requirement |
|---|---|---|
| I-17 | For every component state, the layout box of every element and every `--sp-ui-fraction` are equal in `ink` and `precision`. | REQ-306 |
| I-18 | At most one element per component instance carries `part="sp-heighten"`, and it has an ink outline. | REQ-309 |
| I-19 | `ui.css` contains no literal colour: every `color`, `background`, `border-color` and `fill` value is a `var(--sp-…)` or `currentColor`, `transparent`, or a system colour inside `@media (forced-colors: active)`. | REQ-305 |
| I-20 | Every interactive element of every fixture measures at least 24 × 24 CSS px. | REQ-317 |
| I-21 | `uiFrameVariant` is pure and returns an integer in `0..frameVariants − 1`; with neither `seed` nor `id` it returns `0`. | REQ-307 |
| I-22 | Every fraction is in `[0, 1]` with at most 2 decimals. | REQ-002, REQ-324 |

## Constitution check

- **Art. 4** — fixtures carry ids; frame pieces are generated with fixed seeds per variant.
- **Art. 5** — contrast pairs extended to controls and focus; target size as an invariant.
- **Art. 7** — `ui` is a token section; a consumer ground without it still renders.
- **Exception requested:** none.
