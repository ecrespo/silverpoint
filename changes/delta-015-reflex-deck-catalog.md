# delta-015 — the Reflex catalog's own export, and `sp_deck`

| Field | Value |
|---|---|
| **Status** | `FOLDED` — approved and folded 2026-11-01 (user decision 2026-11-01: staleness compares release lines) |
| **Found by** | issue #10, while updating `silverpoint_web` to `0.9.1` |
| **Amends** | PRD REQ-556, REQ-621, §5.2; API Spec §14.2, §14.3; Data Model §2.37, I-40; Technical Design DD-049; Implementation Plan Phase 10 |
| **SemVer** | `patch` — no change to the normalised SVG, to any fixture or to a public type; `@silverpoint/mcp` ships a new catalog and `generate_code { deck }` accepts `reflex` |

## Problem

The agent catalog pinned the interim Reflex catalog derived from `reflex-silverpoint-react` 0.7.1
(`wraps: 0.7.0`), so every Reflex entry was marked stale, and it said Reflex had no deck until a
separate `reflex-silverpoint-marp` shipped. Instead, `reflex-silverpoint-react` 0.9.0 shipped the deck
as `sp_deck`, and 0.9.1 exports its own `reflex-catalog.json` (`version: 0.9.1`, `wraps: 0.9.1`) with
the deck among its components.

Pinning that export ends the interim pin (`derived` unset), so REQ-556 applies strictly. Compared on
the exact version, the strict rule can never pass a release: the `0.9.2` catalog would see a wrapper
of `0.9.1` as stale, and the wrapper cannot wrap a version npm does not hold yet.

## Change

1. **REQ-556** compares *release lines* (major.minor): the Reflex catalog is stale when it wraps a
   silverpoint line other than the one the agent catalog describes. A patch release changes no name,
   prop or import the wrapper exposes (a surface change is never a patch), so the wrapper of a line
   stays current across its patches. I-40: `reflex.stale` is `!sameLine(reflex.wraps, version)`.
2. The pin is `reflex-silverpoint-react` 0.9.1's own export, from its GitHub release.
3. The catalog's `deck` section joins `sp_deck`: `names.reflex = 'sp_deck'`,
   `imports.reflex = 'reflex_silverpoint_react'`, and each prop's Python name. Both stay `''` when the
   pin holds no deck.
4. **REQ-621**: `generate_code { deck }` with `reflex` returns an `sp_deck` call — the Markdown
   embedded verbatim in a triple-quoted string, the page held in a `State` (`page=State.page`,
   `on_page_change=State.set_page`), the appearance inputs and `SpDeck`'s own props by their Python
   names. `sp_deck` imports the four stylesheets and installs `@silverpoint/marp` itself.
5. The skill's `references/deck.md`, its `reflex.md` names table and the `deck` guide name `sp_deck`.

## Tests

- `tools/agent-catalog/catalog.test.ts`: the pin is the 0.9.1 export, not interim, nothing stale;
  `sameLine`; a `0.9.2` catalog with a `0.9.1` wrapper passes `check --release` (REQ-556, I-40).
- `tools/agent-catalog/deck.test.ts`: the deck's Reflex name, import and Python prop names (REQ-619).
- `packages/mcp/test/generate-deck.test.ts`: Reflex code, the verbatim Markdown, props by Python
  name (REQ-621); `golden/reflex/deck.py`, checked by `check_golden.py` (REQ-557).
