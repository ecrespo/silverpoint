---
'@silverpoint/mcp': patch
---

The agent catalog pins `reflex-silverpoint-react` 0.9.1's own Reflex catalog (it wraps 0.9.1, so no Reflex entry is stale any more) and joins its `sp_deck`: the deck's Reflex name, import and Python prop names. `generate_code { deck }` now writes Reflex code, and the skill and the `deck` guide name `sp_deck` instead of a pending `reflex-silverpoint-marp`. A Reflex catalog is stale only when it wraps another release line (major.minor), so a patch of silverpoint keeps the wrapper of its line current (#10).
