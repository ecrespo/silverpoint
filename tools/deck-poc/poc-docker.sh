#!/usr/bin/env bash
# Runs the Phase 10a PoC in the digest-pinned Playwright image, which carries Chromium, Firefox and
# WebKit at the versions Playwright 1.63 expects (the same image as the pixel gate).
set -euo pipefail
IMAGE='mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27'
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec docker run --rm --ipc=host --init \
  --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI=1 \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 -e npm_config_verify_deps_before_run=false -e pnpm_config_verify_deps_before_run=false \
  -v "$ROOT:/work" -w /work/tools/deck-poc "$IMAGE" \
  bash -c 'mkdir -p /tmp/bin && corepack enable --install-directory /tmp/bin && export PATH=/tmp/bin:$PATH && pnpm exec playwright test "$@"' _ "$@"
