# Implementation Plan and Tasks — Phase 9, agent access

> Source specs: [`prd-delta.md`](prd-delta.md) §6.14 (REQ-530..REQ-569) · [`api-delta.md`](api-delta.md)
> · [`technical-design-delta.md`](technical-design-delta.md) DD-044..DD-050 ·
> [`data-model-delta.md`](data-model-delta.md) §2.28..§2.31. Generated: 2026-10-20. Task ids continue
> the global sequence after T-225.

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 4, drafted and approved 2026-10-20 |
| **Branch** | `feat/silverpoint-0.8` (off `develop`); sibling branches in `reflex-silverpoint-react` and `silverpoint_web` |
| **Prerequisite** | `reflex-silverpoint-react` 0.7.1 released (wraps `@silverpoint/react` 0.7.0; research §3) |

**Goal.** An agent connected to `https://silverpointweb.vercel.app/mcp`, or with the `silverpoint`
or `reflex-silverpoint` skill installed, picks a fitting chart, writes code that compiles in React,
Vue, Angular or Reflex, validates it with the core and sees the canonical render — all from one
catalog generated from the types.

**Done criteria (Phase 9)**
- Every MUST of REQ-530..REQ-569 cited by a test; traceability 0 blocking.
- `agent-catalog.json` regenerated in CI with no diff; `render_chart` parity green over the PR matrix.
- MCP smoke test green against the built handler and against the deployed URL.
- Both skills generated, their examples type-checked, both plugin manifests installable.
- The site serves `/mcp`, `/agent-catalog.json`, `/llms.txt`, `/llms-full.txt`, `/docs/ai`, and stays static.
- Released as `0.8.0` (changeset `minor`) from CI; deltas folded; `CLAUDE.md` status in the three repos.

**Carried rules.** Test-first; cite the REQ; mutation-check any test written after the code. Every
change touching `packages/` adds a changeset. Skills and everything else in English.

## Phases

| Step | Content | Repository | Depends on | Exit |
|---|---|---|---|---|
| 9a | Agent catalog: move the props pipeline, chart metadata, generator, checks | silverpoint | approval | catalog generated; I-37..I-42 tested |
| 9b | Reflex catalog export, its CI check, the pin here | reflex-silverpoint-react → silverpoint | 9a (schema) | `reflex-catalog.json` round-trips; REQ-556 tested |
| 9c | `@silverpoint/mcp`: catalog tools, recommender, codegen, resources, stdio | silverpoint | 9a | contract tests; codegen golden files type-check |
| 9d | `validate_props`, `render_chart` (+ PNG if OQ-E4), `check_palette` | silverpoint | 9c | parity over the PR matrix (REQ-567); budgets REQ-559 |
| 9e | HTTP handler, `apps/mcp-vercel`, limits; site rewrite, `/llms*.txt`, `/agent-catalog.json`, `/docs/ai` | silverpoint, silverpoint_web | 9d | smoke test local and deployed (REQ-568) |
| 9f | Skills: `silverpoint` and `reflex-silverpoint`, generators, examples check, plugin manifests | silverpoint, reflex-silverpoint-react | 9a, 9b, 9c | examples type-check (REQ-557); install tested in Claude Code |
| 9g | README, docs-site page, changeset, fold deltas, `CLAUDE.md` × 3 | all three | 9e, 9f | ready for the `0.8.0` release commit |

**First run: T-226..T-231** (9a and 9b), then review the catalog before building on it.

## Tasks

### 9a — Agent catalog

- [x] **T-226** Move `docs/site/scripts/props.ts` to `tools/agent-catalog/props.ts`; the docs site imports it; `props.json` unchanged byte for byte. *REQ-530*
- [x] **T-227** `charts.meta.ts`: family, summary, `DataSpec`, intents for the 60 charts, families reconciled with the site and the Reflex `FAMILIES`. Tests: I-41, every chart present. *REQ-531, REQ-536*
- [x] **T-228** `generate.ts` → `packages/mcp/agent-catalog.json` (Data Model §2.28), names by the API Spec rule, defaults from JSDoc, diagnostics from `diagnose.ts`, palettes, grounds, stylesheets; stable order. *REQ-530..REQ-534*
- [x] **T-229** `check.ts` + CI job: regenerate and diff; I-37, I-38, I-39. *REQ-535, REQ-536*

### 9b — Reflex catalog

- [ ] **T-230** (reflex-silverpoint-react) `scripts/export_catalog.py` → `reflex-catalog.json` (§2.30); test: every builder in `__all__` present, `wraps == SILVERPOINT_VERSION`; attach to releases. *REQ-534, REQ-553*
- [ ] **T-231** `pnpm agent-catalog:pull-reflex <version>`; join by slug into `PropEntry.reflex` and `names.reflex`; I-40 and the release-build failure. *REQ-556*

### 9c — The server, read-only tools

- [x] **T-232** `packages/mcp` scaffold in the fixed group: `createServer`, stdio bin, `get_version`, catalog loading; trusted publisher noted for the first release. *REQ-538, REQ-550*
- [x] **T-233** `list_charts`, `get_chart`, `list_components`, `get_component`, `search_catalog`; error contract with suggestions. *REQ-539, REQ-549, REQ-566*
- [x] **T-234** `recommend.rules.ts` + `recommend_chart`; golden tables; I-42. *REQ-540*
- [x] **T-235** `generate_code` for react, vue, angular, reflex; golden outputs compiled in the example apps and in a Reflex check; no `SpButton` trigger. *REQ-541, REQ-547, REQ-557*
- [x] **T-236** Resources (catalog, charts, components, diagnostics, guides) and the two prompts. *REQ-546, REQ-548*

### 9d — Validation and render

- [ ] **T-237** `validate_props` with the capturing sink; tests per `SP` warn and error code reachable from props. *REQ-542*
- [ ] **T-238** `render_chart` (SVG) with the inlined stylesheet and font fallback; limits. *REQ-543, REQ-560*
- [ ] **T-239** Parity job: every PR-matrix chart fixture through `render_chart` vs its canonical. *REQ-567*
- [ ] **T-240** `check_palette`; PNG output and `embedFonts` per OQ-E3/E4; latency bench for REQ-559. *REQ-544, REQ-545, REQ-559*

### 9e — Hosting and the site

- [ ] **T-241** `http.ts` stateless Streamable HTTP; body, row and string limits before any work; no body logging; optional rate limit. *REQ-538, REQ-560..REQ-562*
- [ ] **T-242** `apps/mcp-vercel` + deployment; MCP smoke test in CI against the built handler and post-deploy against the URL. *REQ-558, REQ-568*
- [ ] **T-243** (silverpoint_web) `vercel.json` rewrite `/mcp`, catch-all exclusion, `/agent-catalog.json`, `/llms.txt`, `/llms-full.txt` generated at export from the catalog. *REQ-537, REQ-558, REQ-564*
- [ ] **T-244** (silverpoint_web) `/docs/ai` page: URL, client configs, skills, `npx`; no `rx.State`. *REQ-565*

### 9f — Skills

- [ ] **T-245** `skills/silverpoint`: templates (SKILL.md ≤ 500 lines, pitfalls, framework guides) + generated references; version stamp; "prefer the MCP" rule. *REQ-552, REQ-554, REQ-563*
- [ ] **T-246** (reflex-silverpoint-react) `skills/reflex-silverpoint` from `reflex-catalog.json` with `scripts/make_skill.py`; state/event guide from the demo app. *REQ-553, REQ-554*
- [ ] **T-247** Example extraction and type-check in both repositories' CI. *REQ-557*
- [ ] **T-248** `.claude-plugin/marketplace.json` in both repositories (skill + `.mcp.json` → hosted URL); install tested in Claude Code. *REQ-555*

### 9g — Documentation and release

- [ ] **T-249** `@silverpoint/mcp` README and the docs-site agent page, tool lists generated from the server. *REQ-569*
- [ ] **T-250** Changeset `minor` (`0.8.0`); `CLAUDE.md` status here, in reflex-silverpoint-react and silverpoint_web.
- [ ] **T-251** Fold the deltas into `specs/` (PRD v1.14, API v1.12, TD v1.11, DM v1.9, constitution v1.10); traceability report.

## Ledger

### 9a — agent catalog (2026-10-20, branch `feat/silverpoint-0.8`)

- T-226 — `docs/site/scripts/props.ts` moved to `tools/agent-catalog/props.ts`; the docs site's
  generator and test import it; `props.json` byte for byte the same after the move. Then one fix,
  test-first (REQ-416..418): the reader follows a props interface's local `extends`
  (`HierarchyChartProps`), so `SquarifiedTreemap`, `SunburstChart` and `TreeChart` list `idKey`,
  `parentKey` and `labelKey`, which the docs pages had been missing; `props.json` regenerated.
- T-227 — `charts.meta.ts` (60 rows) and `components.meta.ts` (38 one-line summaries).
- T-228 — `catalog.ts` + `generate.ts` → `packages/mcp/agent-catalog.json` (245 KB, `0.7.0`):
  names by the API Spec rule, Angular names read from the adapters' selectors, defaults from the
  core's own fallback literals (`props.x ?? 'literal'`), API Spec §5.1 and the JSDoc; bindings,
  events and slots read from the three adapters' sources (`adapters.ts`); diagnostics read from
  `diagnose.ts`'s tables without running it; palettes and grounds from the packages.
- T-229 — `check.ts` (`pnpm --filter @silverpoint/agent-catalog check [--release]`) and its CI
  step in `ci.yml` (`checks`, before the build). 30 tests in `tools/agent-catalog/catalog.test.ts`,
  mutation-checked (release gate, stale join, Vue binding, I-41 check, export direction).
- T-231 (interim) — The Reflex pin `tools/agent-catalog/reflex/reflex-catalog.json` is derived by
  `tools/agent-catalog/reflex/derive.py` from `reflex-silverpoint-react` `feat/silverpoint-0.7.0-native`
  (`dbd7e76`, `0.7.1`, wraps `0.7.0`), reading its sources with `ast`, never importing them; the file
  says so in `derived`. `joinReflex` joins it by slug and JS prop name, I-40 and the `--release`
  failure are tested. When T-230 lands there, the pin is replaced by its export. The root
  `package.json` is read-only, so the pull is `pnpm --filter @silverpoint/agent-catalog …`, not
  `pnpm agent-catalog:pull-reflex`.

*Amended in implementation* (Data Model §2.28..§2.30, to fold at T-251):

- **Families** (§2.29, fixed at T-227): the nine the site and the Reflex wrapper already show,
  slugged as the site's anchors — `lines`, `bars`, `areas`, `points-grids`, `flows`, `radial`,
  `distributions-comparisons`, `hierarchies-dimensions`, `fields-networks` — not the provisional list;
  `AgentCatalog.families` carries slug and title.
- `DataField.type` adds `array` (a sparkline's points, a heatmap row's values, an orbit's markers).
- `ChartEntry.demo` is optional (`GaugeArc`, `MeterChart` draw from props alone) and names a
  constant of the core's sources, not a public export (only `LINE_CHART_DEMO` is public);
  `demoKeys` and `demoSample` (the demo's first three rows) show the data by example.
- `ComponentEntry.events` and `slots` are per framework (`react`, `vue`, `angular`): a Vue `emits`
  and an Angular `output` are not React handler names. `binding` is set only when all three adapters
  bind it. `states` is carried from `UI_COMPONENTS`.
- A stale Reflex catalog marks each chart and component entry `stale: <wrapped version>` (REQ-556).
- `ReflexCatalog` gains the optional `derived` and `common` (the shared props' Python names).
- Component summaries live in `components.meta.ts`: the core's component types carry no summary.

### 9c — the server, read-only tools (2026-10-20, branch `feat/silverpoint-0.8`)

- T-232 — `packages/mcp` (`@silverpoint/mcp`, eighth package of the `fixed` group, `minor` changeset
  → `0.8.0`): `createServer()`, `AGENT_CATALOG`, the types; `bin: silverpoint-mcp` over stdio
  (shebang from `src/bin.ts`; tsup splitting keeps the catalog in one shared chunk). Allowlisted in
  `check-deps.mjs` with core, grounds, `@modelcontextprotocol/sdk` 1.32.1 and zod 4 — no framework.
  The release, README and dependency tests now count eight packages. `mcp` vitest project, run in CI.
  **Before the first CI release** the package needs its npm trusted publisher (and, as for
  `tailwind`, a first hand publish so npm knows the name).
- T-233 — `list_charts`, `get_chart`, `list_components`, `get_component`, `search_catalog`
  (`src/tools/`); names resolve by slug or any framework's name, case and separators ignored; every
  unknown name is a `ToolError` with up to three closest names (head distance first, so `sankie` →
  `sankey-chart`). Enum-like inputs are strings in the schemas, checked by the tools, so a typo gets
  suggestions instead of a protocol error.
- T-234 — `recommend_chart` over `recommend.rules.ts`: rule candidates plus adjustments; charts
  outside the rule that fit shape and intent score 0.25, intent only 0.15, shape only 0.1 — below
  every curated score; ties by catalog order; top five. Golden table in `test/recommend.test.ts`.
  Three rules tuned against it (lollipop past 12 rows +0.2, treemap past 6 rows +0.1, histogram
  under 30 rows −0.2) to remove ties; `stacked-bar-chart` added to `parts/part-to-whole`.
- T-235 — `generate_code` (`src/codegen/`): a plan resolved against the catalog, then four
  spellings. 40 golden files (`test/golden/`, 10 cases × 4 frameworks) compiled by
  `pnpm --filter @silverpoint/agent-catalog typecheck-golden` in the example apps (`tsc`, `vue-tsc`,
  `ngc` with `strictTemplates`); Reflex goldens checked by `reflex/check_golden.py` against the
  pinned Reflex catalog (builders and keywords). CI step after `pnpm -r run typecheck`. The check
  was mutation-tested in all four frameworks. Overlays take a native `<button type="button">`
  (Angular `spTrigger`, Reflex `trigger="…"`), never `SpButton` (REQ-547).
- T-236 — Resources `silverpoint://catalog`, `silverpoint://diagnostics`,
  `silverpoint://charts/{slug}`, `silverpoint://components/{slug}` and the prompts `choose-chart`,
  `build-dashboard`; contract tests through a real MCP client over `InMemoryTransport`
  (`test/server.test.ts`). `silverpoint://guides/{topic}` waits for the skill's references (9f).

*Amended in implementation*:

- `AgentCatalog.recommend` carries the rule table (Data Model §2.31); I-42 checks its slugs.
- `ComponentEntry.demo`: the first `UI_DEMOS` state's props, the start of generated component code.
- `./http` is not exported until T-241 (9e).
- Every Angular input is written as a binding (`[title]="'…'"`): `strictTemplates` checks bindings,
  never static attributes, and the golden check proved a misspelt static attribute passes.
- A ground with a single substrate (cyanotype's `prussian`) writes no `substrate`: the typed
  `SubstrateName` does not hold it, and the ground paints it whatever `substrate` says.
- A palette preset is imported from `@silverpoint/core/palettes`, so the Vue and Angular example
  apps now depend on `@silverpoint/core`, as the React one already did; the generated notes say so.
- The interim Reflex derivation reads the `SilverpointChart` base class too: `palette`, `tooltip`,
  `on_active_change` and `on_select` were missing from its shared chart props.
- `@silverpoint/mcp` has no size-limit budget: it is a Node server, not a browser bundle; its cost
  is REQ-559's latency, measured in 9d.

