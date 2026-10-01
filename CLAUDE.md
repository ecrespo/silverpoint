# silverpoint — context for agents

Before proposing or writing any code in this repository, read
[`specs/constitution.md`](specs/constitution.md). Its nine articles are binding and every
proposal is validated against them.

## The three most often broken by inattention

1. **Art. 1** — the geometry of the encoding channel is exact. Hand inking touches only
   strokes that carry no data, and always with `preserveVertices: true`.
2. **Art. 2** — no maths in the adapters. If you are computing a scale or an arc outside
   `@silverpoint/core`, you are in the wrong place.
3. **Art. 4** — no `Math.random()` and no `Date.now()` on the render path. The seed is
   public and stable.

## Settled decisions — do not rediscover them

- Area fills use a **tile per tonal level** (`hatchFill: 'tile'`), not per-shape hatching.
  Measured: per-shape is 913 KB for a 12-card dashboard.
- The parity gate **parses and compares trees**; it never normalises strings. Each adapter is
  compared against the fixture's **canonical render**, never against a sibling adapter.
- **Nuxt is not** a validated integration: Vue SSR parity is verified with
  `@vue/server-renderer` directly.
- Typeface: **EB Garamond**, three cuts, self-hosted. **No monospace.**
- Coordinates carry **2 decimals**.
- The palette is **computed, not chosen by eye**: changing a colour requires recomputing
  contrast, and CI enforces it.
- Every white heightening carries an **ink outline** (REQ-031); without it, it fails contrast.
- **Frameworks: React, Angular and Vue.** Those three, and only those three, get an adapter
  package — they are the ones contributing a component layer.
- **Integrations: Vite, Next.js, Angular CLI.** A build tool is not a framework. Vite + React
  is React, Vite + Vue is Vue, and the Angular CLI runs on Vite. All three are validated with requirements of
  their own (REQ-033, REQ-034, REQ-103), not as demos.
- Specs are written in **English**, and so is everything else in this repository.

## Methodology

Spec-Driven Design, *spec-anchored*: `specs/` is the standing truth, `changes/` holds
active proposals. Work of medium-feature size or larger needs an approved spec before
implementation (Art. 9). Every MUST carries a `REQ-NNN`; every task and every test cites
the requirement it implements or verifies.

## Releasing the next version

The seven packages (`core`, `grounds`, `react`, `vue`, `angular`, `fonts`, `tailwind`) share **one
version** (Changesets `fixed` group) and are published **only by CI**, never by hand.

1. **Every change that touches `packages/` adds a changeset** on its branch (CI refuses a PR
   into `develop` without one):
   ```sh
   pnpm --filter @silverpoint/release exec changeset          # patch / minor / major + summary
   pnpm --filter @silverpoint/release exec changeset --empty  # nothing to release
   ```
   A change to the normalised SVG output is **never a patch**.
2. **Release commit, on `develop`.** It consumes the changesets, bumps all seven and writes the
   changelogs:
   ```sh
   pnpm --filter @silverpoint/release run version-packages   # NOT `exec changeset version`
   git add -A packages .changeset && git commit -m "chore(release): version packages X.Y.Z"
   git push origin develop                                   # directly, not as a PR
   ```
   Push it directly: as a PR, the changeset check would refuse it, because it deletes the
   changesets. Wait for `ci` on `develop` to be green.
3. **Publish:** `git push origin develop:main` (fast-forward). `release.yml` runs every CI gate,
   then `tools/release/publish.mjs` publishes the versions npm does not have yet, in dependency
   order, through npm Trusted Publishing with provenance (no token). It then tags `vX.Y.Z` and
   creates the GitHub release from `packages/core/CHANGELOG.md`. A push that bumps nothing
   publishes nothing, and re-running a failed release is safe.
4. **Verify** against the registry, not with `npm view`: the local `.npmrc` sets
   `minimum-release-age`, which hides fresh versions, and the registry index lags a few minutes.
   ```sh
   curl -s https://registry.npmjs.org/@silverpoint%2Freact/X.Y.Z -o /dev/null -w "%{http_code}\n"
   ```

**The line stays on 0.x** (user decision, 2026-09-25): the next release is **`0.3.0`**, a
changeset `minor` from `0.2.0`. Do not propose cutting `1.0.0` — it puts the API Spec in force, and
its changeset stays parked in `changes/release-1.0.0-changeset.md` until the user asks for it (then
move it back into `.changeset/`).
If a new package is added, it needs a trusted publisher on npmjs.com (GitHub Actions,
`ecrespo/silverpoint`, `release.yml`, environment `npm`) before its first CI release.

## Status

| Artifact | Status |
|---|---|
| Constitution | ✅ v1.7 — components join the charts (Arts. 1, 3, 5, 6; folded 2026-09-29); Art. 3 covers normalised markup (wrappers included, 2026-09-25); `cyanotype` ships in `0.2.0` (planned-grounds table, 2026-09-26) |
| PRD (EARS criteria) | ✅ v1.11 approved — 165 requirements, REQ-001..REQ-334 (§6.10 Dashboard; §6.11 UI components, REQ-300..334) |
| API Spec | ✅ v1.9 approved — the UI catalog (§7.2, 17 components), 33 charts + the Dashboard composition (§7.1), two built-in grounds (§6), 19 diagnostic codes, `@silverpoint/tailwind` (§1, §10.4) |
| Technical Design | ✅ v1.8 approved — 27 decisions, DD-001..DD-027 (DD-019: the `weight` tonal mechanism; DD-020: the Tailwind preset; DD-021..027: the UI layer) |
| Data Model | ✅ v1.6 approved — verified palettes (`silverpoint` §3, `cyanotype` §3.7), `ui` tokens §3.8, 22 invariants, dashboard layout §2.13, component value contracts §2.14 |
| Implementation Plan | ✅ v1.7 — Phases 0–4 by shared engine, Phase 5 (dashboard, `0.2.0`) and Phase 6 (UI components, `0.3.0`, steps 6a..6f) |
| Deltas | ✅ `changes/delta-001..011` folded 2026-09-25; `delta-012` (everything in `0.2.0`: `cyanotype`, REQ-220 per adapter, Angular SSR) and `delta-013` (`@silverpoint/tailwind`) folded and implemented 2026-09-26 |
| Feature-002 UI components | ✅ SDD gates 0..4 approved 2026-09-28 and **folded into `specs/` 2026-09-29**; **implemented** (steps 6a..6f, ledger in `changes/feature-002-ui-components/plan-and-tasks.md`, T-135..T-163): 17 `Sp`-prefixed components under `ui/` subpaths × 3 adapters, `@silverpoint/core/ui` and `/ui-demos`, `@silverpoint/grounds/ui.css`, 510 UI fixtures (180 PR), `/ui` page in the four example apps (e2e: keyboard, forms, motion, RTL, axe), docs-site UI section. Add a batch to the gates by adding it to `GATED_BATCHES` (tools) and `UI_GATED_BATCHES` (harness). **Open:** the manual NVDA/VoiceOver pass of T-159 (`a11y-audit.md`, section 2) needs Windows/macOS. Ships in `0.3.0`: changeset in `.changeset/`, not yet released. Decisions and concept corrections in `changes/feature-002-ui-components/analyze.md` |
| Feature-001 Dashboard | ✅ SDD approved and folded 2026-09-25; **implemented 2026-09-26** (T-106..T-122, ledger in `changes/feature-001-dashboard/plan-and-tasks.md`) |
| Implementation | ✅ Phases 0–6 implemented — 33 charts × 3 adapters, the Dashboard composition and the 17 UI components; ledgers in `changes/`. `0.3.0` awaits its release commit |
| Traceability | ✅ every MUST cited (154 of 154), 0 deferred, 0 blocking (`reports/traceability.md`); REQ-028 and REQ-047 implemented: nothing is deferred |
| Release | ✅ **0.2.0** on npm (2026-09-26), all seven packages (`@silverpoint/tailwind` new; its 0.1.1 was published by hand to register the name), from CI with provenance |

Where things stand:

- **Published:** `@silverpoint/*@0.2.0`, tag `v0.2.0` (2026-09-26): delta-011, feature-001,
  delta-012 and delta-013, released from `main` at `bae8132`. Every package, `tailwind`
  included, has its npm trusted publisher, so the next release is the steps above and nothing else.
  `1.0.0` stays parked.
- **Dashboard decisions to know.**
  - React hands a cell's context to its chart as a prop (`cloneElement`), because a React context
    would need a client boundary; Vue uses `provide`/`inject`; Angular uses the `SP_DASHBOARD_CELL`
    and `SP_DASHBOARD_LINK` tokens.
  - `DASHBOARD_DEMOS` live on `@silverpoint/core/dashboard-demos`, which keeps the core's full
    bundle under 45 kB.
  - Dashboard fixtures are `fixtures/dashboard/*.dashboard.json`, compared as trees by
    `tools/visual-gate/dashboard-gate.ts` (DD-017 rules) and by the pixel gate at 375, 800 and
    1280 px.
  - The Angular example app is server-rendered with `@angular/ssr` (`outputMode: 'server'`, one
    `'**'` route per request, `node dist/server/server.mjs`, `allowedHosts` localhost).
  - REQ-220 allows 2 KB over the one-chart build for React and Vue, 3 KB for Angular (its APF
    carries template and input metadata); CI measures the increment itself.
- **Ground decisions to know.** `cyanotype` (Data Model §3.7, DD-019) has one substrate,
  `prussian`, painted from the ground-wide CSS rule whatever `substrate` says. Its `WeightInker`
  sets the internal `Stroke.tonalWeight`, written as `data-weight`. `Stroke.weight` is a different,
  older field (BulletChart's target tick), so do not reuse it: doing so changes 48 canonicals. The
  fixture matrix is 1,782 nightly and 330 on PR, and the dashboard fixtures are 30.
- **Folded** (2026-09-25/26): deltas 001..012, feature-001 and the Art. 3 amendment are in `specs/`.
  When a Phase 5 requirement gets its test, remove it from the Deferred table of `specs/tasks.md`.
  `specs/` was read-only until 2026-09-26, when the user made it writable and chose to keep it so;
  edit it only for an approved change (Art. 9).
- The deferred minors from the phase reviews are closed or ruled (see the Phase 4 ledger).
  Nothing is deferred. `REQ-047` is `@silverpoint/tailwind` (delta-013, DD-020): a preset of names,
  with no dependencies and no peers, in the `fixed` group. **Its first version is published by hand**
  (`npm publish --provenance=false` from `packages/tailwind`, after `npm login`), only so that
  npm knows the name. The user then adds its trusted publisher, and CI publishes every later version.

Working rules:

- **Test-first** for every change. Cite the REQ it verifies, and mutation-check any test
  written after the code.
- `specs/` and the root `package.json` are **read-only** unless the user says otherwise. Put
  new dev tooling in a private `tools/*` workspace package.
- Before any claim of "done", run the CI steps from `.github/workflows/ci.yml`, in order. The
  `browser` job (gates, e2e, pixel gate) runs in the pinned Playwright image. Don't run the
  docker pixel gate and the local e2e at the same time.
