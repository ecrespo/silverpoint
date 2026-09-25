#!/usr/bin/env bash
# Runs the pixel gate inside the digest-pinned Playwright image (REQ-181, Constitution Art. 3):
# golden images are only meaningful when produced and compared on the same rasteriser.
#
#   tools/visual-gate/pixel-docker.sh                      compare against the golden images
#   tools/visual-gate/pixel-docker.sh --update-snapshots   regenerate them (commit deliberately)
#   SP_MATRIX=full tools/visual-gate/pixel-docker.sh       the nightly 1,584-fixture matrix
set -euo pipefail
IMAGE='mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27'
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec docker run --rm --ipc=host --init \
  --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI=1 -e NG_CLI_ANALYTICS=false -e NEXT_TELEMETRY_DISABLED=1 -e SP_MATRIX \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 -e npm_config_verify_deps_before_run=false -e pnpm_config_verify_deps_before_run=false \
  -v "$ROOT:/work" -w /work "$IMAGE" \
  bash -c 'mkdir -p /tmp/bin && corepack enable --install-directory /tmp/bin && export PATH=/tmp/bin:$PATH && pnpm exec playwright test pixel "$@"' _ "$@"
