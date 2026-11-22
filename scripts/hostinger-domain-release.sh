#!/usr/bin/env bash
# Actual Git source in hPanel's domain/app folder, public build in public_html.
set -euo pipefail
umask 077
MODE=${1:---plan}; REVISION=${2:-}
[[ "$MODE" = --plan || "$MODE" = --apply ]] && [[ "$REVISION" =~ ^[0-9a-f]{40}$ ]] || exit 2
export PATH="/opt/alt/php84/usr/bin:/opt/alt/alt-nodejs24/root/usr/bin:$PATH"
pnpm() { corepack pnpm@10.29.3 "$@"; }; export -f pnpm
export SITE_ROOT="$HOME/apps/pesomatch"
DOMAIN="$HOME/domains/pesomatch.site"; APP="$DOMAIN/app"; PUBLIC="$DOMAIN/public_html"
SHARED="$SITE_ROOT/shared"; STAGE="$DOMAIN/.peso-stage-$REVISION"
ORIGIN=https://github.com/TheKanjiTV/PesoMatch.git
[[ "$(realpath "$DOMAIN")" = "$HOME/domains/pesomatch.site" ]]
[[ -d "$APP" && ! -L "$APP" && -d "$PUBLIC" && ! -L "$PUBLIC" ]]
[[ -L "$SITE_ROOT/current" && -s "$SHARED/backend.env" && -d "$SHARED/storage" ]]
for executable in git php composer node pnpm rsync curl mysqldump realpath flock python3; do command -v "$executable" >/dev/null; done
if [[ -d "$APP/.git" ]]; then
  [[ "$(git -C "$APP" remote get-url origin)" = "$ORIGIN" ]]
  [[ -z "$(git -C "$APP" status --porcelain)" ]] || { echo 'Domain checkout has changes; preserve and review them first.' >&2; exit 1; }
fi
printf 'Git source: %s\nLaravel: %s/backend\nHidden private config: %s/backend/.env\nFrontend output: %s\nRevision: %s\n' "$APP" "$APP" "$APP" "$PUBLIC" "$REVISION"
if [[ "$MODE" = --plan ]]; then
  echo 'Plan: fresh Git clone, exact tracked source verification, frozen installs/build, private DB/files backup, preserve key/storage, archive old domain app/public_html, publish new domain checkout, HTTP checks with rollback. No files changed.'
  exit 0
fi
exec 9>"$SITE_ROOT/deployment.lock"; flock -n 9 || exit 1
[[ ! -e "$STAGE" ]] || { echo 'Staging path exists; inspect it before retrying.' >&2; exit 1; }
mkdir -p "$STAGE" "$SITE_ROOT/backups"
git clone --branch main --single-branch "$ORIGIN" "$STAGE/app"
[[ "$(git -C "$STAGE/app" rev-parse HEAD)" = "$REVISION" ]] || { echo 'GitHub moved; review the new revision before release.' >&2; exit 1; }
cp -L "$SHARED/backend.env" "$STAGE/app/backend/.env"; chmod 600 "$STAGE/app/backend/.env"
rsync -a "$SHARED/storage/" "$STAGE/app/backend/storage/"
git -C "$STAGE/app" restore --source=HEAD -- backend/storage
(cd "$STAGE/app/backend"; composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader; composer check-platform-reqs --no-dev)
(cd "$STAGE/app"; pnpm install --frozen-lockfile; RAYON_NUM_THREADS=1 UV_THREADPOOL_SIZE=1 pnpm build; git diff --exit-code HEAD)
BACKUP="$SITE_ROOT/backups/domain-$REVISION-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP"
cp -L "$SHARED/backend.env" "$BACKUP/backend.env"
cp "$SITE_ROOT/runtime.sh" "$BACKUP/runtime.sh"
OLD_CURRENT=$(readlink "$SITE_ROOT/current")
printf '%s\n' "$OLD_CURRENT" > "$BACKUP/previous-current"
mysqldump --defaults-extra-file="$SHARED/mysql-backup.cnf" --single-transaction --no-tablespaces "$(cat "$SHARED/database-name")" | gzip > "$BACKUP/database.sql.gz"
gzip -t "$BACKUP/database.sql.gz"; [[ -s "$BACKUP/database.sql.gz" ]]
(cd "$SITE_ROOT/current/backend"; php -r 'require "vendor/autoload.php";$a=require "bootstrap/app.php";$a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();$p=getenv("SITE_ROOT")."/shared/prepared.json";$m=json_decode(file_get_contents($p),true);foreach(array_keys($m["protected_counts"])as$t)$m["protected_counts"][$t]=Illuminate\Support\Facades\DB::table($t)->count();file_put_contents($p,json_encode($m,JSON_PRETTY_PRINT));')
(cd "$STAGE/app/backend"; set -a; source "$SHARED/migration.env"; set +a; php artisan migrate --force)
(cd "$STAGE/app/backend"; php "$STAGE/app/deploy/hostinger-verify.php"; php artisan peso:ai-configure --check; php artisan peso:ai-index)
mkdir -p "$STAGE/public_html"
# Only retain old content-hashed assets/downloads for open tabs and published APKs.
for directory in assets downloads .well-known; do
  if [[ -d "$PUBLIC/$directory" ]]; then mkdir -p "$STAGE/public_html/$directory"; rsync -a "$PUBLIC/$directory/" "$STAGE/public_html/$directory/"; fi
done
if [[ -f "$PUBLIC/app-release.json" ]]; then cp "$PUBLIC/app-release.json" "$STAGE/public_html/app-release.json"; fi
rsync -a "$STAGE/app/dist/" "$STAGE/public_html/"
python3 - "$STAGE/app" "$STAGE/public_html" "$APP" <<'PY'
import re, sys
from pathlib import Path
source,public,app=map(Path,sys.argv[1:])
configuration=(source/'deploy/hostinger-public.htaccess').read_text()
policy=re.search(r'add_header Content-Security-Policy "([^"]+)" always;',(source/'dist/security-headers.conf').read_text()).group(1)
configuration+='\n<IfModule mod_headers.c>\n<FilesMatch "^(index|offline)\\.html$">\nHeader always set Content-Security-Policy "'+policy+'"\n</FilesMatch>\n</IfModule>\n'
(public/'.htaccess').write_text(configuration)
(public/'index.php').write_text('<?php\nrequire '+repr(str(app/'backend/public/index.php'))+';\n')
PY
find "$STAGE/public_html" -type d -exec chmod 755 {} +
find "$STAGE/public_html" -type f -exec chmod 644 {} +
OLD_APP_MOVED=0; NEW_APP=0; OLD_PUBLIC_MOVED=0; NEW_PUBLIC=0; STORAGE_MOVED=0; ENV_MOVED=0; CURRENT_CHANGED=0; MAINTENANCE=0
rollback() {
  status=$?; trap - ERR; set +e
  if [[ "$NEW_PUBLIC" = 1 ]]; then mv "$PUBLIC" "$BACKUP/failed-public_html"; fi
  if [[ "$OLD_PUBLIC_MOVED" = 1 ]]; then mv "$BACKUP/public_html" "$PUBLIC"; fi
  if [[ "$NEW_APP" = 1 ]]; then mv "$APP" "$BACKUP/failed-app"; fi
  if [[ "$OLD_APP_MOVED" = 1 ]]; then mv "$BACKUP/domain-app" "$APP"; fi
  if [[ "$STORAGE_MOVED" = 1 ]]; then unlink "$SHARED/storage"; mv "$BACKUP/shared-storage" "$SHARED/storage"; fi
  if [[ "$ENV_MOVED" = 1 ]]; then unlink "$SHARED/backend.env"; mv "$BACKUP/shared-backend.env" "$SHARED/backend.env"; fi
  if [[ "$CURRENT_CHANGED" = 1 ]]; then ln -s "$OLD_CURRENT" "$SITE_ROOT/current.rollback"; mv -Tf "$SITE_ROOT/current.rollback" "$SITE_ROOT/current"; fi
  cp "$BACKUP/runtime.sh" "$SITE_ROOT/runtime.sh"
  if [[ "$MAINTENANCE" = 1 ]]; then (cd "$SITE_ROOT/current/backend"; php artisan up); fi
  echo "Domain release failed. Previous paths restored; backups retained in $BACKUP. Additive migrations are not reversed." >&2
  exit "$status"
}
trap rollback ERR
(cd "$SITE_ROOT/current/backend"; php artisan down --retry=15); MAINTENANCE=1
rsync -a "$SHARED/storage/" "$STAGE/app/backend/storage/"
git -C "$STAGE/app" restore --source=HEAD -- backend/storage
# Verified exact domain paths above; old directories are archived, never wiped.
mv "$APP" "$BACKUP/domain-app"; OLD_APP_MOVED=1
mv "$STAGE/app" "$APP"; NEW_APP=1
mv "$PUBLIC" "$BACKUP/public_html"; OLD_PUBLIC_MOVED=1
mv "$STAGE/public_html" "$PUBLIC"; NEW_PUBLIC=1
if [[ ! -L "$SHARED/storage" ]]; then
  mv "$SHARED/storage" "$BACKUP/shared-storage"; STORAGE_MOVED=1
  ln -s "$APP/backend/storage" "$SHARED/storage"
fi
if [[ ! -L "$SHARED/backend.env" ]]; then
  mv "$SHARED/backend.env" "$BACKUP/shared-backend.env"; ENV_MOVED=1
  ln -s "$APP/backend/.env" "$SHARED/backend.env"
fi
ln -s "$APP" "$SITE_ROOT/current.next"; mv -Tf "$SITE_ROOT/current.next" "$SITE_ROOT/current"; CURRENT_CHANGED=1
(cd "$APP/backend"; php artisan optimize:clear; php artisan config:cache; php artisan route:cache; php artisan view:cache; php "$APP/deploy/hostinger-verify.php"; php artisan up)
cp "$APP/deploy/hostinger-runtime.sh" "$SITE_ROOT/runtime.sh"
[[ "$(curl --fail --silent --show-error --max-time 25 https://pesomatch.site/api/public/health)" = *'"application":"pesomatch"'* ]]
[[ "$(curl --fail --silent --show-error --max-time 25 https://pesomatch.site/api/v1/public/health)" = *'"application":"pesomatch"'* ]]
[[ "$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 25 -H 'Accept: application/json' https://pesomatch.site/api/v1/auth/user)" = 401 ]]
[[ "$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 25 -H 'Accept: application/json' https://pesomatch.site/api/auth/user)" = 401 ]]
curl --fail --silent --show-error --max-time 25 https://pesomatch.site/ai-workspace >/dev/null
[[ "$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 25 https://pesomatch.site/.git/config)" = 403 ]]
git -C "$APP" diff --exit-code HEAD
[[ -z "$(git -C "$APP" status --porcelain)" ]]
bash "$APP/scripts/hostinger-workspace.sh"
MAINTENANCE=0
trap - ERR
rmdir "$STAGE"
printf 'Published exact Git source %s to %s. Private ignored .env/storage preserved. Backup: %s\n' "$REVISION" "$APP" "$BACKUP"
git -C "$APP" log -1 --oneline
git -C "$APP" status --short
ls -la "$APP"
