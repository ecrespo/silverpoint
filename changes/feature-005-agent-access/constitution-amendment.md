# Constitution amendment — v1.9 → v1.10 (proposed)

| Field | Value |
|---|---|
| **Status** | `APPROVED` — proposed and approved 2026-10-20 with gate 1; **folded into `specs/constitution.md` (v1.10) on 2026-10-20** (T-251) |
| **Articles** | Scope line; Art. 2 (addition) |

## 1. Scope line

> Scope: `silverpoint` monorepo — `@silverpoint/core`, `@silverpoint/react`,
> `@silverpoint/vue`, `@silverpoint/angular`, `@silverpoint/grounds`, example apps and
> documentation site.

becomes

> Scope: `silverpoint` monorepo — `@silverpoint/core`, `@silverpoint/react`,
> `@silverpoint/vue`, `@silverpoint/angular`, `@silverpoint/grounds`, `@silverpoint/mcp`, the
> `silverpoint` skill, example apps and documentation site.

*Rationale:* the server and the skill describe the library to agents; they belong to it, version
with it and are held to its articles. `@silverpoint/fonts` and `@silverpoint/tailwind` are already
in the fixed group without being named here; naming them is left to a separate editorial change.

## 2. Art. 2 — addition

Append to Art. 2:

> `@silverpoint/mcp` SHALL compute no geometry and no colour of its own: it SHALL render and
> validate only by calling `@silverpoint/core` and `@silverpoint/grounds`, as an adapter does, and
> its catalog SHALL be generated from the published types, never retyped.

*Rationale:* an agent shown a picture or a verdict the library would not produce is worse off than
one shown nothing.

## Unchanged

The "React, Angular and Vue only" decision stands: `@silverpoint/mcp` contributes no component
layer, so it is not a framework adapter. Art. 3 needs no text: REQ-543 holds the render to the
canonical one. Art. 8 is unchanged: the core's allowlist does not move.
