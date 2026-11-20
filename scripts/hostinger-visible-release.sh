#!/usr/bin/env bash
# Run in a visible SSH terminal after pulling reviewed, tested source.
set -euo pipefail
umask 077
REVISION=${1:-}
[[ "$REVISION" =~ ^[0-9a-f]{40}$ ]]
. "$HOME/apps/pesomatch/runtime.sh"
export SITE_ROOT="$HOME/apps/pesomatch"
export PUBLIC_ROOT="$HOME/domains/pesomatch.site/public_html"
export SITE_URL=https://pesomatch.site
[[ "$(git rev-parse HEAD)" = "$REVISION" ]]
mkdir -p "$SITE_ROOT/logs"
run() { printf '\n+ '; printf '%q ' "$@"; printf '\n'; "$@"; }
perform_release() {
run pwd
run ls -la
run git status --short
run git remote -v
run git log -1 --oneline
run cat .gitignore
run ls -ld src public backend backend/app backend/routes
run php -v
run node --version
run pnpm --version
run bash scripts/hostinger-update.sh --plan "$REVISION"
run bash scripts/hostinger-update.sh --apply "$REVISION"
run bash scripts/hostinger-workspace.sh
printf '%s\n' "$REVISION" > "$SITE_ROOT/logs/visible-$REVISION.done"
printf '\nRelease finished. Named paths and the private release log are ready for inspection.\n'
}
# This shared host has no /dev/fd for Bash process substitution. A normal pipe
# works with its restricted filesystem; pipefail preserves deployment failures.
perform_release 2>&1 | tee -a "$SITE_ROOT/logs/visible-$REVISION.log"
