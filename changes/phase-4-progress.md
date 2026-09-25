# Phase 4 — execution ledger

Tasks: `changes/phase-4-tasks.md` (T-090..T-101). Every task test-first; tests cite REQs.
Base: Phase 3 closed at `e9bb182`.

| Task | State | Commit | Evidence |
|---|---|---|---|

## Rulings

- **T-091 · Ruling:** the 1,584 canonicals are committed, as the PR matrix's are (Data Model §5:
  the canonical is stored with the fixture) — measured at 11.9 MB of text — cost if wrong: repo
  weight; they could move to a nightly artifact.
- **T-097 · Ruling:** the documentation site is a Vite + React app in `docs/site`, consuming the
  published builds — Vite + React is a validated integration, so the site is one more consumer —
  cost if wrong: a site generator to swap; the pages are plain components.
