# Constitution amendment — v1.11 → v1.12

| Field | Value |
|---|---|
| **Status** | `APPROVED` and **folded into `specs/` 2026-11-21** (T-329) — 2026-11-20 with gate 1 (user decision); in force when folded with the feature (T-329) |
| **Articles** | Scope line; Art. 2 (one addition); Art. 3 (one addition); Stack constraints (one row added) |

## 1. Scope line

> Scope: `silverpoint` monorepo — `@silverpoint/core`, `@silverpoint/react`,
> `@silverpoint/vue`, `@silverpoint/angular`, `@silverpoint/grounds`, `@silverpoint/marp`,
> `@silverpoint/mcp`, the `silverpoint` skill, example apps and documentation site.

becomes

> Scope: `silverpoint` monorepo — `@silverpoint/core`, `@silverpoint/react`,
> `@silverpoint/vue`, `@silverpoint/angular`, `@silverpoint/grounds`, `@silverpoint/embed`,
> `@silverpoint/marp`, `@silverpoint/mcp`, the `silverpoint` skill, example apps and documentation
> site. Host integrations —repositories of their own that draw silverpoint charts inside another
> product— are outside this scope and bound to it by the rule of Art. 2.

*Rationale:* the embed package is the engine in another wrapping and versions with it; the host
integrations are not this project's code, but what they draw is this project's picture.

## 2. Art. 2 — addition

Append to Art. 2, after the paragraph on `@silverpoint/marp`:

> `@silverpoint/embed` SHALL compute no geometry and no colour of its own: it SHALL render only by
> calling `@silverpoint/core` and `@silverpoint/grounds`, and its client SHALL translate their output
> into nodes and forward events to the core's interaction reducer, as an adapter does. A host
> integration SHALL draw only through `@silverpoint/embed` or through an adapter package, unmodified,
> and SHALL NOT restyle, re-ink or redraw what they return.

*Rationale:* a chart in a report must be the same chart as in an app. A host that redraws "in the
style of" silverpoint is a second engine with this project's name on it.

## 3. Art. 3 — addition

Append, after the paragraph on third-party widgets:

> `@silverpoint/embed`'s client is held to the same gate as an adapter: the nodes it builds,
> serialised and normalised, SHALL equal the canonical chart root for the same input, with zero
> tolerance. It is not a fourth framework: it contributes no component layer and gets no example app
> of its own among the validated integrations.

*Rationale:* the comparison against a canonical render made a fourth comparison cost one; without it
the client is the unchecked copy R3 of the research describes.

## 4. Stack constraints — one row added

| Area | Decision |
|---|---|
| Host targets | A product that embeds charts —a BI tool, a workflow tool, a notebook, a server-rendered web framework, a CMS— is reached through `@silverpoint/embed` or an adapter, from a repository of its own. Hosts are **not** validated integrations of this repository: each host repository validates itself against the conformance kit this repository publishes |

## Unchanged

- **Supported frameworks** stand at three. The embed client is a DOM binder like
  `@silverpoint/marp/client`, not a framework adapter.
- **Art. 4** needs no text: the embed's ids derive from the spec's `id` or the chart's slug, never
  from time or chance; the standalone file is the same bytes for the same sources.
- **Art. 5** needs no text and gets no exception: the embed client carries the accessible role and
  name, the tabular alternative, keyboard navigation and automatic precision mode (REQ-638, REQ-641).
- **Art. 8** needs no text: `@silverpoint/embed` adds no runtime dependency to the core's allowlist
  and no CSS framework; the standalone file is an artefact of the build, not a dependency.
- **Language** stays TypeScript here. Python, and each host's own language, live in the host
  repositories.
