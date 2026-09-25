# Changesets

The six packages — `@silverpoint/core`, `grounds`, `react`, `angular`, `vue` and `fonts` — are
released together with one version (TD §9), fixed as one group in `config.json`.

- **Every pull request that touches `packages/` adds a changeset**; CI fails without one
  (`tools/release/check-changeset.mjs`). With nothing to release, add an empty one.
- A change that alters the normalised SVG output is **never a patch** (TD §9): a minor with a
  prominent note, or a major if it also changes a prop.

```sh
pnpm --filter @silverpoint/release exec changeset          # add a changeset
pnpm --filter @silverpoint/release exec changeset --empty  # a change with nothing to release
pnpm --filter @silverpoint/release run version-packages    # the release commit: versions and changelogs
```

Publishing is `release.yml`'s, from CI with Trusted Publishing.
