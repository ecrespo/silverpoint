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

## Releasing

1. On `develop`, run `version-packages`. It consumes the changesets, bumps the six packages and
   writes their changelogs. Commit that as the release commit and push it to `develop` directly:
   the changeset check would refuse it as a pull request, because it deletes the changesets.
2. Merge `develop` into `main`.
3. `release.yml` runs every CI gate, publishes the versions npm does not have yet
   (`tools/release/publish.mjs`, npm Trusted Publishing with provenance), tags `v<version>` and
   creates the GitHub release from the changelog. A merge that bumps nothing publishes nothing.

The `1.0.0` changeset that puts the API Spec in force waits in
`changes/release-1.0.0-changeset.md`. Move it back into `.changeset/` to cut `1.0.0`.
