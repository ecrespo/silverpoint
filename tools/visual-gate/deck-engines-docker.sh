#!/usr/bin/env bash
# Runs the deck's three-engine e2e (T-280, REQ-625) inside the digest-pinned Playwright image, which
# carries Chromium, Firefox and WebKit at the versions Playwright expects: the `browser-deck` CI job,
# locally. It succeeds the PoC's tools/deck-poc/poc-docker.sh.
#
#   tools/visual-gate/deck-engines-docker.sh                   every app in the three engines
#   tools/visual-gate/deck-engines-docker.sh --project 'angular·webkit'
set -euo pipefail
IMAGE='mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27'
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec docker run --rm --ipc=host --init \
  --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI=1 -e SP_DECK_ENGINES=1 -e NG_CLI_ANALYTICS=false -e NEXT_TELEMETRY_DISABLED=1 \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 -e npm_config_verify_deps_before_run=false -e pnpm_config_verify_deps_before_run=false \
  -v "$ROOT:/work" -w /work "$IMAGE" \
  bash -c 'mkdir -p /tmp/bin && corepack enable --install-directory /tmp/bin && export PATH=/tmp/bin:$PATH && pnpm exec playwright test deck-engines "$@"' _ "$@"
