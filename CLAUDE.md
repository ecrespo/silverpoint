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

The six packages (`core`, `grounds`, `react`, `vue`, `angular`, `fonts`) share **one
version** (Changesets `fixed` group) and are published **only by CI**, never by hand.

1. **Every change that touches `packages/` adds a changeset** on its branch (CI refuses a PR
   into `develop` without one):
   ```sh
   pnpm --filter @silverpoint/release exec changeset          # patch / minor / major + summary
   pnpm --filter @silverpoint/release exec changeset --empty  # nothing to release
   ```
   A change to the normalised SVG output is **never a patch**.
2. **Release commit, on `develop`.** It consumes the changesets, bumps all six and writes the
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

**`1.0.0`** puts the API Spec in force. Its changeset waits in
`changes/release-1.0.0-changeset.md`; move it back into `.changeset/` to cut it.
If a new package is added, it needs a trusted publisher on npmjs.com (GitHub Actions,
`ecrespo/silverpoint`, `release.yml`, environment `npm`) before its first CI release.

## Status

| Artifact | Status |
|---|---|
| Constitution | ✅ v1.4 ratified |
| PRD (EARS criteria) | ✅ v1.7 approved — 105 requirements, REQ-001..REQ-184 |
| API Spec | ✅ v1.5 approved — 33 components, 13 diagnostic codes |
| Technical Design | ✅ v1.4 approved — 12 decisions, DD-001..DD-012 |
| Data Model | ✅ v1.3 approved — verified palette, 9 invariants |
| Implementation Plan | ✅ v1.3 — 5 phases grouped by shared engine |
| Tasks | ✅ Phase 0 — 29 tasks, supervised first batch T-001..T-004 |
| Analyze | ✅ Fourth run — **READY TO IMPLEMENT**, 5 LOW findings open |

Next step: Phase 0, starting with T-001. Run the first batch (T-001 to T-004), review, then
scale. Phase 0 has a stop condition — see the Implementation Plan.
