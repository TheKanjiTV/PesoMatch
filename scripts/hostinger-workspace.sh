#!/usr/bin/env bash
# Named navigation shortcuts only. The established Git layout is preserved.
set -euo pipefail
umask 077
: "${SITE_ROOT:?Private application root required}"
[[ "$SITE_ROOT" = "$HOME"/apps/* ]]
SITE_ROOT=$(realpath "$SITE_ROOT")
[[ -d "$SITE_ROOT/PesoMatch/.git" && -d "$SITE_ROOT/current/backend" && -d "$SITE_ROOT/current/dist" ]]
SOURCE="$SITE_ROOT/PesoMatch"
DOMAIN_SOURCE="$HOME/domains/pesomatch.site/app"
if [[ -d "$DOMAIN_SOURCE/.git" ]]; then SOURCE="$DOMAIN_SOURCE"; fi
WORKSPACE="$SITE_ROOT/workspace"
mkdir -p "$WORKSPACE/source" "$WORKSPACE/live"
shortcut() {
  local target=$1 name=$2
  if [[ -L "$name" ]]; then
    if [[ "$(readlink "$name")" != "$target" ]]; then
      case "$(readlink "$name")" in
        ../../PesoMatch|../../PesoMatch/backend) ln -s "$target" "$name.next"; mv -Tf "$name.next" "$name" ;;
        *) echo "Different shortcut already exists: $name" >&2; exit 1 ;;
      esac
    fi
  elif [[ -e "$name" ]]; then
    echo "Existing path retained; cannot replace it: $name" >&2; exit 1
  else
    ln -s "$target" "$name"
  fi
}
shortcut "$SOURCE" "$WORKSPACE/source/react-frontend"
shortcut "$SOURCE/backend" "$WORKSPACE/source/laravel-backend"
shortcut ../../current/dist "$WORKSPACE/live/react-frontend"
shortcut ../../current/backend "$WORKSPACE/live/laravel-backend"
cat > "$WORKSPACE/README.txt" <<'GUIDE'
PesoMatch navigation guide

source/react-frontend : current private Git root, src/, public/, package.json
source/laravel-backend: backend/ inside that same Git repository
live/react-frontend   : built React dist/ of the current release
live/laravel-backend  : Laravel backend of the current release

These are shortcuts, not extra clones. Git structure has not been moved.
.gitignore is in source/react-frontend/.gitignore; Laravel also has backend/.gitignore.
Commit intended source locally, push to GitHub, then git pull --ff-only on Hostinger.
Use scripts/hostinger-domain-release.sh to build/publish the domain checkout.
A Git pull changes source only. A frontend build alone does not publish its output.
Run operational Artisan commands from live/laravel-backend after selecting runtime.sh.
Never commit .env, keys, private PDFs, storage, backups, vendor or node_modules.
Private shared data and backups remain outside both source and public_html.
GUIDE
printf 'Named source and live entry points (no source moved):\n'
ls -la "$WORKSPACE/source" "$WORKSPACE/live"
cat "$WORKSPACE/README.txt"
