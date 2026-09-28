# PRD delta — UI components drawn in silverpoint

| Field | Value |
|---|---|
| **Status** | `PROPOSED` — gate 1, awaiting the user's approval |
| **Amends** | [PRD](../../specs/prd.md) v1.10 → v1.11: §1, §4.1, §5.1, §5.2, §5.3, new §6.11, §7, §9 (Epic F), §11 |
| **Applicable Constitution** | [`constitution.md`](../../specs/constitution.md) v1.6, with the v1.7 amendment proposed in [`constitution-amendment.md`](constitution-amendment.md) |
| **Research** | [`research.md`](research.md) |
| **Size** | Complex feature (≥ 3 sprints): PRD + API + TD + Data Model + Plan + Tasks + Analyze (Art. 9) |

## 1. Summary

silverpoint's charts give a product a visual character of its own, but the character stops at the
card edge: the buttons, tabs, switches and progress bars around the charts are whatever design
system the app already uses, and they look like it. Persona 1 builds a dashboard and gets
Renaissance charts inside Material controls.

This feature adds a first family of **17 interface components** to the three adapters, drawn with
the same grounds and held to the same rules as the charts: tone by hatching (or by weight under
`cyanotype`), a hand-inked frame, heightening on the current item, a `precision` mode, parity of
markup across React, Vue and Angular, server rendering, and accessibility by construction. The
hand draws only ornament: every hit area, focus indicator and value-bearing shape is exact.

It is **not** a complete design system. `0.3.0` covers the controls whose behaviour is native or a
small keyboard pattern; overlays, tables and trees each need a behaviour engine decision and enter
later as deltas.

## 2. Problem

| Today | Cost |
|---|---|
| The ground's language ends at the chart | A silverpoint dashboard mixes two visual systems; the `--sp-` tokens and the Tailwind preset give colours, not controls |
| Consumers who want the look hand-draw their own controls | They ink the thumb and the tick along with the frame, and lose the exactness silverpoint promises (Art. 1) |
| Hand-drawn UI kits exist (wired-elements) | They deform the geometry a user aims at, need JavaScript per element to redraw, and have no high-contrast mode |
| A multi-framework house (Persona 2) must pick a different UI kit per framework | No shared look, no shared guarantee |

## 3. Scope changes

### §5.1 In Scope — add

- [ ] Interface components in `@silverpoint/react`, `@silverpoint/vue` and `@silverpoint/angular`,
      with their geometry and keyboard behaviour resolved in `@silverpoint/core` and their frames
      and tones in `@silverpoint/grounds` (§6.11).

### §5.2 Out of Scope — add

- Overlay components in `0.3.0`: Select, Dropdown, Menu, Modal, Drawer, Popover, Tooltip,
  Popconfirm, Notification, Message, DatePicker, TimePicker, Cascader, AutoComplete.
- Data-heavy components: Table, Tree, TreeSelect, Transfer, List virtualisation, Upload, Form
  (validation and layout), Calendar, Carousel, ColorPicker, Tour.
- Layout primitives (Grid, Flex, Space, Layout, Splitter): CSS does this; the dashboard is the
  one layout silverpoint owns.
- An icon set. Components take the consumer's icons; the few glyphs they draw themselves (tick,
  dot, close, status marks) are part of each component.

### §5.3 Future Considerations — add

- Overlays, on one behaviour decision for the three adapters: either core-owned machines (as in
  `0.3.0`) or a per-framework headless library (React Aria, Reka UI, Angular Aria) with parity
  checked on the library-owned markup only.
- Table on the dashboard's model: a data-only column layout resolved in the core.

## 4. Personas served

- **Persona 1** (data product developer): the whole screen in one visual language.
- **Persona 2** (multi-framework architect): the same controls, identical markup, in React and Angular.
- **Persona 3** (editorial author): tabs, steps and alerts that print like the charts.
- **Persona 4** (precision or accessibility needs): native controls under the drawing, exact
  focus, `precision` on demand and by system preference.

## 5. Objectives and metrics (§4.1) — add

| Objective | Metric | Target | Deadline |
|---|---|---|---|
| One language for charts and controls | Components of §6.11 available in the three adapters | 17 of 17 | Release 0.3.0 |
| The hand never moves what the user reads or aims at | Layout boxes and value geometry identical in `ink` and `precision` | 100% of the component fixtures | Release 0.3.0 |
| Parity extends to controls | Differences on the component fixtures, three adapters, against canonical renders | 0 | Release 0.3.0 |
| Accessible controls | axe on the UI page of the four example apps; APG keyboard e2e per composite | 0 A/AA issues; every pattern green | Release 0.3.0 |
| Controls cost little | One component over the shared UI runtime; the runtime; `ui.css` | ≤ 3 KB; ≤ 8 KB; ≤ 24 KB min+gzip | Release 0.3.0 |

## 6. §6.11 Functional requirements — UI components

Criteria in EARS. Identifiers REQ-300..REQ-333 are new; none is reused. The block starts at 300 so
the family reads as one range.

### The catalog

| Group | Components |
|---|---|
| Actions | Button |
| Data entry | Input, Checkbox, RadioGroup, Switch, Slider, Rate, Segmented |
| Navigation | Tabs, Steps |
| Data display | Card, Tag, Badge, Divider |
| Feedback | Progress, Alert, Skeleton |

### Structure

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-300 | ubiquitous | THE SYSTEM SHALL provide the 17 components of the catalog in each adapter —React `Button`…, Vue `SpButton`…, Angular `sp-…` or `[sp…]`— each importable by its own `ui/<kebab-case-name>` subpath. | MUST |
| REQ-301 | ubiquitous | THE SYSTEM SHALL ship the components' styles as a separate, opt-in stylesheet `@silverpoint/grounds/ui.css`; an application that imports no component SHALL see no change in its bundle or in `styles.css`. | MUST |
| REQ-302 | ubiquitous | THE SYSTEM SHALL compute every component geometry —value fractions, arcs, step connectors, frame variant— and every keyboard transition in `@silverpoint/core`, as pure functions; adapters SHALL only translate the result into elements (REQ-102 extended). | MUST |
| REQ-303 | ubiquitous | THE SYSTEM SHALL add no runtime dependency to any package for this feature; the runtime allowlist (TD §5.3) is unchanged. | MUST |

### Drawing

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-304 | ubiquitous | THE SYSTEM SHALL draw hit areas, focus indicators and every value-bearing shape —progress fill, slider thumb and fill, rating marks, switch knob, step markers and connectors— with exact geometry, and SHALL apply hand inking only to frames, rules and tonal fills. | MUST |
| REQ-305 | ubiquitous | THE SYSTEM SHALL paint hand-inked frames and tonal fills from pieces generated at build time, laid as CSS masks and painted through `--sp-` custom properties; the render path SHALL NOT measure the DOM, run an inking engine, or emit a literal colour (REQ-042). | MUST |
| REQ-306 | ubiquitous | Switching a component between `ink` and `precision` SHALL change no element's layout box and no value geometry. | MUST |
| REQ-307 | ubiquitous | THE SYSTEM SHALL choose a component's frame variant as a pure function of its `seed`, else its `id`, else variant `0`; never from mount order, randomness or time (Art. 4). | MUST |
| REQ-308 | ubiquitous | THE SYSTEM SHALL render the tone of checked, selected, filled and emphasised states from the ground's tonal ramp —hatch tiles under a `hatch` ground, line weight under a `weight` ground— and SHALL NOT use opacity as a tonal mechanism (Art. 6). | MUST |
| REQ-309 | ubiquitous | THE SYSTEM SHALL heighten only the current item of a component that has one —active tab, current step, selected segment, slider thumb— at most one element per component instance, outlined in ink (REQ-024, §3.3 of the Data Model). | MUST |
| REQ-310 | ubiquitous | No component SHALL convey a state by hatching alone: checked, selected, current, error and disabled SHALL also be carried by a glyph, a shape, text or a native state (REQ-124 extended). | MUST |

### Theming

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-311 | optional | WHERE a component sets `ground`, `substrate` or `mode`, or sits under a provider or a dashboard that does, THE SYSTEM SHALL resolve them with the precedence component prop → dashboard → provider → library default; the `precision` override of REQ-123 SHALL apply after resolution and SHALL NOT be overridable. | MUST |
| REQ-312 | ubiquitous | Each ground SHALL declare a `ui` token section —control heights, frame style, focus width, radius, frame variants— and adding a ground SHALL NOT require changes to any component's code (REQ-044 extended to `packages/core/src/ui/**` and the adapters' `ui/`). | MUST |
| REQ-313 | ubiquitous | Every component's text SHALL reach 4.5:1 and every graphical object needed to identify a control or its state 3:1 against its substrate, on every substrate of every ground (REQ-126 extended); CI SHALL verify it as REQ-127 does. | MUST |

### Accessibility

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-314 | ubiquitous | THE SYSTEM SHALL build on native elements where they exist: Button on `<button>`, Input on `<input>`, and Checkbox, RadioGroup, Switch, Slider, Rate and Segmented on native inputs that stay in the accessibility tree (visually hidden, never `display: none`), the drawing being `aria-hidden`. | MUST |
| REQ-315 | event | WHEN a composite widget —Tabs, RadioGroup, Segmented, Rate— has keyboard focus, THE SYSTEM SHALL follow its WAI-ARIA Authoring Practices pattern: one tab stop per widget, arrow keys by orientation, Home and End, with the transition resolved in the core as a pure function of state, key, orientation and direction. | MUST |
| REQ-316 | event | WHEN an interactive element receives focus through `:focus-visible`, THE SYSTEM SHALL draw an exact, uninked focus indicator at least 2 px wide with at least 3:1 contrast against the adjacent colours. | MUST |
| REQ-317 | ubiquitous | Every interactive target SHALL measure at least 24 × 24 CSS px at every component size (WCAG 2.5.8; REQ-144). | MUST |
| REQ-318 | ubiquitous | THE SYSTEM SHALL expose each non-native component with its role: Progress as `progressbar` with `aria-valuenow`/`min`/`max` (no `valuenow` when indeterminate), Steps as an ordered list with `aria-current="step"`, Alert as `alert` for `error`/`warning` and `status` otherwise, Divider as `separator`, Skeleton with `aria-busy` on its region and hidden shapes, Badge with its count in the accessible name. | MUST |
| REQ-319 | unwanted | IF a Button or Badge has no accessible name —no text content and no `label`— THEN THE SYSTEM SHALL warn `SP018` in development. | MUST |
| REQ-320 | event | WHEN the environment declares `prefers-reduced-motion: reduce`, THE SYSTEM SHALL render every component without transition or animation, and an indeterminate Progress SHALL show a static tone (REQ-125 extended). | MUST |
| REQ-321 | optional | WHERE the document or an ancestor sets `dir="rtl"`, THE SYSTEM SHALL mirror horizontal Slider, Progress, Steps and Segmented, and the arrow-key transitions of REQ-315. | SHOULD |

### State and forms

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-322 | ubiquitous | Every value component —Input, Checkbox, RadioGroup, Switch, Slider, Rate, Segmented, Tabs— SHALL support controlled and uncontrolled use in each framework's idiom: React `value`/`defaultValue`/`onChange`, Vue `v-model`, Angular two-way `[(value)]`. | MUST |
| REQ-323 | ubiquitous | The Angular form components SHALL implement `ControlValueAccessor`, and in every adapter the native inputs SHALL carry `name` and `value` so that the components submit with a native HTML form. | MUST |
| REQ-324 | unwanted | IF a Slider, Rate or Progress value or a Steps `current` falls outside its range or off its step, or a Slider or Rate range (`min`, `max`, `step`, `count`) is invalid, THEN THE SYSTEM SHALL clamp and round it in the core (or fall back to the defaults), render the corrected value and warn `SP017` in development. | MUST |
| REQ-325 | unwanted | IF the items of a Tabs, Segmented, RadioGroup or Steps share a key, THEN THE SYSTEM SHALL keep the first, skip the later ones and warn `SP019` in development, and SHALL NOT throw. | MUST |
| REQ-326 | ubiquitous | A disabled component or item SHALL use the native `disabled` attribute where there is one, and `aria-disabled` otherwise; it SHALL emit no change or select event and, inside a composite, SHALL be skipped by the arrow keys. | MUST |

### Determinism and parity

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-327 | event | WHEN a component fixture is rendered by any adapter, THE SYSTEM SHALL produce a parsed markup tree identical to the fixture's canonical render (Art. 3, "chart, composition or component"). | MUST |
| REQ-328 | ubiquitous | CI SHALL run the three pixel gates of Art. 3 on every component fixture at its declared size. | MUST |
| REQ-329 | event | WHEN a page with components is server-rendered and hydrated in any example app, THE SYSTEM SHALL hydrate without mismatch; ids relating elements (tab ↔ panel, label ↔ control) SHALL derive from the component's `id` by the chart id rule, never from the framework's id hook. | MUST |

### Budgets, integration and documentation

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-330 | unwanted | IF one component's subpath adds more than 3 KB min+gzip over the shared UI runtime, the shared UI runtime exceeds 8 KB, or `ui.css` exceeds 24 KB, THEN CI SHALL fail (REQ-164); the chart budgets stay unchanged. | MUST |
| REQ-331 | ubiquitous | Each example app —`vite-react`, `vite-vue`, `nextjs`, `angular`— SHALL include a UI reference page with the 17 components, verified end to end: no hydration mismatch, no axe A/AA issue, the APG keyboard pattern of every composite, pixel gates green. | MUST |
| REQ-332 | ubiquitous | The documentation site SHALL document every component with a live example and a props reference generated from the types, not retyped (REQ-099 extended). | MUST |
| REQ-333 | optional | WHERE an application uses `SilverpointProvider` (or `provideSilverpoint`), the same provider SHOULD ground both its charts and its components. | SHOULD |

**Count:** 34 requirements (32 MUST, 2 SHOULD). The PRD goes from 130 to 164 requirements.

## 7. Non-functional additions (§7)

- **Performance:** a component renders in < 1 ms (no geometry beyond fractions and one arc); a
  keyboard transition in the core < 0.05 ms. Benchmarks beside the geometry ones.
- **Weight:** the budgets of REQ-330, measured by size-limit on every PR.
- **Compatibility:** the CSS mask technique of DD-022 is checked in the pinned Chromium of the
  pixel gate and, in the e2e job, in Firefox and WebKit on the UI page.

## 8. User stories (§9) — Epic F, UI components

- **F1.** As Persona 1, I put a silverpoint `Segmented` above a silverpoint chart and switch its
  period, and both read as one drawing.
- **F2.** As Persona 2, I render the same `Tabs` in React and Angular and CI proves the markup is
  the same.
- **F3.** As Persona 4, I tab to a `Slider`, move it with the arrows, and my screen reader
  announces a native range; with high contrast on, the frame turns into a plain exact border.

## 9. Risks (§11)

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Seventeen components × three adapters is the largest phase yet | High | High | Step 6c in three batches that can each ship; OQ-U3 lets the user cut the first release to 8 |
| CSS masks render differently across engines | Medium | Medium | Pixel gates are Chromium-pinned (Art. 3); Firefox and WebKit are covered by e2e presence checks, and `precision` needs no mask |
| Native inputs styled invisible break in some assistive technology | Low | High | Visually-hidden pattern, never `display: none` or `opacity: 0` on a zero box; axe and manual NVDA/VoiceOver pass on the UI page before release |
| Pressure to add overlays inside `0.3.0` | Medium | High | §5.2 names them; they need a behaviour-engine decision first (§5.3) |
| Name collisions (`Button`, `Input`) in React apps | Medium | Low | Subpath imports alias freely; OQ-U2 |

## Constitution check

- **Art. 1** — extended by the amendment to interaction and value geometry; REQ-304, REQ-306.
- **Art. 2** — geometry and keyboard transitions in the core (REQ-302); frames generated at build
  time from the core and the ground (DD-022).
- **Art. 3** — parity extended to component markup (REQ-327, REQ-328); amendment wording.
- **Art. 4** — frame variant and related ids from `seed`/`id` (REQ-307, REQ-329).
- **Art. 5** — native first, APG keyboard, exact focus, precision by preference (REQ-314..REQ-320);
  amendment adds components to the article.
- **Art. 6** — tone by the ramp (REQ-308); heightening per component instance (REQ-309, amendment).
- **Art. 7** — `ui` tokens are ground data (REQ-312).
- **Art. 8** — no new dependency (REQ-303), no CSS framework, budgets (REQ-330).
- **Exception requested:** none. Amendments requested: see [`constitution-amendment.md`](constitution-amendment.md).
