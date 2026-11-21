# Spec pack — `superset-plugin-chart-silverpoint`

| Field | Value |
|---|---|
| **Repository** | `github.com/ecrespo/superset-plugin-chart-silverpoint` |
| **Published as** | npm `superset-plugin-chart-silverpoint` |
| **Licence** | MIT |
| **Description** | Apache Superset visualization plugins that draw silverpoint charts. |
| **Draws with** | `@silverpoint/react` (a dependency), `@silverpoint/embed/hosts` for the binding |
| **Wave** | 0 (PoC on `@silverpoint/react` 0.10), then 1 |
| **Ids** | `SUP-REQ-nnn`, `SUP-DD-nn`, `SUP-T-nn` |
| **Status** | `APPROVED` gate-1 pack, 2026-11-20 (user decision); re-read against the released API in T-328 |

## Constitution

H-1..H-8, and:

- **SUP-Art. 1 — Superset queries, silverpoint draws.** Aggregation, filtering, sorting and row
  limits are the query's. `transformProps` binds columns to roles and does nothing else to the data.
- **SUP-Art. 2 — Superset's packages are peers.** `@superset-ui/core`, `@superset-ui/chart-controls`,
  `react` and `react-dom` SHALL be `peerDependencies`, at the ranges of the supported Superset
  versions, stated in the README.

Stack: TypeScript; React; the build of Superset's plugin generator; Jest or Vitest as the generator
gives; a Superset checkout in CI for the integration test.

## Scope

**In:** one `ChartPlugin` per tabular chart, a preset that registers them, generated control panels.
**Out:** dashboard cross-filters and drill-by in the first release (SUP-REQ-010 reserves them);
contributing upstream (the project prefers ECharts-based plugins).

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| SUP-REQ-001 | THE PACKAGE SHALL export one `ChartPlugin` class per chart of the pinned host catalog whose `binding` is not `none`, keyed `silverpoint_<slug>`, with name, description, category *Silverpoint* and tags from the catalog, and a thumbnail rendered from the chart's demo. | MUST |
| SUP-REQ-002 | THE PACKAGE SHALL export `SilverpointChartPreset`, which registers them all, and SHALL let an installer register a subset by slug. | MUST |
| SUP-REQ-003 | EACH PLUGIN'S control panel SHALL be generated from the host catalog: a *Query* section with one control per role (dimension roles as column controls, measure roles as metric controls, temporal roles with a time grain), an *Options* section from the chart's options, and an *Appearance* section (ground, substrate, mode, palette). | MUST |
| SUP-REQ-004 | `buildQuery` SHALL request the role columns and metrics as one query, with Superset's row limit and ordering controls. | MUST |
| SUP-REQ-005 | `transformProps` SHALL bind the query's rows to the chart's roles with `specFromTable`, naming metric columns by their labels, and SHALL pass the resulting props to the chart's `@silverpoint/react` component, loaded lazily by slug. | MUST |
| SUP-REQ-006 | THE CHART SHALL fill the width and height Superset gives it and redraw when they change. | MUST |
| SUP-REQ-007 | IF binding fails, THEN THE PLUGIN SHALL show Superset's standard chart error with the `SpecError`'s message. | MUST |
| SUP-REQ-008 | WHILE Superset's theme is dark or light, THE PLUGIN SHALL use `hostAppearance`'s result as the default appearance, overridden by the control panel. | SHOULD |
| SUP-REQ-009 | THE PACKAGE SHALL import the library's stylesheet and fonts once, from its own entry, without requiring a change to Superset's webpack configuration. | MUST |
| SUP-REQ-010 | WHERE the dashboard supports cross-filters, a later release SHOULD emit one on `onSelect` for charts with a single dimension role. | SHOULD |
| SUP-REQ-011 | CI SHALL build a Superset frontend of each supported version with the preset registered and run a browser test that creates a chart from the examples dataset and reads it by keyboard. | MUST |
| SUP-REQ-012 | CI SHALL run the conformance kit through the module entry the plugin resolves. | MUST |

## Design decisions

- **SUP-DD-01 — Classic plugin first** (silverpoint D7): an npm package registered in
  `MainPreset.js`, which needs a custom Superset frontend build. It is the documented, stable path.
- **SUP-DD-02 — One plugin per chart, generated.** Superset's chart gallery is a list of viz types;
  a single "Silverpoint" type with a chart picker would need a control panel that reshapes itself.
  `scripts/make-plugins.ts` writes `src/plugins/<slug>/{index,controlPanel,buildQuery}.ts` (H-3).
- **SUP-DD-03 — `.supx` is a PoC, not a plan.** SUP-T-02 answers whether Superset's Extensions
  framework can contribute a chart type at runtime. If yes, a second artefact is specified as a
  delta; if no, the finding is recorded and revisited each Superset minor.
- **SUP-DD-04 — React components, not the embed client.** Superset is React: the adapter gives
  server-free rendering inside its tree, its error boundaries and its sizing. The embed contributes
  only the DOM-free `/hosts` entry.

## Tasks

- [ ] **SUP-T-01** Split this pack into `specs/`; `CLAUDE.md`; scaffold with Superset's generator. Stop for review. *H-7*
- [ ] **SUP-T-02** PoC, on `@silverpoint/react` 0.10 and by hand: one plugin (`bar-chart`) in a local Superset; record the supported Superset versions, the stylesheet import that works (SUP-REQ-009), and whether a `.supx` can register a chart. Write `specs/poc.md`. *SUP-DD-01, SUP-DD-03*
- [ ] **SUP-T-03** `scripts/make-plugins.ts` and `--check`. *SUP-REQ-001, SUP-REQ-003, H-3*
- [ ] **SUP-T-04** `buildQuery`, `transformProps`, the lazy component map. *SUP-REQ-004, SUP-REQ-005, SUP-REQ-007*
- [ ] **SUP-T-05** Sizing, theme. *SUP-REQ-006, SUP-REQ-008*
- [ ] **SUP-T-06** The preset and subsets; thumbnails generated from demos. *SUP-REQ-001, SUP-REQ-002*
- [ ] **SUP-T-07** The integration job and the kit. *SUP-REQ-011, SUP-REQ-012, H-4, H-5*
- [ ] **SUP-T-08** README: installing into a Superset image (a Dockerfile); release `0.1.0` with provenance.

Deferred to a later release, with no task yet: SUP-REQ-010 (cross-filters).

## Open questions

- **SUP-OQ-1** Supported Superset versions (5.x? 6.x only?) — SUP-T-02.
- **SUP-OQ-2** Sixty viz types in the gallery: all, or a curated default set with the rest opt-in?

## Bootstrap prompt

````text
This repository will publish `superset-plugin-chart-silverpoint`: Apache Superset viz plugins drawing silverpoint charts with @silverpoint/react. Its design is in specs/spec-pack.md, written in the silverpoint repository (~/WebstormProjects/silverpoint/changes/feature-007-bi-hosts). Read the pack, that folder's README.md and repositories/README.md §3, and Superset's "Creating visualization plugins" page.

Do SUP-T-01 only: split the pack into specs/ without changing its content, write CLAUDE.md, scaffold the plugin with Superset's generator and make its build and tests pass untouched. Show me the tree and the build's output, then stop. SUP-T-02 is a PoC I want to review before anything is generated.
````
