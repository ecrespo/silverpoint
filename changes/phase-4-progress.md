# Phase 4 — execution ledger

Tasks: `changes/phase-4-tasks.md` (T-090..T-101). Every task test-first; tests cite REQs.
Base: Phase 3 closed at `e9bb182`.

| Task | State | Commit | Evidence |
|---|---|---|---|
| T-090 | done | (this commit) | 27 deferred minors triaged: 22 fixed test-first, 7 ruled (below). `close-out-minors.test.ts` RED 19 → GREEN (M1-M8, M-1..M-9; two tests corrected before any fix: an empty chart is `ready` with an `empty` label, and SP009 throws); M7 strengthened and mutation-checked (stacking disabled → red); traceability RED 2 → GREEN (skipped titles cite nothing; an empty PRD fails); pixel count guard mutation-checked (empty `FIXTURES` → 0 ≠ 264); markup-injection lint RED 5 → GREEN, then it caught the canonical page, rewritten with `DOMParser` + `importNode`; consumer id RED → GREEN (sanitised, SP002); React 18: the whole React suite runs on React 18.3 (385/385) as project `react-18`, with a guard mutation-checked (alias removed → 19 ≠ 18). Suite: vitest 3002/3002, lint, typecheck, traceability 99/99, size-limit, e2e 450/450, pixel 1068/1068; no canonical changed |

## Rulings

- **T-091 · Ruling:** the 1,584 canonicals are committed, as the PR matrix's are (Data Model §5:
  the canonical is stored with the fixture) — measured at 11.9 MB of text — cost if wrong: repo
  weight; they could move to a nightly artifact.
- **T-097 · Ruling:** the documentation site is a Vite + React app in `docs/site`, consuming the
  published builds — Vite + React is a validated integration, so the site is one more consumer —
  cost if wrong: a site generator to swap; the pages are plain components.
- **T-090 · Ruling:** Phase 0's `sideEffects` test rewriting the tracked `package.json` stands — the
  race it caused is closed by the gates' later group (Phase 3 ruling), and rewriting the real file is
  what it proves — cost if wrong: a test that edits a tracked file.
- **T-090 · Ruling:** the string gate compares the `<svg>` only, and React's server entry only: the
  table and overlay are checked per app by the e2e a11y suite (every fixture's table and readout),
  and the client entry's output by the hydration tests (no mismatch with the server's) — cost if
  wrong: a divergence in the table markup between adapters caught by e2e rather than the gate.
- **T-090 · Ruling:** the normaliser's `v-N` / `ngN` patterns stay: fixture ids are `<chart>--…`
  and never match them; a consumer id like `v-2` only meets the normaliser inside our own gates —
  cost if wrong: a false pass for a consumer who runs our normaliser over such ids.
- **T-090 · Ruling:** `adapter-boundary` stays at `Math.*`: arithmetic operators have legitimate
  adapter uses (indexes, `-1` sentinels), and Art. 2 is also held by review and the parity gates —
  cost if wrong: a computation slipping into an adapter until review.
- **T-090 · Ruling:** `process.env.NODE_ENV` stays as the production-strip switch: a `typeof process`
  guard would keep every warning in bundled production builds, which is worse; the quickstart
  (T-098) states that a bundler is required — cost if wrong: unbundled ESM use throws.
- **T-090 · Ruling (M-7):** orbit periods 0 and 1 both stay valid and coincide at 12 o'clock, as
  delta-009 reads 0-1 inclusive and a cycle's end is its start — cost if wrong: a half-open range
  to propose in delta-009 before it is approved.
- **T-090 · Ruling (M-10):** the orbit readout keeps the shared pattern (first column, one value);
  the period is in the table and the description, and markers are traversed in period order. Making
  the readout name two columns changes every chart's announcement — cost if wrong: keyboard users
  hear "orbit Inner, value 4" without the period; revisit with the API Spec's readout wording.
- **T-090 · Ruling (found on the way):** the examples are not typechecked by `pnpm -r typecheck`
  (no `typecheck` script); vite-react's `main.tsx` has union-JSX errors, and `vue-tsc` is absent.
  The canonical page's error was fixed with its rewrite; the rest goes to T-097, where the site
  meets the same pattern — cost if wrong: a type error in an example ships unseen (Vite does not
  typecheck).
