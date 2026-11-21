# Prompts for the sibling repositories

Feature-007's work that lives outside this repository, as prompts for a Claude Code session opened in
each one. The eight **new** repositories have their own bootstrap prompts in
[`repositories/`](repositories/README.md); this file covers the two that already exist.

| Repository | Work | When |
|---|---|---|
| `reflex-silverpoint-react` | Follow the `0.11` line; no API change | After `@silverpoint/*@0.11.0` is on npm |
| `silverpoint_web` | A hosts page; `/host-catalog.json` | After `0.11.0` |

## `reflex-silverpoint-react`

Analysis (2026-11-20, at `f904ea2`, wrapping 0.10.0): this feature adds nothing the wrapper must wrap.
`@silverpoint/embed` is not a React component and Reflex apps keep using `@silverpoint/react` through
the wrapper. Two consequences, both mechanical:

1. **The release line.** `0.11.0` opens a line, so by delta-017 the library is released with the
   Reflex pin one line behind (`stale`, a warning), the wrapper follows, and the library pins the
   wrapper's export in `0.11.1`.
2. **A sentence in the README.** There will be two Python packages with "silverpoint" in the name.
   `reflex-silverpoint-react` is for Reflex apps; `silverpoint` (PyPI) is for notebooks, Flask,
   Django, KNIME and Plone. Neither depends on the other.

````text
silverpoint 0.11.0 is published (feature-007: @silverpoint/embed, the host catalog). It changes nothing in @silverpoint/react's API. Bring this repository onto the 0.11 line.

Read first: AGENTS.md here, and in ~/WebstormProjects/silverpoint: changes/delta-017-reflex-pin-follows.md and changes/feature-007-bi-hosts/sibling-prompts.md.

On a branch `chore/silverpoint-0.11.0` off `develop`:
1. Set SILVERPOINT_VERSION and every npm version in base.py to 0.11.0; set the package version to 0.11.0 in pyproject.toml and both .claude-plugin/*.json files.
2. Run `uv lock`, `uv run python scripts/make_stubs.py`, `uv run python scripts/export_catalog.py`, `uv run python scripts/make_skill.py`. Show me the diff of reflex-catalog.json: I expect only `version` and `wraps` to change. If anything else changes, stop and tell me what and why.
3. Add one paragraph to README.md, under the installation section, distinguishing this package from `silverpoint` on PyPI (notebooks, Flask, Django, KNIME, Plone) and linking to it. Do not describe features of that package beyond one clause.
4. CHANGELOG entry for 0.11.0: "wraps silverpoint 0.11.0; no API change".
5. Run `pre-commit run --all-files` and `uv run pytest`, and show me the output of both.
6. Run the demo and show me the compiled output of the gallery page's first chart, so I can see it renders against 0.11.0 rather than infer it.

Do not release: I tag `v0.11.0` on main myself. After the release, tell me the URL of the release's reflex-catalog.json asset so silverpoint can pin it in 0.11.1.
````

## `silverpoint_web`

````text
silverpoint 0.11.0 is published with @silverpoint/embed and a host catalog. Add the hosts to the site. The design lives in ~/WebstormProjects/silverpoint/changes/feature-007-bi-hosts (read README.md, api-delta.md §8 and §9, and repositories/README.md).

1. Serve `/host-catalog.json`: the file `host-catalog.json` from the @silverpoint/embed 0.11.0 npm tarball, copied at build time the same way `/agent-catalog.json` is.
2. Add a page `/docs/hosts` listing the host integrations from the `hosts` section of /agent-catalog.json: name, what it is built on (`via`), where it is published, its status and a link to its repository. Statuses are `planned`, `preview`, `released`; show `planned` hosts as such, without install instructions.
3. On that page, one live example of the `<silverpoint-chart>` element loaded from the standalone file, served from this site's own static files (no CDN), with its HTML source shown beside it.
4. Link the page from the docs index and from `/docs/ai`.
5. Show me the rendered HTML of the hosts page's table and of the live example's element, not only that the build passed.
````
