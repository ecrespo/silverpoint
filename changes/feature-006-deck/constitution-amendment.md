# Constitution amendment — v1.10 → v1.11

| Field | Value |
|---|---|
| **Status** | `FOLDED` — approved 2026-10-31 with gate 1; folded into `specs/constitution.md` v1.11 on 2026-10-31 (T-289) |
| **Articles** | Scope line; Art. 2 (two additions) |

## 1. Scope line

> Scope: `silverpoint` monorepo — `@silverpoint/core`, `@silverpoint/react`,
> `@silverpoint/vue`, `@silverpoint/angular`, `@silverpoint/grounds`, `@silverpoint/mcp`, the
> `silverpoint` skill, example apps and documentation site.

becomes

> Scope: `silverpoint` monorepo — `@silverpoint/core`, `@silverpoint/react`,
> `@silverpoint/vue`, `@silverpoint/angular`, `@silverpoint/grounds`, `@silverpoint/marp`,
> `@silverpoint/mcp`, the `silverpoint` skill, example apps and documentation site.

*Rationale:* the deck package renders the library's charts and grounds inside slides and versions
with it in the `fixed` group; it is held to the articles like every other package.

## 2. Art. 2 — additions

Append to Art. 2, after the paragraph on `@silverpoint/mcp`:

> `@silverpoint/marp` SHALL compute no geometry and no colour of its own: the charts of a slide and
> its inked backdrop SHALL be rendered by `@silverpoint/core` and `@silverpoint/grounds`, and the
> deck package SHALL only parse Markdown, place their output and keep the deck's state.

and amend the `@silverpoint/mcp` sentence to read "…only by calling `@silverpoint/core`,
`@silverpoint/grounds` and, for decks, `@silverpoint/marp`, as an adapter does…".

*Rationale:* a chart in a slide must be the same chart as anywhere else; if the deck package drew
it, there would be two engines again.

## Unchanged

- **Supported frameworks** stand: `@silverpoint/marp` contributes no component layer; the deck
  components live in the three existing adapters, on a `deck` subpath.
- **Validated integrations** stand: Marp CLI and the Marp VS Code extension are documented
  degradation targets for the theme file, not integrations.
- **Art. 3** needs no text: the deck's markup is wrapper markup the library emits, already covered.
  The Markdown the author writes is the deck's data, like a chart's rows.
- **Art. 8** needs no text: Marpit (and postcss under it) is a Markdown engine, not a CSS framework;
  it is a dependency of `@silverpoint/marp` only, listed in the TD allowlist (§5.3), and the core's
  allowlist does not move. The adapters take `@silverpoint/marp` as an optional peer.
- **DD-010** stands: no monospace; code in slides is set in EB Garamond.
