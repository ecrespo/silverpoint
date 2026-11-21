# Delta-018 — issues #25, #27, #28, #29

| Field | Value |
|---|---|
| **Status** | `APPROVED` — user decision 2026-11-21 ("fix these four issues before publishing 0.11"); **implemented and folded into `specs/` 2026-11-21** (PRD v1.19, API Spec v1.16, as amendments of the feature-007 versions, unreleased) |
| **Target release** | `0.11.0`, with feature-007 (#29 changes the normalised SVG output: never a patch, and 0.11.0 is already a minor) |
| **Issues** | #25 (enhancement), #27, #28, #29 (bugs) |
| **Touches** | PRD (REQ-669..REQ-672), API Spec §8.1 (`ChartHandle`), `@silverpoint/core`, `@silverpoint/grounds`, the three adapters, `@silverpoint/embed` |

## #29 — the SVG `<title>` gives a native tooltip (REQ-669)

**Cause.** The chart's root `<svg>` names itself with a `<title id="{id}-title">` child, referenced by
`aria-labelledby="{id}-title {id}-desc"`. Every desktop browser shows an SVG `<title>` as a native
tooltip, so Chrome draws it over the chart, next to silverpoint's own readout. #18 removed the host
attribute; the element remains.

**Change.** The element becomes `<desc id="{id}-title">`, carrying the same text. `aria-labelledby` is
unchanged, so the accessible name stays exactly the title followed by the description (REQ-120), the
dashboard's `article` keeps its `aria-labelledby="{chartId}-title"` (REQ-214), and an exported or
standalone file keeps its name inside the file. A `<desc>` is never shown as a tooltip. Rejected:
`aria-label` on the root (the `article` would lose the id it references, and every caller of the id
would change); an HTML element outside the SVG (an exported file would lose its name).

| ID | EARS | Priority |
|---|---|---|
| REQ-669 | THE SYSTEM SHALL name a chart's root `<svg>` through `aria-labelledby` without an SVG `<title>` element, so that no browser shows a native tooltip over a chart; the element carrying the name SHALL keep the id `{id}-title`. | MUST |

Every canonical render changes (one element name); no pixel changes. `0.11.0` is a minor.

## #28 — `SpTable` depends on stylesheet order (REQ-670)

**Cause.** `styles.css` styles the charts' tabular alternative with `.sp-table`, `.sp-table th`,
`.sp-table td` and `.sp-table caption`. `SpTable`'s wrapper is also `.sp-table` (a `div`), so those
rules reach it; `ui.css`'s `.sp-ui-table th/td` have the same specificity and win only when loaded later.

**Change.** `styles.css` scopes those rules to `table.sp-table`, the element the tabular alternative is
(`chart-root.ts`). What `SpTable` took from them with the right order —the display face, the 8 px top
margin and the italic caption— moves into `ui.css`, so its look does not change.

| ID | EARS | Priority |
|---|---|---|
| REQ-670 | No rule of `@silverpoint/grounds/styles.css` SHALL match an element of `SpTable`, so that `SpTable` computes the same styles whatever the order of `styles.css` and `ui.css`. | MUST |

## #27 — React dashboard charts keep the old theme after a hidden provider change (REQ-671)

**Cause, as traced.** Reproduced with Next.js 16.3.6 `cacheComponents: true` in a production build:
after the reveal, React re-renders `DashboardRoot` (it reads `SilverpointContext`) but never re-renders
the charts below it, which read the same context; their render function does not run. Not reproduced
with React 19.3 under `<Activity>` alone, nor with an explicit `<Activity>` in Next.js without
`cacheComponents`: the context change does not reach the hidden segment's consumers below a consumer
that re-renders with the same `children`.

**Change.** `DashboardRoot` provides the provider value it read to its children
(`<SilverpointContext.Provider value={provider}>`). When the root re-renders with a new value, React
propagates the change from the root down, and the charts render with it. Verified on the reproduction
(frame and charts follow together).

| ID | EARS | Priority |
|---|---|---|
| REQ-671 | WHEN React's dashboard root renders with a provider configuration, THE SYSTEM SHALL provide that configuration to the dashboard's charts and components from the root, so that they re-render with the root when the provider changes, also after the dashboard was hidden. | MUST |

## #25 — the standalone export from the handle (REQ-672)

**Change.** `ChartHandle` gains `toStandaloneSVGString(extraCss?: string): Promise<string>`, the same
in the three adapters: `standaloneSVG(toSVGString(), styles + extraCss)`, where `styles` is
`@silverpoint/grounds/styles-text` loaded by a dynamic `import()`, so a chart's build does not carry
the stylesheet (3.2 kB gzip) until the method is called. `toSVGString()` is unchanged.

The open questions of the issue, settled:

1. **Bundle size:** lazy, so the method is async; `rx.call_script` awaits a promise.
2. **Which stylesheet:** the package's `styles.css`, the same file everywhere (deterministic); the app's
   own overrides go in `extraCss`, appended after it.
3. **Palette and provider:** a palette is written as declarations on the root's `style` (REQ-461) and
   the ground as the root's class, both inside the markup, so both reach the file.
4. **Typeface:** not embedded; the file names EB Garamond and falls back to the reader's serif.

| ID | EARS | Priority |
|---|---|---|
| REQ-672 | THE SYSTEM SHALL expose on every chart's imperative handle, in the three adapters, `toStandaloneSVGString(extraCss?)`, resolving to the chart's `toSVGString()` with `@silverpoint/grounds/styles.css`, followed by `extraCss`, embedded as its first child (`standaloneSVG`), and SHALL load the stylesheet only when it is called. | MUST |

## Tests

| Requirement | Test |
|---|---|
| REQ-669 | core render tests (no `<title>` in the markup, `{id}-title` on a `<desc>`), the adapters' handle tests, the canonicals regenerated |
| REQ-670 | grounds: no selector of `styles.css` matches `SpTable`'s markup (each UI table fixture) |
| REQ-671 | react: `DashboardRoot` hands the provider it read to its children |
| REQ-672 | react, vue, angular: the handle resolves to `standaloneSVG(toSVGString(), styles + extra)` |

## As implemented

- **REQ-444 re-baselined at 0.11.0** (user decision 2026-11-21): #25 adds 300–370 B minified to every
  chart's build (React +302, Vue +366, Angular +329), and Angular's dashboard build already sat at
  exactly REQ-444's 2 000 B over 0.6.0. The record is `tools/bundle-budget/one-chart-0.11.0.json`, the
  allowance stays 2 KB. The budgets measure the static graph: `@silverpoint/grounds/styles-text` is
  ignored in every adapter entry, and a test holds that no adapter imports it statically.
- **#28** also moved into `ui.css` what `SpTable` took from `styles.css` (the 8 px top margin, the
  italic caption), so its look is unchanged; the REQ-301 hash of `styles.css` changed once, on purpose.
- **#29** regenerated every canonical (3 457 files: only the element name) and the embed's conformance
  hashes and HTML goldens; no pixel changes.
- **The docs site** (found by PR #30's browser job, not an issue): the hosts table on `#/embed` scrolls
  in its own region at 320 px (WCAG 1.4.10).
