# API Spec delta — UI components

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 2, approved 2026-09-28 by Ernesto Crespo, with OQ-U2 (`Sp` prefix), C-1, C-2, C-4, C-6, C-7, A-03 and A-06 of [`analyze.md`](analyze.md) |
| **Amends** | [API Spec](../../specs/api-spec.md) v1.8 → v1.9: §1, §2, §3, §5.1, §6, new §7.2, §8.1–8.3, §9, §10.1–10.3, §11, §12 |
| **SemVer** | `minor` — new subpaths, components, a stylesheet, optional tokens and codes (§13) |

## 1. Packages and entry points (§1)

No new package (DD-021): the components ship inside the existing seven, under one version.

| Package | Subpath | Exports |
|---|---|---|
| `@silverpoint/core` | `@silverpoint/core/ui` (internal surface, §2) and `@silverpoint/core/ui-demos` | `ui/*`: value geometry, keyboard transitions, frame variant, item validation, types below. A subpath of its own, so the charts' entry and its 45 kB budget are unchanged, and the UI runtime is measured apart (REQ-330) |
| `@silverpoint/grounds` | `@silverpoint/grounds/ui.css` | The components' stylesheet: frame and tone pieces per ground, sizes, focus, states (§10.2). Opt-in (REQ-301) |
| `@silverpoint/react` | `@silverpoint/react/ui/<name>` and the barrel `@silverpoint/react/ui` | `SpButton`, `SpInput`, `SpCheckbox`, `SpRadioGroup`, `SpSwitch`, `SpSlider`, `SpRate`, `SpSegmented`, `SpTabs`, `SpTabPanel`, `SpSteps`, `SpCard`, `SpTag`, `SpBadge`, `SpDivider`, `SpProgress`, `SpAlert`, `SpSkeleton` |
| `@silverpoint/vue` | `@silverpoint/vue/ui/<name>` and `@silverpoint/vue/ui` | The same names as React (`SpButton`, `SpTabPanel`, …) |
| `@silverpoint/angular` | `@silverpoint/angular/ui/<name>` (secondary entry points) and `@silverpoint/angular/ui` | `SpButton` (`button[spButton], a[spButton]`), `SpInput` (`input[spInput]`), and `sp-checkbox`, `sp-radio-group`, `sp-switch`, `sp-slider`, `sp-rate`, `sp-segmented`, `sp-tabs`, `sp-tab-panel`, `sp-steps`, `sp-card`, `sp-tag`, `sp-badge`, `sp-divider`, `sp-progress`, `sp-alert`, `sp-skeleton` |

`<name>` is kebab-case: `ui/button`, `ui/radio-group`, `ui/tabs` (which also exports `SpTabPanel`).
Every component is named `Sp<Name>` in the three adapters (OQ-U2, decided 2026-09-28): unlike the
charts, component names such as `Button` and `Input` collide with every application's own, and one
name per component keeps the docs and the parity fixtures adapter-neutral. The component tables
below use the bare `<Name>` for brevity.
The React client boundary (`"use client"`) is set only on components with state or effects:
`SpCard`, `SpTag` (non-closable), `SpBadge`, `SpDivider`, `SpProgress`, `SpAlert` (non-closable) and `SpSkeleton`
are server-safe (REQ-104 extended).

```ts
import '@silverpoint/grounds/styles.css';   // as today
import '@silverpoint/grounds/ui.css';       // once, only if the app uses components
import { SpSegmented } from '@silverpoint/react/ui/segmented';
```

## 2. Types (§3)

```ts
export type UiSize = 'sm' | 'md' | 'lg';

/** Props every component takes (as CommonChartProps does for charts). */
export interface CommonUiProps {
  /** Frame variant and related ids derive from it (REQ-307, REQ-329). */
  id?: string;
  /** Overrides `id` for the frame variant only. */
  seed?: Seed;
  ground?: GroundRef;
  substrate?: SubstrateName;
  mode?: InkMode;
  /** Default `'md'`. */
  size?: UiSize;
  className?: string;
}

/** An item of Tabs, Segmented, RadioGroup (REQ-325: keys unique). */
export interface UiItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export interface StepItem {
  key: string;
  title: string;
  description?: string;
  /** Derived from `current` when omitted; `'error'` must be explicit. */
  status?: 'wait' | 'process' | 'finish' | 'error';
}

/** Button emphasis. Not a tone: `tone` names only a level 1-4 of the ground's ramp (A-07). */
export type UiVariant = 'default' | 'primary' | 'danger';
export type AlertKind = 'info' | 'success' | 'warning' | 'error';
```

### Per-component props (own props, beside `CommonUiProps`)

| Component | Props | Value / events |
|---|---|---|
| **Button** | `variant?: UiVariant` (`default`; `danger` also draws the exact ✕ glyph, REQ-310), `type?: 'button' \| 'submit' \| 'reset'` (`button`), `disabled?`, `label?` (accessible name for icon-only), `block?: boolean`, `href?` (renders `<a>`) | `onClick` / `@click` / `(click)` — native |
| **Input** | `type?: 'text' \| 'search' \| 'email' \| 'url' \| 'tel' \| 'password' \| 'number'`, `placeholder?`, `name?`, `disabled?`, `readOnly?`, `invalid?: boolean` (sets `aria-invalid="true"` and draws the exact ⚠ glyph), `message?: string` (help or error text under the control, `${id}--message`, referenced by `aria-describedby`; REQ-334), `prefix?`/`suffix?` (slots) | value: `string` |
| **Checkbox** | `label`, `name?`, `disabled?`, `indeterminate?: boolean` | value: `boolean` (`checked`) |
| **RadioGroup** | `items: UiItem[]`, `name` (required), `label` (group name), `orientation?: 'horizontal' \| 'vertical'` (`vertical`) | value: `string \| null` (a key) |
| **Switch** | `label`, `name?`, `disabled?` | value: `boolean` |
| **Slider** | `label`, `min?` (`0`), `max?` (`100`), `step?` (`1`), `name?`, `disabled?`, `marks?: number[]` | value: `number` |
| **Rate** | `label`, `count?` (`5`, 1..10; each mark an exact lozenge), `name?`, `disabled?`, `readOnly?` | value: `number` (0..count, integer) |
| **Segmented** | `items: UiItem[]`, `label`, `name?`, `block?` | value: `string` (a key) |
| **Tabs** | `items: UiItem[]`, `label?`, `orientation?` (`horizontal`), `activation?: 'automatic' \| 'manual'` (`automatic`) | value: `string` (the active key); panels are `TabPanel value="key"` children |
| **Steps** | `items: StepItem[]`, `current: number` (0-based), `orientation?` (`horizontal`), `label?` | — (display only in `0.3.0`) |
| **Card** | `title?`, `extra?` (slot), `footer?` (slot), `headingLevel?: 2..6` (`3`) | — |
| **Tag** | `tone?: 1 \| 2 \| 3 \| 4` (tonal level, `1`), `closable?: boolean`, `closeLabel?` (`'Remove'`) | `onClose` / `@close` / `(close)` |
| **Badge** | `count?: number`, `max?` (`99`), `dot?: boolean`, `label?` | — |
| **Divider** | `orientation?` (`horizontal`), `text?`, `align?: 'start' \| 'center' \| 'end'` (`center`) | — |
| **Progress** | `value?: number` (0..100; omitted → indeterminate), `shape?: 'line' \| 'circle'` (`line`), `label` (accessible name), `showValue?` (`true`) | — |
| **Alert** | `kind?: AlertKind` (`info`), `title?`, `closable?`, `closeLabel?` | `onClose` / `@close` / `(close)` |
| **Skeleton** | `lines?` (`3`, 1..8), `avatar?: boolean`, `label?` (`'Loading'`) | — |

**Value binding by framework** (REQ-322):

| | Controlled | Uncontrolled | Change |
|---|---|---|---|
| React | `value` (or `checked` for Checkbox/Switch) | `defaultValue` / `defaultChecked` | `onChange(value)` — the value, not the DOM event |
| Vue | `v-model` (`modelValue`) | omit `v-model`, `default-value` | `update:modelValue`, and `change` after commit (Slider: pointer up / key) |
| Angular | `[(value)]` (`model()` signal), or any forms directive through `ControlValueAccessor` (REQ-323) | `[defaultValue]` | `(valueChange)` |

**Values outside their domain** (Data Model §2.14). A number out of range or off step is clamped
and rounded with `SP017` (REQ-324). An unknown key is not a range error, and is corrected silently: RadioGroup falls back to `null`, Segmented and Tabs to their first enabled key, with no
diagnostic — a key that disappears from `items` is an ordinary state of dynamic data (A-06).

### Core internal surface (§2)

```ts
/** 0..variants-1, from seed ?? id ?? 0 (REQ-307). Pure. */
export function uiFrameVariant(seed: Seed | undefined, id: string | undefined, variants: number): number;

/** Box, slice and radius of each frame kind, the geometry the grounds build cuts (DD-022). */
export const UI_FRAME_KINDS: Record<UiFrameKind, { size: number; slice: number; radius: number }>;

/**
 * Exact outline of a frame kind, the input the grounds build inks into pieces (DD-022). Build time
 * only. One `ornament` stroke: a frame carries no value, so the ground's inker may draw it, with
 * its vertices preserved (Art. 1 as amended).
 */
export function uiFrameOutline(kind: UiFrameKind): Geometry;

/**
 * Value → exact fraction in [0, 1], 2 decimals, after clamping and step rounding (REQ-324).
 * Without `step` the value is only clamped (Progress). `component` names the `SP017` warning.
 */
export function uiValue(value: number, range: { min: number; max: number; step?: number }, component?: string): { value: number; fraction: number; corrected: boolean };

/** A Rate's `count`: integer in 1..10, default 5; corrected with `SP017`. */
export function uiRateCount(count: number | undefined, component?: string): number;

/** Circle progress: the exact arc of the existing polar engine, in a 100 × 100 view box. */
export function uiProgressArc(fraction: number, stroke: number): { track: Stroke; fill: Stroke };  // both `role: 'encoding'`

/** Steps: status per item, and the status of the connector after it —that of the step it leads to (C-4); `null` after the last. */
export function uiSteps(items: readonly StepItem[], current: number, component?: string): readonly { key: string; status: StepStatus; connector: StepStatus | null }[];

/** WAI-ARIA APG transitions for roving focus (REQ-315). Pure. */
export function uiRovingKey(
  state: { index: number; count: number; disabled: readonly boolean[] },
  key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End',
  orientation: 'horizontal' | 'vertical',
  dir: 'ltr' | 'rtl',
): number;

/** Keeps the first of each key, skips the rest and any empty key (REQ-325, SP019). */
export function uiItems<T extends { key: string }>(items: readonly T[], component: string): readonly T[];

/** Accessible-name check (REQ-319, SP018). */
export function uiRequireName(component: string, text: string | undefined, label: string | undefined): void;
```

**Framework-neutral props and demos.** The core also declares each component's own props as
`Sp<Name>Props` (value binding and slots excepted, being each adapter's idiom), the catalog
`UI_COMPONENTS` (17 rows: name, slug, component, group, states), and, on the subpath
`@silverpoint/core/ui-demos` so no application ships them, the frozen `UI_DEMOS` (Data Model §4).

## 3. Default values (§5.1) — additions

| Prop | Default | Note |
|---|---|---|
| `size` | `'md'` | Heights from the ground's `ui.controlHeight` (Data Model §3.8) |
| `mode` | from provider, else `'ink'` | `precision` forced by REQ-123, after resolution |
| Frame variant | `0` without `seed` and `id` | So an anonymous component renders the same in every adapter |

**Resolution precedence** (REQ-311) is the charts' own: component prop → dashboard → provider →
library default, with the media-query `precision` override applied after resolution. A component
inside a dashboard cell reads the dashboard's configuration exactly as a chart does; it gets no cell
box (a component sizes to its content).

## 4. §7.2 UI component catalog (new)

### Markup contract (normative; parity is checked on it, REQ-327)

Every component root carries `class="sp-ui sp-<name>"`, `data-ground`, `data-substrate`,
`data-mode`, `data-size` and, when inked, `data-frame="0..3"`. Drawn pieces are `aria-hidden`
elements with a `part`:

| Component | Root | Native / semantic core | Drawn parts |
|---|---|---|---|
| Button | `<button>` (or `<a>` with `href`) | itself | `sp-frame`, `sp-tone` (for `primary`/`danger`), `sp-mark` (✕ glyph, exact, for `danger`) |
| Input | `<span class="sp-ui sp-input">` | `<input>` (`aria-invalid`, `aria-describedby` when `message`), then `<span id="${id}--message">` | `sp-frame`, `sp-mark` (⚠ glyph, exact, when `invalid`) |
| Checkbox | `<label>` | `<input type="checkbox">` visually hidden | `sp-frame` (box), `sp-mark` (tick or dash, exact), `sp-tone` |
| RadioGroup | `<fieldset>` + `<legend>` | `<input type="radio">` per item | per item `sp-frame`, `sp-mark` (dot, exact) |
| Switch | `<label>` | `<input type="checkbox" role="switch">` | `sp-frame` (track), `sp-knob` (exact), `sp-tone` |
| Slider | `<label>` | `<input type="range">` over the drawing | `sp-track`, `sp-fill` (exact length), `sp-thumb` (exact, heightened), `sp-mark` |
| Rate | `<fieldset>` | `<input type="radio">` per value 1..count | per item `sp-mark` (exact lozenge), `sp-tone` when filled |
| Segmented | `<fieldset>` | `<input type="radio">` per item | `sp-frame`, `sp-tone` + `sp-heighten` on the selected |
| Tabs | `<div>` | `role="tablist"` of `<button role="tab">`, `role="tabpanel"` | `sp-rule`, `sp-heighten` on the active tab |
| Steps | `<ol>` | `<li aria-current="step">` on current | `sp-mark` per step (exact), `sp-connector` (exact) with `data-status` (`wait` connectors are dashed, the others solid), `sp-heighten` on current |
| Card | `<article>` (`<section>` without title) | heading at `headingLevel` | `sp-frame`, `sp-rule` under header |
| Tag | `<span>` | close `<button>` when closable | `sp-frame`, `sp-tone` |
| Badge | `<span>` | count as text | `sp-frame` |
| Divider | `<div role="separator">` | — | `sp-rule` |
| Progress | `<div role="progressbar">` | — | `sp-track`, `sp-fill` (exact), value text |
| Alert | `<div role="alert|status">` | close `<button>` when closable | `sp-frame`, `sp-mark` (kind glyph: i, ✓, ⚠, ✕; exact), `sp-tone` for `error` only (ground `ui.tone.alertError`) |
| Skeleton | `<div aria-busy="true">` | a visually-hidden label | `sp-tone` blocks, `aria-hidden` |

Rules: no framework comments or empty text nodes in the emitted markup (DD-017's rule); element
order is reading order; ids are `${id}--${part}` (REQ-329).

**`ink` and `precision`** emit the same elements; only `data-mode` differs.
In `precision` the frame becomes an exact border and the tone is unchanged (DD-022, C-7): hatch
tiles, or line weights under a `weight` ground, stay, since tone is value, not ornament.

## 5. API by adapter (§8) — additions

- **React (§8.1):** function components; `forwardRef` to the native element (Button, Input and the
  hidden inputs); `onChange` receives the value. `Tabs` renders `TabPanel` children matched by
  `value`.
- **Angular (§8.2):** standalone, signal inputs, `OnPush`, zoneless-safe (REQ-101). Value components
  expose `value = model<T>()` and implement `ControlValueAccessor` (REQ-323). `SpButton` and
  `SpInput` are attribute components on the consumer's native element, so the host is the native
  control (DD-024).
- **Vue (§8.3):** `<script setup>` with typed props and emits (REQ-108), `defineModel` for the value,
  slots for `prefix`, `suffix`, `extra`, `footer`.

## 6. Events and interaction (§9) — additions

Value events fire only on user input, never on a prop change, and never for a disabled component or
item (REQ-326). Composite keyboard transitions come from `uiRovingKey` (REQ-315); `Tabs` with
`activation="automatic"` selects on focus move, `manual` on Enter/Space.

## 7. DOM and CSS contract (§10) — additions

### 10.1 `part` attributes — new values

`sp-frame`, `sp-tone`, `sp-mark`, `sp-knob`, `sp-track`, `sp-fill`, `sp-thumb`, `sp-connector`;
`sp-rule` and `sp-heighten` keep their meaning.

### 10.2 Public CSS custom properties — new

| Property | Default (from the ground's `ui` tokens) | |
|---|---|---|
| `--sp-ui-height-sm` / `-md` / `-lg` | 24 / 32 / 40 px | Control heights (≥ 24 px, REQ-317) |
| `--sp-ui-radius` | ground `ui.radius` | Frame corner radius in `precision` |
| `--sp-ui-focus-width` | 2 px | REQ-316 |
| `--sp-ui-focus-color` | `var(--sp-ink)` | Must keep 3:1 (REQ-313) |
| `--sp-ui-gap` | 8 px | Spacing inside composites |

### 10.3 Accessibility contract — additions

As in REQ-314..REQ-320, REQ-334 and the markup table above. The drawing never takes focus and never
carries a name; the native or semantic element does.

Parity holds for the markup the library emits. With the Angular attribute components (DD-024)
the host is the consumer's own `<button>` or `<input>`: attributes the consumer adds to it are
theirs, outside the contract and outside the gate (A-03).

## 8. Catalog of errors and warnings (§11) — additions

| Code | Severity | Requirement | Condition |
|---|---|---|---|
| `SP017` | warn | REQ-324 | A Slider, Rate or Progress value or a Steps `current` is out of range or off step, or a Slider/Rate range is invalid; clamped, rounded or defaulted |
| `SP018` | warn | REQ-319 | An `SpButton` or `SpBadge` has no accessible name (no text, no `label`) |
| `SP019` | warn | REQ-325 | Items of a Tabs, Segmented, RadioGroup or Steps share a key; later ones skipped |

`SP002` keeps its meaning for charts and is not reused (each diagnostic names its own REQ).

## 9. Limits and budgets (§12) — additions

| Limit | `0.x` value | Behaviour on exceeding it |
|---|---|---|
| One component's subpath over the shared UI runtime | 3 KB min+gzip | CI fails (REQ-330) |
| Shared UI runtime (core `ui/*` + adapter base), per adapter | 8 KB min+gzip | CI fails (REQ-330) |
| `@silverpoint/grounds/ui.css` | 24 KB gzip | CI fails (REQ-330) |
| Items per Tabs / Segmented / RadioGroup / Steps | 12 (advisory) | No diagnostic; documented |
| Keyboard transition in the core | 0.05 ms | The CI benchmark fails |

## Constitution check

- **Art. 2** — every function above is in the core; adapters bind props and events.
- **Art. 3** — the markup contract of §4 is what the gate compares.
- **Art. 4** — `uiFrameVariant` and the id rule; no framework id hook in emitted ids.
- **Art. 5** — native controls, roles, APG keyboard, exact focus.
- **Art. 8** — no dependency added; `ui.css` opt-in; budgets.
- **Exception requested:** none.
