# Analyze gate and traceability at the close of Phase 4 (T-100)

> REQ-183, REQ-184 · Implementation Plan §6. Run 2026-09-25 on `develop` after T-099 (`7323c2c`).

## Traceability over the whole PRD

`pnpm exec tsx tools/traceability/traceability.ts` → `reports/traceability.md`:

- **99 of 99 MUST** requirements are cited by at least one test (69 test files, e2e specs
  included); **0 deferred, 0 blocking** (REQ-184).
- No test cites an undefined requirement.
- Of the six requirements below MUST, four are cited by tests. The other two are deferred with a
  target in `specs/tasks.md` §"Deferred":

| REQ | Priority | Target | Reason |
|---|---|---|---|
| REQ-028 | SHOULD | After v1 | `tonalMechanism: 'weight'` belongs to the `cyanotype` ground, which is not in v1 |
| REQ-047 | COULD | After v1 | The Tailwind preset is a convenience, not a dependency |

The PRD holds 105 requirements: 99 MUST, 5 SHOULD, 1 COULD.

## The Analyze findings still open (B-01..B-05)

The fourth Analyze run (`specs/analyze.md`) left five LOW findings. Three of them change `specs/`,
which is read-only in this checkout, so they are carried with the edit they need.

| # | Finding | Disposition |
|---|---|---|
| B-01 | `api-spec.md` spells its version field `**API version**` | **Settled.** `tools/spec-check` accepts both spellings, so no document is skipped (`specs/analyze.md`, spec-check pass); it runs in `pnpm lint` on every PR |
| B-02 | Path-weight figures are KiB but written "KB" | **Carried.** The edit is to PRD §11 and DD-007: state the raw byte counts beside the figures. No code depends on the unit |
| B-03 | REQ-095 is the only `optional` pattern with `MUST` priority | **Carried.** The edit is a footnote to REQ-095 in the PRD: the feature is optional, implementing it is not. It is implemented and cited (`chrome: 'bare'` in the three adapters and the core contract) |
| B-04 | The spec corpus is duplicated in two repositories | **Carried to the user.** It is outside this repository. The proposal stands: this repository is canonical, and the planning folder becomes a pointer |
| B-05 | Nuxt is not validated while Next.js is | **Settled: it stands.** The Vue adapter exists and its SSR parity is verified with `@vue/server-renderer` directly (REQ-109; the `vite-vue` app is server-rendered and hydrates in the e2e suite). Nuxt adds a host, not a renderer; validating it stays out of v1 |

## The deltas

| Delta | Subject | Affects | Status |
|---|---|---|---|
| 001 | TypeScript 6 for the Angular 22 build | Constitution stack; TD §10 | `PROPOSED` |
| 002 | `tslib` in the Angular adapter's runtime allowlist | TD §5.3 | `PROPOSED` |
| 003 | The client `locale` default | API Spec §5.1 | `PROPOSED` |
| 004 | Interaction state in the Vue adapter | PRD REQ-108 | `PROPOSED` |
| 005 | Vue 3.5 floor | Constitution stack; PRD NFR Compatibility | `PROPOSED` |
| 006 | Heatmap column labels | API Spec §7 (REQ-084 row); Data Model §2.4 | `APPROVED` 2026-09-24; to fold into `specs/` |
| 007 | SP002 covers every value a chart cannot draw as given | API Spec §11 (`SP002`) | `APPROVED` 2026-09-24; to fold into `specs/` |
| 008 | The input shape of SparklineRows | Data Model §2.1, new §2.11 | `PROPOSED` |
| 009 | How OrbitChart's props read the Orbits shape | Data Model §2.10; API Spec §7 | `PROPOSED` |
| 010 | The input shape and the alignment of VolvelleChart | Data Model new §2.12; API Spec §7 | `PROPOSED` |

The code already behaves as every delta describes; each one records where the approved specs and
the implementation part ways. **`1.0.0` puts the API Spec in force (TD §9), so T-101 waits on the
user's decision on the eight `PROPOSED` deltas.** After approval, all ten are folded into
`specs/` once it is writable, together with B-02 and B-03.

## Result

No MUST requirement is uncited, and nothing blocks. The open items are all outside the code: three
spec edits (B-02, B-03, the deltas), one repository decision (B-04), and the deltas' approval
before `1.0.0`.
