# Delta 003 — the client `locale` default

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-25 ("Apruebo los deltas puedes continuar"); **folded into `specs/` on 2026-09-25** |
| **Affects** | API Spec §5.1 (`locale` default) |
| **Raised by** | T-015, 2026-09-24 |

## Finding

API Spec §5.1: `locale` defaults to "`navigator.language` on the client, `'en'` on the server".
A server-rendered chart would then format its numbers with `'en'` and hydrate with, say,
`'es-ES'` — different text in the ticks and the table, which is a hydration mismatch (REQ-103,
REQ-109, and the SSR clause of Constitution Art. 3).

## Proposal

The default becomes the provider's `locale`, else `'en'`, identically on server and client.
A consumer who wants the browser's locale passes it once to the provider, where they can also
pass it to their server render.

## Constitution check

- **Art. 3 / Art. 4** — the same inputs produce the same markup on both sides.
- **Exception requested:** none.
