# Source this file inside a Hostinger Bash session; do not execute it as a child.
# Verified for this account on 19 November 2026. No deployment is performed.
export PATH="/opt/alt/php84/usr/bin:/opt/alt/alt-nodejs24/root/usr/bin:$PATH"
pnpm() { corepack pnpm@10.29.3 "$@"; }
export -f pnpm
cd "$HOME/apps/pesomatch/PesoMatch" || return 1
