# Delta 005 — Vue 3.5 floor

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-25 ("Apruebo los deltas puedes continuar"); fold into `specs/` when it is writable |
| **Affects** | Constitution stack table and PRD NFR Compatibility ("Vue 3.4+") |
| **Raised by** | Phase 0 final review, 2026-09-24 |

## Finding

Hydration-safe instance ids need `useId`, which Vue introduced in 3.5. Under 3.4 the only
available token is the component uid, a module-global counter that keeps growing across server
requests, so server and client derive different ids and seeds: a hydration mismatch (REQ-109).

## Proposal

Raise the Vue floor to 3.5 in the stack table and the compatibility NFR. `@silverpoint/vue`
already declares `vue: ^3.5.0`.

## Constitution check

- **Art. 3 / Art. 4** — same inputs, same ids and seeds on server and client.
- **Exception requested:** none.
