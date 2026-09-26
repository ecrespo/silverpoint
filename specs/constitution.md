# Constitution — silverpoint

> Version 1.6 · Ratified: 2026-09-12 · Last amended: 2026-09-26
> Scope: `silverpoint` monorepo — `@silverpoint/core`, `@silverpoint/react`,
> `@silverpoint/vue`, `@silverpoint/angular`, `@silverpoint/grounds`, example apps and
> documentation site.

**What silverpoint is.** A charting library for React, Vue and Angular whose visual language
is historical drawing techniques. The first style —the Renaissance *ground*— reproduces
the mechanics of silverpoint: prepared mid-tone substrate, fine silver line, value built
by hatching and white heightening. The engine supports several grounds; the Renaissance
one is the first, not the only one.

**What it is not.** It is not a port of Monocharts. The chart catalog takes its
functional inventory from there, but the visual language, the geometry and the code are
original work.

---

## Articles

### Art. 1 — The geometry of the data is inviolable

THE SYSTEM SHALL compute the geometry of every encoding channel —position, length,
angle, area— with exact precision, and SHALL apply hand inking only to strokes that do
not encode data. Every inked stroke SHALL be rendered with `preserveVertices: true`.
Every chart SHALL produce identical vertices in `ink` mode and in `precision` mode,
verified by a test that compares both outputs.

*Rationale: Wood et al. (IEEE VIS 2012) show that irregular strokes degrade the
judgement of area and proportion; the style cannot be paid for with the accuracy of the
data.*

### Art. 2 — A single geometry engine

THE SYSTEM SHALL compute all geometry in `@silverpoint/core`, free of DOM and of
framework. No adapter SHALL contain computation of scales, axes, arcs or paths: an
adapter translates the core's output into nodes and nothing more. CI SHALL fail if an
adapter package imports `d3-*` or `roughjs` directly, or if it declares maths of its
own.

*Rationale: two implementations of the same drawing always diverge; it is the failure
that sinks multi-framework libraries.*

### Art. 3 — Visual parity across frameworks

THE SYSTEM SHALL produce, for the same data, configuration, ground, mode and seed, a
normalised markup —the SVG of every chart and any wrapper markup the library emits around
charts; attributes ordered, numbers to 2 decimals, whitespace collapsed—
**character-for-character identical across every adapter**. Each adapter is compared
against the canonical serialisation stored with the fixture, not against its siblings, so
that adding a framework costs one comparison rather than one per pair. CI SHALL verify
this with zero tolerance.

THE SYSTEM SHALL also pass three pixel comparisons, and CI SHALL block the release if
any of them is not met:

| Comparison | `threshold` | `maxDiffPixelRatio` |
|---|---|---|
| Any adapter against the canonical render, same commit | ≤ 0.10 | ≤ 0.001 |
| Against the stored golden image | ≤ 0.15 | ≤ 0.005 |
| Any individual pixel | > 0.50 fails | — |

THE SYSTEM SHALL also render on the server and, after hydration, the same markup in every
example app that server-renders, with no hydration mismatches.

The comparisons are only valid under declared conditions of determinism: a single
browser pinned by version, `deviceScaleFactor: 1`, fixed viewport, animations disabled,
self-hosted fonts preloaded and awaiting `document.fonts.ready`, a fixed seed and a
stylesheet shared by every example app. The gate operates over a declared fixture
matrix —chart or composition × ground × mode × size—, never over the example apps in free evolution.

*Rationale: with Art. 2 the geometry is identical by construction, so the strong gate is
the string comparison, which has no rasterisation noise; the pixel thresholds only
absorb antialiasing and browser version drift.*

### Art. 4 — Determinism

THE SYSTEM SHALL produce a reproducible render: the seed is part of the public API and,
if not given, is derived stably from the chart's identifier. THE SYSTEM SHALL NOT invoke
`Math.random()`, `Date.now()` or any other source of non-determinism in the render path.

*Rationale: a chart whose stroke changes on every repaint is a defect, and without
determinism the visual regression of Art. 3 is impossible.*

### Art. 5 — Accessibility and precision mode

THE SYSTEM SHALL expose every chart with an accessible role and name and a
keyboard-navigable tabular alternative. THE SYSTEM SHALL offer `precision` mode —inking
disabled entirely— on all charts from v1, and SHALL enable it automatically under
`prefers-contrast: more` or `forced-colors: active`. No chart SHALL encode information
solely through hatching style.

*Rationale: the hand-drawn stroke is an aesthetic choice that cannot exclude anyone, and
the state of the art itself advises against it exactly when precision is needed.*

### Art. 6 — Tone is encoded with density

THE SYSTEM SHALL build tonal value through hatch density and angle, and SHALL NOT use
flat fill with opacity as a tonal mechanism. White heightening SHALL be reserved for a
single element per chart.

*Rationale: it is the real mechanics of engraving and of silverpoint, and it is what
separates silverpoint from any old monochrome fill.*

### Art. 7 — Grounds are data, not code

THE SYSTEM SHALL define each style ground as a declarative set of tokens —substrate,
inks, inking parameters, typography, tonal mechanism—. Adding or modifying a ground
SHALL NOT require changes to the code of any chart.

*Rationale: if the style leaks into the charts' code, the second ground costs the same
as the first and the multi-style engine ceases to exist.*

### Art. 8 — Dependency boundary and theming

THE SYSTEM SHALL NOT require Tailwind or any CSS framework: theming goes through CSS
custom properties. `@silverpoint/core` SHALL NOT declare runtime dependencies outside
the allowlist pinned in the Technical Design. React, Vue and Angular SHALL be declared as
`peerDependencies`, never as dependencies. Every package SHALL respect its declared
bundle budget, verified in CI.

*Rationale: a charting library that imposes a toolchain on the consumer does not get
adopted.*

### Art. 9 — The specs are the source

THE TEAM SHALL obtain an approved spec before implementing any work of size ≥ medium
feature, and SHALL update the spec as part of the Definition of Done. Every change to an
already specified chart SHALL enter as a Delta Spec in `changes/` and be folded into
`specs/` on approval. Every MUST requirement SHALL have a `REQ-NNN` identifier, and
every task and every test SHALL cite the requirement they implement or verify.

*Rationale: the project is implemented in large part with agents; without traceability
there is no way to answer why a line of code exists.*

---

## Stack constraints

Decided, not re-litigated per feature:

| Area | Decision |
|---|---|
| Language | TypeScript 5.9+ (6.x where a supported framework requires it, as Angular 22 does) in `strict` mode, ESM first |
| Monorepo | pnpm workspaces + Nx (chosen for its Angular support) |
| Geometry engine | `d3-scale` + `d3-shape` (only the subset used) |
| Inking engine | `rough.js`, isolated behind the core's `Inker` interface |
| React | 18.2+ and 19; RSC-compatible (`"use client"` only where indispensable) |
| Angular | The two most recent majors; standalone components, signal inputs and `ChangeDetectionStrategy.OnPush`. Exact versions pinned in the Technical Design |
| Vue | 3.5+ (hydration-safe `useId`); `<script setup>` with typed props and emits, and `@vue/server-renderer` for the string gate |
| Build | `tsup` for core, react and vue; `ng-packagr` (Angular Package Format) for angular |
| Testing | Vitest (core, react, vue), Angular TestBed, Playwright for cross-framework visual regression |
| Supported frameworks | **React, Angular and Vue.** Those three contribute a component layer, and each gets an adapter package |
| Validated integrations | **Vite, Next.js and the Angular CLI**, each with an example app under `examples/`. A build tool is not a framework: Vite + React is React, and the Angular CLI runs on Vite and esbuild. Integrations are validated as first-class targets, not as incidental hosts |
| Runtime | Node 20+, pnpm 9+ |
| CI | GitHub Actions |
| Licence | MIT |

## Planned grounds (non-normative)

Context for the ratified scope. Their formal specification lives in the PRD; each one is
chosen for having a **distinct tonal mechanism**, not just another palette.

| Ground | Period / technique | Tonal mechanism | Status |
|---|---|---|---|
| `silverpoint` | Silverpoint, 15th c. | Hatching over a mid-tone substrate, white heightening | `0.1` |
| `burin` | Copperplate engraving, 16th c. | Cross-hatching and stippling on white; line of variable thickness | planned |
| `cyanotype` | Cyanotype, 1842 | White line on Prussian blue; value by thickness, not by hatching | `0.2.0` |
| `woodcut` | Woodcut, 16th c. | High-contrast block, coarse hatching, no fine gradation | planned |
| `wash` | Bistre / sepia wash | Translucent washes: the only ground where the fill **is** the mechanism | planned |
| `plotter` | Pen plotter, 20th c. | Single-thickness pen, fill by hatching, deterministic paths | planned |

The `wash` ground constitutes the planned exception to Art. 6 and SHALL declare it
explicitly in its tonal mechanism token.

## Amendments

| Date | Article | Change | Reason | Approved by |
|---|---|---|---|---|
| 2026-09-12 | — | Initial ratification v1.0 | — | Ernesto Crespo |
| 2026-09-12 | Art. 3 | "Pixel-identical" is replaced by a string gate with zero tolerance plus three pixel thresholds, and the SSR/CSR gate is added | A single pixel threshold is either unenforceable or noisy; equality of normalised SVG is the noise-free gate that Art. 2 makes possible | Ernesto Crespo |
| 2026-09-13 | Art. 3 | Rounding in the normalised form aligned to 2 decimals, matching REQ-002 | REQ-002 was lowered to 2 decimals after the path-weight measurement; the article still said 3, contradicting the PRD | Ernesto Crespo |
| 2026-09-13 | Art. 3 | Vue added as a third supported framework; parity now compares each adapter against a canonical render rather than pairwise | A pairwise formulation costs one comparison per pair and does not survive a third adapter; a canonical reference makes the cost linear | Ernesto Crespo |
| 2026-09-13 | — | Stack constraints now separate supported frameworks from validated integrations | Vite was listed only as an example app, which left it ambiguous whether it was a third framework; it is a build tool, and the distinction is worth fixing in the one place nobody re-litigates | Ernesto Crespo |
| 2026-09-13 | — | Document converted to English | The project is an open-source library with an international audience | Ernesto Crespo |
| 2026-09-25 | — | Stack: TypeScript 5.9+ (6.x where a framework requires it); Vue floor 3.5 | Angular 22's compiler requires TypeScript 6.0; hydration-safe ids need Vue 3.5's `useId` (deltas 001, 005) | Ernesto Crespo |
| 2026-09-25 | Art. 3 | Parity covers normalised markup, wrappers included, and the fixture matrix admits compositions | The dashboard composition emits HTML around the charts; the gate must hold it to the same zero tolerance (feature-001, Analyze A-01) | Ernesto Crespo |
| 2026-09-26 | — | Planned grounds (non-normative): `cyanotype` ships in `0.2.0`; statuses name releases, not "v1" | The line stays on `0.x`; the second ground is what proves Art. 7 (delta-012) | Ernesto Crespo |

## Constitution check (use in every artifact)

At the close of every PRD, Technical Design, Data Model, Implementation Plan and Delta
Spec, include a 3-5 line section stating which articles apply and how they are met, or
which exception is requested and why. An exception without written justification is a
violation.
