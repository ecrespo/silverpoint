# delta-017 — the Reflex pin follows the library

| Field | Value |
|---|---|
| **Status** | `FOLDED` 2026-11-15 — approved by the user 2026-11-15 |
| **Found by** | preparing `0.10.0`: REQ-556 refused the release until `reflex-silverpoint-react` had a `0.10` export, and the wrapper cannot have one before `@silverpoint/*@0.10.0` is on npm |
| **Amends** | PRD v1.17 → v1.18 (REQ-556); Data Model v1.12 → v1.13 (I-40); Technical Design v1.14 → v1.15 (DD-049) |
| **SemVer** | none of its own — tooling and specs; it ships with `0.10.0` |

## The problem

Since delta-015 the pin is the wrapper's own export and a release build fails when it wraps another
release line. The wrapper is built on the published library, so the two repositories depend on each
other in a circle whenever the library opens a line: neither can release first.

## The change

- `check --release` **warns** when the Reflex catalog wraps the release line immediately before the
  catalog's, in the same major (`followsLine` in `tools/agent-catalog/versions.ts`). The catalog is
  still marked `stale`, with the version it wraps, on every Reflex entry and in `get_version`.
- Two or more lines behind, a line ahead, or another major still **fails**: that is a wrapper that
  stopped following, not one that is about to.
- The order of a minor is now: the library releases `X.Y.0`; the wrapper releases on that line; the
  library pins the wrapper's export in a patch (`X.Y.1`), which clears `stale`.

## Constitution check

- **Art. 9** — approved by the user before implementation; folded the same day.
- No package source changes; the generated catalog is unchanged until the version moves.
