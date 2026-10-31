# `@silverpoint/marp` — first publish (T-288, REQ-570)

`@silverpoint/marp` is the ninth package of the `fixed` group (`.changeset/config.json`). CI publishes
through npm Trusted Publishing, and npm lets a trusted publisher be set only on a package that already
exists. The name is not on npm yet (`https://registry.npmjs.org/@silverpoint%2Fmarp` answered 404 on
2026-10-31), so the user publishes it once by hand **before** the `0.9.0` release is pushed to `main`.
This is the `@silverpoint/tailwind` (0.2.0) and `@silverpoint/mcp` (0.7.0) precedent.

## What to publish by hand

Do **not** hand-publish the package as it stands on `develop`. Its version reads `0.8.0`, but its code
imports what `@silverpoint/grounds` gains in `0.9.0` (`slideBackdrop`, `listGrounds`,
`toChartRootString`), so a `0.8.0` built from it would resolve against `0.8.0` dependencies it
cannot run on. Publish a placeholder that only reserves the name:

```sh
mkdir -p /tmp/marp-placeholder && cd /tmp/marp-placeholder
cat > package.json <<'JSON'
{
  "name": "@silverpoint/marp",
  "version": "0.0.1",
  "description": "Reserved: Marp decks in the silverpoint style ship from 0.9.0.",
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/ecrespo/silverpoint.git", "directory": "packages/marp" }
}
JSON
printf '# @silverpoint/marp\n\nReserved. The first release is 0.9.0.\n' > README.md
npm whoami          # 401 means an expired token: run `npm login` in your own terminal (2FA)
npm publish --access public --provenance=false
```

## Then

1. Set the trusted publisher (GitHub Actions, `ecrespo/silverpoint`, `release.yml`, environment `npm`).
   npm ≤ 11.14.1 sends no permission flag and the registry answers a bare 400; use:

   ```sh
   npx -y npm@12.2.1 trust github @silverpoint/marp --repo ecrespo/silverpoint --file release.yml --env npm --allow-publish
   ```

2. Release as usual (CLAUDE.md, "Releasing the next version"): the release commit on `develop`, then
   `git push origin develop:main`. `tools/release/publish.mjs` finds `marp` under `packages/` and
   publishes it after `core` and `grounds`, with provenance.
3. Verify against the registry. A brand-new name can 404 on `npm view` for minutes (the CDN caches the
   404s from before it existed); the version URL answers first:

   ```sh
   curl -s https://registry.npmjs.org/@silverpoint%2Fmarp/0.9.0 -o /dev/null -w "%{http_code}\n"
   ```

4. Deprecate the placeholder: `npm deprecate @silverpoint/marp@0.0.1 "Reserved name; use 0.9.0 or later."`
