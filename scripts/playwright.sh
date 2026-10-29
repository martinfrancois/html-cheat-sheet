#!/bin/sh
# Runs the Playwright tests inside the official Playwright image whose tag matches the
# installed @playwright/test, so browsers and fonts, and with them the screenshots, are the
# same on every machine and in CI. Arguments go to `playwright test`, for example
# `pnpm run test:e2e --update-snapshots`. Uses podman when there is no docker.
# The run gets the lowest CPU priority, so a laptop or shared machine stays responsive;
# PLAYWRIGHT_WORKERS sets how many browsers run at once (default in playwright.config.ts).
set -eu

# pnpm hands a "--" separator to the script as an argument, and Playwright ignores everything after
# it, so `pnpm run test:e2e -- --update-snapshots` would silently run without updating.
if [ "${1:-}" = "--" ]; then shift; fi

version=$(node -p 'require("@playwright/test/package.json").version')
image="mcr.microsoft.com/playwright:v${version}-noble"
engine=$(command -v docker || command -v podman)
root=$(pwd)

# :Z gives the container access on SELinux hosts; it is ignored elsewhere.
exec nice -n 19 "$engine" run --rm --init --ipc=host \
  --volume "$root:/work:Z" --workdir /work \
  --env CI="${CI:-}" --env PLAYWRIGHT_WORKERS="${PLAYWRIGHT_WORKERS:-}" \
  "$image" ./node_modules/.bin/playwright test "$@"
