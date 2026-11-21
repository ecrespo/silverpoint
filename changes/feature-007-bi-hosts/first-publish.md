# `@silverpoint/embed` — first publish (T-327, REQ-629)

`@silverpoint/embed` becomes the tenth package of the `fixed` group. CI publishes through npm
Trusted Publishing, and npm lets a trusted publisher be set only on a package that exists. The name
was free on 2026-11-20 (`https://registry.npmjs.org/@silverpoint%2Fembed` answered 404). This is the
`@silverpoint/tailwind`, `@silverpoint/mcp` and `@silverpoint/marp` precedent; the lessons of the
last two are folded into the order below.

## 1. Reserve the name with a placeholder — not the real package

```sh
mkdir -p /tmp/embed-placeholder && cd /tmp/embed-placeholder
cat > package.json <<'JSON'
{
  "name": "@silverpoint/embed",
  "version": "0.0.1",
  "description": "Reserved: silverpoint charts from one file, for hosts. Ships from 0.11.0.",
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/ecrespo/silverpoint.git", "directory": "packages/embed" }
}
JSON
printf '# @silverpoint/embed\n\nReserved. The first release is 0.11.0.\n' > README.md
npm whoami          # 401 means an expired token: run `npm login` in your own terminal (2FA)
npm publish --access public --provenance=false
```

## 2. Set the trusted publisher **right before** the release

A new trusted publisher stays "Pending validation" for about 48 hours and expires unless a CI
release publishes the package in that window (what happened to `mcp` before `0.9.0`). So do this the
day of the release, not the day of the placeholder:

```sh
npx -y npm@12.2.1 trust github @silverpoint/embed --repo ecrespo/silverpoint --file release.yml --env npm --allow-publish
```

## 3. Release, verify, deprecate

1. Release as usual (`CLAUDE.md`, "Releasing the next version"). `tools/release/publish.mjs` orders
   `embed` after `core` and `grounds` and before `mcp`, which now depends on it.
2. If the publish of `embed` answers `E404`, the publisher expired: delete and re-create it, then
   `gh run rerun <id> --failed`.
3. Verify against the registry:
   `curl -s https://registry.npmjs.org/@silverpoint%2Fembed/0.11.0 -o /dev/null -w "%{http_code}\n"`
4. `npm deprecate @silverpoint/embed@0.0.1 "Reserved name; use 0.11.0 or later."`
5. Attach the **hosts kit** to the GitHub release `v0.11.0` (TD delta §6):
   `silverpoint-hosts-kit-0.11.0.zip`, holding the four standalone files, `host-catalog.json`,
   `conformance.json`, `integrity.json`, the `renderToHTML` goldens and the table fixtures. Host
   repositories vendor from it (or from the npm tarball, which carries the same files under `dist`).

## 4. Names worth reserving outside npm, in the same sitting

`silverpoint` on PyPI is the one name in this feature that someone else could take and that has no
substitute. It is taken by the Python package's first real upload, not by a placeholder (user
decision, 2026-11-20; [`repositories/silverpoint-python.md`](repositories/silverpoint-python.md) PY-T-02, PY-T-13).
