# silverpoint — API Specification

## Metadata

| Field | Value |
|---|---|
| **Author** | Ernesto Crespo |
| **Status** | `IN_REVIEW` |
| **API version** | v1.9 |
| **Date** | 2026-09-29 |
| **Related PRD** | [`prd.md`](prd.md) v1.11 |
| **Applicable Constitution** | [`constitution.md`](constitution.md) v1.7 |
| **Surface** | npm packages — there is no network API |

---

## 0. Template adaptation note

The API Spec template assumes an HTTP service. silverpoint is a client library, so each
section is carried over to its equivalent and the correspondence is written down here, so
that the Analyze gate does not read it as an omission:

| Original section | Equivalent here |
|---|---|
| Base URL | Packages and *entry points* (§1) |
| Authentication and roles | Not applicable — replaced by public versus internal surface (§2) |
| Response format | Shared types and naming conventions (§3, §4) |
| Error codes | Catalog of errors and warnings with a stable code (§11) |
| Endpoints | Components and their props (§5 through §8) |
| Pagination | Not applicable |
| Webhooks | Events and interaction (§9) |
| Rate limiting | Limits and budgets (§12) |
| Versioning | SemVer and deprecation policy (§13) |

## 1. Packages and entry points

| Package | Contents | Dependencies |
|---|---|---|
| `@silverpoint/core` | Geometry, scales, interaction, the `Inker` interface, types; the UI components' framework-neutral surface under `/ui` and `/ui-demos` (§1.2) | `d3-scale`, `d3-shape` and the ribbon generator (§8.4) |
| `@silverpoint/grounds` | Declarative style tokens, the `styles.css` sheet and the opt-in `ui.css` sheet (§1.2) | `@silverpoint/core` |
| `@silverpoint/react` | React components: charts, the dashboard and the UI components (§1.2) | `peer`: `react`, `react-dom` |
| `@silverpoint/angular` | Standalone components, in Angular Package Format | `peer`: `@angular/core`, `@angular/common`, `@angular/forms` (UI components, REQ-323) |
| `@silverpoint/vue` | Vue 3 components authored with `<script setup>`: charts, the dashboard and the UI components | `peer`: `vue` |
| `@silverpoint/fonts` | **Optional.** Self-hosted EB Garamond (400, 500 and 400 italic) plus its `@font-face` rules | none |
| `@silverpoint/tailwind` | **Optional.** A Tailwind preset naming the public `--sp-` variables as theme tokens (§10.4, REQ-047) | none, not even a peer |

Every chart is importable by subpath, so that an app using one does not drag in all 33
(REQ-107):

```ts
import { LineChart } from '@silverpoint/react';            // barrel
import { LineChart } from '@silverpoint/react/line-chart';  // subpath
import '@silverpoint/grounds/styles.css';                   // once only, in the app
```

The dashboard composition (§7.1) follows the same rule, under a `dashboard` subpath in each
adapter: `@silverpoint/react/dashboard` (and `/server/dashboard`), `@silverpoint/vue/dashboard`,
`@silverpoint/angular/dashboard`. It ships inside the existing packages; there is no dashboard
package.

### 1.1 Consuming under a bundler

The three frameworks are React, Angular and Vue. The bundlers that host them are validated
separately, because that is where package resolution actually breaks. Vite is the default
host for both the React and the Vue example apps, and runs underneath the Angular CLI.

| Host | Guarantee | Requirement |
|---|---|---|
| Vite | Every subpath resolves identically in the dev server and in the production build, with no `optimizeDeps` entry required | REQ-033 |
| Vite, Next.js, any bundler | The stylesheet import survives tree-shaking: packages declare `sideEffects: false` **except** for `.css`, so `import '@silverpoint/grounds/styles.css'` is never dropped | REQ-034 |
| Next.js | Server-rendered markup hydrates with no mismatch | REQ-103 |

If a consumer ever needs an `optimizeDeps.include` entry to make an import work, that is a
defect in this package, not a configuration step for them to discover.

In Angular the subpath is a secondary entry point per APF:

```ts
import { SpLineChart } from '@silverpoint/angular/line-chart';
```

In Vue the subpath mirrors React's:

```ts
import { SpLineChart } from '@silverpoint/vue/line-chart';
```

### 1.2 UI components (feature-002)

No new package (DD-021): the 17 components ship inside the existing seven, under one version.

| Package | Subpath | Exports |
|---|---|---|
| `@silverpoint/core` | `@silverpoint/core/ui` (internal surface, §2.1) and `@silverpoint/core/ui-demos` | `ui/*`: value geometry, keyboard transitions, frame variant, item validation, the `ui*View` trees, types (§3.3). A subpath of its own, so the charts' entry and its 45 kB budget are unchanged, and the UI runtime is measured apart (REQ-330) |
| `@silverpoint/grounds` | `@silverpoint/grounds/ui.css` | The components' stylesheet: frame and tone pieces per ground, sizes, focus, states (§10.2). Opt-in (REQ-301) |
| `@silverpoint/react` | `@silverpoint/react/ui/<name>` and the barrel `@silverpoint/react/ui`; `@silverpoint/react/server/ui/<name>` | `SpButton`, `SpInput`, `SpCheckbox`, `SpRadioGroup`, `SpSwitch`, `SpSlider`, `SpRate`, `SpSegmented`, `SpTabs`, `SpTabPanel`, `SpSteps`, `SpCard`, `SpTag`, `SpBadge`, `SpDivider`, `SpProgress`, `SpAlert`, `SpSkeleton` |
| `@silverpoint/vue` | `@silverpoint/vue/ui/<name>` and `@silverpoint/vue/ui` | The same names as React (`SpButton`, `SpTabPanel`, …) |
| `@silverpoint/angular` | `@silverpoint/angular/ui/<name>` (secondary entry points) and `@silverpoint/angular/ui`; the providers, tokens and environment signals in `@silverpoint/angular/env` | `SpButton` (`button[spButton], a[spButton]`) and the elements `sp-input`, `sp-checkbox`, `sp-radio-group`, `sp-switch`, `sp-slider`, `sp-rate`, `sp-segmented`, `sp-tabs`, `sp-tab-panel`, `sp-steps`, `sp-card`, `sp-tag`, `sp-badge`, `sp-divider`, `sp-progress`, `sp-alert`, `sp-skeleton` |

That is 17 components and 18 exported names (`SpTabPanel` is part of Tabs). `<name>` is kebab-case:
`ui/button`, `ui/radio-group`, `ui/tabs` (which also exports `SpTabPanel`).

Every component is named `Sp<Name>` in the three adapters (OQ-U2): unlike the charts, component
names such as `Button` and `Input` collide with every application's own, and one name per component
keeps the docs and the parity fixtures adapter-neutral. The component tables below use the bare
`<Name>` for brevity.

The React client boundary (`"use client"`) is set only on components with state or effects.
Display components render in Server Components from `@silverpoint/react/server/ui/<name>` (props
and dashboard cell only, as the charts' server entries do): `card`, `tag`, `badge`, `divider`,
`progress`, `alert`, `skeleton` and `steps`. The server `Tag` and `Alert` take no `closable`.
`ui/<name>` are client entries that read the provider (REQ-104 extended).

Angular: `@angular/forms` is a peer, for `ControlValueAccessor` (REQ-323). The providers, tokens
and environment signals live in the secondary entry `@silverpoint/angular/env`,
which the main entry re-exports, so a UI component does not carry the charts' render pipeline
(REQ-330).

```ts
import '@silverpoint/grounds/styles.css';   // as today
import '@silverpoint/grounds/ui.css';       // once, only if the app uses components
import { SpSegmented } from '@silverpoint/react/ui/segmented';
```

## 2. Public versus internal surface

**Public** —subject to SemVer—: component names and selectors, props and inputs, the
types exported in §3, the ground token schema (§6), the CSS custom properties of §10, the
error codes of §11 and the subpath names; for the UI components (§7.2), the `Sp<Name>` names and selectors, their props, the markup contract and `part` names, and `@silverpoint/grounds/ui.css`.

**Internal** —may change in a minor version—: the shape of the `Geometry` objects the core
returns, the implementation of each `Inker`, the structure of the SVG DOM except for the
`part` attributes documented in §10, and any symbol exported under the `__` prefix. The whole of `@silverpoint/core/ui` (§2.1) is internal: adapters consume it, applications do not.

THE SYSTEM marks internals with `@internal` in TSDoc and excludes them from the public
`.d.ts`.

### 2.1 UI core surface (`@silverpoint/core/ui`)

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

/** A ground's `ui` tokens or the defaults, held to their domain; a `weight` ground's frame is always `css` (REQ-312). */
export function resolveUiTokens(ground: Ground): UiTokens;

/** Seamless tone tile layers for one ramp step: one for hachure, two for cross-hatch, none for weight (DD-022). Build time only. */
export function uiToneTile(spec: ToneSpec): readonly { width: number; height: number; strokes: readonly Stroke[] }[];

/** Accessible-name check (REQ-319, SP018). */
export function uiRequireName(component: string, text: string | undefined, label: string | undefined): void;
```

The surface added during implementation:

```ts
/** Fallbacks of Data Model §2.14: the selected key of a Tabs/Segmented ('first') or RadioGroup ('none'). */
export function uiSelectedKey(items: readonly UiItem[], value: string | null | undefined, fallback: 'none' | 'first'): string | null;

/** Validates a Slider/Rate range once, so it warns SP017 once. */
export function uiRange(range: { min: number; max: number; step?: number }, component?: string): { min: number; max: number; step?: number };  // invalid → 0..100 step 1, SP017

/** Whether a key moves a roving focus. */
export function uiIsRovingKey(key: string): key is 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';

/**
 * The DOM side of REQ-315: finds the items under `root` by `selector`, reads `dir` from the nearest
 * ancestor, moves focus and, when `activate`, clicks the new item. Structural types: the core takes
 * no DOM library. The three adapters call it.
 */
export function uiRovingFocus(event: { readonly key: string; preventDefault(): void }, root: UiRovingRoot, selector: string, orientation: UiOrientation | 'both', activate: boolean): void;
```

- `uiSteps` also flags the current step.
- A view element's `bind` is `native` or `close`.
- The `ui*View` trees (`uiButtonView`, `uiInputView`, …) are the markup contract of §7.2 as data:
  every attribute, text and node an adapter writes. The canonical render of a fixture is that tree,
  written by a reference writer (`tools/visual-gate/ui-canonical.ts`).

## 3. Shared types

```ts
/** A row of data. Charts reach its fields through accessors. */
export type Datum = Readonly<Record<string, unknown>>;

/** Access to a field: key name or pure function. */
export type Accessor<T = number> = string | ((d: Datum, i: number) => T);

/** Inking mode. `precision` amounts to using NullInker (REQ-021). */
export type InkMode = 'ink' | 'precision';

/** Seed. A string is converted to an integer stably (REQ-003). */
export type Seed = number | string;

/** Name of a registered ground, or a complete ground. */
export type GroundRef = GroundName | Ground;

/** Prepared substrates of the silverpoint ground (REQ-046). */
export type SubstrateName = 'cream' | 'green' | 'blue' | 'ochre';

/** Active item resolved by the interaction engine (REQ-140). */
export interface ActiveItem {
  readonly seriesKey: string;
  readonly index: number;
  readonly datum: Datum;
  readonly value: number;
  /** Coordinates in SVG space, not screen space. */
  readonly point: Readonly<{ x: number; y: number }>;
}
```

### 3.1 Geometry output

```ts
/** Stroke instruction. It carries no color: color comes from CSS (REQ-042). */
export interface Stroke {
  /** SVG path data, already rounded to 2 decimals (REQ-002). */
  readonly d: string;
  /** What this stroke is. Determines whether the Inker may touch it (REQ-022). */
  readonly role: 'encoding' | 'ornament' | 'hatch';
  /** Semantic paint slot; maps to a CSS variable in §10. */
  readonly part: StrokePart;
  /** Relative weight, resolved against the ground's token. */
  readonly weight?: number;
}

export type StrokePart =
  | 'ink' | 'ink-secondary' | 'heighten' | 'rule' | 'grid' | 'axis';

/** Everything a chart needs in order to draw itself. Serializable (REQ-011). */
export interface Geometry {
  readonly viewBox: Readonly<{ x: number; y: number; width: number; height: number }>;
  readonly strokes: readonly Stroke[];
  readonly labels: readonly TextLabel[];
  readonly hitAreas: readonly HitArea[];
}
```

> **Design decision.** `Stroke` carries no color as a direct consequence of Art. 8: since
> theming goes through CSS custom properties and in SVG `stroke="var(--x)"` does **not**
> resolve as a presentation attribute, color is applied by CSS from the `part` attribute.
> The `Inker` emits shape, never paint.

### 3.2 The `Inker` interface

```ts
export interface Inker {
  readonly name: string;
  /** Receives exact geometry and returns the inked geometry. */
  ink(geometry: Geometry, options: InkOptions): Geometry;
}

export interface InkOptions {
  readonly seed: number;
  readonly roughness: number;
  readonly bowing: number;
  readonly hatchAngle: number;
  readonly hatchGap: number;
  readonly fillWeight: number;
  /** Upper bound of nodes the Inker must not exceed. */
  readonly nodeBudget: number;
}

/** Returns the geometry untouched. `precision` mode is exactly this. */
export declare const NullInker: Inker;
```

An `Inker` SHALL honour two invariants, verified by test: it does not alter any `Stroke`
whose `role` is `'encoding'` beyond its intermediate path —the endpoints are preserved—
and it does not emit a `part` different from the one it received.

### 3.3 UI component types (feature-002)

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

The status of one Steps item, `StepStatus`, is `'wait' | 'process' | 'finish' | 'error'`; a frame kind, `UiFrameKind`, is `'control' | 'pill' | 'box' | 'card' | 'round'`.

#### Per-component props (own props, beside `CommonUiProps`)

| Component | Props | Value / events |
|---|---|---|
| **Button** | `variant?: UiVariant` (`default`; `danger` also draws the exact ✕ glyph, REQ-310), `type?: 'button' \| 'submit' \| 'reset'` (`button`), `disabled?`, `label?` (accessible name for icon-only), `block?: boolean`, `href?` (renders `<a>`) | `onClick` / `@click` / `(click)` — native |
| **Input** | `label?` (its accessible name, when no `<label for>` names it), `type?: 'text' \| 'search' \| 'email' \| 'url' \| 'tel' \| 'password' \| 'number'`, `placeholder?`, `name?`, `disabled?`, `readOnly?`, `invalid?: boolean` (sets `aria-invalid="true"` and draws the exact ⚠ glyph), `message?: string` (help or error text under the control, `${id}--message`, referenced by `aria-describedby`; REQ-334), `prefix?`/`suffix?` (slots) | value: `string` |
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

## 4. Naming conventions

| Scope | Convention | Example |
|---|---|---|
| React component | `PascalCase`, no prefix | `<LineChart>` |
| Angular selector | `sp-` plus `kebab-case` | `<sp-line-chart>` |
| Vue component | `Sp` plus `PascalCase`; `sp-` plus `kebab-case` in in-DOM templates | `<SpLineChart>` |
| Props and inputs | `camelCase`, identical across all three adapters | `valueKey` |
| Accessors | `Key` suffix when they accept a string | `xKey`, `valueKey` |
| Subpath | `kebab-case` of the component | `@silverpoint/react/line-chart` |
| CSS custom property | `--sp-` plus `kebab-case` | `--sp-ink-secondary` |
| Part attribute | `part="sp-<part>"` | `part="sp-heighten"` |
| Diagnostic code | `SP` plus three digits | `SP001` |

Prop names are **identical** across React, Angular and Vue. It is a maintenance requirement:
the documentation is a single one, and the Art. 3 gate compares two trees that can only
match if the input is the same.

## 5. Props common to every chart

Present in all 33 charts, with identical names across React, Vue and Angular (REQ-094).

```ts
export interface CommonChartProps {
  /**
   * Rows to draw. If omitted, the demo dataset is rendered (REQ-093): accessor props
   * (`…Key`, `keys`, `names`) are ignored, every other prop applies (REQ-098).
   */
  data?: readonly Datum[];

  /** Style ground. Defaults to the app provider's, or `silverpoint`. */
  ground?: GroundRef;
  /** Prepared substrate within the ground (REQ-046). */
  substrate?: SubstrateName;
  /** `ink` by default; `precision` disables inking (REQ-021). */
  mode?: InkMode;
  /** Seed. If omitted, it is derived from `id` stably (REQ-003). */
  seed?: Seed;

  /** Stable identifier. If omitted, it is generated deterministically. */
  id?: string;
  /** Height of the drawing area in px. Width is the container's unless pinned. */
  height?: number;
  width?: number;

  /** `card` draws the full frame; `bare` only the drawing area (REQ-095). */
  chrome?: 'card' | 'bare';
  /**
   * How areas are filled (REQ-029).
   * `tile` shares one hatch tile per tonal level: it is the default and the one that
   * keeps weight bounded. `per-shape` traces the hatching shape by shape, with more
   * variation and much more weight; meant for a hero chart or for export.
   */
  hatchFill?: 'tile' | 'per-shape';
  title?: string;
  badge?: string;
  value?: string | number;
  unit?: string;
  footerLeft?: string;
  footerRight?: string;

  /** Accessible name. If omitted, it is derived from `title` (REQ-120). */
  label?: string;
  /** Long description for screen readers (REQ-120). */
  description?: string;
  /** Tabular alternative; `hidden` leaves it for assistive technology only (REQ-121). */
  dataTable?: 'visible' | 'hidden' | 'none';

  locale?: string;
  numberFormat?: Intl.NumberFormatOptions;

  className?: string;
}
```

### 5.1 Default values

Part of the contract: changing them observably is a *major* change (§13).

| Prop | Default | Note |
|---|---|---|
| `ground` | `'silverpoint'` | Or the application provider's, if there is one |
| `substrate` | `'cream'` | |
| `mode` | `'ink'` | Unless the media query forces `precision` |
| `seed` | derived from `id` | Stable across renders (REQ-003) |
| `id` | generated deterministically | From the chart name and its mount position |
| `chrome` | `'card'` | |
| `hatchFill` | `'tile'` | `'per-shape'` multiplies path weight by a factor of 10 to 40 |
| `dataTable` | `'hidden'` | Present for assistive technology, visually hidden |
| `height` | `160` | Drawing area, without the frame |
| `width` | container width | Except in the server entry points, where it is mandatory |
| `locale` | the provider's, else `'en'` | Identical on server and client, so hydration matches; pass `navigator.language` to the provider to follow the browser |
| `curve` | `'monotone'` | Line and area charts |
| `orientation` | `'columns'` | `BarChart` |
| `series` | `'all'` | `LineChart` |
| `showLine` | `true` | `ComposedChart` |
| `stacked` | `false` | `StreamChart` |
| `legend` | `true` | `DonutChart` |
| `sizeRange` | `[60, 240]` | `ScatterChart`; `[100, 500]` in `BubbleChart` |

UI components add (`CommonUiProps`, §3.3):

| Prop | Default | Note |
|---|---|---|
| `size` | `'md'` | Heights from the ground's `ui.controlHeight` (Data Model §3.8) |
| `mode` | from provider, else `'ink'` | `precision` forced by REQ-123, after resolution |
| Frame variant | `0` without `seed` and `id` | So an anonymous component renders the same in every adapter |

The **resolution precedence** below (REQ-311) is the charts' own: component prop → dashboard → provider →
library default, with the media-query `precision` override applied after resolution. A component
inside a dashboard cell reads the dashboard's configuration exactly as a chart does; it gets no cell
box (a component sizes to its content).

**Resolution precedence** for `ground`, `substrate`, `mode` and `locale`, highest to lowest:
chart prop → dashboard (§7.1) → application provider (§8.1, §8.2) → library default value.
The media query forcing `precision` (REQ-123) is **not a level in that chain**: it is an
override applied after resolution, so no prop, dashboard or provider can undo it. It is an
accessibility requirement, not a preference.

## 6. Token schema of a ground

```ts
export interface Ground {
  readonly name: string;
  /** How it builds tonal value. `wash` is the anticipated exception to Art. 6. */
  readonly tonalMechanism: 'hatch' | 'weight' | 'wash';
  /** Name of the registered Inker that inks it. */
  readonly inker: string;

  readonly substrates: Readonly<Record<string, string>>;
  readonly ink: Readonly<{
    primary: string;
    secondary: string;
    heighten: string;
    rule: string;
    grid: string;
    text: string;
    textMuted: string;
  }>;

  readonly inkOptions: Omit<InkOptions, 'seed' | 'nodeBudget'>;
  /** Hatch density bound, to stay within the node budget. */
  readonly maxHatchDensity: number;
  /** Tonal levels 1-4: hatch steps under `hatch`, stroke-width multipliers under `weight`. */
  readonly tonalRamp: Readonly<Record<1 | 2 | 3 | 4, ToneSpec>>;

  readonly typography: Readonly<{ display: string; mono: string; scale: number }>;
  /** What to draw when there is no data (REQ-007). */
  readonly emptyState: Readonly<{ text: string; rule: boolean }>;
  /** Expansion of degenerate domains (REQ-010). */
  readonly domainPadding: number;
  /** Tokens of the UI components (Data Model §3.8); optional, defaults apply. */
  readonly ui?: UiTokens;
}

export interface UiTokens {
  /** `inked`: build-time pieces laid as masks (DD-022). `css`: an exact border. */
  readonly frame: 'inked' | 'css';
  /** Frame variants generated per kind, 1..6. */
  readonly frameVariants: number;
  /** Control heights in px per size, each ≥ 24 (REQ-317). */
  readonly controlHeight: Readonly<{ sm: number; md: number; lg: number }>;
  /** Corner radius of the exact frame (`precision`, `css`), px. */
  readonly radius: number;
  /** Focus indicator width, px, ≥ 2 (REQ-316). */
  readonly focusWidth: number;
  /** Tonal level per state (DD-026); `alertError` fills an error Alert's box. */
  readonly tone: Readonly<{ selected: ToneStep; primary: ToneStep; danger: ToneStep; disabled: ToneStep; alertError: ToneStep }>;
}
```

```ts
export type ToneSpec =
  | { readonly style: 'hachure' | 'cross-hatch'; readonly gap: number; readonly angle: number }
  /** A `weight` ground: the stroke width of a toned shape's outline, times `--sp-stroke-width`. */
  | { readonly style: 'weight'; readonly weight: number };
```

**Built-in grounds.** `@silverpoint/grounds` registers two, and exports both with their inkers:

| Ground | `tonalMechanism` | Inker | Substrates | Data Model |
|---|---|---|---|---|
| `silverpoint` (default) | `hatch` | `RoughInker` (`'rough'`) | `cream`, `green`, `blue`, `ochre` | §3.1–§3.6 |
| `cyanotype` | `weight` | `WeightInker` (`'weight'`) | `prussian` | §3.7 |

A ground with a single substrate paints it whatever `substrate` names, so `ground="cyanotype"`
needs no `substrate`.

Registering a ground is a declarative call, and it does not touch the code of any chart
(REQ-044):

```ts
import { registerGround } from '@silverpoint/grounds';
registerGround(myGround);
```

## 7. Component catalog

The 33 charts. The `REQ` column is the traceability back to the PRD. All of them accept
`CommonChartProps` in addition to their own props.

| REQ | React | Vue | Angular selector | Own props |
|---|---|---|---|---|
| REQ-060 | `LineChart` | `SpLineChart` | `sp-line-chart` | `xKey`, `valueKey`, `secondaryKey?`, `curve`, `series` |
| REQ-061 | `StepChart` | `SpStepChart` | `sp-step-chart` | `xKey`, `valueKey`, `step: 'after' \| 'before' \| 'middle'` |
| REQ-062 | `SparklineRows` | `SpSparklineRows` | `sp-sparkline-rows` | `rows`, `nameKey`, `readoutKey`, `seriesKey`, `pointKey` |
| REQ-063 | `KpiCard` | `SpKpiCard` | `sp-kpi-card` | `valueKey`, `metric`, `delta`, `deltaTone` |
| REQ-064 | `BarChart` | `SpBarChart` | `sp-bar-chart` | `xKey`, `valueKey`, `secondaryKey?`, `orientation: 'columns' \| 'rows'` |
| REQ-065 | `StackedBarChart` | `SpStackedBarChart` | `sp-stacked-bar-chart` | `xKey`, `keys`, `names?` |
| REQ-066 | `ComposedChart` | `SpComposedChart` | `sp-composed-chart` | `xKey`, `barKey`, `lineKey`, `showLine` |
| REQ-067 | `WaterfallChart` | `SpWaterfallChart` | `sp-waterfall-chart` | `stepKey`, `baseKey`, `deltaKey` |
| REQ-068 | `FunnelChart` | `SpFunnelChart` | `sp-funnel-chart` | `stageKey`, `valueKey` |
| REQ-069 | `BulletChart` | `SpBulletChart` | `sp-bullet-chart` | `titleKey`, `actualKey`, `targetKey` |
| REQ-070 | `PyramidChart` | `SpPyramidChart` | `sp-pyramid-chart` | `labelKey`, `widthKey`, `toneKey?` |
| REQ-071 | `CandlestickChart` | `SpCandlestickChart` | `sp-candlestick-chart` | `timeKey`, `openKey`, `highKey`, `lowKey`, `closeKey`, `bounds?` |
| REQ-072 | `AreaChart` | `SpAreaChart` | `sp-area-chart` | `xKey`, `valueKey`, `curve` |
| REQ-073 | `RangeBandChart` | `SpRangeBandChart` | `sp-range-band-chart` | `xKey`, `lowKey`, `highKey` |
| REQ-074 | `StreamChart` | `SpStreamChart` | `sp-stream-chart` | `xKey`, `keys`, `stacked` |
| REQ-075 | `DonutChart` | `SpDonutChart` | `sp-donut-chart` | `nameKey`, `valueKey`, `centerValue?`, `centerLabel?`, `legend` |
| REQ-076 | `RadarChart` | `SpRadarChart` | `sp-radar-chart` | `subjectKey`, `valueKey`, `domain` |
| REQ-077 | `PolarBarChart` | `SpPolarBarChart` | `sp-polar-bar-chart` | `nameKey`, `valueKey` |
| REQ-078 | `RadialArcGroup` | `SpRadialArcGroup` | `sp-radial-arc-group` | `nameKey`, `valueKey` |
| REQ-079 | `RadialRings` | `SpRadialRings` | `sp-radial-rings` | `nameKey`, `valueKey` |
| REQ-080 | `GaugeArc` | `SpGaugeArc` | `sp-gauge-arc` | `percent`, `caption?`, `readout?` |
| REQ-081 | `MeterChart` | `SpMeterChart` | `sp-meter-chart` | `percent`, `caption?`, `readout?` |
| REQ-082 | `ScatterChart` | `SpScatterChart` | `sp-scatter-chart` | `xKey`, `yKey`, `sizeKey?`, `sizeRange` |
| REQ-083 | `BubbleChart` | `SpBubbleChart` | `sp-bubble-chart` | `xKey`, `yKey`, `sizeKey`, `sizeRange` |
| REQ-084 | `HeatmapChart` | `SpHeatmapChart` | `sp-heatmap-chart` | `labelKey`, `valuesKey`, `scaleMax`, `columnLabels?` |
| REQ-085 | `TreemapChart` | `SpTreemapChart` | `sp-treemap-chart` | `labelKey`, `shareKey`, `columns`, `rows` |
| REQ-086 | `SankeyChart` | `SpSankeyChart` | `sp-sankey-chart` | `sourceKey`, `targetKey`, `valueKey` |
| REQ-087 | `ActivityGrid` | `SpActivityGrid` | `sp-activity-grid` | `dateKey`, `countKey`, `levelKey`, `weeks` |
| REQ-088 | `CoxcombChart` | `SpCoxcombChart` | `sp-coxcomb-chart` | `nameKey`, `valueKey`, `startAngle` |
| REQ-089 | `WindRose` | `SpWindRose` | `sp-wind-rose` | `bearingKey`, `valueKey`, `sectors`, `bins` |
| REQ-090 | `VolvelleChart` | `SpVolvelleChart` | `sp-volvelle-chart` | `rings`, `indexRing`, `indexValue` (they apply to the demo's rings too, REQ-098) |
| REQ-091 | `ChordRing` | `SpChordRing` | `sp-chord-ring` | `sourceKey`, `targetKey`, `valueKey`, `maxCategories` |
| REQ-092 | `OrbitChart` | `SpOrbitChart` | `sp-orbit-chart` | `orbits`, `periodKey`, `markerKey` |

Own props that the table leaves implicit:

- **`HeatmapChart.columnLabels?: readonly string[]`** names the columns in order; they head the
  table columns, the keyboard announcement and the readout, and are drawn above the cells.
  Missing names fall back to `#k`; names beyond the drawn columns are ignored with `SP002`.
- **`OrbitChart`**: `data` holds the orbit rows (Data Model §2.10); `orbits` caps the orbits
  shown, from the inside out; `markerKey` reads a row's markers (default `'markers'`) and
  `periodKey` a marker's period (default `'period'`, 0-1 over the cycle).
- **`VolvelleChart`**: `data` holds the rings from the inside out (Data Model §2.12); `rings`
  caps them; `indexRing` (0-based, default 0) and `indexValue` (default: that ring's first
  segment) choose the index angle. Without `data` they address the demo's rings `Day`, `Shift`,
  `Team` (REQ-098).

### 7.1 Composition: Dashboard

| REQ | React | Vue | Angular selector | Own props |
|---|---|---|---|---|
| REQ-200 | `Dashboard` | `SpDashboard` | `sp-dashboard` | `DashboardProps` |
| REQ-200 | `DashboardCell` | `SpDashboardCell` | `sp-dashboard-cell` | `cell?` |

A declarative grid of cards (PRD §6.10). Charts are children; the layout is a data-only object
matched to children by cell id (DD-013). It is not a builder: there are no placement
coordinates, no `order`, no drag or resize.

**Types** (public):

```ts
/** The three container breakpoints; their widths are fixed (TD DD-014). */
export type DashboardBreakpoint = 'sm' | 'md' | 'lg';

/** A value that may differ per breakpoint; a bare number applies to all three. */
export type PerBreakpoint<T> = T | Partial<Record<DashboardBreakpoint, T>>;

/** Serialisable layout (REQ-201). No functions, no DOM, no chart references. */
export interface DashboardLayout {
  /** Columns per breakpoint. Default `{ sm: 1, md: 2, lg: 4 }` (REQ-208). */
  columns?: PerBreakpoint<number>;
  /** Height of one row unit, in px, card chrome included. Default `240`. */
  rowHeight?: number;
  /** Gap between cells, in px. Default `16`. */
  gap?: number;
  /** Cells in reading order (REQ-203). Omitted: every child, span 1. */
  cells?: readonly DashboardCellLayout[];
}

export interface DashboardCellLayout {
  /** Matches `DashboardCell`'s `cell` prop; unique within the dashboard (REQ-205). */
  id: string;
  /** Default `1`. Clamped to the breakpoint's columns with `SP014` (REQ-204). */
  colSpan?: PerBreakpoint<number>;
  /** Default `1`. */
  rowSpan?: PerBreakpoint<number>;
}

/** Link on a category key across the dashboard's charts (REQ-216). */
export interface DashboardLink {
  /** The datum field whose value is matched, e.g. `'hour'`. */
  key: string;
}

/** Name is required by the type: `title` or `label` (REQ-214). */
type DashboardName = { title: string; label?: string } | { title?: undefined; label: string };

export type DashboardProps = DashboardName & {
  /** Stable identifier; seeds of unnamed charts derive from it (REQ-209). Required. */
  id: string;
  layout?: DashboardLayout;
  /** Long description, exposed as the region's description (REQ-214). */
  description?: string;
  /** Heading level of `title`. Default `2`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Width in px used for nominal cell boxes on the server and at hydration (REQ-207). Default `1200`. */
  ssrWidth?: number;
  /** Linked interaction (REQ-216); client entry points only. */
  link?: DashboardLink;

  /** Inherited by every chart inside, below the chart's own prop (REQ-212). */
  ground?: GroundRef;
  substrate?: SubstrateName;
  mode?: InkMode;
  locale?: string;

  className?: string;
};

export interface DashboardCellProps {
  /** The layout cell this child fills. Omitted: next in source order, span 1. */
  cell?: string;
}
```

**`id` is required.** Charts may omit theirs because a single chart's derived id is harmless; in a
dashboard, every unnamed chart's seed hangs off this id (REQ-209), so it must be stable and chosen
by the consumer.

**`id` is required.** Every unnamed chart's seed hangs off it (REQ-209), so it must be stable
and chosen by the consumer. **`title` or `label` is required** by the type (REQ-214).

**Resolved model** (internal surface, §2):

```ts
export interface DashboardModel {
  readonly id: string;
  /** In reading order. */
  readonly cells: readonly ResolvedCell[];
  /** The CSS custom properties of the wrapper, e.g. `--sp-dashboard-columns-md: 2`. */
  readonly style: Readonly<Record<string, string>>;
}

export interface ResolvedCell {
  /** The layout cell's id; for a child placed in source order, its source index. */
  readonly id: string;
  /** The child this cell holds, as its index in `childCells`, so the adapter emits it here (I-11). */
  readonly child: number;
  /** Derived chart id: `${dashboard.id}--${cell.id}` (REQ-209). */
  readonly chartId: string;
  readonly span: Readonly<Record<DashboardBreakpoint, { col: number; row: number }>>;
  /** Outer box at `ssrWidth`, 2 decimals (REQ-002, REQ-206). */
  readonly nominal: { readonly width: number; readonly height: number };
  /** The cell's CSS custom properties, e.g. `--sp-cell-col-lg: 2`. */
  readonly style: Readonly<Record<string, string>>;
}

/** Pure; emits SP014 / SP015 through the diagnostics channel. */
export function resolveDashboard(props: DashboardProps, childCells: readonly (string | undefined)[]): DashboardModel;

/** The chart's width and drawing-area height inside a cell box, card chrome subtracted (REQ-206). */
/** `recipe`, when given, is built at a probe height to measure chrome the recipe adds itself (KpiCard's value line). */
export function cellChartBox<P extends CommonChartProps>(cell: { width: number; height: number }, chartProps: P, recipe?: ChartRecipe<P>): { width: number; height: number };

/** Items of `model` whose datum carries `value` under `key` (REQ-216, REQ-217). */
export function linkedItems(model: ChartModel, key: string, value: unknown): readonly number[];

/** What a cell hands its chart: plain data, so it crosses an RSC boundary as a prop (TD §3.3). */
export interface DashboardCellContext {
  readonly chartId: string;
  readonly box: { readonly width: number; readonly height: number };
  readonly config: Readonly<ProviderConfig>;
}

/** Every attribute, text and cell an adapter writes, from `resolveDashboard` (Art. 2). */
export function dashboardView(props: DashboardProps, children: readonly { cell?: string; id?: string }[]): DashboardView;

/** A chart's props inside a cell (size and config precedence) and its width until measured. */
export function inCell<P extends CommonChartProps>(props: P, cell: DashboardCellContext | undefined, recipe: ChartRecipe<P>): { props: P; width: number | undefined };
```

`childCells` is the `cell` prop of each child in source order — the only thing an adapter reads
from its children, and something every framework can read synchronously during render.

**Default values** (part of the contract, like §5.1):

| Prop | Default | Note |
|---|---|---|
| `layout.columns` | `{ sm: 1, md: 2, lg: 4 }` | Collapses 4 → 2 → 1 (REQ-208) |
| `layout.rowHeight` | `240` | 160 drawing area + the default card chrome, rounded up |
| `layout.gap` | `16` | |
| `colSpan`, `rowSpan` | `1` | |
| `headingLevel` | `2` | |
| `ssrWidth` | `1200` | Nominal boxes use the breakpoint `ssrWidth` falls in: `lg` at ≥ 1024, `md` at 640–1023, `sm` below (DD-015) |

**Size precedence** of a chart inside a cell: its own `width`/`height` → the cell box from
`cellChartBox` → the chart defaults.

**By adapter.** React:

```tsx
import { Dashboard, DashboardCell } from '@silverpoint/react/dashboard';
import { KpiCard } from '@silverpoint/react/kpi-card';
import { LineChart } from '@silverpoint/react/line-chart';
import { BarChart } from '@silverpoint/react/bar-chart';

const layout = {
  columns: { sm: 1, md: 2, lg: 4 },
  cells: [
    { id: 'revenue' }, { id: 'users' }, { id: 'churn' }, { id: 'nps' },
    { id: 'traffic', colSpan: { md: 2, lg: 3 }, rowSpan: 2 },
    { id: 'errors' },
  ],
} satisfies DashboardLayout;

<Dashboard id="ops" title="Operations" layout={layout} link={{ key: 'hour' }}>
  <DashboardCell cell="revenue"><KpiCard title="Revenue" … /></DashboardCell>
  …
  <DashboardCell cell="traffic"><LineChart data={rows} xKey="hour" valueKey="hits" title="Traffic" /></DashboardCell>
  <DashboardCell cell="errors"><BarChart data={errs} xKey="hour" valueKey="count" title="Errors" /></DashboardCell>
</Dashboard>
```

`Dashboard` from `/server/dashboard` renders with no client JavaScript and rejects `link` by
type. The client `Dashboard` renders a `"use client"` link boundary only when `link` is given
(REQ-104 holds: no link, no client boundary).

Vue:

```vue
<SpDashboard id="ops" title="Operations" :layout="layout" :link="{ key: 'hour' }">
  <SpDashboardCell cell="traffic"><SpLineChart … /></SpDashboardCell>
</SpDashboard>
```

Angular — signal inputs, `OnPush`, standalone (REQ-101); cell ids are read from
`contentChildren`, available during server rendering. Signal inputs cannot say "`title` or
`label`", so where React and Vue reject a nameless dashboard by type, `sp-dashboard` warns `SP002`
(REQ-214); `id` is a required input. Each `sp-dashboard-cell` keeps its content in a template the
dashboard instantiates inside the cell's `article`, in reading order:

```html
<sp-dashboard id="ops" title="Operations" [layout]="layout" [link]="{ key: 'hour' }">
  <sp-dashboard-cell cell="traffic"><sp-line-chart … /></sp-dashboard-cell>
</sp-dashboard>
```

### 7.2 UI component catalog (feature-002)

17 components (REQ-300..334): `Button`, `Input`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `Rate`, `Segmented`, `Tabs`, `Steps`, `Card`, `Tag`, `Badge`, `Divider`, `Progress`, `Alert`, `Skeleton`. Each takes `CommonUiProps` (§3.3) and the own props of §3.3; names per adapter are in §1.2. The core catalog `UI_COMPONENTS` lists them (name, slug, component, group, states).

#### Markup contract (normative; parity is checked on it, REQ-327)

Every component root carries `class="sp-ui sp-<name> sp-ground-<ground>"` (the ground class, as a
chart root and a dashboard carry it, is what `styles.css` hangs the `--sp-` palette on),
`data-ground`, `data-substrate`, `data-mode`, `data-size` and, when inked, `data-frame="0..3"`.
Drawn pieces are `aria-hidden` elements with a `part`; an `sp-frame` names its shape with
`data-kind` (`control`, `pill`, `box`, `card`, `round`), an `sp-tone` its level with `data-tone`
(1-4) and its shape with `data-kind`. A native input hidden for sight carries `class="sp-ui-native"`,
the label of one item of a composite `class="sp-ui-item"`, and text over a tone sits in an
`sp-ui-plate`. `ui.css` is written against these names (grounds `src/ui/ui-css.ts`):

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

**Markup as data.** The contract above is the `ui*View` trees of `@silverpoint/core/ui` (§2.1); the
canonical render of a fixture is that tree.

**Runtime without ground.** The runtime never reads a ground's tokens for markup: `data-frame` is a
slot 0..5 (`uiFrameVariant(seed, id, 6)`) and `data-tone` a level 1-4 or a state (`primary`,
`danger`, `disabled`, `selected`, `alertError`). `ui.css` folds slots onto the variants a ground
draws and maps states to its `ui.tone` levels.

**Markup details.**

- The legends of Segmented and Rate are for assistive technology only (`sp-ui-sr`).
- The radios of Segmented and Rate take `name`, else `${id}--value`, else no name.
- A read-only Rate is `role="radiogroup"` with `aria-readonly`.
- A Tag's close button is named `Remove <text>` unless `closeLabel` is set.
- A Badge's dot is drawn; its `label` is visually hidden text.
- The circle Progress is the core's arc (`uiProgressArc`), with classes on its two paths.
- A slider thumb is `part="sp-thumb sp-heighten"`, and `ui.css` matches parts with `~=`.

## 8. API by adapter

### 8.1 React

```tsx
import { LineChart, SilverpointProvider } from '@silverpoint/react';

<SilverpointProvider ground="silverpoint" substrate="cream" mode="ink">
  <LineChart
    data={rows}
    xKey="hour"
    valueKey="hits"
    title="Throughput per hour"
    unit="requests"
    onActiveChange={setActive}
  />
</SilverpointProvider>
```

**Server and client boundaries** (REQ-103, REQ-104). There are two entry points per chart:

| Import | Marker | Interaction | Use |
|---|---|---|---|
| `@silverpoint/react/line-chart` | `"use client"` | Yes | Default |
| `@silverpoint/react/server/line-chart` | No marker | No | RSC; standing alone it needs `id`, `width` and `height` (`SP002` / `SP003` without them); inside a `Dashboard` the cell supplies them |

The server variant emits pure SVG with no client JavaScript. It accepts neither
`onActiveChange` nor `dataTable: 'visible'` with keyboard navigation; the type prevents it.

**Imperative API** through `ref`, deliberately minimal:

```ts
export interface ChartHandle {
  getGeometry(): Geometry;
  toSVGString(): string;
}
```

**UI components (§7.2).** Function components; `forwardRef` to the native element (`SpButton`, `SpInput` and the hidden inputs); `onChange` receives the value. `SpTabs` renders `SpTabPanel` children matched by `value`. Display components also have server entries (§1.2).

### 8.2 Angular

Standalone components with signal inputs and `OnPush` (REQ-101).

```ts
import { SpLineChart } from '@silverpoint/angular/line-chart';
```

In Vue the subpath mirrors React's:

```ts
import { SpLineChart } from '@silverpoint/vue/line-chart';
import { provideSilverpoint } from '@silverpoint/angular';

bootstrapApplication(App, {
  providers: [provideSilverpoint({ ground: 'silverpoint', substrate: 'cream' })],
});
```

```html
<sp-line-chart
  [data]="rows()"
  xKey="hour"
  valueKey="hits"
  title="Throughput per hour"
  unit="requests"
  (activeChange)="active.set($event)" />
```

Inputs are declared with `input()` and are read-only inside the component. The component
SHALL NOT expose public methods beyond `getGeometry()` and `toSVGString()`, so as to keep
symmetry with `ChartHandle`.

**UI components (§7.2).** Standalone, signal inputs, `OnPush`, zoneless-safe (REQ-101). Value components share the `SpUiControl` base (`ui/base`), expose `value = model<T>()` and implement `ControlValueAccessor` (REQ-323). `SpButton` is an attribute component on the consumer's native element (`button[spButton]`, `a[spButton]`), so the host is the native control (DD-024). `SpInput` is an **element**, `<sp-input>`, not `input[spInput]`: a native `<input>` can hold neither the frame nor the message. Named slots are templates: `<ng-template spExtra>`, `spFooter`, `spPrefix`, `spSuffix`. Panels read their tabs through the `SP_TABS` token. A Tag reads its projected text after render, for its close button's name.

### 8.3 Vue

Components authored with `<script setup>`, typed props and typed emits (REQ-108).

```ts
import { SpLineChart, provideSilverpoint } from '@silverpoint/vue';

// main.ts
app.use(provideSilverpoint({ ground: 'silverpoint', substrate: 'cream' }));
```

```vue
<template>
  <SpLineChart
    :data="rows"
    x-key="hour"
    value-key="hits"
    title="Throughput per hour"
    unit="requests"
    @active-change="active = $event" />
</template>
```

Props are the same `CommonChartProps` as every other adapter; in templates they may be
written in `kebab-case`, which Vue maps to the `camelCase` declaration. Emits are typed,
so `@active-change` carries `ActiveItem | null` and nothing else.

**Server rendering.** The adapter renders under `@vue/server-renderer` with no DOM access,
which is what the string gate of DD-003 consumes and what REQ-109 verifies after
hydration. There is no Nuxt-specific code: a Nuxt app consumes the package like any other
Vue app, and Nuxt is not a validated integration in the `0.x` line.

**Imperative API** by template ref, identical to `ChartHandle`:

```ts
const chart = ref<InstanceType<typeof SpLineChart>>();
chart.value?.getGeometry();
```

**UI components (§7.2).** `<script setup>` with typed props and emits (REQ-108), `defineModel` for the value, slots `prefix`, `suffix`, `extra` and `footer`.

### 8.4 Ribbon generator

`ChordRing` (REQ-091) needs a generator of ribbons between angular positions that the arc
engine does not cover. The core exposes it as an internal part and the Technical Design
decides whether it leans on `d3-chord` or is implemented by hand; either way, the decision
does not alter any signature in this specification.

## 9. Events and interaction

| React | Vue | Angular | Payload | When |
|---|---|---|---|---|
| `onActiveChange` | `@active-change` | `activeChange` | `ActiveItem \| null` | The pointer enters or leaves an item, or keyboard focus moves (REQ-141) |
| `onSelect` | `@select` | `select` | `ActiveItem` | Click, `Enter` or `Space` on an item |
| `onLinkChange` | `@link-change` | `linkChange` | `{ key: string; value: unknown } \| null` | On a `Dashboard` with `link`: the linked value changes (REQ-216); `null` when the source clears (REQ-218) |

Charts inside a linked dashboard keep their own `onActiveChange`; a linked mark is **not** an
active item and fires no `onActiveChange` in the other charts.

`onActiveChange` emits `null` when leaving the area or losing focus, leaving no residual
state (REQ-143). The active item is resolved by the core as a pure function of position
and geometry, without consulting the DOM (REQ-140).

On touch input, resolution is by proximity, with a minimum target of 24 px (REQ-144).

**Custom readout.** `tooltip` accepts a consumer-supplied renderer (REQ-142); if it is
omitted, the included one is used.

```tsx
<LineChart tooltip={(active) => <MyReadout item={active} />} />
```

```html
<sp-line-chart><ng-template spTooltip let-active>…</ng-template></sp-line-chart>
```

```vue
<SpLineChart><template #tooltip="{ active }">…</template></SpLineChart>
```

**UI components.** Value events fire only on user input, never on a prop change, and never for a disabled component or
item (REQ-326). Composite keyboard transitions come from `uiRovingKey` (REQ-315); `Tabs` with
`activation="automatic"` selects on focus move, `manual` on Enter/Space.

| React | Vue | Angular | Payload | When |
|---|---|---|---|---|
| `onChange(value)` | `update:modelValue`, then `change` after commit (Slider: pointer up / key) | `(valueChange)` | the component's value (§3.3) | User input on a value component |
| `onClose` | `@close` | `(close)` | — | A closable `Tag` or `Alert` is dismissed |
| `onClick` | `@click` | `(click)` | native event | `Button`, native |

## 10. DOM and CSS contract

### 10.1 `part` attributes

Every emitted stroke carries `part`, and it is the only stable coupling point between the
SVG and the stylesheet. Overriding a variable re-themes without re-rendering (REQ-042).

| `part` | CSS property applied | Variable |
|---|---|---|
| `sp-ink` | `stroke`, `fill` | `--sp-ink` |
| `sp-ink-secondary` | `stroke`, `fill` | `--sp-ink-secondary` |
| `sp-heighten` | `fill` | `--sp-heighten` |
| `sp-rule` | `stroke` | `--sp-rule` |
| `sp-grid` | `stroke` | `--sp-grid` |
| `sp-axis` | `fill` | `--sp-text-muted` |

UI components (§7.2) add `sp-frame`, `sp-tone`, `sp-mark`, `sp-knob`, `sp-track`, `sp-fill`, `sp-thumb` and `sp-connector`; `sp-rule` and `sp-heighten` keep their meaning.

The dashboard composition (§7.1) adds, on HTML elements: `dashboard` (the `section`),
`dashboard-title` (the heading), `dashboard-description`, `dashboard-grid` (the grid inside the
section: a container query styles descendants, never the container), `dashboard-cell` (each
`article`), and
`linked` on a chart item under a linked mark (client only, REQ-219).

Besides `part`, a `path` carries `data-role`, `data-paint`, and when set `data-dash` and
`data-weight`. `data-weight="1".."4"` is the tonal weight of a `weight` ground (REQ-028); the
stylesheet sets its `stroke-width` to `calc(var(--sp-stroke-width) * var(--sp-weight-N))`.

### 10.2 Public CSS custom properties

```css
.sp-ground-silverpoint[data-substrate='cream'] {
  --sp-substrate:      #EDE7DA;
  --sp-ink:            #5A5E65;
  --sp-ink-secondary:  #685C4D;
  --sp-heighten:       #FFFFFF;
  --sp-rule:           #737A82;
  --sp-grid:           #737A82;
  --sp-text:           #3F4348;
  --sp-text-muted:     #5A5E65;  /* = --sp-ink in this ground, see Data Model §3.2 */
  --sp-font-display:   'EB Garamond', 'Iowan Old Style', Georgia, serif;
  --sp-stroke-width:   0.9;
  --sp-hatch-gap:      7;
  --sp-radius:         2px;
}
```

```css
.sp-ground-cyanotype {
  --sp-substrate:      #1B3F6B;  /* prussian, the ground's only substrate */
  --sp-ink:            #E2EAF2;
  --sp-ink-secondary:  #DCCBA8;
  --sp-heighten:       #0C2240;  /* a reserve: the heightened element is the deepest blue */
  --sp-rule:           #8AA8C7;
  --sp-grid:           #8AA8C7;
  --sp-text:           #F4F6F8;
  --sp-text-muted:     #B8CBDE;
  --sp-stroke-width:   0.9;
  --sp-weight-1:       1.5;
  --sp-weight-2:       2.25;
  --sp-weight-3:       3;
  --sp-weight-4:       4;
}
```

The exact values of the substrates are fixed by the Data Model. Any variable not
listed here is internal and may change in a minor version.

The dashboard composition adds `--sp-dashboard-gap` (default `16px`, overrides `layout.gap`), and
the variables the adapter writes from the resolved model: `--sp-dashboard-columns-sm/md/lg`,
`--sp-dashboard-row-height` and `--sp-dashboard-layout-gap` (the value `--sp-dashboard-gap` falls back
to, so the public property still overrides it from CSS) on the wrapper, `--sp-cell-col-sm/md/lg` and `--sp-cell-row-sm/md/lg` on each cell. Container
breakpoints are fixed in the stylesheet: `sm` < 640 px ≤ `md` < 1024 px ≤ `lg` (DD-014).

UI components add these public properties (`@silverpoint/grounds/ui.css`):

| Property | Default (from the ground's `ui` tokens) | Note |
|---|---|---|
| `--sp-ui-height-sm` / `-md` / `-lg` | 24 / 32 / 40 px | Control heights (≥ 24 px, REQ-317) |
| `--sp-ui-radius` | ground `ui.radius` | Frame corner radius in `precision` |
| `--sp-ui-focus-width` | 2 px | REQ-316 |
| `--sp-ui-focus-color` | `var(--sp-ink)` | Must keep 3:1 (REQ-313) |
| `--sp-ui-gap` | 8 px | Spacing inside composites |

**There is no monospace variable.** The system uses a single family: monospace is an
invention of the typewriter and has no place in a Renaissance ground. What motivated its
use —aligning figures— is solved by EB Garamond's `tnum` feature, verified present. Small
caps lines are set with `text-transform: uppercase` and open tracking, which is
deterministic in any engine; the Google Fonts build of EB Garamond does not include `smcp`.

### 10.3 Accessibility contract

| Element | Contract |
|---|---|
| SVG root | `role="img"`, `aria-labelledby` pointing at the name and, if present, the description (REQ-120) |
| Tabular alternative | Associated `<table>`, visible or visually hidden according to `dataTable` (REQ-121) |
| Data points | Traversable with `Tab` and arrow keys; each announces series, category and value (REQ-122) |
| Forced mode | `prefers-contrast: more` or `forced-colors: active` force `precision` (REQ-123) |
| Motion | `prefers-reduced-motion: reduce` omits the entrance animation (REQ-125) |
| Dashboard wrapper | `<section part="dashboard" aria-labelledby="{id}-title">`, `aria-describedby` when `description` is given; `aria-label` when only `label` is (REQ-214) |
| Dashboard heading | `<h{headingLevel} id="{id}-title">` |
| Dashboard cell | `<article part="dashboard-cell">` labelled by its chart's accessible name (REQ-214) |
| Dashboard order | DOM order = reading order at every breakpoint (REQ-203); the dashboard adds no tab stop (REQ-215) |
| Linked marks | `aria-hidden`; no live-region update (REQ-218) |

UI components (§7.2) additionally follow REQ-314..REQ-320, REQ-334 and the markup table. The drawing never takes focus and never carries a name; the native or semantic element does.

Parity holds for the markup the library emits. With the Angular attribute components (DD-024)
the host is the consumer's own `<button>` or `<input>`: attributes the consumer adds to it are
theirs, outside the contract and outside the gate (A-03).

`dataTable: 'none'` is only legitimate when the consumer supplies their own accessible
alternative; the documentation says so and development mode warns about it.

### 10.4 Tailwind preset (`@silverpoint/tailwind`, optional)

For a consumer who already uses Tailwind (REQ-047). It names the public variables of §10.2; the
values stay in `@silverpoint/grounds`, so the utilities follow the chart's ground, substrate and any
override. It has no dependencies and no peers: Tailwind is never required (Art. 8, REQ-043).

```css
/* Tailwind 4 */
@import 'tailwindcss';
@import '@silverpoint/tailwind/theme.css';
```

```js
// Tailwind 3.4
export default { presets: [require('@silverpoint/tailwind')] };
```

| Utility family | Tokens | Variable |
|---|---|---|
| Colour (`bg-`, `text-`, `border-`, …) | `sp-substrate`, `sp-ink`, `sp-ink-secondary`, `sp-heighten`, `sp-rule`, `sp-grid`, `sp-text`, `sp-text-muted` | `--sp-<token>` |
| Font | `font-sp-display` | `--sp-font-display` |
| Radius | `rounded-sp` | `--sp-radius` |

Under Tailwind 3.4 a variable colour takes no opacity modifier (`bg-sp-ink/50`); under 4 it does.

## 11. Catalog of errors and warnings

Stable codes, part of the public surface. Those with `warn` severity are stripped from the
production bundle; those with `error` severity are always thrown.

| Code | Severity | Requirement | Condition |
|---|---|---|---|
| `SP001` | warn | REQ-007 | Empty dataset; the ground's empty state is drawn |
| `SP002` | warn | REQ-008 | A value cannot be drawn as given — `null`, not finite, or outside the chart's data contract — so it is corrected or omitted. The generic message names no remedy; each chart states what happened and its own remedy in the diagnostic's specifics |
| `SP003` | warn | REQ-009 | Zero-dimension container; the render is deferred |
| `SP004` | warn | REQ-010 | Degenerate scale domain; it is expanded with `domainPadding` |
| `SP005` | error (dev) / warn (prod) | REQ-025 | More than one item marked with heightening; the first one is applied |
| `SP006` | warn | REQ-026 | Inker not registered; falls back to `NullInker` |
| `SP007` | warn | REQ-045 | Ground not registered; falls back to `silverpoint` |
| `SP008` | warn | REQ-096 | Data volume above the family's threshold |
| `SP009` | error | REQ-097 | A non-derivable scale bound is missing; the message names the property |
| `SP010` | warn | REQ-091 | `ChordRing` above 12 categories |
| `SP011` | warn | NFR §7 | Path byte budget exceeded; `hatchFill: 'tile'` or a larger gap is suggested |
| `SP012` | error (CI) | REQ-127 | A ground does not reach the minimum contrast |
| `SP014` | warn | REQ-204 | A dashboard cell spans more columns than a breakpoint has; clamped |
| `SP015` | warn | REQ-205 | A dashboard's layout and children disagree (unknown cell, unplaced child, duplicate id); unmatched children rendered in source order, span 1 |
| `SP016` | warn | REQ-217 | A chart in a linked dashboard has no field named by `link.key` |
| `SP017` | warn | REQ-324 | A Slider, Rate or Progress value or a Steps `current` is out of range or off step, or a Slider/Rate range is invalid; clamped, rounded or defaulted |
| `SP018` | warn | REQ-319 | An `SpButton` or `SpBadge` has no accessible name (no text, no `label`) |
| `SP019` | warn | REQ-325 | Items of a Tabs, Segmented, RadioGroup or Steps share a key; later ones skipped |
| `SP013` | warn | REQ-032 | The `@silverpoint/fonts` face failed to load; rendering fell back to the system stack and golden images will no longer match |

`SP002` keeps its meaning for charts and is not reused by the UI components (each diagnostic names its own REQ).

Every diagnostic includes the chart name, the property involved and the `REQ-NNN` that
motivates it.

## 12. Limits and budgets

| Limit | `0.x` value | Behaviour on exceeding it |
|---|---|---|
| Points per series, cartesian families | 500 | `SP008` |
| Sectors, polar families | 60 | `SP008` |
| Categories, `ChordRing` | 12 | `SP010` |
| Path data per chart | 40 KB | `SP011` |
| Weight of `@silverpoint/core` + `react` with one chart | 45 KB min+gzip | CI fails (REQ-164) |
| Geometry computation, 100 points | 2 ms | The CI benchmark fails |
| `dashboard` subpath, per adapter, over its one-chart build | 2 KB min+gzip for React and Vue, 3 KB for Angular | CI fails (REQ-220) |
| Cells per dashboard | 24 (advisory) | No diagnostic; documented guidance, rendered anyway |
| Dashboard layout resolution, 24 cells | 0.5 ms | The CI benchmark fails |
| Reference 12-card dashboard, server HTML | 480 KB | `tools/path-weight` fails the PR |
| One component's subpath over the shared UI runtime | 3 KB min+gzip | CI fails (REQ-330) |
| Shared UI runtime (core `ui/*` + adapter base), per adapter | 8 KB min+gzip | CI fails (REQ-330) |
| `@silverpoint/grounds/ui.css` | 24 KB gzip | CI fails (REQ-330) |
| Items per Tabs / Segmented / RadioGroup / Steps | 12 (advisory) | No diagnostic; documented |
| Keyboard transition in the core | 0.05 ms | The CI benchmark fails |

## 13. Versioning and deprecation

SemVer over the public surface of §2.

- **Major**: removing or renaming a prop, a component, an `SPNNN` code, a `--sp-` variable
  or a `part`; changing a default value observably.
- **Minor**: adding charts, components, subpaths, stylesheets, optional props and tokens, grounds, new codes.
- **Patch**: fixes that do not alter the normalised SVG output. A change that does alter
  it **is not a patch**, even if it is a visual improvement: it breaks the golden images of
  consumers using the same gate.

Deprecation: a prop marked `@deprecated` warns for at least two minor versions before
being removed in the next major. The four packages are always published with the same
version.

---

## Change History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-13 | Initial version |
| 1.2 | 2026-09-13 | Palette replaced with the one verified against the contrast thresholds (Data Model §3.2) |
| 1.1 | 2026-09-13 | `@silverpoint/fonts` and the `hatchFill` prop are introduced; rounding to 2 decimals; `--sp-font-mono` is removed; `SP011` switches to measuring bytes |
| 1.5 | 2026-09-13 | Vue adapter added: package, naming, a Vue column across the 33-row catalog, §8.3, and Vue emits in §9 |
| 1.4 | 2026-09-13 | §1.1 added: bundler consumption guarantees for Vite and Next.js (REQ-033, REQ-034) |
| 1.3 | 2026-09-13 | Converted to English; diagnostic SP013 added for typeface load failure (Analyze finding A-05) |
| 1.9 | 2026-09-29 | Feature-002: the 17 `Sp` UI components — §1.2 (subpaths `ui`, `ui-demos`, `ui.css`, `server/ui`, `angular/env`; `@angular/forms` peer), §2.1 core surface, §3.3 types and props, §5.1 defaults, `Ground.ui` (§6), new §7.2 catalog and markup contract, §8 adapters, §9 events, §10 parts/properties/accessibility, `SP017`–`SP019` (16 → 19 codes), §12 budgets; includes the Phase 3–5 amendments (Angular `<sp-input>` element, `SpInput.label`, React server entries, `uiRovingFocus` and further core surface) |
| 1.8 | 2026-09-26 | Delta-013: `@silverpoint/tailwind` in §1 and §10.4 |
| 1.7 | 2026-09-26 | Delta-012: `ToneSpec` gains the `weight` variant and `Ground` shows its `tonalRamp`; the built-in grounds table adds `cyanotype` with `WeightInker`; a toned shape's tonal weight level is written as `data-weight` (§10.1) with `--sp-weight-1..4` (§10.2) — an internal stroke field, distinct from `Stroke.weight`; REQ-220's allowance is 3 KB for Angular (§12) |
| 1.6 | 2026-09-25 | Deltas folded: `locale` default identical on server and client (003); `HeatmapChart.columnLabels` (006); `SP002` covers every value a chart cannot draw as given (007); how `OrbitChart` and `VolvelleChart` props read their data (009, 010); view props apply to the demo (011). §7.1 Dashboard composition with `onLinkChange`, parts, CSS variables, accessibility contract, `SP014`–`SP016` and budgets (feature-001). The media query forcing `precision` is stated as an override after resolution (Analyze A-06) |

## Constitution check

- **Art. 2** — §1 and §8 maintain the boundary: the adapters only consume `Geometry`, and
  the ribbon generator (§8.4) lives in the core.
- **Art. 4** — `seed` is a public prop in §5 and is derived from `id` when omitted.
- **Art. 5** — §10.3 fixes the accessibility contract, and §5 establishes that the media
  query forcing `precision` cannot be overridden by prop.
- **Art. 6** — §6 requires every ground to declare its `tonalMechanism`.
- **Art. 7** — §6 defines the ground as a declarative object and `registerGround` as the
  only way to register one.
- **Art. 8** — §3.1 and §10 implement the consequence of not depending on Tailwind: the
  `Inker` emits shape without paint, and color enters through CSS by way of `part`.
- **Art. 3** (v1.5) — §7.1 requires a dashboard `id` and derives chart ids from it, so the
  wrapper and every chart inside are comparable across adapters.
- **Art. 2** (feature-002) — §2.1 puts every UI function in the core; adapters bind props and events.
- **Art. 3** (feature-002) — the markup contract of §7.2 is what the gate compares.
- **Art. 4** (feature-002) — `uiFrameVariant` and the id rule; no framework id hook in emitted ids.
- **Art. 5** (feature-002) — native controls, roles, APG keyboard, exact focus.
- **Art. 8** (feature-002) — no dependency added; `ui.css` opt-in; budgets in §12.
- **Requested exception:** none.
