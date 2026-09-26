# Delta 013 — `@silverpoint/tailwind`, the optional Tailwind preset (REQ-047)

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-26, who chose "Preset Tailwind (REQ-047)" as the new package: create it, publish its first version by hand, then configure its npm trusted publisher so CI releases the rest. Ships in `0.2.0`; **folded into `specs/` on 2026-09-26** |
| **Affects** | PRD §6.3 (REQ-047 names the package), §6.9 (REQ-160 lists it); API Spec §2, new §10.4; Technical Design new DD-020, §9; Implementation Plan step 5h; `specs/tasks.md` Deferred table |
| **Release** | Joins the Changesets `fixed` group at the group's version, so the next release (`0.2.0`) publishes it with the other six. Its first version is published by hand, only so that npm knows the name and a trusted publisher can be configured for it (CLAUDE.md, "If a new package is added") |

## Finding

REQ-047 (COULD) is the only requirement still deferred. It asks for a Tailwind preset in a
separate package that maps the `--sp-` variables to theme tokens, "without the core depending on it". Art. 8 and
REQ-043 forbid *requiring* Tailwind; a consumer who already uses it today writes
`bg-[var(--sp-substrate)]` by hand, and nothing tells them which variables are public.

## Proposal

**A package of data, with no dependencies.** `@silverpoint/tailwind` declares no `dependencies`
and no `peerDependencies`, not even `tailwindcss`. No other package depends on it. Tailwind never
enters a silverpoint consumer's dependency tree unless the consumer put it there. It maps the
public variables of API Spec §10.2 to tokens and nothing else. The values stay in
`@silverpoint/grounds`, so re-theming by variable (REQ-042) and switching grounds keep working
through the utilities.

**Two entry points, one set of names.**

| Tailwind | Entry point | How |
|---|---|---|
| 4.x | `@import '@silverpoint/tailwind/theme.css';` | `@theme inline { --color-sp-ink: var(--sp-ink); … }` |
| 3.4 | `presets: [require('@silverpoint/tailwind')]` (or `import`) | `theme.extend` with `var(--sp-…)` values |

Both give the same utilities:
- colours `sp-substrate`, `sp-ink`, `sp-ink-secondary`, `sp-heighten`, `sp-rule`, `sp-grid`,
  `sp-text`, `sp-text-muted`, as in `bg-sp-substrate`, `text-sp-ink` and `border-sp-rule`;
- the font `font-sp-display`;
- the radius `rounded-sp`.

The v4 file uses `@theme inline`, so each utility reads the variable where the element is, inside
the chart's ground and substrate. Under v3 a variable colour takes no opacity modifier; the
README says so.

**One source.** `src/tokens.ts` lists the mapping. The JS preset is built from it, and a test
holds `theme.css` equal to it. A second test holds every mapped variable to one that
`@silverpoint/grounds/styles.css` declares for **every** built-in ground. Real Tailwind compiles
both entry points in the tests (4.x through `@tailwindcss/node`, 3.4 through PostCSS), as
dev-dependencies of the package's tests only.

### PRD

- REQ-047 (COULD, wording unchanged) gains: "The preset is `@silverpoint/tailwind`."
- REQ-160 lists `@silverpoint/tailwind` (optional) beside `@silverpoint/fonts` (optional).

## Tasks

Task ids continue from T-131.

**[ ] T-132 · Specs** — Art. 9. Fold this delta; REQ-047 leaves the Deferred table.

**[ ] T-133 · The package** — REQ-047, REQ-043, REQ-160, REQ-163, REQ-164
- Test-first: mapping ⇔ `theme.css`; every variable is public in both grounds; Tailwind 4 and
  3.4 compile the utilities to `var(--sp-…)`; the manifest has no dependencies and no peers;
  nothing depends on it; the metadata gate, the README gate and a size budget cover it; the
  release tooling counts seven packages in one version.

**[ ] T-134 · Close** — changeset `minor`; README, CLAUDE.md; the manual first publish is the user's
step (npm login), then the trusted publisher.

## Constitution check

- **Art. 8.** Tailwind is not required. No package depends on the preset, and the preset depends
  on nothing. Theming still goes through custom properties: the preset only names them.
- **Art. 7.** The ground's values stay in `@silverpoint/grounds`. The preset holds names, not
  colours.
- **Art. 2 and Art. 3.** Untouched: no chart, adapter or SVG output changes.
- **Art. 9.** A delta, approved and folded before implementation.
- **Exception requested:** none.
